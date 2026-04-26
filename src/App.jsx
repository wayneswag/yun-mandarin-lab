import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
function EmojiIcon({ symbol, className = '' }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center justify-center leading-none ${className}`}>
      {symbol}
    </span>
  );
}

const CheckCircle2 = ({ className }) => <EmojiIcon symbol="✅" className={className} />;
const XCircle = ({ className }) => <EmojiIcon symbol="❌" className={className} />;
const MessageSquareQuote = ({ className }) => <EmojiIcon symbol="💬" className={className} />;
const BookOpen = ({ className }) => <EmojiIcon symbol="📘" className={className} />;
const Sparkles = ({ className }) => <EmojiIcon symbol="✨" className={className} />;
const Volume2 = ({ className }) => <EmojiIcon symbol="🔊" className={className} />;
const ChevronRight = ({ className }) => <EmojiIcon symbol="›" className={className} />;
const Heart = ({ className }) => <EmojiIcon symbol="💗" className={className} />;
const BrainCircuit = ({ className }) => <EmojiIcon symbol="🧠" className={className} />;
const CalendarDays = ({ className }) => <EmojiIcon symbol="📅" className={className} />;
const Home = ({ className }) => <EmojiIcon symbol="🏠" className={className} />;
const House = ({ className }) => <EmojiIcon symbol="⌂" className={className} />;
const Compass = ({ className }) => <EmojiIcon symbol="🧭" className={className} />;
const Bookmark = ({ className }) => <EmojiIcon symbol="🔖" className={className} />;
const RotateCcw = ({ className }) => <EmojiIcon symbol="↺" className={className} />;
const Settings2 = ({ className }) => <EmojiIcon symbol="⚙️" className={className} />;

const STORAGE_KEY = 'yun-mandarin-lab-pilot-v4';

function readPilotState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getSavedAudioRate() {
  if (typeof window === 'undefined') return 0.75;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0.75;
    const parsed = JSON.parse(raw);
    return typeof parsed?.audioRate === 'number' ? parsed.audioRate : 0.75;
  } catch {
    return 0.75;
  }
}

function createCollectionItem({ expression, pinyin = '', english = '', type = 'expression', source = '', chapter = '', mission = '' }) {
  return {
    id: `${type}::${expression}::${source}`,
    expression,
    pinyin,
    english,
    type,
    source,
    chapter,
    mission,
    createdAt: Date.now(),
  };
}

function AudioButton({ text, dark = false, small = false }) {
  const speak = (e) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = getSavedAudioRate();
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const zhVoice =
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('zh')) ||
      voices.find((v) => v.name && v.name.toLowerCase().includes('chinese')) ||
      null;

    if (zhVoice) utterance.voice = zhVoice;
    synth.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      className={`rounded-full transition ${
        small ? 'p-1' : 'p-2'
      } ${dark ? 'bg-white/15 hover:bg-white/25' : 'bg-neutral-100 hover:bg-neutral-200'}`}
      aria-label="Play audio"
      title="Play audio"
    >
      <Volume2 className={`${small ? 'h-4 w-4' : 'h-4 w-4'} ${dark ? 'text-white' : 'text-neutral-700'}`} />
    </button>
  );
}

const glossary = {
  '新来的': {
    title: '新来的',
    pinyin: 'xīn lái de',
    translation: 'newly arrived / new here',
    explanation:
      'This phrase describes someone who has recently arrived in a place or group. In 新来的室友, it means “the roommate who is new here.”',
    examples: [
      { zh: '他是新来的同事。', py: 'Tā shì xīn lái de tóngshì.', en: 'He is the new coworker.' },
      { zh: '新来的老师很年轻。', py: 'Xīn lái de lǎoshī hěn niánqīng.', en: 'The new teacher is very young.' },
      { zh: '那个新来的学生会说中文。', py: 'Nàge xīn lái de xuésheng huì shuō Zhōngwén.', en: 'That new student can speak Chinese.' },
      { zh: '我是昨天新来的。', py: 'Wǒ shì zuótiān xīn lái de.', en: 'I’m the one who arrived yesterday.' },
      { zh: '大家都在帮新来的室友。', py: 'Dàjiā dōu zài bāng xīn lái de shìyǒu.', en: 'Everyone is helping the new roommate.' },
    ],
  },
  '中文': {
    title: '中文',
    pinyin: 'Zhōngwén',
    translation: 'Chinese language',
    explanation:
      'In a sentence like 中文说得怎么样？, 中文 is best explained as the topic: “As for Chinese…” It is not acting like a simple English subject.',
    examples: [
      { zh: '我会说一点中文。', py: 'Wǒ huì shuō yìdiǎn Zhōngwén.', en: 'I can speak a little Chinese.' },
      { zh: '你的中文很好。', py: 'Nǐ de Zhōngwén hěn hǎo.', en: 'Your Chinese is very good.' },
      { zh: '中文不太容易。', py: 'Zhōngwén bú tài róngyì.', en: 'Chinese is not very easy.' },
      { zh: '他在学中文。', py: 'Tā zài xué Zhōngwén.', en: 'He is learning Chinese.' },
      { zh: '中文说得怎么样？', py: 'Zhōngwén shuō de zěnmeyàng?', en: 'How well do you speak Chinese?' },
    ],
  },
  '说得怎么样': {
    title: '说得怎么样',
    pinyin: 'shuō de zěnmeyàng',
    translation: 'how well someone speaks',
    explanation:
      'This is a verb + 得 + description pattern. 得 links the verb 说 to a comment about performance.',
    examples: [
      { zh: '你中文说得很好。', py: 'Nǐ Zhōngwén shuō de hěn hǎo.', en: 'You speak Chinese very well.' },
      { zh: '他说得不太清楚。', py: 'Tā shuō de bú tài qīngchu.', en: 'He does not speak very clearly.' },
      { zh: '你法语说得怎么样？', py: 'Nǐ Fǎyǔ shuō de zěnmeyàng?', en: 'How well do you speak French?' },
      { zh: '她汉语说得越来越自然了。', py: 'Tā Hànyǔ shuō de yuèláiyuè zìrán le.', en: 'Her Chinese is sounding more and more natural.' },
      { zh: '你今天说得很流利。', py: 'Nǐ jīntiān shuō de hěn liúlì.', en: 'You spoke very fluently today.' },
    ],
  },
  '有时间': {
    title: '有时间',
    pinyin: 'yǒu shíjiān',
    translation: 'to have time / to be available',
    explanation:
      'Chinese often asks availability with 有时间. It is one of the most practical chunks for making plans.',
    examples: [
      { zh: '你晚上有时间吗？', py: 'Nǐ wǎnshang yǒu shíjiān ma?', en: 'Are you free tonight?' },
      { zh: '我周末没有时间。', py: 'Wǒ zhōumò méiyǒu shíjiān.', en: 'I do not have time this weekend.' },
      { zh: '你明天下午有时间吗？', py: 'Nǐ míngtiān xiàwǔ yǒu shíjiān ma?', en: 'Are you free tomorrow afternoon?' },
      { zh: '我现在没时间。', py: 'Wǒ xiànzài méi shíjiān.', en: 'I do not have time right now.' },
      { zh: '老师今天有时间见你。', py: 'Lǎoshī jīntiān yǒu shíjiān jiàn nǐ.', en: 'The teacher has time to meet you today.' },
    ],
  },
  '可能': {
    title: '可能',
    pinyin: 'kěnéng',
    translation: 'maybe / possibly',
    explanation:
      '可能 marks possibility. In 我明天可能会晚一点, it means “it is possible that…” It makes the sentence less absolute and more cautious.',
    examples: [
      { zh: '我今天可能会下班晚一点。', py: 'Wǒ jīntiān kěnéng huì xiàbān wǎn yìdiǎn.', en: 'I may get off work a bit late today.' },
      { zh: '他可能不来了。', py: 'Tā kěnéng bú lái le.', en: 'He may not come.' },
      { zh: '明天可能会下雨。', py: 'Míngtiān kěnéng huì xiàyǔ.', en: 'It may rain tomorrow.' },
      { zh: '我可能要改时间。', py: 'Wǒ kěnéng yào gǎi shíjiān.', en: 'I may need to change the time.' },
      { zh: '她现在可能在路上。', py: 'Tā xiànzài kěnéng zài lùshang.', en: 'She may be on the way now.' },
    ],
  },
  '会': {
    title: '会',
    pinyin: 'huì',
    translation: 'will / be likely to / know how to',
    explanation:
      '会 has several uses. Here, in 可能会晚一点, it does not mean skill. It helps show a predicted future result: “may will / may end up…” In many future sentences Chinese does not need 会, but here it makes the possibility reading smoother and more explicit.',
    examples: [
      { zh: '我明天会去。', py: 'Wǒ míngtiān huì qù.', en: 'I will go tomorrow.' },
      { zh: '他会说中文。', py: 'Tā huì shuō Zhōngwén.', en: 'He can speak Chinese.' },
      { zh: '你会迟到吗？', py: 'Nǐ huì chídào ma?', en: 'Will you be late?' },
      { zh: '她可能会很忙。', py: 'Tā kěnéng huì hěn máng.', en: 'She may be very busy.' },
      { zh: '我不会忘记。', py: 'Wǒ bú huì wàngjì.', en: 'I will not forget.' },
    ],
  },
  '晚一点': {
    title: '晚一点',
    pinyin: 'wǎn yìdiǎn',
    translation: 'a little later / a bit late',
    explanation:
      'In planning language, 晚一点 usually means later than expected, not “badly late” in a moral sense. It sounds softer than a direct blunt statement.',
    examples: [
      { zh: '我们晚一点见吧。', py: 'Wǒmen wǎn yìdiǎn jiàn ba.', en: 'Let’s meet a bit later.' },
      { zh: '我可能会晚一点到。', py: 'Wǒ kěnéng huì wǎn yìdiǎn dào.', en: 'I may arrive a little late.' },
      { zh: '你可以晚一点给我打电话。', py: 'Nǐ kěyǐ wǎn yìdiǎn gěi wǒ dǎ diànhuà.', en: 'You can call me a little later.' },
      { zh: '今天我想晚一点睡。', py: 'Jīntiān wǒ xiǎng wǎn yìdiǎn shuì.', en: 'Today I want to sleep a bit later.' },
      { zh: '他总是晚一点来。', py: 'Tā zǒngshì wǎn yìdiǎn lái.', en: 'He always comes a little later.' },
    ],
  },
  '要不然': {
    title: '要不然',
    pinyin: 'yàoburán',
    translation: 'otherwise / if not / how about instead',
    explanation:
      'In spoken Chinese, 要不然 often introduces an alternative after a problem appears. In this context it works like “if that does not work, then…” or “otherwise, shall we…”',
    examples: [
      { zh: '要不然我们明天见吧。', py: 'Yàoburán wǒmen míngtiān jiàn ba.', en: 'Otherwise, let’s meet tomorrow.' },
      { zh: '你坐地铁吧，要不然会迟到。', py: 'Nǐ zuò dìtiě ba, yàoburán huì chídào.', en: 'Take the subway, otherwise you will be late.' },
      { zh: '要不然我们先吃饭吧。', py: 'Yàoburán wǒmen xiān chīfàn ba.', en: 'Otherwise, let’s eat first.' },
      { zh: '要不然你问老师一下？', py: 'Yàoburán nǐ wèn lǎoshī yíxià?', en: 'Otherwise, how about asking the teacher?' },
      { zh: '今天不行，要不然改到周五吧。', py: 'Jīntiān bù xíng, yàoburán gǎi dào Zhōuwǔ ba.', en: 'Today does not work. Otherwise, let’s move it to Friday.' },
    ],
  },
  '不好意思': {
    title: '不好意思',
    pinyin: 'bù hǎoyìsi',
    translation: 'sorry / excuse me / I feel a bit embarrassed',
    explanation:
      '不好意思 is softer and more socially flexible than a simple “sorry.” It can be used for small apologies, getting someone’s attention, or showing slight embarrassment. It feels lighter than 对不起 in many everyday situations.',
    examples: [
      { zh: '不好意思，我来晚了。', py: 'Bù hǎoyìsi, wǒ lái wǎn le.', en: 'Sorry, I’m late.' },
      { zh: '不好意思，请问洗手间在哪儿？', py: 'Bù hǎoyìsi, qǐngwèn xǐshǒujiān zài nǎr?', en: 'Excuse me, where is the restroom?' },
      { zh: '不好意思，我没听清楚。', py: 'Bù hǎoyìsi, wǒ méi tīng qīngchu.', en: 'Sorry, I did not hear clearly.' },
      { zh: '不好意思，让你久等了。', py: 'Bù hǎoyìsi, ràng nǐ jiǔ děng le.', en: 'Sorry to keep you waiting.' },
      { zh: '不好意思，我想问一个问题。', py: 'Bù hǎoyìsi, wǒ xiǎng wèn yí ge wèntí.', en: 'Excuse me, I want to ask a question.' },
    ],
  },
  '几位': {
    title: '几位',
    pinyin: 'jǐ wèi',
    translation: 'how many people (for guests)',
    explanation:
      'In restaurants and hotels, 位 is a polite measure word for people. 几位 is the standard way staff ask how many guests are in your group.',
    examples: [
      { zh: '请问，您几位？', py: 'Qǐngwèn, nín jǐ wèi?', en: 'Excuse me, how many people are in your party?' },
      { zh: '我们两位。', py: 'Wǒmen liǎng wèi.', en: 'There are two of us.' },
      { zh: '他们一共四位。', py: 'Tāmen yígòng sì wèi.', en: 'There are four of them in total.' },
      { zh: '今天晚上五位有位子吗？', py: 'Jīntiān wǎnshang wǔ wèi yǒu wèizi ma?', en: 'Do you have seats for five tonight?' },
      { zh: '我们先等两位朋友。', py: 'Wǒmen xiān děng liǎng wèi péngyou.', en: 'We are waiting for two friends first.' },
    ],
  },
  '位子': {
    title: '位子',
    pinyin: 'wèizi',
    translation: 'seat / spot / table',
    explanation:
      '位子 means a seat or a spot. In restaurants, it often means whether there is a table or seating available.',
    examples: [
      { zh: '现在还有位子吗？', py: 'Xiànzài hái yǒu wèizi ma?', en: 'Are there still seats available now?' },
      { zh: '我们想要一个安静一点的位子。', py: 'Wǒmen xiǎng yào yí ge ānjìng yìdiǎn de wèizi.', en: 'We want a quieter seat.' },
      { zh: '靠窗的位子没有了。', py: 'Kàochuāng de wèizi méiyǒu le.', en: 'The window seats are gone.' },
      { zh: '这个位子可以吗？', py: 'Zhège wèizi kěyǐ ma?', en: 'Is this seat okay?' },
      { zh: '请给我们找两个位子。', py: 'Qǐng gěi wǒmen zhǎo liǎng ge wèizi.', en: 'Please find us two seats.' },
    ],
  },
  '靠窗': {
    title: '靠窗',
    pinyin: 'kào chuāng',
    translation: 'by the window / window-side',
    explanation:
      '靠窗 means near the window. It is a very common request chunk in cafés and restaurants.',
    examples: [
      { zh: '我们想坐靠窗的位子。', py: 'Wǒmen xiǎng zuò kàochuāng de wèizi.', en: 'We want to sit by the window.' },
      { zh: '靠窗还有位子吗？', py: 'Kàochuāng hái yǒu wèizi ma?', en: 'Are there still seats by the window?' },
      { zh: '这个靠窗的位置很好。', py: 'Zhège kàochuāng de wèizhi hěn hǎo.', en: 'This window-side spot is very good.' },
      { zh: '我喜欢靠窗坐。', py: 'Wǒ xǐhuan kàochuāng zuò.', en: 'I like sitting by the window.' },
      { zh: '他们已经坐在靠窗那边了。', py: 'Tāmen yǐjīng zuò zài kàochuāng nàbiān le.', en: 'They are already sitting by the window over there.' },
    ],
  },
  '来': {
    title: '来',
    pinyin: 'lái',
    translation: 'to order / let me have',
    explanation:
      'In restaurant Chinese, 来 is often used to place an order, like “let me have…” It does not literally mean physical coming in this context.',
    examples: [
      { zh: '我们先来一份牛肉面。', py: 'Wǒmen xiān lái yí fèn niúròumiàn.', en: 'Let’s first order one beef noodle.' },
      { zh: '再来两碗米饭。', py: 'Zài lái liǎng wǎn mǐfàn.', en: 'And two more bowls of rice.' },
      { zh: '我想来一杯热茶。', py: 'Wǒ xiǎng lái yì bēi rè chá.', en: 'I would like a cup of hot tea.' },
      { zh: '先来这个吧。', py: 'Xiān lái zhège ba.', en: 'Let’s get this first.' },
      { zh: '今天我们来点儿清淡的。', py: 'Jīntiān wǒmen lái diǎnr qīngdàn de.', en: 'Today let’s order something lighter.' },
    ],
  },
  '一共': {
    title: '一共',
    pinyin: 'yígòng',
    translation: 'in total / altogether',
    explanation:
      '一共 is used to talk about the total number or amount, especially when asking or telling the bill.',
    examples: [
      { zh: '一共多少钱？', py: 'Yígòng duōshao qián?', en: 'How much is it in total?' },
      { zh: '这些一共八十八块。', py: 'Zhèxiē yígòng bāshíbā kuài.', en: 'These are 88 yuan in total.' },
      { zh: '我们一共三个人。', py: 'Wǒmen yígòng sān ge rén.', en: 'There are three of us in total.' },
      { zh: '今天一共点了四个菜。', py: 'Jīntiān yígòng diǎn le sì ge cài.', en: 'Today we ordered four dishes in total.' },
      { zh: '你们一共要几杯？', py: 'Nǐmen yígòng yào jǐ bēi?', en: 'How many cups do you want in total?' },
    ],
  },
  '打包': {
    title: '打包',
    pinyin: 'dǎbāo',
    translation: 'to pack up / take away',
    explanation:
      '打包 is the everyday Chinese way to say you want the food packed to take away after the meal.',
    examples: [
      { zh: '这个菜可以打包吗？', py: 'Zhège cài kěyǐ dǎbāo ma?', en: 'Can this dish be packed to go?' },
      { zh: '麻烦帮我打包。', py: 'Máfan bāng wǒ dǎbāo.', en: 'Please help me pack it up.' },
      { zh: '我们想把没吃完的打包。', py: 'Wǒmen xiǎng bǎ méi chī wán de dǎbāo.', en: 'We want to pack up what we did not finish.' },
      { zh: '打包要不要加盒子费？', py: 'Dǎbāo yàobuyào jiā hézi fèi?', en: 'Is there an extra box fee for takeaway packing?' },
      { zh: '她把剩下的饭都打包了。', py: 'Tā bǎ shèngxia de fàn dōu dǎbāo le.', en: 'She packed up all the leftover food.' },
    ],
  },
  '刷卡': {
    title: '刷卡',
    pinyin: 'shuākǎ',
    translation: 'to pay by card / swipe card',
    explanation:
      '刷卡 means paying with a bank card or credit card. In daily restaurant Chinese, 可以刷卡吗 is very common.',
    examples: [
      { zh: '这里可以刷卡吗？', py: 'Zhèlǐ kěyǐ shuākǎ ma?', en: 'Can I pay by card here?' },
      { zh: '我今天想刷卡。', py: 'Wǒ jīntiān xiǎng shuākǎ.', en: 'I want to pay by card today.' },
      { zh: '不好意思，这里不能刷卡。', py: 'Bù hǎoyìsi, zhèlǐ bù néng shuākǎ.', en: 'Sorry, you cannot pay by card here.' },
      { zh: '刷卡还是付现金？', py: 'Shuākǎ háishi fù xiànjīn?', en: 'Card or cash?' },
      { zh: '他已经刷卡结账了。', py: 'Tā yǐjīng shuākǎ jiézhàng le.', en: 'He has already paid by card.' },
    ],
  },
};

const chapters = [
  {
    id: 'chapter1',
    label: 'Chapter 1',
    shortTitle: 'New Roommate',
    title: 'Meet Your New Roommate',
    subtitle: 'Make a good first impression in Chinese.',
    level: 'HSK 2–3',
    icon: Home,
    scene: 'Apartment Living Room',
    goals: [
      'Introduce yourself naturally',
      'Say where you are from',
      'Say whether you speak Chinese',
      'End a first meeting politely',
    ],
    grammarNotes: [
      {
        id: 'newlai',
        title: 'How to explain 新来的',
        short: '“新来的” means “newly arrived / new here.”',
        body: [
          'Break it as: 新 + 来 + 的.',
          '来 here does not only mean physical movement. In this phrase, it describes someone who has newly arrived in a place or group.',
          '的 turns the phrase before it into something that describes a noun.',
          'So 新来的室友 means “the roommate who has just arrived / moved in.”',
        ],
        examples: [
          { zh: '新来的老师。', py: 'Xīn lái de lǎoshī.', en: 'The new teacher.' },
          { zh: '新来的同事。', py: 'Xīn lái de tóngshì.', en: 'The new coworker.' },
        ],
      },
      {
        id: 'topic-comment',
        title: 'Why does 中文 come first in 中文说得怎么样？',
        short: '中文 is better explained as the topic, not as an English-style subject.',
        body: [
          'This sentence works better through a topic-comment explanation, not a simple subject-verb explanation.',
          '中文 is the topic: it tells us what the speaker is asking about.',
          '说得怎么样 is the comment: it asks how well someone speaks it.',
          'So the sentence means: “As for Chinese, how well do you speak it?”',
        ],
        examples: [
          { zh: '中文说得怎么样？', py: 'Zhōngwén shuō de zěnmeyàng?', en: 'How well do you speak Chinese?' },
          { zh: '这个菜，我很喜欢。', py: 'Zhège cài, wǒ hěn xǐhuan.', en: 'As for this dish, I like it a lot.' },
          { zh: '上海，我去过。', py: 'Shànghǎi, wǒ qù guo.', en: 'As for Shanghai, I have been there.' },
        ],
      },
      {
        id: 'shuode',
        title: 'What does 说得怎么样 mean?',
        short: 'It is a verb + 得 + description pattern.',
        body: [
          '得 links the verb to a description of performance or result.',
          '说得怎么样 literally means “how well someone speaks.”',
          'Learners can treat it as a useful pattern: verb + 得 + description.',
          'Later this helps with many verbs: 写得很好, 做得不错, 跑得很快.',
        ],
        examples: [
          { zh: '你中文说得很好。', py: 'Nǐ Zhōngwén shuō de hěn hǎo.', en: 'You speak Chinese very well.' },
          { zh: '他汉语说得怎么样？', py: 'Tā Hànyǔ shuō de zěnmeyàng?', en: 'How well does he speak Chinese?' },
        ],
      },
      {
        id: 'speak-language',
        title: 'Why can 中文 go after 说?',
        short: 'Chinese normally uses 说 + language.',
        body: [
          'Chinese treats a language name as the object after 说 in expressions like 说中文, 说英语, 说法语.',
          'A simple learner rule is: 说 + language.',
          'That does not mean every noun can go after 说. 中文 works because it names a language.',
        ],
        examples: [
          { zh: '我会说中文。', py: 'Wǒ huì shuō Zhōngwén.', en: 'I can speak Chinese.' },
          { zh: '他说英语说得很好。', py: 'Tā shuō Yīngyǔ shuō de hěn hǎo.', en: 'He speaks English very well.' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Reply politely and confirm that you are the new roommate.',
        npc: 'Roommate',
        npcLineZh: '你好，你是新来的室友吗？',
        npcLinePy: 'Nǐ hǎo, nǐ shì xīn lái de shìyǒu ma?',
        npcLineEn: 'Hi, are you the new roommate?',
        npcGlossary: ['新来的'],
        options: [
          {
            id: 'A',
            zh: '你好，对，我是新来的室友。',
            py: 'Nǐ hǎo, duì, wǒ shì xīn lái de shìyǒu.',
            en: 'Hi, yes, I’m the new roommate.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and polite. It answers the question clearly and sounds normal in a first meeting.',
            correction: null,
            glossary: ['新来的'],
          },
          {
            id: 'B',
            zh: '对，我是。',
            py: 'Duì, wǒ shì.',
            en: 'Yes, I am.',
            rating: 'Stiff',
            score: 2,
            relationship: 4,
            explanation: 'Correct, but too short for a first meeting. It sounds cold rather than friendly.',
            correction: '你好，对，我是新来的室友。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '我是新室友来到。',
            py: 'Wǒ shì xīn shìyǒu láidào.',
            en: 'I am new roommate come.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The listener may guess your meaning, but the word order is not Chinese. This looks like English logic pushed into Chinese.',
            correction: '我是新来的室友。',
            glossary: [],
          },
          {
            id: 'D',
            zh: '你是新来的室友吗？',
            py: 'Nǐ shì xīn lái de shìyǒu ma?',
            en: 'Are you the new roommate?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'You repeated the question instead of answering it.',
            correction: '你好，对，我是新来的室友。',
            glossary: ['新来的'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Introduce yourself naturally.',
        npc: 'Roommate',
        npcLineZh: '我叫李明，你呢？',
        npcLinePy: 'Wǒ jiào Lǐ Míng, nǐ ne?',
        npcLineEn: 'My name is Li Ming. What about you?',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '我叫 Alex，很高兴认识你。',
            py: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.',
            en: 'My name is Alex. Nice to meet you.',
            rating: 'Natural',
            score: 3,
            relationship: 10,
            explanation: 'Good first-meeting Chinese. It gives your name and adds a polite closing line.',
            correction: null,
            glossary: [],
          },
          {
            id: 'B',
            zh: '我叫 Alex。',
            py: 'Wǒ jiào Alex.',
            en: 'My name is Alex.',
            rating: 'Stiff',
            score: 2,
            relationship: 2,
            explanation: 'Correct, but plain. In this situation, one more polite phrase sounds better.',
            correction: '我叫 Alex，很高兴认识你。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '我是叫 Alex。',
            py: 'Wǒ shì jiào Alex.',
            en: 'I am called Alex.',
            rating: 'Awkward',
            score: 1,
            relationship: -3,
            explanation: 'This is influenced by English. Chinese usually says 我叫 Alex, not 我是叫 Alex.',
            correction: '我叫 Alex。',
            glossary: [],
          },
          {
            id: 'D',
            zh: '我名字 Alex。',
            py: 'Wǒ míngzi Alex.',
            en: 'My name Alex.',
            rating: 'Incorrect',
            score: 0,
            relationship: -8,
            explanation: 'The sentence is missing a verb. You need 叫 or 是 here.',
            correction: '我叫 Alex。',
            glossary: [],
          },
        ],
      },
      {
        id: 3,
        mission: 'Say where you are from and how your Chinese is.',
        npc: 'Roommate',
        npcLineZh: '你是哪国人？中文说得怎么样？',
        npcLinePy: 'Nǐ shì nǎ guó rén? Zhōngwén shuō de zěnmeyàng?',
        npcLineEn: 'Where are you from? How is your Chinese?',
        npcGlossary: ['中文', '说得怎么样'],
        options: [
          {
            id: 'A',
            zh: '我是美国人，我会说一点中文，不过说得不太好。',
            py: 'Wǒ shì Měiguó rén, wǒ huì shuō yìdiǎn Zhōngwén, búguò shuō de bú tài hǎo.',
            en: 'I’m American. I can speak a little Chinese, but not very well.',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'Natural, complete, and very close to real life speech.',
            correction: null,
            glossary: ['会', '中文'],
          },
          {
            id: 'B',
            zh: '我是美国人。我会一点中文。',
            py: 'Wǒ shì Měiguó rén. Wǒ huì yìdiǎn Zhōngwén.',
            en: 'I’m American. I know a little Chinese.',
            rating: 'Stiff',
            score: 2,
            relationship: 4,
            explanation: 'Understandable, but 我会说一点中文 sounds more natural than 我会一点中文.',
            correction: '我是美国人，我会说一点中文。',
            glossary: ['会', '中文'],
          },
          {
            id: 'C',
            zh: '我来自美国人，我中文一点会。',
            py: 'Wǒ láizì Měiguó rén, wǒ Zhōngwén yìdiǎn huì.',
            en: 'I come from American person, I Chinese a little can.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'This combines two common learner errors: 来自美国人 and English-like word order.',
            correction: '我来自美国。/ 我是美国人。 我会说一点中文。',
            glossary: ['会', '中文'],
          },
          {
            id: 'D',
            zh: '我是美国中文。',
            py: 'Wǒ shì Měiguó Zhōngwén.',
            en: 'I am America Chinese.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'Nationality and language ability need to be expressed separately in Chinese.',
            correction: '我是美国人，我会说一点中文。',
            glossary: ['中文'],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter2',
    label: 'Chapter 2',
    shortTitle: 'Plan & Reschedule',
    title: 'Make a Plan and Change It',
    subtitle: 'Arrange a meeting, then handle a schedule change naturally.',
    level: 'HSK 2–3',
    icon: CalendarDays,
    scene: 'Campus Café & Chat',
    goals: [
      'Ask whether someone is free',
      'Suggest a time naturally',
      'Say you may be late',
      'Reschedule politely',
    ],
    grammarNotes: [
      {
        id: 'you-time',
        title: 'Why 你明天有时间吗 sounds natural',
        short: '有时间 is the normal way to ask if someone is available.',
        body: [
          'Chinese usually asks availability with 有时间, not with a direct translation of “are you free” in every case.',
          '你明天有时间吗？ literally means “Do you have time tomorrow?”',
          'For learners, treat it as a high-frequency chunk for making plans.',
        ],
        examples: [
          { zh: '你晚上有时间吗？', py: 'Nǐ wǎnshang yǒu shíjiān ma?', en: 'Are you free tonight?' },
          { zh: '你周末有时间吗？', py: 'Nǐ zhōumò yǒu shíjiān ma?', en: 'Are you free this weekend?' },
        ],
      },
      {
        id: 'possible-future',
        title: 'How 可能 + 会 works here',
        short: '可能 marks possibility, and 会 helps show a likely future result.',
        body: [
          'In 我明天可能会晚一点, 可能 means “possibly / maybe.”',
          '会 here does not mean skill. It helps mark a predicted future outcome: “may end up being late / may arrive later.”',
          'Chinese does not always need 会 for future time, but it often appears when the speaker wants to make the prediction more explicit.',
        ],
        examples: [
          { zh: '我可能会迟到。', py: 'Wǒ kěnéng huì chídào.', en: 'I may be late.' },
          { zh: '他明天可能会来。', py: 'Tā míngtiān kěnéng huì lái.', en: 'He may come tomorrow.' },
        ],
      },
      {
        id: 'yaoburan',
        title: 'What does 要不然 mean here?',
        short: 'Here it introduces an alternative after a problem appears.',
        body: [
          'In spoken Chinese, 要不然 often means “otherwise / if not / then how about this instead?”',
          'In this chapter, it helps the speaker move from a problem to a solution.',
          'So 要不然我们改时间吧？ feels like: “If that does not work, shall we change the time?”',
        ],
        examples: [
          { zh: '要不然我们明天见吧。', py: 'Yàoburán wǒmen míngtiān jiàn ba.', en: 'Otherwise, let’s meet tomorrow.' },
          { zh: '要不然你先回家吧。', py: 'Yàoburán nǐ xiān huí jiā ba.', en: 'Otherwise, you should go home first.' },
        ],
      },
      {
        id: 'buhaoyisi',
        title: 'When do we use 不好意思?',
        short: '不好意思 is a soft social expression for apology, interruption, or slight embarrassment.',
        body: [
          '不好意思 is common for small apologies, polite interruption, or getting someone’s attention.',
          'It is usually softer and lighter than 对不起 in many daily situations.',
          'In this chapter it works well because the speaker is being polite, not making a heavy serious apology.',
        ],
        examples: [
          { zh: '不好意思，我来晚了。', py: 'Bù hǎoyìsi, wǒ lái wǎn le.', en: 'Sorry, I’m late.' },
          { zh: '不好意思，请问一下。', py: 'Bù hǎoyìsi, qǐng wèn yíxià.', en: 'Excuse me, may I ask something?' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Ask naturally whether your classmate is free tomorrow.',
        npc: 'Classmate',
        npcLineZh: '明天一起喝咖啡吗？',
        npcLinePy: 'Míngtiān yìqǐ hē kāfēi ma?',
        npcLineEn: 'Do you want to get coffee together tomorrow?',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '可以啊，你明天几点有时间？',
            py: 'Kěyǐ a, nǐ míngtiān jǐ diǎn yǒu shíjiān?',
            en: 'Sure. What time are you free tomorrow?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'This sounds cooperative and natural. It accepts first, then asks about time.',
            correction: null,
            glossary: ['有时间'],
          },
          {
            id: 'B',
            zh: '可以。你明天有时间吗？',
            py: 'Kěyǐ. Nǐ míngtiān yǒu shíjiān ma?',
            en: 'Okay. Are you free tomorrow?',
            rating: 'Stiff',
            score: 2,
            relationship: 5,
            explanation: 'It works, but it repeats the idea of tomorrow a bit stiffly after already accepting.',
            correction: '可以啊，你明天几点有时间？',
            glossary: ['有时间'],
          },
          {
            id: 'C',
            zh: '我明天时间有你吗？',
            py: 'Wǒ míngtiān shíjiān yǒu nǐ ma?',
            en: 'Tomorrow time have you?',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The learner is trying to build the sentence from English pieces. Chinese does not arrange it this way.',
            correction: '你明天有时间吗？',
            glossary: ['有时间'],
          },
          {
            id: 'D',
            zh: '你明天一起喝咖啡吗？',
            py: 'Nǐ míngtiān yìqǐ hē kāfēi ma?',
            en: 'Do you want to get coffee tomorrow?',
            rating: 'Incorrect',
            score: 0,
            relationship: -8,
            explanation: 'You repeated the invitation instead of responding to it.',
            correction: '可以啊，你明天几点有时间？',
            glossary: [],
          },
        ],
      },
      {
        id: 2,
        mission: 'Suggest a meeting time naturally.',
        npc: 'Classmate',
        npcLineZh: '我下午有时间。',
        npcLinePy: 'Wǒ xiàwǔ yǒu shíjiān.',
        npcLineEn: 'I’m free in the afternoon.',
        npcGlossary: ['有时间'],
        options: [
          {
            id: 'A',
            zh: '那我们明天下午三点见面吧。',
            py: 'Nà wǒmen míngtiān xiàwǔ sān diǎn jiànmiàn ba.',
            en: 'Then let’s meet at 3 tomorrow afternoon.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural Chinese. The time comes before the action, and 吧 makes it sound like a friendly suggestion.',
            correction: null,
            glossary: [],
          },
          {
            id: 'B',
            zh: '我们见面明天下午三点。',
            py: 'Wǒmen jiànmiàn míngtiān xiàwǔ sān diǎn.',
            en: 'We meet tomorrow afternoon at 3.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'English learners often put the action first, but Chinese usually puts the time before the verb.',
            correction: '我们明天下午三点见面吧。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '好，三点。',
            py: 'Hǎo, sān diǎn.',
            en: 'Okay, 3 o’clock.',
            rating: 'Stiff',
            score: 2,
            relationship: 2,
            explanation: 'It is understandable, but too thin. The learner is not building a full useful planning sentence.',
            correction: '那我们明天下午三点见面吧。',
            glossary: [],
          },
          {
            id: 'D',
            zh: '明天下午三点有时间吗？',
            py: 'Míngtiān xiàwǔ sān diǎn yǒu shíjiān ma?',
            en: 'Are you free tomorrow at 3?',
            rating: 'Incorrect',
            score: 0,
            relationship: -3,
            explanation: 'This is not fully wrong in another context, but here the other person already said they are free in the afternoon. The better next step is to suggest a time.',
            correction: '那我们明天下午三点见面吧。',
            glossary: ['有时间'],
          },
        ],
      },
      {
        id: 3,
        mission: 'Say that you may be a little late and reschedule politely if needed.',
        npc: 'Classmate',
        npcLineZh: '好啊，那就三点见。',
        npcLinePy: 'Hǎo a, nà jiù sān diǎn jiàn.',
        npcLineEn: 'Sounds good, see you at 3.',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '不好意思，我明天可能会晚一点。要不然我们改时间吧？',
            py: 'Bù hǎoyìsi, wǒ míngtiān kěnéng huì wǎn yìdiǎn. Yàoburán wǒmen gǎi shíjiān ba?',
            en: 'Sorry, I may be a little late tomorrow. Otherwise, shall we reschedule?',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'This sounds considerate. It apologizes, explains, and offers a practical solution.',
            correction: null,
            glossary: ['不好意思', '可能', '会', '晚一点', '要不然'],
          },
          {
            id: 'B',
            zh: '我明天晚一点。',
            py: 'Wǒ míngtiān wǎn yìdiǎn.',
            en: 'Tomorrow I later a bit.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The learner knows 晚一点 but is not building a complete sentence. Chinese needs a clearer structure here.',
            correction: '我明天可能会晚一点到。',
            glossary: ['晚一点'],
          },
          {
            id: 'C',
            zh: '不好意思，我明天可能会晚一点到。',
            py: 'Bù hǎoyìsi, wǒ míngtiān kěnéng huì wǎn yìdiǎn dào.',
            en: 'Sorry, I may arrive a little late tomorrow.',
            rating: 'Stiff',
            score: 2,
            relationship: 5,
            explanation: 'Good and useful, but it stops one step early. Offering a solution would be even better.',
            correction: '不好意思，我明天可能会晚一点到。要不然我们改时间吧？',
            glossary: ['不好意思', '可能', '会', '晚一点'],
          },
          {
            id: 'D',
            zh: '三点见。',
            py: 'Sān diǎn jiàn.',
            en: 'See you at 3.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This ignores the new problem. Once your schedule changes, you need to signal it clearly.',
            correction: '不好意思，我明天可能会晚一点。要不然我们改时间吧？',
            glossary: [],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter3',
    label: 'Chapter 3',
    shortTitle: 'Restaurant Order',
    title: 'Order Food Without Sounding Lost',
    subtitle: 'Get a table, place an order, and handle the bill naturally.',
    level: 'HSK 2–3',
    icon: MessageSquareQuote,
    scene: 'Restaurant',
    goals: [
      'Respond to the host naturally',
      'Order food with useful restaurant chunks',
      'Ask for takeaway and pay by card',
    ],
    grammarNotes: [
      {
        id: 'jiwei-weizi',
        title: 'How 几位 and 位子 work in restaurants',
        short: '几位 asks how many guests, and 位子 asks about seating availability.',
        body: [
          '几位 is a fixed restaurant chunk. Staff use 位 as a polite measure word for guests.',
          '位子 means seat or table spot. 有没有位子 means “are there any seats/tables available?”',
          'A practical learner rule is: 几位 for party size, 位子 for table availability.',
        ],
        examples: [
          { zh: '请问，您几位？', py: 'Qǐngwèn, nín jǐ wèi?', en: 'Excuse me, how many people are in your party?' },
          { zh: '现在还有位子吗？', py: 'Xiànzài hái yǒu wèizi ma?', en: 'Are there still seats available now?' },
        ],
      },
      {
        id: 'lai-order',
        title: 'Why restaurants use 来 to order',
        short: '来 + quantity + noun is a very common ordering pattern.',
        body: [
          'In restaurant Chinese, 来 often means “let me have / let’s get.”',
          'It sounds more natural than translating directly from English word by word.',
          'Learners can reuse this pattern again and again: 来一份…, 再来两碗…, 先来一个….',
        ],
        examples: [
          { zh: '我们先来一份牛肉面。', py: 'Wǒmen xiān lái yí fèn niúròumiàn.', en: 'Let’s first order one beef noodle.' },
          { zh: '再来一盘青菜。', py: 'Zài lái yì pán qīngcài.', en: 'And one more plate of greens.' },
        ],
      },
      {
        id: 'yigong-dabao',
        title: 'How 一共, 打包, and 刷卡 work at the end',
        short: 'These three chunks cover the total bill, takeaway packing, and paying by card.',
        body: [
          '一共 is used for the total amount. 一共多少钱 means “how much is it in total?”',
          '打包 means packing the food to take away.',
          '刷卡 means paying by card. 可以刷卡吗 is a very common real-life question.',
        ],
        examples: [
          { zh: '一共多少钱？', py: 'Yígòng duōshao qián?', en: 'How much is it in total?' },
          { zh: '这个可以打包吗？', py: 'Zhège kěyǐ dǎbāo ma?', en: 'Can this be packed to go?' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Tell the host your party size and ask for a window seat.',
        npc: 'Host',
        npcLineZh: '欢迎光临，几位？',
        npcLinePy: 'Huānyíng guānglín, jǐ wèi?',
        npcLineEn: 'Welcome. How many people?',
        npcGlossary: ['几位'],
        options: [
          {
            id: 'A',
            zh: '两位。请问有没有靠窗的位子？',
            py: 'Liǎng wèi. Qǐngwèn yǒu méiyǒu kàochuāng de wèizi?',
            en: 'Two people. Excuse me, do you have a window seat?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'This is polite, efficient, and sounds like real restaurant Chinese.',
            correction: null,
            glossary: ['靠窗', '位子'],
          },
          {
            id: 'B',
            zh: '两个人。有位子吗？',
            py: 'Liǎng ge rén. Yǒu wèizi ma?',
            en: 'Two people. Is there a seat?',
            rating: 'Stiff',
            score: 2,
            relationship: 4,
            explanation: 'It works, but it sounds flatter and less polished than 两位 plus a more specific request.',
            correction: '两位。请问有没有靠窗的位子？',
            glossary: ['位子'],
          },
          {
            id: 'C',
            zh: '我们是两位的人，有没有窗户旁边？',
            py: 'Wǒmen shì liǎng wèi de rén, yǒu méiyǒu chuānghu pángbiān?',
            en: 'We are two-person people. Do you have beside the window?',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The listener may understand part of it, but the sentence is built with English logic and incomplete Chinese chunks.',
            correction: '两位。请问有没有靠窗的位子？',
            glossary: ['几位'],
          },
          {
            id: 'D',
            zh: '你几位？',
            py: 'Nǐ jǐ wèi?',
            en: 'How many people are you?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'You repeated the host’s question back instead of answering it.',
            correction: '两位。请问有没有靠窗的位子？',
            glossary: ['几位'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Order food using a natural restaurant pattern.',
        npc: 'Waiter',
        npcLineZh: '你们想吃什么？',
        npcLinePy: 'Nǐmen xiǎng chī shénme?',
        npcLineEn: 'What would you like to eat?',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '我们先来一份牛肉面，再来一盘青菜。',
            py: 'Wǒmen xiān lái yí fèn niúròumiàn, zài lái yì pán qīngcài.',
            en: 'We’ll start with one beef noodle and then one plate of greens.',
            rating: 'Natural',
            score: 3,
            relationship: 13,
            explanation: 'This uses a common restaurant ordering chunk and sounds practical and natural.',
            correction: null,
            glossary: ['来'],
          },
          {
            id: 'B',
            zh: '我要牛肉面和青菜。',
            py: 'Wǒ yào niúròumiàn hé qīngcài.',
            en: 'I want beef noodles and greens.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'It is understandable, but it sounds blunter and less restaurant-like than 来一份 / 来一盘.',
            correction: '我们先来一份牛肉面，再来一盘青菜。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '我们来牛肉面一个，青菜一个盘。',
            py: 'Wǒmen lái niúròumiàn yí ge, qīngcài yí ge pán.',
            en: 'We order one beef noodle, one plate greens.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The learner knows some pieces of the pattern, but the measure word placement is wrong and sounds unnatural.',
            correction: '我们先来一份牛肉面，再来一盘青菜。',
            glossary: ['来'],
          },
          {
            id: 'D',
            zh: '什么你们想吃？',
            py: 'Shénme nǐmen xiǎng chī?',
            en: 'What you want eat?',
            rating: 'Incorrect',
            score: 0,
            relationship: -9,
            explanation: 'This is not an answer to the waiter’s question, and the word order is also broken.',
            correction: '我们先来一份牛肉面，再来一盘青菜。',
            glossary: [],
          },
        ],
      },
      {
        id: 3,
        mission: 'Ask for takeaway and check whether you can pay by card.',
        npc: 'Waiter',
        npcLineZh: '一共八十八块，您要打包吗？',
        npcLinePy: 'Yígòng bāshíbā kuài, nín yào dǎbāo ma?',
        npcLineEn: 'It’s 88 yuan in total. Would you like it packed to go?',
        npcGlossary: ['一共', '打包'],
        options: [
          {
            id: 'A',
            zh: '要打包。可以刷卡吗？',
            py: 'Yào dǎbāo. Kěyǐ shuākǎ ma?',
            en: 'Yes, please pack it. Can I pay by card?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Clear, practical, and exactly the kind of chunk learners can reuse in real restaurants.',
            correction: null,
            glossary: ['打包', '刷卡'],
          },
          {
            id: 'B',
            zh: '我要打包，我可以刷卡吗？',
            py: 'Wǒ yào dǎbāo, wǒ kěyǐ shuākǎ ma?',
            en: 'I want takeaway, can I pay by card?',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'This is understandable, but a little heavier than the more natural chunked version.',
            correction: '要打包。可以刷卡吗？',
            glossary: ['打包', '刷卡'],
          },
          {
            id: 'C',
            zh: '我要盒子带走，可以刷卡不可以？',
            py: 'Wǒ yào hézi dài zǒu, kěyǐ shuākǎ bù kěyǐ?',
            en: 'I want a box take away, can card or not?',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The listener may guess your meaning, but the phrasing is patched together and not how people usually say it.',
            correction: '要打包。可以刷卡吗？',
            glossary: ['打包', '刷卡'],
          },
          {
            id: 'D',
            zh: '你要打包吗？',
            py: 'Nǐ yào dǎbāo ma?',
            en: 'Do you want takeaway?',
            rating: 'Incorrect',
            score: 0,
            relationship: -9,
            explanation: 'You repeated the waiter’s question instead of answering it and asking about payment.',
            correction: '要打包。可以刷卡吗？',
            glossary: ['打包'],
          },
        ],
      },
    ],
  },
];

function RatingBadge({ rating }) {
  const map = {
    Natural: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Stiff: 'bg-amber-100 text-amber-800 border-amber-200',
    Awkward: 'bg-orange-100 text-orange-800 border-orange-200',
    Incorrect: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return <Badge className={`border ${map[rating]}`}>{rating}</Badge>;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function SaveButton({ saved, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full p-1 transition ${dark ? 'bg-white/15 hover:bg-white/25' : 'bg-neutral-100 hover:bg-neutral-200'}`}
      aria-label={saved ? 'Remove from collection' : 'Save to collection'}
    >
      <Bookmark className={`h-4 w-4 ${saved ? (dark ? 'fill-white text-white' : 'fill-neutral-900 text-neutral-900') : (dark ? 'text-white' : 'text-neutral-500')}`} />
    </button>
  );
}

function AnnotatedText({ text, glossaryKeys = [], onOpen, className = '' }) {
  if (!glossaryKeys.length) return <span className={className}>{text}</span>;

  const sorted = [...glossaryKeys].sort((a, b) => text.indexOf(a) - text.indexOf(b));
  const parts = [];
  let cursor = 0;

  sorted.forEach((key, index) => {
    const start = text.indexOf(key, cursor);
    if (start === -1) return;
    if (start > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, start), id: `t-${index}-${cursor}` });
    }
    parts.push({ type: 'token', value: key, id: `k-${index}-${start}` });
    cursor = start + key.length;
  });

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor), id: `tail-${cursor}` });
  }

  return (
    <span className={className}>
      {parts.map((part) =>
        part.type === 'token' ? (
          <button
            key={part.id}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(part.value);
            }}
            className="rounded-md bg-sky-100 px-1 py-0.5 font-semibold text-sky-800 underline decoration-dotted underline-offset-4 transition hover:bg-sky-200"
          >
            {part.value}
          </button>
        ) : (
          <span key={part.id}>{part.value}</span>
        )
      )}
    </span>
  );
}

function AppSectionButton({ active, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        active
          ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
          : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-2 ${active ? 'bg-white/15' : 'bg-neutral-100'}`}>
          <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-neutral-700'}`} />
        </div>
        <div>
          <div className={`font-semibold ${active ? 'text-white' : 'text-neutral-900'}`}>{title}</div>
          <div className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-neutral-600'}`}>{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function ChapterUIPrototype() {
  const persisted = useMemo(() => readPilotState(), []);

  const [currentView, setCurrentView] = useState(persisted?.currentView || 'home');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(persisted?.currentChapterIndex || 0);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(persisted?.currentNodeIndex || 0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [nodeSelections, setNodeSelections] = useState(persisted?.nodeSelections || {});
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPinyin, setShowPinyin] = useState(persisted?.showPinyin ?? true);
  const [showEnglish, setShowEnglish] = useState(persisted?.showEnglish ?? true);
  const [trust, setTrust] = useState(persisted?.trust || 30);
  const [mastery, setMastery] = useState(persisted?.mastery || 12);
  const [collected, setCollected] = useState(persisted?.collected || []);
  const [practiceLog, setPracticeLog] = useState(persisted?.practiceLog || []);
  const [activeNoteId, setActiveNoteId] = useState(persisted?.activeNoteId || chapters[0].grammarNotes[0].id);
  const [selectedGlossaryKey, setSelectedGlossaryKey] = useState(null);
  const [glossaryShowPinyin, setGlossaryShowPinyin] = useState(true);
  const [glossaryShowEnglish, setGlossaryShowEnglish] = useState(true);
  const [quickExamplesShowPinyin, setQuickExamplesShowPinyin] = useState(persisted?.quickExamplesShowPinyin ?? true);
  const [quickExamplesShowEnglish, setQuickExamplesShowEnglish] = useState(persisted?.quickExamplesShowEnglish ?? true);
  const [audioRate, setAudioRate] = useState(persisted?.audioRate ?? 0.75);
  const [fontScale, setFontScale] = useState(persisted?.fontScale || 'md');

  const makeNodeKey = (chapterIndex, nodeIndex) => `${chapterIndex}-${nodeIndex}`;

  const chineseHeadingClass = fontScale === 'sm' ? 'text-xl' : fontScale === 'lg' ? 'text-3xl' : 'text-2xl';
  const chineseOptionClass = fontScale === 'sm' ? 'text-base' : fontScale === 'lg' ? 'text-xl' : 'text-lg';
  const glossaryTitleClass = fontScale === 'sm' ? 'text-xl' : fontScale === 'lg' ? 'text-3xl' : 'text-2xl';

  const currentChapter = chapters[currentChapterIndex];
  const currentNode = currentChapter.nodes[currentNodeIndex];
  const displayOptions = useMemo(() => {
    const shuffled = shuffleArray(currentNode.options);
    const labels = ['A', 'B', 'C', 'D'];
    return shuffled.map((option, index) => ({
      ...option,
      displayId: labels[index] || option.id,
    }));
  }, [currentChapterIndex, currentNodeIndex]);
  const selectedOption = useMemo(
    () => currentNode.options.find((o) => o.id === selectedOptionId) || null,
    [currentNode, selectedOptionId]
  );
  const activeNote = currentChapter.grammarNotes.find((note) => note.id === activeNoteId) || currentChapter.grammarNotes[0];
  const selectedGlossary = selectedGlossaryKey ? glossary[selectedGlossaryKey] : null;

  const chapterProgress = ((currentNodeIndex + 1) / currentChapter.nodes.length) * 100;
  const overallProgress = ((currentChapterIndex + 1) / chapters.length) * 100;
  const isLastNode = currentNodeIndex === currentChapter.nodes.length - 1;
  const isLastChapter = currentChapterIndex === chapters.length - 1;

  const recentCollected = [...collected].slice(-3).reverse();
  const reviewItems = useMemo(() => {
    const map = new Map();
    practiceLog
      .filter((item) => item.rating !== 'Natural')
      .forEach((item) => {
        const key = `${item.chapter}-${item.mission}-${item.selected}`;
        if (!map.has(key)) map.set(key, item);
      });
    return Array.from(map.values()).slice(-6).reverse();
  }, [practiceLog]);

  const isCollected = (id) => collected.some((item) => item.id === id);

  const toggleCollected = (item) => {
    setCollected((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      return exists ? prev.filter((entry) => entry.id !== item.id) : [...prev, item];
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentView,
        currentChapterIndex,
        currentNodeIndex,
        showPinyin,
        showEnglish,
        trust,
        mastery,
        collected,
        practiceLog,
        activeNoteId,
        quickExamplesShowPinyin,
        quickExamplesShowEnglish,
        audioRate,
        fontScale,
        nodeSelections,
      })
    );
  }, [
    currentView,
    currentChapterIndex,
    currentNodeIndex,
    showPinyin,
    showEnglish,
    trust,
    mastery,
    collected,
    practiceLog,
    activeNoteId,
    quickExamplesShowPinyin,
    quickExamplesShowEnglish,
    audioRate,
    fontScale,
    nodeSelections,
  ]);

  useEffect(() => {
    const savedSelection = nodeSelections[makeNodeKey(currentChapterIndex, currentNodeIndex)] || null;
    setSelectedOptionId(savedSelection);
  }, [currentChapterIndex, currentNodeIndex, nodeSelections]);

  const handleSelectOption = (optionId) => {
    const key = makeNodeKey(currentChapterIndex, currentNodeIndex);
    setSelectedOptionId(optionId);
    setNodeSelections((prev) => ({ ...prev, [key]: optionId }));
  };

  const switchChapter = (index) => {
    setCurrentChapterIndex(index);
    setCurrentNodeIndex(0);
    setShowFeedback(false);
    setSelectedGlossaryKey(null);
    setActiveNoteId(chapters[index].grammarNotes[0].id);
    setCurrentView('story');
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setShowFeedback(true);
    setTrust((prev) => Math.max(0, Math.min(100, prev + selectedOption.relationship)));
    setMastery((prev) => Math.max(0, Math.min(100, prev + selectedOption.score * 8)));

    const logItem = {
      chapter: currentChapter.shortTitle,
      mission: currentNode.mission,
      selected: selectedOption.zh,
      rating: selectedOption.rating,
      correction: selectedOption.correction,
      timestamp: Date.now(),
    };
    setPracticeLog((prev) => [...prev, logItem]);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    if (!isLastNode) {
      setCurrentNodeIndex((prev) => prev + 1);
      return;
    }
    if (!isLastChapter) {
      switchChapter(currentChapterIndex + 1);
    }
  };

  const handlePreviousNode = () => {
    if (currentNodeIndex === 0) return;
    setShowFeedback(false);
    setCurrentNodeIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextNode = () => {
    if (isLastNode) return;
    setShowFeedback(false);
    setCurrentNodeIndex((prev) => Math.min(currentChapter.nodes.length - 1, prev + 1));
  };

  const resetPilot = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    setCurrentView('home');
    setCurrentChapterIndex(0);
    setCurrentNodeIndex(0);
    setSelectedOptionId(null);
    setNodeSelections({});
    setShowFeedback(false);
    setShowPinyin(true);
    setShowEnglish(true);
    setTrust(30);
    setMastery(12);
    setCollected([]);
    setPracticeLog([]);
    setActiveNoteId(chapters[0].grammarNotes[0].id);
    setSelectedGlossaryKey(null);
    setGlossaryShowPinyin(true);
    setGlossaryShowEnglish(true);
    setQuickExamplesShowPinyin(true);
    setQuickExamplesShowEnglish(true);
    setAudioRate(0.75);
    setFontScale('md');
  };

  const renderMainView = () => {
    if (currentView === 'home') {
      return (
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
            <div className="h-56 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#e5e7eb_55%,_#fafafa)] p-6">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge className="rounded-full bg-white/80 text-neutral-800">Yun Mandarin Lab</Badge>
                  <Badge variant="outline" className="rounded-full bg-white/70">Pilot for students</Badge>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold">Train Chinese through situations</h2>
                  <p className="mt-2 max-w-xl text-sm text-neutral-600">
                    This pilot is built for Yun’s current students. Learn by making choices, seeing consequences, and saving the expressions that feel worth keeping.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Continue learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-neutral-100 p-4">
                  <div className="text-sm text-neutral-500">Current chapter</div>
                  <div className="mt-1 text-xl font-semibold">{currentChapter.title}</div>
                  <div className="mt-1 text-sm text-neutral-600">Node {currentNodeIndex + 1} of {currentChapter.nodes.length}</div>
                </div>
                <Button className="rounded-2xl px-6" onClick={() => setCurrentView('story')}>Continue story mode</Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Progress snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Overall progress</span>
                    <span className="font-medium">{currentChapterIndex + 1}/{chapters.length}</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <div className="text-neutral-500">Collected</div>
                    <div className="mt-1 text-2xl font-semibold">{collected.length}</div>
                  </div>
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <div className="text-neutral-500">Needs review</div>
                    <div className="mt-1 text-2xl font-semibold">{reviewItems.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Most recent saved items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {recentCollected.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 md:col-span-3">
                  Nothing saved yet. Students can now decide for themselves what to keep.
                </div>
              ) : (
                recentCollected.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">{item.expression}</div>
                        <AudioButton text={item.expression} small />
                      </div>
                      {item.pinyin && <div className="mt-1 text-sm text-neutral-500">{item.pinyin}</div>}
                        {item.english && <div className="mt-1 text-sm text-neutral-700">{item.english}</div>}
                      </div>
                      <Badge variant="outline" className="rounded-full">{item.type}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">{item.source || item.chapter}</div>
                    {item.mission && <div className="mt-1 text-sm text-neutral-600">{item.mission}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'favorites') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Expression Collection</CardTitle>
              <p className="text-sm text-neutral-500">Students decide what to keep. Options, glossary terms, glossary examples, and quick examples can all be saved here.</p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {collected.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 md:col-span-2">
                  The collection is empty. Save anything that feels useful, natural, or worth reviewing later.
                </div>
              ) : (
                collected.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">{item.expression}</div>
                        <AudioButton text={item.expression} small />
                      </div>
                      {item.pinyin && <div className="mt-1 text-sm text-neutral-500">{item.pinyin}</div>}
                        {item.english && <div className="mt-1 text-sm text-neutral-700">{item.english}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full">{item.type}</Badge>
                        <SaveButton saved onClick={() => toggleCollected(item)} />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">{item.source || item.chapter}</div>
                    {item.mission && <div className="mt-1 text-sm text-neutral-600">{item.mission}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'review') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Review Queue</CardTitle>
              <p className="text-sm text-neutral-500">These are the items where you sounded stiff, awkward, or incorrect.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  No review items yet. Once you make non-natural choices, they will appear here.
                </div>
              ) : (
                reviewItems.map((item, idx) => (
                  <div key={`${item.selected}-${idx}`} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center gap-2">
                      <RatingBadge rating={item.rating} />
                      <span className="text-xs text-neutral-500">{item.chapter}</span>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="font-semibold">{item.selected}</div>
                      <AudioButton text={item.selected} small />
                    </div>
                    <div className="mt-2 text-sm text-neutral-600">{item.mission}</div>
                    {item.correction && (
                      <div className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 font-medium">
                        <span>Better version</span>
                        <AudioButton text={item.correction} small />
                      </div>
                      <div className="mt-1">{item.correction}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'settings') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Pilot Settings</CardTitle>
              <p className="text-sm text-neutral-500">This pilot currently stores progress on this device only.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-neutral-100 p-4">
                <div className="font-medium">Main story display</div>
                <div className="mt-3 flex gap-2">
                  <Button variant={showPinyin ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setShowPinyin((v) => !v)}>Pinyin</Button>
                  <Button variant={showEnglish ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setShowEnglish((v) => !v)}>English</Button>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-4">
                <div className="font-medium">Quick examples display</div>
                <div className="mt-3 flex gap-2">
                  <Button variant={quickExamplesShowPinyin ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setQuickExamplesShowPinyin((v) => !v)}>Quick Pinyin</Button>
                  <Button variant={quickExamplesShowEnglish ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setQuickExamplesShowEnglish((v) => !v)}>Quick English</Button>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-4">
                <div className="font-medium">Audio speed</div>
                <p className="mt-1 text-sm text-neutral-600">Choose the playback speed for all Chinese audio in the app.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[0.5, 0.75, 1].map((rate) => (
                    <Button
                      key={rate}
                      variant={audioRate === rate ? 'default' : 'outline'}
                      className="rounded-2xl"
                      onClick={() => setAudioRate(rate)}
                    >
                      {rate.toFixed(2).replace(/\.00$/, '.0')}x
                    </Button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-4">
                <div className="font-medium">Font size</div>
                <p className="mt-1 text-sm text-neutral-600">Adjust the Chinese text size for easier reading.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Small', value: 'sm' },
                    { label: 'Medium', value: 'md' },
                    { label: 'Large', value: 'lg' },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      variant={fontScale === item.value ? 'default' : 'outline'}
                      className="rounded-2xl"
                      onClick={() => setFontScale(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-rose-300 p-4">
                <div className="font-medium text-rose-700">Reset local pilot data</div>
                <p className="mt-1 text-sm text-neutral-600">This clears current progress, collection, review items, and local settings on this device.</p>
                <Button variant="outline" className="mt-3 rounded-2xl" onClick={resetPilot}>Reset local data</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
          <div className="h-56 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#e5e7eb_55%,_#fafafa)] p-6">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full bg-white/80 text-neutral-800">{currentChapter.scene}</Badge>
                <Badge variant="outline" className="rounded-full bg-white/70">{currentChapter.level}</Badge>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{currentChapter.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-500">Yun Mandarin Lab</p>
                <p className="mt-2 max-w-xl text-sm text-neutral-600">{currentChapter.subtitle}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">Current mission</p>
                <h3 className="text-lg font-semibold">{currentNode.mission}</h3>
              </div>
              <div className="flex gap-2">
                <Button variant={showPinyin ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setShowPinyin((v) => !v)}>
                  Pinyin
                </Button>
                <Button variant={showEnglish ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setShowEnglish((v) => !v)}>
                  English
                </Button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between text-sm text-neutral-500">
              <span>Tip: tap highlighted words or phrases for meaning, explanation, and practical examples.</span>
              <span className="font-medium">{currentNodeIndex + 1}/{currentChapter.nodes.length}</span>
            </div>
            <Progress value={chapterProgress} className="h-2" />

            <motion.div layout className="mt-4 rounded-3xl bg-neutral-100 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-neutral-500">
                <MessageSquareQuote className="h-4 w-4" /> {currentNode.npc}
                <AudioButton text={currentNode.npcLineZh} />
              </div>
              <div className="space-y-2">
                <div className={`${chineseHeadingClass} font-semibold tracking-tight`}>
                  <AnnotatedText text={currentNode.npcLineZh} glossaryKeys={currentNode.npcGlossary} onOpen={setSelectedGlossaryKey} />
                </div>
                {showPinyin && <p className="text-sm text-neutral-500">{currentNode.npcLinePy}</p>}
                {showEnglish && <p className="text-sm text-neutral-600">{currentNode.npcLineEn}</p>}
              </div>
            </motion.div>

            <div className="mt-6 grid gap-3">
              {displayOptions.map((option) => {
                const active = selectedOptionId === option.id;
                const optionCollectionItem = createCollectionItem({
                  expression: option.zh,
                  pinyin: option.py,
                  english: option.en,
                  type: 'option',
                  source: `${currentChapter.shortTitle} · Option`,
                  chapter: currentChapter.shortTitle,
                  mission: currentNode.mission,
                });
                const optionSaved = isCollected(optionCollectionItem.id);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-full">
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm font-medium opacity-80">
                          <span>Option {option.displayId}</span>
                          <div className="flex items-center gap-1">
                            <AudioButton text={option.zh} dark={active} small />
                            <SaveButton
                            saved={optionSaved}
                            dark={active}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollected(optionCollectionItem);
                            }}
                          />
                          </div>
                        </div>
                        <div className={`${chineseOptionClass} font-semibold`}>
                          <AnnotatedText text={option.zh} glossaryKeys={option.glossary} onOpen={setSelectedGlossaryKey} />
                        </div>
                        {showPinyin && <div className={`mt-1 text-sm ${active ? 'text-white/75' : 'text-neutral-500'}`}>{option.py}</div>}
                        {showEnglish && <div className={`mt-1 text-sm ${active ? 'text-white/85' : 'text-neutral-700'}`}>{option.en}</div>}
                      </div>
                      <ChevronRight className={`mt-1 h-5 w-5 ${active ? 'text-white' : 'text-neutral-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={handlePreviousNode} disabled={currentNodeIndex === 0 || showFeedback}>
                  Previous
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={handleNextNode} disabled={isLastNode || showFeedback}>
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <BrainCircuit className="h-4 w-4" />
                Pick what sounds most natural in this social situation.
              </div>
              <Button className="rounded-2xl px-6" disabled={!selectedOption} onClick={handleSubmit}>Submit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (currentView === 'home') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Pilot structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700">
              <div className="rounded-2xl bg-neutral-100 p-4">Home gives students a clear restart point instead of throwing them straight into a chapter.</div>
              <div className="rounded-2xl bg-neutral-100 p-4">Collection now stores whatever the student actively chooses to keep.</div>
              <div className="rounded-2xl bg-neutral-100 p-4">Review surfaces non-natural choices so the student can revisit weak spots later.</div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sync note</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-700">
              This pilot stores progress on this device only. Cross-device sync and teacher-side analytics can be added later when you decide on a mainland-friendly backend.
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'favorites') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Why collection matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700">
              <div className="rounded-2xl bg-neutral-100 p-4">Collection is now intentional, not automatic. That makes it a better signal of what the student actually values.</div>
              <div className="rounded-2xl bg-neutral-100 p-4">Later, this can become one of the strongest signals for personalized review and recommendation.</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'review') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How review works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700">
              <div className="rounded-2xl bg-neutral-100 p-4">Natural answers are not the only data point. Stiff, awkward, and incorrect choices also matter.</div>
              <div className="rounded-2xl bg-neutral-100 p-4">This queue is the beginning of a future personalized memory system.</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'settings') {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Trial notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700">
              <div className="rounded-2xl bg-neutral-100 p-4">This version is designed for current students, not open public distribution.</div>
              <div className="rounded-2xl bg-neutral-100 p-4">Brand trace is already visible as Yun Mandarin Lab across the pilot.</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Why this chapter works</CardTitle>
            <p className="text-sm text-neutral-500">Grammar is explained where the learner is most likely to get stuck.</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {currentChapter.grammarNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                    activeNote.id === note.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  {note.title}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-neutral-100 p-4">
              <h4 className="font-semibold">{activeNote.title}</h4>
              <p className="mt-1 text-sm text-neutral-600">{activeNote.short}</p>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              {activeNote.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Quick examples</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={quickExamplesShowPinyin ? 'default' : 'outline'}
                    className="rounded-2xl"
                    onClick={() => setQuickExamplesShowPinyin((v) => !v)}
                  >
                    Quick Pinyin
                  </Button>
                  <Button
                    variant={quickExamplesShowEnglish ? 'default' : 'outline'}
                    className="rounded-2xl"
                    onClick={() => setQuickExamplesShowEnglish((v) => !v)}
                  >
                    Quick English
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {activeNote.examples.map((example) => {
                  const quickExampleItem = createCollectionItem({
                    expression: example.zh,
                    pinyin: example.py,
                    english: example.en,
                    type: 'quick-example',
                    source: `${activeNote.title} · Quick example`,
                    chapter: currentChapter.shortTitle,
                  });
                  const quickSaved = isCollected(quickExampleItem.id);
                  return (
                    <div key={example.zh} className="rounded-xl border border-neutral-200 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium">{example.zh}</div>
                        <div className="flex items-center gap-1">
                          <AudioButton text={example.zh} small />
                          <SaveButton saved={quickSaved} onClick={() => toggleCollected(quickExampleItem)} />
                        </div>
                      </div>
                      {quickExamplesShowPinyin && <div className="mt-1 text-neutral-500">{example.py}</div>}
                      {quickExamplesShowEnglish && <div className="mt-2 text-neutral-700">{example.en}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Retention by design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700">
            <div className="rounded-2xl bg-neutral-100 p-4">
              <div className="font-medium">1. No answer-position pattern</div>
              <p className="mt-1 text-neutral-600">Options are shuffled when a new node loads, so learners must judge language quality instead of guessing that the first choice is always right.</p>
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <div className="font-medium">2. Intentional collection</div>
              <p className="mt-1 text-neutral-600">Students now decide for themselves what to save from options, glossary, and examples instead of having the system collect things automatically.</p>
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <div className="font-medium">3. Immediate consequence</div>
              <p className="mt-1 text-neutral-600">The user does not just see right or wrong. The social meter changes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const glossaryTermItem = selectedGlossary
    ? createCollectionItem({
        expression: selectedGlossary.title,
        pinyin: selectedGlossary.pinyin,
        english: selectedGlossary.translation,
        type: 'glossary-term',
        source: 'Glossary term',
        chapter: currentChapter.shortTitle,
      })
    : null;
  const glossaryTermSaved = glossaryTermItem ? isCollected(glossaryTermItem.id) : false;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
      <div className="mx-auto mb-6 grid max-w-7xl gap-3 md:grid-cols-5">
        <AppSectionButton active={currentView === 'home'} icon={House} title="Home" subtitle="Continue and overview" onClick={() => setCurrentView('home')} />
        <AppSectionButton active={currentView === 'story'} icon={Compass} title="Story" subtitle="Situation practice" onClick={() => setCurrentView('story')} />
        <AppSectionButton active={currentView === 'favorites'} icon={Bookmark} title="Collection" subtitle="Saved expressions" onClick={() => setCurrentView('favorites')} />
        <AppSectionButton active={currentView === 'review'} icon={RotateCcw} title="Review" subtitle="Fix weak spots" onClick={() => setCurrentView('review')} />
        <AppSectionButton active={currentView === 'settings'} icon={Settings2} title="Settings" subtitle="Pilot controls" onClick={() => setCurrentView('settings')} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-neutral-900 text-white">Yun Mandarin Lab</Badge>
              <Badge variant="outline" className="rounded-full">Pilot Version</Badge>
            </div>
            <CardTitle className="pt-2 text-2xl">Yun Mandarin Lab</CardTitle>
            <p className="text-sm text-neutral-500">A scenario-based Chinese learning prototype by Yun. Train useful Chinese through consequences, not through isolated drills.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-500">Overall progress</span>
                <span className="font-medium">{currentChapterIndex + 1}/{chapters.length} chapters</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const Icon = chapter.icon;
                const active = index === currentChapterIndex;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => switchChapter(index)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-2 ${active ? 'bg-white/15' : 'bg-neutral-100'}`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-neutral-700'}`} />
                      </div>
                      <div>
                        <div className={`text-sm ${active ? 'text-white/75' : 'text-neutral-500'}`}>{chapter.label}</div>
                        <div className="font-semibold">{chapter.shortTitle}</div>
                        <div className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-neutral-600'}`}>{chapter.subtitle}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-neutral-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Heart className="h-4 w-4" /> Social comfort
              </div>
              <Progress value={trust} className="h-2" />
              <p className="mt-2 text-xs text-neutral-500">Good Chinese should feel socially safe, not just grammatically correct.</p>
            </div>

            <div className="rounded-2xl bg-neutral-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" /> Naturalness mastery
              </div>
              <Progress value={mastery} className="h-2" />
              <p className="mt-2 text-xs text-neutral-500">The target is not only “correct.” The target is “something a real person would say.”</p>
            </div>

            <div className="rounded-2xl border border-dashed border-neutral-300 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" /> Saved items
              </div>
              <div className="space-y-2 text-sm">
                {collected.length === 0 ? (
                  <p className="text-neutral-500">Students now choose for themselves what to save.</p>
                ) : (
                  collected.slice(-5).reverse().map((item) => (
                    <div key={item.id} className="rounded-xl bg-white p-2 shadow-sm">{item.expression}</div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900 p-4 text-sm text-white">
              <div className="font-semibold">Yun Mandarin Lab</div>
              <div className="mt-1 text-white/80">Pilot build for Yun’s current students.</div>
              <div className="mt-2 text-white/70">© Yun Mandarin Lab · Internal trial</div>
            </div>
          </CardContent>
        </Card>

        {renderMainView()}

        {renderRightPanel()}
      </div>

      <AnimatePresence>
        {showFeedback && selectedOption && currentView === 'story' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {selectedOption.rating === 'Natural' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-600" />
                    )}
                    <RatingBadge rating={selectedOption.rating} />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`${fontScale === 'sm' ? 'text-lg' : fontScale === 'lg' ? 'text-2xl' : 'text-xl'} font-semibold`}>{selectedOption.zh}</h3>
                    <AudioButton text={selectedOption.zh} />
                  </div>
                  {showPinyin && <p className="mt-1 text-sm text-neutral-500">{selectedOption.py}</p>}
                  {showEnglish && <p className="mt-1 text-sm text-neutral-700">{selectedOption.en}</p>}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-100 p-4">
                  <div className="mb-2 text-sm font-medium">Why this answer feels this way</div>
                  <p className="text-sm text-neutral-700">{selectedOption.explanation}</p>
                </div>
                <div className="rounded-2xl bg-neutral-100 p-4">
                  <div className="mb-2 text-sm font-medium">Scene consequence</div>
                  <p className="text-sm text-neutral-700">
                    Social comfort {selectedOption.relationship >= 0 ? '+' : ''}{selectedOption.relationship} · Naturalness +{selectedOption.score * 8}
                  </p>
                  <p className="mt-2 text-sm text-neutral-600">
                    {selectedOption.rating === 'Natural'
                      ? 'Good. The conversation moves forward smoothly.'
                      : selectedOption.rating === 'Stiff'
                      ? 'The conversation continues, but you sound flatter or less warm.'
                      : selectedOption.rating === 'Awkward'
                      ? 'The other person may mentally repair your Chinese before reacting.'
                      : 'This creates confusion and weakens the interaction.'}
                  </p>
                </div>
              </div>

              {selectedOption.correction && (
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm font-medium">
                  <span>Better version</span>
                  <AudioButton text={selectedOption.correction} small />
                </div>
                <p className="text-base font-medium">{selectedOption.correction}</p>
                </div>
              )}

              <div className="mt-6 flex justify-between gap-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={handlePreviousNode} disabled={currentNodeIndex === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={handleNextNode} disabled={isLastNode}>
                    Next
                  </Button>
                </div>
                <Button className="rounded-2xl px-6" onClick={handleContinue}>
                  {isLastNode ? (isLastChapter ? 'Finish prototype' : 'Next chapter') : 'Back to lesson'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGlossary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4"
            onClick={() => setSelectedGlossaryKey(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-sky-100 text-sky-800">Tap Glossary</Badge>
                    <Badge variant="outline" className="rounded-full">{selectedGlossary.pinyin}</Badge>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className={`${glossaryTitleClass} font-semibold`}>{selectedGlossary.title}</h3>
                      <AudioButton text={selectedGlossary.title} />
                    </div>
                    {glossaryTermItem && (
                      <SaveButton saved={glossaryTermSaved} onClick={() => toggleCollected(glossaryTermItem)} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{selectedGlossary.translation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={glossaryShowPinyin ? 'default' : 'outline'}
                    className="rounded-2xl"
                    onClick={() => setGlossaryShowPinyin((v) => !v)}
                  >
                    Glossary Pinyin
                  </Button>
                  <Button
                    variant={glossaryShowEnglish ? 'default' : 'outline'}
                    className="rounded-2xl"
                    onClick={() => setGlossaryShowEnglish((v) => !v)}
                  >
                    Glossary English
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setSelectedGlossaryKey(null)}>Close</Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-neutral-100 p-4 text-sm leading-6 text-neutral-700">
                {selectedGlossary.explanation}
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium">Practical examples</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedGlossary.examples.map((example) => {
                    const glossaryExampleItem = createCollectionItem({
                      expression: example.zh,
                      pinyin: example.py,
                      english: example.en,
                      type: 'glossary-example',
                      source: `${selectedGlossary.title} · Glossary example`,
                      chapter: currentChapter.shortTitle,
                    });
                    const glossaryExampleSaved = isCollected(glossaryExampleItem.id);
                    return (
                      <div key={example.zh} className="rounded-2xl border border-neutral-200 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1">
                          <div className={`${fontScale === 'sm' ? 'text-sm' : fontScale === 'lg' ? 'text-lg' : 'text-base'} font-semibold`}>{example.zh}</div>
                          <AudioButton text={example.zh} small />
                        </div>
                        <SaveButton saved={glossaryExampleSaved} onClick={() => toggleCollected(glossaryExampleItem)} />
                        </div>
                        {glossaryShowPinyin && <div className="mt-1 text-sm text-neutral-500">{example.py}</div>}
                        {glossaryShowEnglish && <div className="mt-2 text-sm text-neutral-700">{example.en}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
