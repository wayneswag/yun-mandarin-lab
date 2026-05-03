import { list, put } from '@vercel/blob';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';

const MODEL = 'gpt-4o-mini-tts';
const DEFAULT_VOICE = 'coral';
const DEFAULT_INSTRUCTIONS = 'Speak natural Mandarin Chinese clearly, at a slightly slow teaching pace. Keep the pronunciation accurate and suitable for language learners.';
const MAX_TEXT_LENGTH = 1200;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function getAudioPathname({ text, voice, instructions }) {
  const hash = createHash('sha256')
    .update(JSON.stringify({ model: MODEL, voice, instructions, text }))
    .digest('hex')
    .slice(0, 32);

  return `tts/${voice}/${hash}.mp3`;
}

async function findExistingBlob(pathname) {
  const result = await list({
    prefix: pathname,
    limit: 1,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return result.blobs.find((blob) => blob.pathname === pathname) || null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Use POST /api/tts with JSON: { "text": "你好" }' });
    return;
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      sendJson(res, 500, { error: 'Missing OPENAI_API_KEY in Vercel Environment Variables.' });
      return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      sendJson(res, 500, { error: 'Missing BLOB_READ_WRITE_TOKEN. Make sure your Vercel Blob store is connected to this project.' });
      return;
    }

    const body = await readJsonBody(req);
    const text = String(body.text || '').trim();
    const voice = String(body.voice || DEFAULT_VOICE).trim();
    const instructions = String(body.instructions || DEFAULT_INSTRUCTIONS).trim();

    if (!text) {
      sendJson(res, 400, { error: 'Missing text.' });
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      sendJson(res, 400, { error: `Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.` });
      return;
    }

    const pathname = getAudioPathname({ text, voice, instructions });
    const existingBlob = await findExistingBlob(pathname);

    if (existingBlob) {
      sendJson(res, 200, {
        url: existingBlob.url,
        pathname: existingBlob.pathname,
        cached: true,
      });
      return;
    }

    const speech = await openai.audio.speech.create({
      model: MODEL,
      voice,
      input: text,
      instructions,
      response_format: 'mp3',
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

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
      cached: false,
    });
  } catch (error) {
    console.error('TTS API error:', error);
    sendJson(res, 500, {
      error: 'TTS generation failed.',
      detail: error?.message || String(error),
    });
  }
}
