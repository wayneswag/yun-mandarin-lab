import { list, put } from '@vercel/blob';
import { createHash } from 'node:crypto';
import PopCore from '@alicloud/pop-core';

const { RPCClient } = PopCore;

const ALIYUN_TTS_ENDPOINT = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts';

const DEFAULT_VOICE = process.env.ALIYUN_TTS_VOICE || 'xiaoyun';
const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_FORMAT = 'mp3';
const MAX_TEXT_LENGTH = 300;

let cachedAliyunToken = null;
let cachedAliyunTokenExpireTime = 0;
let aliyunTokenPromise = null;

const OPENAI_VOICE_NAMES = new Set([
  'nova',
  'shimmer',
  'echo',
  'onyx',
  'fable',
  'alloy',
  'coral',
]);

async function createAliyunToken() {
  if (!process.env.ALIYUN_AK_ID || !process.env.ALIYUN_AK_SECRET) {
    if (process.env.ALIYUN_NLS_TOKEN) {
      return {
        token: process.env.ALIYUN_NLS_TOKEN,
        expireTime: 0,
      };
    }

    throw new Error('Missing ALIYUN_AK_ID / ALIYUN_AK_SECRET in Vercel Environment Variables.');
  }

  const client = new RPCClient({
    accessKeyId: process.env.ALIYUN_AK_ID,
    accessKeySecret: process.env.ALIYUN_AK_SECRET,
    endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28',
  });

  const result = await client.request('CreateToken', {}, { method: 'POST' });

  const token = result?.Token?.Id;
  const expireTime = Number(result?.Token?.ExpireTime || 0);

  if (!token) {
    throw new Error(`Failed to create Aliyun token: ${JSON.stringify(result)}`);
  }

  return { token, expireTime };
}

async function getAliyunToken() {
  const now = Math.floor(Date.now() / 1000);

  if (
    cachedAliyunToken &&
    cachedAliyunTokenExpireTime &&
    now < cachedAliyunTokenExpireTime - 300
  ) {
    return cachedAliyunToken;
  }

  if (aliyunTokenPromise) return aliyunTokenPromise;

  aliyunTokenPromise = createAliyunToken()
    .then(({ token, expireTime }) => {
      cachedAliyunToken = token;
      cachedAliyunTokenExpireTime = expireTime;
      return token;
    })
    .finally(() => {
      aliyunTokenPromise = null;
    });

  return aliyunTokenPromise;
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function normalizeVoice(voice) {
  const cleanVoice = String(voice || '').trim();

  if (!cleanVoice || OPENAI_VOICE_NAMES.has(cleanVoice.toLowerCase())) {
    return DEFAULT_VOICE;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(cleanVoice)) {
    return cleanVoice;
  }

  return DEFAULT_VOICE;
}

function getAudioPathname({ text, voice, sampleRate, format }) {
  const hash = createHash('sha256')
    .update(
      JSON.stringify({
        provider: 'aliyun',
        voice,
        sampleRate,
        format,
        text,
      })
    )
    .digest('hex')
    .slice(0, 32);

  return `tts/aliyun/${voice}/${hash}.${format}`;
}

async function findExistingBlob(pathname) {
  const result = await list({
    prefix: pathname,
    limit: 1,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return result.blobs.find((blob) => blob.pathname === pathname) || null;
}

async function synthesizeWithAliyun({ text, voice }) {
  const appkey = process.env.ALIYUN_NLS_APP_KEY;
  const token = await getAliyunToken();

  const response = await fetch(ALIYUN_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appkey,
      token,
      text,
      format: DEFAULT_FORMAT,
      sample_rate: DEFAULT_SAMPLE_RATE,
      voice,
      volume: 50,
      speech_rate: -100,
      pitch_rate: 0,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!response.ok || contentType.includes('application/json') || contentType.includes('text/')) {
    const detail = buffer.toString('utf8');
    throw new Error(`Aliyun TTS failed. status=${response.status}; detail=${detail}`);
  }

  return buffer;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      error: 'Use POST /api/tts-aliyun with JSON: { "text": "你好" }',
    });
    return;
  }

  try {
    if (!process.env.ALIYUN_NLS_APP_KEY) {
      sendJson(res, 500, {
        error: 'Missing ALIYUN_NLS_APP_KEY in Vercel Environment Variables.',
      });
      return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      sendJson(res, 500, {
        error: 'Missing BLOB_READ_WRITE_TOKEN.',
      });
      return;
    }

    const body = await readJsonBody(req);
    const text = String(body.text || '').trim();
    const voice = normalizeVoice(body.voice);
    const sampleRate = DEFAULT_SAMPLE_RATE;
    const format = DEFAULT_FORMAT;

    if (!text) {
      sendJson(res, 400, { error: 'Missing text.' });
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      sendJson(res, 400, {
        error: `Text is too long for Aliyun short TTS. Maximum length is ${MAX_TEXT_LENGTH} characters.`,
      });
      return;
    }

    const pathname = getAudioPathname({
      text,
      voice,
      sampleRate,
      format,
    });

    const existingBlob = await findExistingBlob(pathname);

    if (existingBlob) {
      sendJson(res, 200, {
        url: existingBlob.url,
        pathname: existingBlob.pathname,
        provider: 'aliyun',
        voice,
        cached: true,
      });
      return;
    }

    const audioBuffer = await synthesizeWithAliyun({ text, voice });

    const uploadedBlob = await put(pathname, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31536000,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    sendJson(res, 200, {
      url: uploadedBlob.url,
      pathname: uploadedBlob.pathname,
      provider: 'aliyun',
      voice,
      cached: false,
    });
  } catch (error) {
    console.error('Aliyun TTS API error:', error);

    sendJson(res, 500, {
      error: 'Aliyun TTS generation failed.',
      detail: error?.message || String(error),
    });
  }
}
