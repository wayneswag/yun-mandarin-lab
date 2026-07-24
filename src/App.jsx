import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  X,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CircleEllipsis,
  CircleHelp,
  MessageSquareQuote,
  BookOpen,
  Sparkles,
  Volume2,
  Heart,
  BrainCircuit,
  CalendarDays,
  Home,
  House,
  Compass,
  Bookmark,
  RotateCcw,
  Settings2,
  Eye,
  EyeOff,
} from 'lucide-react';

const STORAGE_KEY = 'yun-mandarin-lab-pilot-v4';
const PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters. Avoid simple passwords like 12345678 or password.';
const WEAK_PASSWORDS = new Set(['12345678', 'password', 'qwerty123', '11111111', '00000000']);
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const SCENE_NATURALNESS_DELTA = {
  Natural: 12,
  Stiff: 4,
  Awkward: -6,
  Incorrect: -12,
};

const CHAPTER6_CORRECTION_DETAILS = {
  '我的手机没电了。这里可以充电吗？': {
    py: 'Wǒ de shǒujī méi diàn le. Zhèlǐ kěyǐ chōngdiàn ma?',
    en: 'My phone is out of battery. Can I charge here?',
  },
  '我找不到钱包，可以帮我一下吗？': {
    py: 'Wǒ zhǎo bú dào qiánbāo, kěyǐ bāng wǒ yíxià ma?',
    en: 'I cannot find my wallet. Could you help me for a moment?',
  },
  '是我的！太谢谢你了，麻烦你了！': {
    py: 'Shì wǒ de! Tài xièxie nǐ le, máfan nǐ le!',
    en: 'It is mine! Thank you so much. Sorry to trouble you!',
  },
};

const CHAPTER6_TIER_REWARDS = {
  needsRepair: {
    tier: 'Tier 1',
    label: 'Needs repair',
    intro: 'This run unlocked one reliable repair line for trying the scene again.',
    title: 'Extra useful reply',
    zh: '不好意思，可以再说一遍吗？',
    py: 'Bù hǎoyìsi, kěyǐ zài shuō yí biàn ma?',
    en: 'Sorry, could you say that again?',
  },
  usefulRecovery: {
    tier: 'Tier 2',
    label: 'Useful recovery',
    intro: 'You kept the interaction workable and earned a softer request alternative.',
    title: 'Extra natural alternative',
    zh: '麻烦你帮我看一下，可以吗？',
    py: 'Máfan nǐ bāng wǒ kàn yíxià, kěyǐ ma?',
    en: 'Could I trouble you to help me take a look?',
  },
  strongRecovery: {
    tier: 'Tier 3',
    label: 'Strong recovery',
    intro: 'Your replies stayed clear and cooperative, unlocking two bonus examples.',
    title: 'Bonus quick examples',
    examples: [
      { zh: '我的手机快没电了。', py: 'Wǒ de shǒujī kuài méi diàn le.', en: 'My phone is nearly out of battery.' },
      { zh: '找到了，太谢谢你了！', py: 'Zhǎo dào le, tài xièxie nǐ le!', en: 'I found it. Thank you so much!' },
    ],
  },
  nativeRecovery: {
    tier: 'Tier 4',
    label: 'Native-level recovery',
    intro: 'This run unlocked a preview of how the conversation could continue naturally.',
    title: 'Hidden follow-up scene preview',
    zh: '充电的地方就在前面，我带你过去吧。',
    py: 'Chōngdiàn de dìfang jiù zài qiánmiàn, wǒ dài nǐ guòqu ba.',
    en: 'The charging area is just ahead. I’ll show you the way.',
  },
};

const CHAPTER6_OPTION_META = {
  Natural: { id: 'A', score: 3, relationship: 14 },
  Stiff: { id: 'B', score: 2, relationship: 3 },
  Awkward: { id: 'C', score: 1, relationship: -5 },
  Incorrect: { id: 'D', score: 0, relationship: -10 },
};

// Every student-facing correction has authored language layers. These are kept
// separate from option wording so a correction can be shared across scenes.
const BETTER_VERSION_TRANSLATIONS = {
  '半小时前，我在咖啡馆看到过钱包。': { correctionPy: 'Bàn ge xiǎoshí qián, wǒ zài kāfēiguǎn kàn dào guo qiánbāo.', correctionEn: 'Half an hour ago, I saw my wallet at the café.' },
  '半小时前，我在咖啡馆用过钱包。': { correctionPy: 'Bàn ge xiǎoshí qián, wǒ zài kāfēiguǎn yòng guo qiánbāo.', correctionEn: 'Half an hour ago, I used my wallet at the café.' },
  '不好意思，可以说慢一点吗？': { correctionPy: 'Bù hǎoyìsi, kěyǐ shuō màn yìdiǎn ma?', correctionEn: 'Sorry, could you speak a little more slowly?' },
  '不好意思，我没听清楚。可以再说一遍吗？': { correctionPy: 'Bù hǎoyìsi, wǒ méi tīng qīngchu. Kěyǐ zài shuō yí biàn ma?', correctionEn: 'Sorry, I did not hear clearly. Could you say that again?' },
  '不好意思，我明天可能会晚一点。要不然我们改时间吧？': { correctionPy: 'Bù hǎoyìsi, wǒ míngtiān kěnéng huì wǎn yìdiǎn. Yàoburan wǒmen gǎi shíjiān ba?', correctionEn: 'Sorry, I may be a little late tomorrow. How about we change the time?' },
  '不好意思，我明天可能会晚一点到。要不然我们改时间吧？': { correctionPy: 'Bù hǎoyìsi, wǒ míngtiān kěnéng huì wǎn yìdiǎn dào. Yàoburan wǒmen gǎi shíjiān ba?', correctionEn: 'Sorry, I may arrive a little late tomorrow. How about we change the time?' },
  '不是手机，是我的钱包丢了。': { correctionPy: 'Bú shì shǒujī, shì wǒ de qiánbāo diū le.', correctionEn: 'It is not my phone; it is my wallet that is lost.' },
  '不是手机丢了，是钱包丢了。': { correctionPy: 'Bú shì shǒujī diū le, shì qiánbāo diū le.', correctionEn: 'It is not that the phone is lost; the wallet is lost.' },
  '大概半小时前，我在那边的咖啡馆买过东西。': { correctionPy: 'Dàgài bàn ge xiǎoshí qián, wǒ zài nàbiān de kāfēiguǎn mǎi guo dōngxi.', correctionEn: 'About half an hour ago, I bought something at the café over there.' },
  '丢的是钱包，手机还在。': { correctionPy: 'Diū de shì qiánbāo. Shǒujī hái zài.', correctionEn: 'It is the wallet that is lost. I still have my phone.' },
  '对，可能在咖啡馆。可以帮我联系一下吗？': { correctionPy: 'Duì, kěnéng zài kāfēiguǎn. Kěyǐ bāng wǒ liánxì yíxià ma?', correctionEn: 'Yes, it may be at the café. Could you help me contact them?' },
  '对，我的钱包可能在咖啡馆。': { correctionPy: 'Duì, wǒ de qiánbāo kěnéng zài kāfēiguǎn.', correctionEn: 'Yes, my wallet may be at the café.' },
  '对，我可能把钱包忘在咖啡馆了。': { correctionPy: 'Duì, wǒ kěnéng bǎ qiánbāo wàng zài kāfēiguǎn le.', correctionEn: 'Yes, I may have left my wallet at the café.' },
  '好，麻烦你帮我打电话。': { correctionPy: 'Hǎo, máfan nǐ bāng wǒ dǎ diànhuà.', correctionEn: 'Okay, please help me make the call.' },
  '好，麻烦你给咖啡馆打电话问一下钱包。': { correctionPy: 'Hǎo, máfan nǐ gěi kāfēiguǎn dǎ diànhuà wèn yíxià qiánbāo.', correctionEn: 'Okay, please call the café and ask about the wallet.' },
  '好，谢谢。麻烦你帮我安排一下。': { correctionPy: 'Hǎo, xièxie. Máfan nǐ bāng wǒ ānpái yíxià.', correctionEn: 'Okay, thanks. Please help me arrange it.' },
  '好的，请给我一张表格。': { correctionPy: 'Hǎo de, qǐng gěi wǒ yì zhāng biǎogé.', correctionEn: 'Okay, please give me a form.' },
  '好的，我等你们以后通知我。': { correctionPy: 'Hǎo de, wǒ děng nǐmen yǐhòu tōngzhī wǒ.', correctionEn: 'Okay, I will wait for you to notify me later.' },
  '好的，我去咖啡馆确认一下。': { correctionPy: 'Hǎo de, wǒ qù kāfēiguǎn quèrèn yíxià.', correctionEn: 'Okay, I will go to the café to confirm it.' },
  '好的，我先填写表格。': { correctionPy: 'Hǎo de, wǒ xiān tiánxiě biǎogé.', correctionEn: 'Okay, I will fill out the form first.' },
  '好的，我先一直走，然后左转。谢谢你！': { correctionPy: 'Hǎo de, wǒ xiān yìzhí zǒu, ránhòu zuǒ zhuǎn. Xièxie!', correctionEn: 'Okay, I will go straight first, then turn left. Thank you!' },
  '好的，谢谢。我会等你们的通知。': { correctionPy: 'Hǎo de, xièxie. Wǒ huì děng nǐmen de tōngzhī.', correctionEn: 'Okay, thank you. I will wait for your notification.' },
  '可以啊，你明天几点有时间？': { correctionPy: 'Kěyǐ a, nǐ míngtiān jǐ diǎn yǒu shíjiān?', correctionEn: 'Sure. What time are you free tomorrow?' },
  '可以刷卡吗？': { correctionPy: 'Kěyǐ shuākǎ ma?', correctionEn: 'Can I pay by card?' },
  '里面有银行卡和身份证。': { correctionPy: 'Lǐmiàn yǒu yínhángkǎ hé shēnfènzhèng.', correctionEn: 'There is a bank card and an ID inside.' },
  '里面有银行卡和我的身份证。': { correctionPy: 'Lǐmiàn yǒu yínhángkǎ hé wǒ de shēnfènzhèng.', correctionEn: 'There is a bank card and my ID inside.' },
  '两位。请问有没有靠窗的位子？': { correctionPy: 'Liǎng wèi. Qǐngwèn yǒu méiyǒu kào chuāng de wèizi?', correctionEn: 'Two people. Do you have a window seat?' },
  '麻烦你帮我安排去取钱包。': { correctionPy: 'Máfan nǐ bāng wǒ ānpái qù qǔ qiánbāo.', correctionEn: 'Please help me arrange for me to collect the wallet.' },
  '麻烦你帮我给咖啡馆打电话。': { correctionPy: 'Máfan nǐ bāng wǒ gěi kāfēiguǎn dǎ diànhuà.', correctionEn: 'Please help me call the café.' },
  '明白了，谢谢你帮我确认。': { correctionPy: 'Míngbai le, xièxie nǐ bāng wǒ quèrèn.', correctionEn: 'I understand. Thank you for helping me confirm it.' },
  '那我们明天下午三点见面吧。': { correctionPy: 'Nà wǒmen míngtiān xiàwǔ sān diǎn jiànmiàn ba.', correctionEn: 'Then let us meet tomorrow at 3 p.m.' },
  '你好，对，我是新来的室友。': { correctionPy: 'Nǐ hǎo, duì, wǒ shì xīn lái de shìyǒu.', correctionEn: 'Hi, yes, I am the new roommate.' },
  '你明天有时间吗？': { correctionPy: 'Nǐ míngtiān yǒu shíjiān ma?', correctionEn: 'Are you free tomorrow?' },
  '钱包是黑色的，里面有银行卡。': { correctionPy: 'Qiánbāo shì hēisè de, lǐmiàn yǒu yínhángkǎ.', correctionEn: 'The wallet is black, with a bank card inside.' },
  '请给我失物登记表。': { correctionPy: 'Qǐng gěi wǒ shīwù dēngjìbiǎo.', correctionEn: 'Please give me a lost-property form.' },
  '请问，地铁站怎么走？': { correctionPy: 'Qǐngwèn, dìtiě zhàn zěnme zǒu?', correctionEn: 'Excuse me, how do I get to the subway station?' },
  '请问，这个包多少钱？': { correctionPy: 'Qǐngwèn, zhège bāo duōshao qián?', correctionEn: 'Excuse me, how much is this bag?' },
  '是一个小黑色钱包，里面有银行卡。': { correctionPy: 'Shì yí ge xiǎo hēisè qiánbāo, lǐmiàn yǒu yínhángkǎ.', correctionEn: 'It is a small black wallet with a bank card inside.' },
  '太好了，真的谢谢你！': { correctionPy: 'Tài hǎo le, zhēn de xièxie nǐ!', correctionEn: 'That is great, thank you so much!' },
  '太好了，真的谢谢你帮了我这么多。': { correctionPy: 'Tài hǎo le, zhēn de xièxie nǐ bāng le wǒ zhème duō.', correctionEn: 'That is great, thank you so much for helping me this much.' },
  '我的钱包是黑色的，里面有银行卡。': { correctionPy: 'Wǒ de qiánbāo shì hēisè de, lǐmiàn yǒu yínhángkǎ.', correctionEn: 'My wallet is black, with a bank card inside.' },
  '我的钱包找不到了，手机也快没电了。可以帮我一下吗？': { correctionPy: 'Wǒ de qiánbāo zhǎo bú dào le, shǒujī yě kuài méi diàn le. Kěyǐ bāng wǒ yíxià ma?', correctionEn: 'I cannot find my wallet, and my phone is nearly out of battery. Could you help me?' },
  '我叫 Alex，很高兴认识你。': { correctionPy: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.', correctionEn: 'My name is Alex. Nice to meet you.' },
  '我叫 Alex。': { correctionPy: 'Wǒ jiào Alex.', correctionEn: 'My name is Alex.' },
  '我来填写失物登记表。': { correctionPy: 'Wǒ lái tiánxiě shīwù dēngjìbiǎo.', correctionEn: 'I will fill out the lost-property form.' },
  '我来自美国。/ 我是美国人。 我会说一点中文。': { correctionPy: 'Wǒ láizì Měiguó. / Wǒ shì Měiguó rén. Wǒ huì shuō yìdiǎn Zhōngwén.', correctionEn: 'I am from the United States. / I am American. I can speak a little Chinese.' },
  '我们明天下午三点见面吧。': { correctionPy: 'Wǒmen míngtiān xiàwǔ sān diǎn jiànmiàn ba.', correctionEn: 'We will meet tomorrow at 3 p.m.' },
  '我们先来一份牛肉面，再来一盘青菜。': { correctionPy: 'Wǒmen xiān lái yí fèn niúròu miàn, zài lái yì pán qīngcài.', correctionEn: 'We will start with one beef noodle dish, then another plate of greens.' },
  '我明天可能会晚一点到。': { correctionPy: 'Wǒ míngtiān kěnéng huì wǎn yìdiǎn dào.', correctionEn: 'I might arrive a little late tomorrow.' },
  '我是美国人，我会说一点中文。': { correctionPy: 'Wǒ shì Měiguó rén, wǒ huì shuō yìdiǎn Zhōngwén.', correctionEn: 'I am American, and I can speak a little Chinese.' },
  '我是新来的室友。': { correctionPy: 'Wǒ shì xīn lái de shìyǒu.', correctionEn: 'I am the new roommate.' },
  '我先一直走，然后左转。谢谢你！': { correctionPy: 'Wǒ xiān yìzhí zǒu, ránhòu zuǒ zhuǎn. Xièxie!', correctionEn: 'I will go straight first, then turn left. Thank you!' },
  '我要这个。可以刷卡吗？': { correctionPy: 'Wǒ yào zhège. Kěyǐ shuākǎ ma?', correctionEn: 'I want this one. Can I pay by card?' },
  '现在明白了，我去确认钱包。': { correctionPy: 'Xiànzài míngbai le, wǒ qù quèrèn qiánbāo.', correctionEn: 'Now I understand. I will go confirm the wallet.' },
  '谢谢，麻烦你帮我安排去取钱包。': { correctionPy: 'Xièxie, máfan nǐ bāng wǒ ānpái qù qǔ qiánbāo.', correctionEn: 'Thanks. Please help me arrange for me to collect the wallet.' },
  '要打包。可以刷卡吗？': { correctionPy: 'Yào dǎbāo. Kěyǐ shuākǎ ma?', correctionEn: 'I need it to go. Can I pay by card?' },
  '有点儿贵，我想看看别的。': { correctionPy: 'Yǒudiǎnr guì, wǒ xiǎng kànkan bié de.', correctionEn: 'It is a little expensive. I would like to look at something else.' },
  '这个包多少钱？': { correctionPy: 'Zhège bāo duōshao qián?', correctionEn: 'How much is this bag?' },
  '真的谢谢你帮了我这么多。': { correctionPy: 'Zhēn de xièxie nǐ bāng le wǒ zhème duō.', correctionEn: 'Thank you so much for helping me this much.' },
};

const CHAPTER1_NEW_CORE_LANGUAGE = [
  '新来的',
  '室友',
  '我叫……',
  '很高兴认识你',
  '哪国人',
  '会说一点……',
  '说得不太好',
  '刚搬来',
  '不太熟悉',
  '麻烦你了',
  '一起',
];

const CHAPTER1_SUPPORT_MAP = {
  1: {
    stage: 1,
    stageLabel: 'First contact',
    focus: 'Confirm identity and introduce names.',
    primaryGlossaryKeys: ['新来的', '室友'],
    recycledGlossaryKeys: [],
    primaryNoteIds: ['newlai'],
  },
  2: {
    stage: 1,
    stageLabel: 'First contact',
    focus: 'Confirm identity and introduce names.',
    primaryGlossaryKeys: ['我叫', '很高兴认识你'],
    recycledGlossaryKeys: ['室友'],
    primaryNoteIds: ['introduce-name'],
  },
  3: {
    stage: 2,
    stageLabel: 'Learn about each other',
    focus: 'Explain background, Chinese ability, and that you are new here.',
    primaryGlossaryKeys: ['哪国人', '会说一点', '说得怎么样', '说得不太好'],
    recycledGlossaryKeys: ['中文'],
    primaryNoteIds: ['shuode'],
  },
  4: {
    stage: 2,
    stageLabel: 'Learn about each other',
    focus: 'Explain background, Chinese ability, and that you are new here.',
    primaryGlossaryKeys: ['刚搬来', '不太熟悉'],
    recycledGlossaryKeys: ['会说一点', '说得怎么样'],
    primaryNoteIds: ['just-moved'],
  },
  5: {
    stage: 3,
    stageLabel: 'Settle in',
    focus: 'Accept the roommate’s help and close the first meeting naturally.',
    primaryGlossaryKeys: ['麻烦你了', '一起'],
    recycledGlossaryKeys: ['刚搬来', '不太熟悉'],
    primaryNoteIds: ['polite-trouble'],
  },
  6: {
    stage: 3,
    stageLabel: 'Settle in',
    focus: 'Accept the roommate’s help and close the first meeting naturally.',
    primaryGlossaryKeys: [],
    recycledGlossaryKeys: ['很高兴认识你', '麻烦你了'],
    primaryNoteIds: ['first-meeting-recap'],
  },
};

const CHAPTER1_STAGE_TRANSITIONS = {
  2: { title: 'Stage 1 complete', message: 'You and your roommate have introduced yourselves.' },
  4: { title: 'Stage 2 complete', message: 'Your roommate now understands your background and that you are new here.' },
};

const CHAPTER1_MEMORY_TARGETS = [
  {
    id: 'confirm-roommate',
    zh: '你好，对，我是新来的室友。',
    py: 'Nǐ hǎo, duì, wǒ shì xīn lái de shìyǒu.',
    en: 'Hi, yes, I’m the new roommate.',
    audioText: '你好，对，我是新来的室友。',
    firstUseDecision: 1,
    callbackDecision: 6,
  },
  {
    id: 'introduce-name',
    zh: '我叫 Alex，很高兴认识你。',
    py: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.',
    en: 'My name is Alex. Nice to meet you.',
    audioText: '我叫 Alex，很高兴认识你。',
    firstUseDecision: 2,
    callbackDecision: 6,
  },
  {
    id: 'describe-ability',
    zh: '我会说一点中文，不过说得不太好。',
    py: 'Wǒ huì shuō yìdiǎn Zhōngwén, búguò shuō de bú tài hǎo.',
    en: 'I can speak a little Chinese, but not very well.',
    audioText: '我会说一点中文，不过说得不太好。',
    firstUseDecision: 3,
    callbackDecision: 4,
  },
  {
    id: 'accept-help',
    zh: '好啊，麻烦你了。我们一起看看吧。',
    py: 'Hǎo a, máfan nǐ le. Wǒmen yìqǐ kànkan ba.',
    en: 'Sure. Sorry to trouble you. Let’s take a look together.',
    audioText: '好啊，麻烦你了。我们一起看看吧。',
    firstUseDecision: 5,
    callbackDecision: 6,
  },
  {
    id: 'strong-close',
    zh: '谢谢你，很高兴认识你！',
    py: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!',
    en: 'Thank you. Nice to meet you!',
    audioText: '谢谢你，很高兴认识你！',
    firstUseDecision: 2,
    callbackDecision: 6,
  },
  {
    id: 'mixed-close',
    zh: '好的，谢谢你。麻烦你了。',
    py: 'Hǎo de, xièxie nǐ. Máfan nǐ le.',
    en: 'Okay, thank you. Sorry to trouble you.',
    audioText: '好的，谢谢你。麻烦你了。',
    firstUseDecision: 5,
    callbackDecision: 6,
  },
  {
    id: 'weak-repair',
    zh: '不好意思，我需要帮忙。麻烦你带我看看吧。',
    py: 'Bù hǎoyìsi, wǒ xūyào bāngmáng. Máfan nǐ dài wǒ kànkan ba.',
    en: 'Sorry, I do need help. Please show me around.',
    audioText: '不好意思，我需要帮忙。麻烦你带我看看吧。',
    firstUseDecision: 5,
    callbackDecision: 6,
  },
];

const CHAPTER1_MEMORY_MOMENTS = [
  {
    id: 'recall-chinese-ability',
    decision: 4,
    targetId: 'describe-ability',
    label: 'Quick memory moment',
    context: 'The roommate remembers where you are from, but not how much Chinese you speak.',
    npcContext: '你会说多少中文？',
    npcContextPy: 'Nǐ huì shuō duōshao Zhōngwén?',
    npcContextEn: 'How much Chinese can you speak?',
    contextAudioText: '你会说多少中文？',
    patternCueZh: '会说一点……',
    patternCuePy: 'huì shuō yìdiǎn...',
    patternCueEn: 'can speak a little...',
    prompt: 'Recall how to describe a small amount of ability.',
    firstClue: 'Start with 我会说一点, then name the language.',
  },
  {
    id: 'recall-polite-acceptance',
    decision: 6,
    targetId: 'accept-help',
    label: 'Quick memory moment',
    context: 'Your roommate offers to show you around. Accept politely.',
    npcContext: '需要我带你看看吗？',
    npcContextPy: 'Xūyào wǒ dài nǐ kànkan ma?',
    npcContextEn: 'Would you like me to show you around?',
    contextAudioText: '需要我带你看看吗？',
    patternCueZh: '麻烦你了 + 一起……',
    patternCuePy: 'máfan nǐ le + yìqǐ...',
    patternCueEn: 'sorry to trouble you + together...',
    prompt: 'Accept the offer, acknowledge the help, and suggest doing it together.',
    firstClue: 'Use 麻烦你了, then add 我们一起……',
  },
];

const CHAPTER1_RETRIEVAL_BY_DECISION = {
  4: CHAPTER1_MEMORY_MOMENTS[0],
  6: CHAPTER1_MEMORY_MOMENTS[1],
};

const CHAPTER1_MEMORY_REPLAY_MOMENTS = [
  {
    id: 'replay-confirm-roommate',
    decision: 1,
    targetId: 'confirm-roommate',
    label: 'Language moment 1',
    npcContext: '你好，你是新来的室友吗？',
    npcContextPy: 'Nǐ hǎo, nǐ shì xīn lái de shìyǒu ma?',
    npcContextEn: 'Hi, are you the new roommate?',
    contextAudioText: '你好，你是新来的室友吗？',
    patternCueZh: '你好 + 对 + 我是……',
    patternCuePy: 'nǐ hǎo + duì + wǒ shì...',
    patternCueEn: 'hello + yes + I am...',
    prompt: 'Confirm politely that you are the new roommate.',
    firstClue: 'Begin with 你好，对, then identify yourself.',
  },
  {
    id: 'replay-introduce-name',
    decision: 2,
    targetId: 'introduce-name',
    label: 'Language moment 2',
    npcContext: '我叫李明。你叫什么名字？',
    npcContextPy: 'Wǒ jiào Lǐ Míng. Nǐ jiào shénme míngzi?',
    npcContextEn: 'My name is Li Ming. What’s your name?',
    contextAudioText: '我叫李明。你叫什么名字？',
    patternCueZh: '我叫…… + 很高兴认识你',
    patternCuePy: 'wǒ jiào... + hěn gāoxìng rènshi nǐ',
    patternCueEn: 'my name is... + nice to meet you',
    prompt: 'Give your name and respond warmly.',
    firstClue: 'Start with 我叫, then add the first-meeting phrase.',
  },
  {
    id: 'replay-describe-ability',
    decision: 3,
    targetId: 'describe-ability',
    label: 'Language moment 3',
    npcContext: '中文说得怎么样？',
    npcContextPy: 'Zhōngwén shuō de zěnmeyàng?',
    npcContextEn: 'How well do you speak Chinese?',
    contextAudioText: '中文说得怎么样？',
    patternCueZh: '会说一点…… + 说得不太好',
    patternCuePy: 'huì shuō yìdiǎn... + shuō de bú tài hǎo',
    patternCueEn: 'can speak a little... + do not speak very well',
    prompt: 'Describe a small amount of Chinese ability naturally.',
    firstClue: 'Use 我会说一点中文 before qualifying how well you speak.',
  },
  {
    id: 'replay-accept-help',
    decision: 5,
    targetId: 'accept-help',
    label: 'Language moment 4',
    npcContext: '需要我带你看看吗？',
    npcContextPy: 'Xūyào wǒ dài nǐ kànkan ma?',
    npcContextEn: 'Would you like me to show you around?',
    contextAudioText: '需要我带你看看吗？',
    patternCueZh: '麻烦你了 + 一起……',
    patternCuePy: 'máfan nǐ le + yìqǐ...',
    patternCueEn: 'sorry to trouble you + together...',
    prompt: 'Accept politely and suggest looking around together.',
    firstClue: 'Acknowledge the help with 麻烦你了, then use 一起.',
  },
];

const CHAPTER1_OPTION_META = {
  Natural: { id: 'A', score: 3, relationship: 14 },
  Stiff: { id: 'B', score: 2, relationship: 3 },
  Awkward: { id: 'C', score: 1, relationship: -5 },
  Incorrect: { id: 'D', score: 0, relationship: -10 },
};

function makeChapter1BranchOptions(entries) {
  return ['Natural', 'Stiff', 'Awkward', 'Incorrect'].map((rating) => ({
    ...CHAPTER1_OPTION_META[rating],
    ...entries[rating],
    rating,
    glossary: entries[rating].glossary || [],
  }));
}

const CHAPTER1_BRANCH_NODES = {
  decision2: {
    strong: {
      branchKey: 'warm-introduction',
      npcLineZh: '太好了，我叫李明。你叫什么名字？',
      npcLinePy: 'Tài hǎo le, wǒ jiào Lǐ Míng. Nǐ jiào shénme míngzi?',
      npcLineEn: 'Great! My name is Li Ming. What’s your name?',
    },
    mixed: {
      branchKey: 'reserved-introduction',
      npcLineZh: '好，我叫李明。你呢？',
      npcLinePy: 'Hǎo, wǒ jiào Lǐ Míng. Nǐ ne?',
      npcLineEn: 'Okay. My name is Li Ming. What about you?',
    },
    weak: {
      branchKey: 'confirming-introduction',
      npcLineZh: '你是新室友，对吗？你叫什么名字？',
      npcLinePy: 'Nǐ shì xīn shìyǒu, duì ma? Nǐ jiào shénme míngzi?',
      npcLineEn: 'You’re the new roommate, right? What’s your name?',
    },
  },
  decision4: {
    strong: {
      branchKey: 'encouraging-move-in',
      npcLineZh: '你中文说得不错！你今天刚搬来吗？',
      npcLinePy: 'Nǐ Zhōngwén shuō de búcuò! Nǐ jīntiān gāng bān lái ma?',
      npcLineEn: 'Your Chinese is pretty good! Did you just move in today?',
    },
    mixed: {
      branchKey: 'confirming-move-in',
      npcLineZh: '你会说一点中文，对吗？你今天刚搬来吗？',
      npcLinePy: 'Nǐ huì shuō yìdiǎn Zhōngwén, duì ma? Nǐ jīntiān gāng bān lái ma?',
      npcLineEn: 'You can speak a little Chinese, right? Did you just move in today?',
    },
    weak: {
      branchKey: 'clarifying-move-in',
      npcLineZh: '你的意思是你会说一点中文吗？你刚搬来吗？',
      npcLinePy: 'Nǐ de yìsi shì nǐ huì shuō yìdiǎn Zhōngwén ma? Nǐ gāng bān lái ma?',
      npcLineEn: 'Do you mean that you can speak a little Chinese? Did you just move in?',
    },
  },
  decision5: {
    strong: {
      branchKey: 'warm-help-offer',
      npcLineZh: '那要不要我带你看看？',
      npcLinePy: 'Nà yào bú yào wǒ dài nǐ kànkan?',
      npcLineEn: 'Then would you like me to show you around?',
    },
    mixed: {
      branchKey: 'reserved-help-offer',
      npcLineZh: '我可以带你看看。你需要吗？',
      npcLinePy: 'Wǒ kěyǐ dài nǐ kànkan. Nǐ xūyào ma?',
      npcLineEn: 'I can show you around. Would you like that?',
    },
    weak: {
      branchKey: 'uncertain-help-offer',
      npcLineZh: '我没太听明白。你需要我帮忙吗？',
      npcLinePy: 'Wǒ méi tài tīng míngbai. Nǐ xūyào wǒ bāngmáng ma?',
      npcLineEn: 'I didn’t quite understand. Do you need my help?',
    },
  },
  decision6: {
    strong: {
      branchKey: 'warm-close',
      npcLineZh: '没问题，我带你看看。欢迎你搬进来！',
      npcLinePy: 'Méi wèntí, wǒ dài nǐ kànkan. Huānyíng nǐ bān jìnlái!',
      npcLineEn: 'No problem. I’ll show you around. Welcome to the apartment!',
      options: makeChapter1BranchOptions({
        Natural: { zh: '谢谢你，很高兴认识你！', py: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!', en: 'Thank you. Nice to meet you!', explanation: 'Natural and warm. It thanks your roommate and closes the first meeting with familiar language.', correction: null },
        Stiff: { zh: '好，谢谢。', py: 'Hǎo, xièxie.', en: 'Okay, thanks.', explanation: 'Correct, but brief for a warm welcome.', correction: '谢谢你，很高兴认识你！', correctionPy: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!', correctionEn: 'Thank you. Nice to meet you!' },
        Awkward: { zh: '谢谢，你很好认识。', py: 'Xièxie, nǐ hěn hǎo rènshi.', en: 'Thanks. You are very good to know.', explanation: 'The thanks is clear, but the first-meeting phrase is formed incorrectly.', correction: '很高兴认识你，谢谢你！', correctionPy: 'Hěn gāoxìng rènshi nǐ, xièxie nǐ!', correctionEn: 'Nice to meet you. Thank you!' },
        Incorrect: { zh: '你叫什么名字？', py: 'Nǐ jiào shénme míngzi?', en: 'What is your name?', explanation: 'This restarts an introduction that has already been completed.', correction: '谢谢你，很高兴认识你！', correctionPy: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!', correctionEn: 'Thank you. Nice to meet you!' },
      }),
    },
    mixed: {
      branchKey: 'polite-close',
      npcLineZh: '好，我先带你看看。',
      npcLinePy: 'Hǎo, wǒ xiān dài nǐ kànkan.',
      npcLineEn: 'Okay, I’ll show you around first.',
      options: makeChapter1BranchOptions({
        Natural: { zh: '好的，谢谢你。麻烦你了。', py: 'Hǎo de, xièxie nǐ. Máfan nǐ le.', en: 'Okay, thank you. Sorry to trouble you.', explanation: 'Natural and considerate. It thanks your roommate and acknowledges the help.', correction: null },
        Stiff: { zh: '好，谢谢。', py: 'Hǎo, xièxie.', en: 'Okay, thanks.', explanation: 'Correct, but the closing remains reserved.', correction: '好的，谢谢你。麻烦你了。', correctionPy: 'Hǎo de, xièxie nǐ. Máfan nǐ le.', correctionEn: 'Okay, thank you. Sorry to trouble you.' },
        Awkward: { zh: '我谢谢你帮助看。', py: 'Wǒ xièxie nǐ bāngzhù kàn.', en: 'I thank you help look.', explanation: 'The gratitude is visible, but the help and looking-around phrase is not natural.', correction: '谢谢你带我看看。', correctionPy: 'Xièxie nǐ dài wǒ kànkan.', correctionEn: 'Thank you for showing me around.' },
        Incorrect: { zh: '不用了，我走了。', py: 'Bú yòng le, wǒ zǒu le.', en: 'No need. I’m leaving.', explanation: 'This rejects the accepted help and ends the meeting abruptly.', correction: '好的，谢谢你。麻烦你了。', correctionPy: 'Hǎo de, xièxie nǐ. Máfan nǐ le.', correctionEn: 'Okay, thank you. Sorry to trouble you.' },
      }),
    },
    weak: {
      branchKey: 'repair-close',
      npcLineZh: '你如果不需要帮忙，我就先回房间了。',
      npcLinePy: 'Nǐ rúguǒ bù xūyào bāngmáng, wǒ jiù xiān huí fángjiān le.',
      npcLineEn: 'If you don’t need help, I’ll go back to my room.',
      options: makeChapter1BranchOptions({
        Natural: { zh: '不好意思，我需要帮忙。麻烦你带我看看吧。', py: 'Bù hǎoyìsi, wǒ xūyào bāngmáng. Máfan nǐ dài wǒ kànkan ba.', en: 'Sorry, I do need help. Please show me around.', explanation: 'Natural repair. It corrects the misunderstanding and clearly accepts the help.', correction: null },
        Stiff: { zh: '我需要帮忙。', py: 'Wǒ xūyào bāngmáng.', en: 'I need help.', explanation: 'Clear, but abrupt after a misunderstanding.', correction: '不好意思，我需要帮忙。', correctionPy: 'Bù hǎoyìsi, wǒ xūyào bāngmáng.', correctionEn: 'Sorry, I need help.' },
        Awkward: { zh: '不好意思，我帮忙需要你。', py: 'Bù hǎoyìsi, wǒ bāngmáng xūyào nǐ.', en: 'Sorry, I help need you.', explanation: 'The need for help is guessable, but the word order is unnatural.', correction: '不好意思，我需要你帮忙。', correctionPy: 'Bù hǎoyìsi, wǒ xūyào nǐ bāngmáng.', correctionEn: 'Sorry, I need your help.' },
        Incorrect: { zh: '你不需要帮忙。', py: 'Nǐ bù xūyào bāngmáng.', en: 'You do not need help.', explanation: 'This reverses who needs help and does not repair the interaction.', correction: '不好意思，我需要帮忙。麻烦你带我看看吧。', correctionPy: 'Bù hǎoyìsi, wǒ xūyào bāngmáng. Máfan nǐ dài wǒ kànkan ba.', correctionEn: 'Sorry, I do need help. Please show me around.' },
      }),
    },
  },
};

const CHAPTER1_ENDINGS = {
  smooth: {
    label: 'Warm beginning',
    zh: '你们很快熟悉起来。室友愿意带你看看房子，你们的第一次见面很顺利。',
    py: 'Nǐmen hěn kuài shúxī qǐlái. Shìyǒu yuànyì dài nǐ kànkan fángzi, nǐmen de dì yī cì jiànmiàn hěn shùnlì.',
    en: 'You quickly became more comfortable with each other. Your roommate offered to show you around, and the first meeting went smoothly.',
    audioText: '你们很快熟悉起来。室友愿意带你看看房子，你们的第一次见面很顺利。',
  },
  clarified: {
    label: 'Polite but reserved',
    zh: '你们完成了基本介绍，室友也愿意帮忙，不过交流还有一点拘谨。',
    py: 'Nǐmen wánchéng le jīběn jièshào, shìyǒu yě yuànyì bāngmáng, búguò jiāoliú hái yǒu yìdiǎn jūjǐn.',
    en: 'You completed the basic introductions, and your roommate was willing to help, but the interaction was still a little reserved.',
    audioText: '你们完成了基本介绍，室友也愿意帮忙，不过交流还有一点拘谨。',
  },
  delayed: {
    label: 'Needs clarification',
    zh: '室友大概明白了你的情况，不过几次表达让交流有些不顺。',
    py: 'Shìyǒu dàgài míngbai le nǐ de qíngkuàng, búguò jǐ cì biǎodá ràng jiāoliú yǒuxiē bù shùn.',
    en: 'Your roommate mostly understood your situation, but several replies made the conversation less smooth.',
    audioText: '室友大概明白了你的情况，不过几次表达让交流有些不顺。',
  },
};

const CHAPTER6_NEW_CORE_LANGUAGE = [
  '快没电了',
  '半小时前',
  '咖啡馆',
  'V过',
  '什么样',
  '里面有',
  '不是A，是B',
  '联系',
  '确认',
  '失物登记表',
];

const CHAPTER6_SUPPORT_MAP = {
  1: {
    stage: 1,
    stageLabel: 'Explain the problem',
    focus: 'Explain the missing wallet and low phone battery.',
    primaryGlossaryKeys: ['没电了'],
    recycledGlossaryKeys: ['钱包', '手机', '找不到', '帮我一下'],
    primaryNoteIds: ['zhao-bu-dao'],
  },
  2: {
    stage: 1,
    stageLabel: 'Explain the problem',
    focus: 'Say when and where the wallet was last used.',
    primaryGlossaryKeys: ['半小时前', '咖啡馆', '过'],
    recycledGlossaryKeys: ['钱包'],
    primaryNoteIds: ['time-place-guo'],
  },
  3: {
    stage: 2,
    stageLabel: 'Give details and repair confusion',
    focus: 'Describe the wallet and what is inside.',
    primaryGlossaryKeys: ['什么样', '里面有'],
    recycledGlossaryKeys: ['钱包', '咖啡馆'],
    primaryNoteIds: ['describe-object'],
  },
  4: {
    stage: 2,
    stageLabel: 'Give details and repair confusion',
    focus: 'Clarify the missing item and move toward contact.',
    primaryGlossaryKeys: ['不是', '联系'],
    recycledGlossaryKeys: ['钱包', '手机', '咖啡馆'],
    primaryNoteIds: ['clarify-not-a'],
  },
  5: {
    stage: 3,
    stageLabel: 'Resolve the problem',
    focus: 'Confirm identifying details and the practical next step.',
    primaryGlossaryKeys: ['确认', '失物登记表'],
    recycledGlossaryKeys: ['里面有', '联系', '咖啡馆', '钱包'],
    primaryNoteIds: ['practical-next-step'],
  },
  6: {
    stage: 3,
    stageLabel: 'Resolve the problem',
    focus: 'Respond to the result and close naturally.',
    primaryGlossaryKeys: [],
    recycledGlossaryKeys: ['确认', '咖啡馆', '钱包', '手机', '麻烦你了', '没电了'],
    primaryNoteIds: ['thank-after-help'],
  },
};

const CHAPTER6_CORE_GLOSSARY_KEYS = [
  '没电了',
  '半小时前',
  '咖啡馆',
  '过',
  '什么样',
  '里面有',
  '不是',
  '联系',
  '确认',
  '失物登记表',
];

const CHAPTER6_GRAMMAR_GLOSSARY_KEYS = ['过', '里面有', '不是'];
const CHAPTER6_RECYCLED_GLOSSARY_KEYS = ['钱包', '手机', '找不到', '帮我一下', '麻烦你了'];

const CHAPTER6_STAGE_TRANSITIONS = {
  2: { title: 'Stage 1 complete', message: 'The staff now understands what is missing and where to look.' },
  4: { title: 'Stage 2 complete', message: 'The key details are clear, so the staff can act on the problem.' },
};

const CHAPTER6_MEMORY_TARGETS = [
  {
    id: 'cannot-find',
    zh: '找不到',
    py: 'zhǎo bú dào',
    en: 'cannot find',
    audioText: '找不到',
    firstUseDecision: 1,
    callbackDecision: 5,
    callbackPurpose: 'Confirm whether the café found the missing item.',
  },
  {
    id: 'ask-for-help',
    zh: '可以帮我一下吗？',
    py: 'Kěyǐ bāng wǒ yíxià ma?',
    en: 'Could you help me for a moment?',
    audioText: '可以帮我一下吗？',
    firstUseDecision: 1,
    callbackDecision: 4,
    callbackPurpose: 'Turn the general request into a practical request to contact the café.',
  },
  {
    id: 'half-hour-ago',
    zh: '半小时前',
    py: 'bàn ge xiǎoshí qián',
    en: 'half an hour ago',
    audioText: '半小时前',
    firstUseDecision: 2,
    callbackDecision: 3,
    callbackPurpose: 'Recall the timeline before giving identifying details.',
  },
  {
    id: 'used-at-cafe',
    zh: '半小时前，我在咖啡馆用过钱包。',
    py: 'Bàn ge xiǎoshí qián, wǒ zài kāfēiguǎn yòng guo qiánbāo.',
    en: 'Half an hour ago, I used my wallet at the café.',
    audioText: '半小时前，我在咖啡馆用过钱包。',
    firstUseDecision: 2,
    callbackDecision: 3,
    callbackPurpose: 'Retrieve the time and place as the staff begins a follow-up check.',
  },
  {
    id: 'what-kind',
    zh: '什么样',
    py: 'shénme yàng',
    en: 'what kind / what does it look like',
    audioText: '什么样',
    firstUseDecision: 3,
    callbackDecision: 5,
    callbackPurpose: 'Use the description again to verify the café’s possible match.',
  },
  {
    id: 'inside-has',
    zh: '里面有银行卡和身份证。',
    py: 'Lǐmiàn yǒu yínhángkǎ hé shēnfènzhèng.',
    en: 'There is a bank card and an ID inside.',
    audioText: '里面有银行卡和身份证。',
    firstUseDecision: 3,
    callbackDecision: 5,
    callbackPurpose: 'Repeat identifying contents to confirm the wallet.',
  },
  {
    id: 'not-a-but-b',
    zh: '不是手机丢了，是钱包丢了。',
    py: 'Bú shì shǒujī diū le, shì qiánbāo diū le.',
    en: 'It is not the phone that is lost; it is the wallet.',
    audioText: '不是手机丢了，是钱包丢了。',
    firstUseDecision: 4,
    callbackDecision: 5,
    callbackPurpose: 'Repair the phone and wallet misunderstanding before confirming details.',
  },
  {
    id: 'contact-cafe',
    zh: '可以帮我联系一下咖啡馆吗？',
    py: 'Kěyǐ bāng wǒ liánxì yíxià kāfēiguǎn ma?',
    en: 'Could you help me contact the café?',
    audioText: '可以帮我联系一下咖啡馆吗？',
    firstUseDecision: 4,
    callbackDecision: 5,
    callbackPurpose: 'Move from clarification to a concrete recovery action.',
  },
  {
    id: 'confirm',
    zh: '确认',
    py: 'quèrèn',
    en: 'to confirm / verify',
    audioText: '确认',
    firstUseDecision: 5,
    callbackDecision: 6,
    callbackPurpose: 'Acknowledge the verified result before closing.',
  },
  {
    id: 'polite-close',
    zh: '太谢谢了，麻烦你了。',
    py: 'Tài xièxie le, máfan nǐ le.',
    en: 'Thank you so much. Sorry to trouble you.',
    audioText: '太谢谢了，麻烦你了。',
    firstUseDecision: 1,
    callbackDecision: 6,
    callbackPurpose: 'Return to the polite language as a natural closing.',
  },
];

const CHAPTER6_MEMORY_MOMENTS = [
  {
    id: 'recall-time-place',
    decision: 3,
    targetId: 'used-at-cafe',
    label: 'Quick memory moment',
    context: 'The staff is about to ask what the wallet looks like. First, recall when and where you last used it.',
    npcContext: '你最后一次看到钱包是什么时候？在哪里？',
    npcContextPy: 'Nǐ zuìhòu yí cì kàn dào qiánbāo shì shénme shíhou? Zài nǎli?',
    npcContextEn: 'When and where did you last see your wallet?',
    patternCueZh: '时间 + 地点 + V过',
    patternCuePy: 'shíjiān + dìdiǎn + V guo',
    patternCueEn: 'time + place + past experience with 过',
    prompt: 'Say the time, place, and past action before you reveal the model.',
    firstClue: 'Begin with 半小时前, then name the café.',
  },
  {
    id: 'repair-misunderstanding',
    decision: 5,
    targetId: 'not-a-but-b',
    label: 'Quick memory moment',
    context: 'Before confirming the café’s result, make sure the staff knows which item is missing.',
    npcContext: '你丢的是手机，钱包还在，对吗？',
    npcContextPy: 'Nǐ diū de shì shǒujī, qiánbāo hái zài, duì ma?',
    npcContextEn: 'You lost the phone and still have the wallet, right?',
    patternCueZh: '不是 A，是 B',
    patternCuePy: 'Bú shì A, shì B',
    patternCueEn: 'It is not A; it is B.',
    prompt: 'Use 不是A，是B to repair the misunderstanding.',
    firstClue: 'Reject 手机 first, then supply 钱包.',
  },
  {
    id: 'request-contact',
    decision: 4,
    targetId: 'contact-cafe',
    label: 'Story callback',
    context: 'The café may have the wallet, but the staff still needs a practical next step.',
    npcContext: '你是说钱包可能落在咖啡馆了，对吗？',
    npcContextPy: 'Nǐ shì shuō qiánbāo kěnéng là zài kāfēiguǎn le, duì ma?',
    npcContextEn: 'You mean the wallet may have been left at the café, right?',
    patternCueZh: '可以帮我……吗？',
    patternCuePy: 'Kěyǐ bāng wǒ... ma?',
    patternCueEn: 'Could you help me...?',
    prompt: 'Recall the polite request that asks the staff to contact the café.',
    firstClue: 'Start with 可以帮我…',
  },
  {
    id: 'close-with-thanks',
    decision: 6,
    targetId: 'polite-close',
    label: 'Story callback',
    context: 'The staff has helped recover the wallet and handled the phone problem.',
    npcContext: '信息对上了。你可以去拿钱包了。',
    npcContextPy: 'Xìnxī duì shàng le. Nǐ kěyǐ qù ná qiánbāo le.',
    npcContextEn: 'The information matches. You can go collect the wallet.',
    patternCueZh: '太……了，麻烦你了',
    patternCuePy: 'Tài... le, máfan nǐ le',
    patternCueEn: 'Thank you so much; sorry to trouble you.',
    prompt: 'Say a warm closing that recognizes the staff member’s effort.',
    firstClue: 'Use stronger thanks, then acknowledge the trouble.',
  },
];

const CHAPTER6_RETRIEVAL_BY_DECISION = {
  3: CHAPTER6_MEMORY_MOMENTS[0],
  5: CHAPTER6_MEMORY_MOMENTS[1],
};

function makeChapter6BranchOptions(entries) {
  return ['Natural', 'Stiff', 'Awkward', 'Incorrect'].map((rating) => ({
    ...CHAPTER6_OPTION_META[rating],
    ...entries[rating],
    rating,
    glossary: entries[rating].glossary || [],
  }));
}

const CHAPTER6_BRANCH_NODES = {
  decision4: {
    high: {
      branchKey: 'understands',
      npcLineZh: '我明白了。我现在帮你给咖啡馆打电话。',
      npcLinePy: 'Wǒ míngbai le. Wǒ xiànzài bāng nǐ gěi kāfēiguǎn dǎ diànhuà.',
      npcLineEn: 'I understand. I will call the café for you now.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '太好了，麻烦你帮我打电话。我可以说明钱包的样子。', py: 'Tài hǎo le, máfan nǐ bāng wǒ dǎ diànhuà. Wǒ kěyǐ shuōmíng qiánbāo de yàngzi.', en: 'Great, please help me call. I can describe the wallet.', explanation: 'Natural and cooperative. It accepts the offer and prepares useful information.', correction: null, glossary: ['钱包'] },
        Stiff: { zh: '好，请打电话。', py: 'Hǎo, qǐng dǎ diànhuà.', en: 'Okay, please call.', explanation: 'Correct but terse. It accepts the help without adding useful detail.', correction: '好，麻烦你帮我打电话。' },
        Awkward: { zh: '好，你电话咖啡馆，问钱包。', py: 'Hǎo, nǐ diànhuà kāfēiguǎn, wèn qiánbāo.', en: 'Okay, you phone café, ask wallet.', explanation: 'The intended action is understandable, but the verb pattern is unnatural and sounds demanding.', correction: '好，麻烦你给咖啡馆打电话问一下钱包。', glossary: ['钱包'] },
        Incorrect: { zh: '不用，我要给手机充电。', py: 'Bú yòng, wǒ yào gěi shǒujī chōngdiàn.', en: 'No need. I want to charge my phone.', explanation: 'This rejects the action that could recover the wallet and shifts away from the main problem.', correction: '麻烦你帮我给咖啡馆打电话。', glossary: ['手机', '充电'] },
      }),
    },
    medium: {
      branchKey: 'confirms',
      npcLineZh: '你是说钱包可能落在咖啡馆了，对吗？',
      npcLinePy: 'Nǐ shì shuō qiánbāo kěnéng là zài kāfēiguǎn le, duì ma?',
      npcLineEn: 'You mean the wallet may have been left at the café, right?',
    },
    low: {
      branchKey: 'misunderstands',
      npcLineZh: '等一下，你丢的是手机还是钱包？',
      npcLinePy: 'Děng yíxià, nǐ diū de shì shǒujī háishi qiánbāo?',
      npcLineEn: 'Wait, did you lose your phone or your wallet?',
      options: makeChapter6BranchOptions({
        Natural: { zh: '丢的是钱包。手机还在，只是快没电了。', py: 'Diū de shì qiánbāo. Shǒujī hái zài, zhǐshì kuài méi diàn le.', en: 'It is the wallet that is missing. I still have my phone; it is just nearly out of battery.', explanation: 'Natural repair. It clearly separates the missing wallet from the low phone battery.', correction: null, glossary: ['钱包', '手机', '没电了'] },
        Stiff: { zh: '钱包丢了，手机还在。', py: 'Qiánbāo diū le, shǒujī hái zài.', en: 'The wallet is lost; I still have the phone.', explanation: 'Correct and clear, though brief and less reassuring.', correction: '丢的是钱包，手机还在。', glossary: ['钱包', '手机'] },
        Awkward: { zh: '不是手机丢，是钱包没有。', py: 'Bú shì shǒujī diū, shì qiánbāo méiyǒu.', en: 'Not phone lost, it is wallet not have.', explanation: 'The contrast is recoverable, but the structure is unnatural.', correction: '不是手机丢了，是钱包丢了。', glossary: ['钱包', '手机'] },
        Incorrect: { zh: '对，我的手机丢了。', py: 'Duì, wǒ de shǒujī diū le.', en: 'Yes, I lost my phone.', explanation: 'This confirms the wrong item and sends the staff down the wrong path.', correction: '不是手机，是我的钱包丢了。', glossary: ['手机', '钱包'] },
      }),
    },
  },
  decision5: {
    strong: {
      branchKey: 'proactive-help',
      npcLineZh: '咖啡馆找到你的钱包了。我已经请他们保管好，也可以帮你安排去取。',
      npcLinePy: 'Kāfēiguǎn zhǎo dào nǐ de qiánbāo le. Wǒ yǐjīng qǐng tāmen bǎoguǎn hǎo, yě kěyǐ bāng nǐ ānpái qù qǔ.',
      npcLineEn: 'The café found your wallet. I asked them to keep it safe, and I can help arrange collection.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '太感谢了！麻烦你帮我安排一下，我的手机可能撑不了多久。', py: 'Tài gǎnxiè le! Máfan nǐ bāng wǒ ānpái yíxià, wǒ de shǒujī kěnéng chēng bù liǎo duōjiǔ.', en: 'Thank you so much! Please help me arrange it; my phone may not last much longer.', explanation: 'Natural and practical. It appreciates the extra help and explains the time pressure.', correction: null, glossary: ['手机'] },
        Stiff: { zh: '好，帮我安排。', py: 'Hǎo, bāng wǒ ānpái.', en: 'Okay, arrange it for me.', explanation: 'The request is clear but sounds abrupt after proactive help.', correction: '好，谢谢。麻烦你帮我安排一下。' },
        Awkward: { zh: '谢谢，你安排我去钱包。', py: 'Xièxie, nǐ ānpái wǒ qù qiánbāo.', en: 'Thanks, you arrange me go wallet.', explanation: 'The gratitude is present, but the action is expressed unnaturally.', correction: '谢谢，麻烦你帮我安排去取钱包。', glossary: ['钱包'] },
        Incorrect: { zh: '不用找了，我要买新钱包。', py: 'Bú yòng zhǎo le, wǒ yào mǎi xīn qiánbāo.', en: 'Stop looking; I will buy a new wallet.', explanation: 'This abandons the confirmed recovery and rejects the offered help.', correction: '麻烦你帮我安排去取钱包。', glossary: ['钱包'] },
      }),
    },
    mixed: {
      branchKey: 'verification-needed',
      npcLineZh: '咖啡馆找到一个黑色钱包，不过需要你确认里面的东西。',
      npcLinePy: 'Kāfēiguǎn zhǎo dào yí ge hēisè qiánbāo, búguò xūyào nǐ quèrèn lǐmiàn de dōngxi.',
      npcLineEn: 'The café found a black wallet, but they need you to confirm what is inside.',
    },
    weak: {
      branchKey: 'procedural-help',
      npcLineZh: '现在还不能确认丢了什么。请你先填写失物登记表。',
      npcLinePy: 'Xiànzài hái bù néng quèrèn diū le shénme. Qǐng nǐ xiān tiánxiě shīwù dēngjìbiǎo.',
      npcLineEn: 'We still cannot confirm what was lost. Please complete a lost-property form first.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '好的，我来填写。请问需要写哪些信息？', py: 'Hǎo de, wǒ lái tiánxiě. Qǐngwèn xūyào xiě nǎxiē xìnxī?', en: 'Okay, I will fill it out. What information should I include?', explanation: 'Natural and cooperative. It accepts the procedure and asks for a clear next step.', correction: null },
        Stiff: { zh: '好，给我表格。', py: 'Hǎo, gěi wǒ biǎogé.', en: 'Okay, give me the form.', explanation: 'Understandable but blunt in a formal service interaction.', correction: '好的，请给我一张表格。' },
        Awkward: { zh: '我写丢东西的纸。', py: 'Wǒ xiě diū dōngxi de zhǐ.', en: 'I write lost thing paper.', explanation: 'The listener can infer the intent, but the form name and structure are unnatural.', correction: '我来填写失物登记表。' },
        Incorrect: { zh: '咖啡馆已经把钱包给我了。', py: 'Kāfēiguǎn yǐjīng bǎ qiánbāo gěi wǒ le.', en: 'The café already gave me the wallet.', explanation: 'This claims a result that has not happened and prevents accurate assistance.', correction: '请给我失物登记表。', glossary: ['钱包'] },
      }),
    },
  },
  decision6: {
    strong: {
      branchKey: 'smooth-close',
      npcLineZh: '钱包已经确认是你的。往前走就能取，我再带你去充电。',
      npcLinePy: 'Qiánbāo yǐjīng quèrèn shì nǐ de. Wǎng qián zǒu jiù néng qǔ, wǒ zài dài nǐ qù chōngdiàn.',
      npcLineEn: 'The wallet is confirmed as yours. You can collect it just ahead, and I will also show you where to charge.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '太好了，真的谢谢你帮了我这么多！', py: 'Tài hǎo le, zhēn de xièxie nǐ bāng le wǒ zhème duō!', en: 'That is wonderful. Thank you so much for all your help!', explanation: 'Natural and warm. It recognizes the staff member’s extra effort and closes smoothly.', correction: null },
        Stiff: { zh: '好，谢谢。', py: 'Hǎo, xièxie.', en: 'Okay, thanks.', explanation: 'Correct but brief after receiving substantial help.', correction: '太好了，真的谢谢你！' },
        Awkward: { zh: '很好，你帮助我很多谢谢。', py: 'Hěn hǎo, nǐ bāngzhù wǒ hěn duō xièxie.', en: 'Very good, you help me much thanks.', explanation: 'The appreciation is clear, but the sentence is not natural Chinese.', correction: '真的谢谢你帮了我这么多。' },
        Incorrect: { zh: '你的钱包找到了吗？', py: 'Nǐ de qiánbāo zhǎo dào le ma?', en: 'Was your wallet found?', explanation: 'This switches the missing wallet to the staff member and does not close your interaction.', correction: '太好了，真的谢谢你！', glossary: ['钱包'] },
      }),
    },
    mixed: {
      branchKey: 'clarified-close',
      npcLineZh: '信息终于对上了。你可以去咖啡馆确认并领取钱包。',
      npcLinePy: 'Xìnxī zhōngyú duì shàng le. Nǐ kěyǐ qù kāfēiguǎn quèrèn bìng lǐngqǔ qiánbāo.',
      npcLineEn: 'The information finally matches. You can go to the café to verify and collect the wallet.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '明白了，谢谢你耐心帮我确认。', py: 'Míngbai le, xièxie nǐ nàixīn bāng wǒ quèrèn.', en: 'I understand. Thank you for patiently helping me confirm it.', explanation: 'Natural and appropriate. It acknowledges the clarification effort.', correction: null },
        Stiff: { zh: '知道了，谢谢。', py: 'Zhīdào le, xièxie.', en: 'Got it, thanks.', explanation: 'Correct but emotionally flat after a longer clarification.', correction: '明白了，谢谢你帮我确认。' },
        Awkward: { zh: '现在知道，我去确认钱包。', py: 'Xiànzài zhīdào, wǒ qù quèrèn qiánbāo.', en: 'Now know, I go confirm wallet.', explanation: 'The next step is understandable, but the phrasing is incomplete.', correction: '现在明白了，我去确认钱包。', glossary: ['钱包'] },
        Incorrect: { zh: '不用确认，那不是我的钱包。', py: 'Bú yòng quèrèn, nà bú shì wǒ de qiánbāo.', en: 'No need to verify; that is not my wallet.', explanation: 'This rejects the possible match before checking it.', correction: '好的，我去咖啡馆确认一下。', glossary: ['钱包'] },
      }),
    },
    weak: {
      branchKey: 'delayed-close',
      npcLineZh: '请先把表格填好。我们确认以后再通知你。',
      npcLinePy: 'Qǐng xiān bǎ biǎogé tián hǎo. Wǒmen quèrèn yǐhòu zài tōngzhī nǐ.',
      npcLineEn: 'Please complete the form first. We will contact you after we confirm the details.',
      options: makeChapter6BranchOptions({
        Natural: { zh: '好的，我明白了。谢谢你，我会留下可以联系我的号码。', py: 'Hǎo de, wǒ míngbai le. Xièxie nǐ, wǒ huì liúxià kěyǐ liánxì wǒ de hàomǎ.', en: 'Okay, I understand. Thank you; I will leave a number where you can reach me.', explanation: 'Natural and practical. It accepts the delay and provides a useful next step.', correction: null },
        Stiff: { zh: '好，我等通知。', py: 'Hǎo, wǒ děng tōngzhī.', en: 'Okay, I will wait for notification.', explanation: 'Correct but minimal and procedural.', correction: '好的，谢谢。我会等你们的通知。' },
        Awkward: { zh: '好，我等你告诉以后。', py: 'Hǎo, wǒ děng nǐ gàosu yǐhòu.', en: 'Okay, I wait you tell later.', explanation: 'The intent is understandable, but the notification phrasing is unnatural.', correction: '好的，我等你们以后通知我。' },
        Incorrect: { zh: '不用了，钱包已经找到了。', py: 'Bú yòng le, qiánbāo yǐjīng zhǎo dào le.', en: 'No need; the wallet has already been found.', explanation: 'This claims the unresolved problem is already solved.', correction: '好的，我先填写表格。', glossary: ['钱包'] },
      }),
    },
  },
};

const CHAPTER6_ENDINGS = {
  smooth: {
    label: 'Smooth resolution',
    zh: '工作人员很快明白了。钱包顺利找回，也带你去了充电的地方。',
    py: 'Gōngzuò rényuán hěn kuài míngbai le. Qiánbāo shùnlì zhǎo huí, yě dài nǐ qù le chōngdiàn de dìfang.',
    en: 'The staff understood quickly. Your wallet was recovered, and they also showed you where to charge your phone.',
  },
  clarified: {
    label: 'Solved after clarification',
    zh: '经过几次确认，钱包终于找到了，问题也解决了。',
    py: 'Jīngguò jǐ cì quèrèn, qiánbāo zhōngyú zhǎo dào le, wèntí yě jiějué le.',
    en: 'After several clarifications, the wallet was identified and the problem was solved.',
  },
  delayed: {
    label: 'Help delayed',
    zh: '工作人员还不能确认情况。你需要填写失物登记表并等待通知。',
    py: 'Gōngzuò rényuán hái bù néng quèrèn qíngkuàng. Nǐ xūyào tiánxiě shīwù dēngjìbiǎo bìng děngdài tōngzhī.',
    en: 'The staff still cannot confirm the situation. You need to complete a lost-property form and wait for an update.',
  },
};

function clampSceneMetric(value) {
  return Math.max(0, Math.min(100, value));
}

function calculateSceneRunMetrics(run) {
  return Object.keys(run)
    .map(Number)
    .sort((a, b) => a - b)
    .reduce((metrics, index) => {
      const choice = run[index];
      return {
        socialComfort: clampSceneMetric(metrics.socialComfort + choice.relationship),
        naturalness: clampSceneMetric(metrics.naturalness + SCENE_NATURALNESS_DELTA[choice.rating]),
      };
    }, { socialComfort: 50, naturalness: 50 });
}

function applySceneMetricChoice(metrics, choice) {
  return {
    socialComfort: clampSceneMetric(metrics.socialComfort + choice.relationship),
    naturalness: clampSceneMetric(metrics.naturalness + SCENE_NATURALNESS_DELTA[choice.rating]),
  };
}

function resolveSpeakerHeader(chapter, node) {
  const role = firstAvailableText(
    node?.speakerRole,
    node?.npcRole,
    node?.speaker,
    node?.npc,
    chapter?.speakerRole,
    chapter?.npcRole,
    chapter?.speaker
  );
  if (!role) return null;

  const configuredLabel = firstAvailableText(node?.avatarLabel, node?.speakerAvatarLabel, chapter?.avatarLabel);
  const neutralLabel = role
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    role,
    avatarLabel: configuredLabel || (neutralLabel.length > 1 ? neutralLabel : role.slice(0, 2).toUpperCase()),
  };
}

function SpeakerHeader({ speaker, rating, compact = false }) {
  if (!speaker?.role || !speaker?.avatarLabel) return null;
  const state = {
    Natural: {
      label: 'Friendly',
      shell: 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_10px_26px_rgba(5,150,105,0.14)]',
      marker: 'bg-emerald-600 text-white',
      Icon: CheckCircle2,
      animate: { scale: [1, 1.05, 1], y: [0, -3, 0] },
    },
    Stiff: {
      label: 'Reserved',
      shell: 'border-neutral-300 bg-neutral-100 text-neutral-800',
      marker: 'bg-neutral-700 text-white',
      Icon: CircleEllipsis,
      animate: { scale: [1, 0.98, 1], y: [0, 1, 0] },
    },
    Awkward: {
      label: 'Unsure',
      shell: 'border-orange-400 bg-orange-50 text-orange-950 shadow-[0_10px_24px_rgba(234,88,12,0.12)]',
      marker: 'bg-orange-600 text-white',
      Icon: CircleHelp,
      animate: { rotate: [0, -5, 0] },
    },
    Incorrect: {
      label: 'Misunderstood',
      shell: 'border-rose-400 bg-rose-50 text-rose-950 shadow-[0_10px_24px_rgba(190,18,60,0.12)]',
      marker: 'bg-rose-700 text-white',
      Icon: AlertTriangle,
      animate: { x: [0, -5, 4, -3, 0] },
    },
  }[rating] || {
    label: 'Listening',
    shell: 'border-indigo-200 bg-[#34304f] text-white shadow-[0_10px_26px_rgba(52,48,79,0.18)]',
    marker: 'bg-white text-[#34304f]',
    Icon: CircleEllipsis,
    animate: { scale: 1 },
  };
  const MarkerIcon = state.Icon;

  return (
    <div
      data-speaker-role={speaker.role}
      data-speaker-status={state.label}
      data-speaker-avatar={speaker.avatarLabel}
      className="flex shrink-0 items-center gap-3"
    >
      <motion.div
        key={rating || 'listening'}
        animate={state.animate}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative flex shrink-0 items-center justify-center border font-bold tracking-[0.12em] ${state.shell} ${compact ? 'h-11 w-11 rounded-xl text-[10px]' : 'h-16 w-16 rounded-[20px] text-sm'}`}
      >
        {speaker.avatarLabel}
        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full ring-2 ring-white ${state.marker} ${compact ? 'h-5 w-5' : 'h-6 w-6'}`}>
          <MarkerIcon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </span>
      </motion.div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">{speaker.role}</div>
        <div className="whitespace-nowrap text-sm font-semibold text-[#2b241f]">{state.label}</div>
      </div>
    </div>
  );
}

function isStrongPassword(password) {
  const normalized = password.trim().toLowerCase();
  return password.length >= 8 && normalized.length > 0 && !WEAK_PASSWORDS.has(normalized);
}

function clampArrayIndex(index, length) {
  if (!Number.isInteger(index) || length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

function normalizeRestoredNodeIndex(chapterIndex, nodeIndex, nodeSelections) {
  const safeChapterIndex = clampArrayIndex(chapterIndex, chapters.length);
  const safeNodeIndex = clampArrayIndex(nodeIndex, chapters[safeChapterIndex].nodes.length);
  const completedLegacyChapter1 = safeChapterIndex === 0
    && safeNodeIndex === 2
    && [0, 1, 2].every((decisionIndex) => Boolean(nodeSelections?.[`0-${decisionIndex}`]))
    && [3, 4, 5].every((decisionIndex) => !nodeSelections?.[`0-${decisionIndex}`]);
  const restoredNodeIndex = completedLegacyChapter1 ? 3 : safeNodeIndex;
  for (let decisionIndex = 0; decisionIndex < restoredNodeIndex; decisionIndex += 1) {
    if (!nodeSelections?.[`${safeChapterIndex}-${decisionIndex}`]) return decisionIndex;
  }
  return restoredNodeIndex;
}

function restoreSceneRunFromSelections(chapter, chapterIndex, nodeSelections) {
  if (!chapter || !nodeSelections || typeof nodeSelections !== 'object') return {};

  let metrics = { socialComfort: 50, naturalness: 50 };
  const restoredRun = {};
  chapter.nodes.forEach((node, nodeIndex) => {
    const optionId = nodeSelections[`${chapterIndex}-${nodeIndex}`];
    const option = node.options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    const previousMetrics = metrics;
    const newMetrics = applySceneMetricChoice(previousMetrics, option);
    restoredRun[nodeIndex] = {
      optionId: option.id,
      rating: option.rating,
      relationship: option.relationship,
      branchKey: 'restored',
      previousMetrics,
      newMetrics,
    };
    metrics = newMetrics;
  });
  return restoredRun;
}

function PasswordInput({ value, onChange, placeholder, visible, onToggle }) {
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-11 text-sm outline-none focus:border-neutral-500"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-500 hover:text-neutral-900"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordRequirements() {
  return (
    <div className="text-xs leading-5 text-neutral-500">
      <div>Password must be at least 8 characters.</div>
      <div>Avoid simple passwords like 12345678 or password.</div>
    </div>
  );
}

function DisplayToggleButton({ active, label, onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border font-semibold transition ${
        compact ? 'min-h-11 px-3 py-2 text-sm' : 'min-h-12 px-4 py-2 text-base'
      } ${
        active
          ? 'border-[#2b241f] bg-[#2b241f] text-white shadow-[0_10px_24px_rgba(43,36,31,0.16)]'
          : 'border-[#d8cbb8] bg-white/75 text-[#6f6257] hover:border-[#d6a856] hover:bg-[#fffaf3]'
      }`}
      aria-pressed={active}
    >
      <span className="min-w-0 text-left leading-tight">{label}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-white/20 text-white' : 'bg-[#f3eadf] text-[#6f6257]'}`}>
        {active ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function getCurrentDeviceLabel() {
  if (typeof navigator === 'undefined') return 'This device';

  const userAgent = navigator.userAgent;
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
    ? 'Chrome'
    : userAgent.includes('Safari/') && !userAgent.includes('Chrome/')
    ? 'Safari'
    : userAgent.includes('Firefox/')
    ? 'Firefox'
    : 'Browser';
  const device = /iPhone|iPad|iPod/.test(userAgent)
    ? userAgent.includes('iPad')
      ? 'iPad'
      : 'iPhone'
    : userAgent.includes('Android')
    ? 'Android'
    : userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac OS X')
    ? 'Mac'
    : userAgent.includes('Linux')
    ? 'Linux'
    : 'this device';

  return `${browser} on ${device}`;
}

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

function createCollectionItem({ expression, pinyin = '', english = '', audioId = '', type = 'expression', source = '', chapter = '', mission = '' }) {
  return {
    id: `${type}::${expression}::${source}`,
    expression,
    pinyin,
    english,
    audioId,
    type,
    source,
    chapter,
    mission,
    createdAt: Date.now(),
  };
}

function AudioButton({ audioId = '', text, dark = false, small = false }) {
  const [isLoading, setIsLoading] = useState(false);

  const speak = async (e) => {
    e.stopPropagation();

    const finalText = text || AUDIO_TEXT_BY_ID[audioId] || '';
    if (!finalText || isLoading) return;

    try {
      setIsLoading(true);

      const remoteUrl = await resolveAudioUrl(audioId, finalText);

      if (!remoteUrl) {
        alert('No TTS audio URL returned.');
        return;
      }

      console.log('TTS audio URL:', remoteUrl);

      const audio = new Audio(remoteUrl);
      audio.playbackRate = getSavedAudioRate();
      await audio.play();
   } catch (error) {
  console.error('TTS audio failed:', error);

  const message = String(error?.message || '');

  if (
    message.includes('ACCESS_DENIED') ||
    message.includes('token') ||
    message.includes('signature') ||
    message.includes('AccessKey') ||
    message.includes('Aliyun')
  ) {
    alert('Audio is temporarily unavailable. Please try again later.');
  } else {
    alert('Audio could not be played. Please check your connection and try again.');
  }
} finally {
      setTimeout(() => setIsLoading(false), 300);
    }
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
      {isLoading ? (
        <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${dark ? 'text-white' : 'text-neutral-700'}`} />
      ) : (
        <Volume2 className={`${small ? 'h-4 w-4' : 'h-4 w-4'} ${dark ? 'text-white' : 'text-neutral-700'}`} />
)}
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
  '室友': {
    title: '室友',
    pinyin: 'shìyǒu',
    translation: 'roommate',
    explanation: '室友 is someone who shares your room or home. In this story it refers to the learner’s new apartment roommate.',
    examples: [
      { zh: '他是我的室友。', py: 'Tā shì wǒ de shìyǒu.', en: 'He is my roommate.' },
      { zh: '我的室友叫李明。', py: 'Wǒ de shìyǒu jiào Lǐ Míng.', en: 'My roommate is called Li Ming.' },
      { zh: '新来的室友很友好。', py: 'Xīn lái de shìyǒu hěn yǒuhǎo.', en: 'The new roommate is very friendly.' },
      { zh: '我和室友一起吃饭。', py: 'Wǒ hé shìyǒu yìqǐ chīfàn.', en: 'My roommate and I eat together.' },
      { zh: '室友带我看了看房子。', py: 'Shìyǒu dài wǒ kàn le kan fángzi.', en: 'My roommate showed me around the apartment.' },
    ],
  },
  '我叫': {
    title: '我叫',
    pinyin: 'wǒ jiào',
    translation: 'my name is / I am called',
    explanation: 'Use 我叫 directly before your name. Chinese does not normally add 是 between 我 and 叫 in a simple introduction.',
    examples: [
      { zh: '我叫 Alex。', py: 'Wǒ jiào Alex.', en: 'My name is Alex.' },
      { zh: '我叫李明。', py: 'Wǒ jiào Lǐ Míng.', en: 'My name is Li Ming.' },
      { zh: '你好，我叫王雨。', py: 'Nǐ hǎo, wǒ jiào Wáng Yǔ.', en: 'Hello, my name is Wang Yu.' },
      { zh: '我叫小云，你呢？', py: 'Wǒ jiào Xiǎo Yún, nǐ ne?', en: 'My name is Xiao Yun. What about you?' },
      { zh: '我叫陈安，很高兴认识你。', py: 'Wǒ jiào Chén Ān, hěn gāoxìng rènshi nǐ.', en: 'My name is Chen An. Nice to meet you.' },
    ],
  },
  '很高兴认识你': {
    title: '很高兴认识你',
    pinyin: 'hěn gāoxìng rènshi nǐ',
    translation: 'nice to meet you',
    explanation: 'This is a warm, standard phrase for a first meeting. It literally expresses being happy to get to know the other person.',
    examples: [
      { zh: '很高兴认识你。', py: 'Hěn gāoxìng rènshi nǐ.', en: 'Nice to meet you.' },
      { zh: '我叫 Alex，很高兴认识你。', py: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.', en: 'My name is Alex. Nice to meet you.' },
      { zh: '你好，很高兴认识你。', py: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ.', en: 'Hello, nice to meet you.' },
      { zh: '我也很高兴认识你。', py: 'Wǒ yě hěn gāoxìng rènshi nǐ.', en: 'Nice to meet you too.' },
      { zh: '谢谢你，很高兴认识你！', py: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!', en: 'Thank you. Nice to meet you!' },
    ],
  },
  '哪国人': {
    title: '哪国人',
    pinyin: 'nǎ guó rén',
    translation: 'person of which country / what nationality',
    explanation: '哪国人 asks someone’s nationality. Use it in 你是哪国人？ and answer with 我是 + country + 人.',
    examples: [
      { zh: '你是哪国人？', py: 'Nǐ shì nǎ guó rén?', en: 'What country are you from?' },
      { zh: '他是哪国人？', py: 'Tā shì nǎ guó rén?', en: 'What nationality is he?' },
      { zh: '你的室友是哪国人？', py: 'Nǐ de shìyǒu shì nǎ guó rén?', en: 'What country is your roommate from?' },
      { zh: '老师问我是哪国人。', py: 'Lǎoshī wèn wǒ shì nǎ guó rén.', en: 'The teacher asked what country I was from.' },
      { zh: '我不知道她是哪国人。', py: 'Wǒ bù zhīdào tā shì nǎ guó rén.', en: 'I do not know what nationality she is.' },
    ],
  },
  '会说一点': {
    title: '会说一点',
    pinyin: 'huì shuō yìdiǎn',
    translation: 'can speak a little',
    explanation: 'Use 会说一点 before a language to describe a small amount of speaking ability.',
    examples: [
      { zh: '我会说一点中文。', py: 'Wǒ huì shuō yìdiǎn Zhōngwén.', en: 'I can speak a little Chinese.' },
      { zh: '她会说一点英文。', py: 'Tā huì shuō yìdiǎn Yīngwén.', en: 'She can speak a little English.' },
      { zh: '你会说一点日语吗？', py: 'Nǐ huì shuō yìdiǎn Rìyǔ ma?', en: 'Can you speak a little Japanese?' },
      { zh: '我的室友会说一点法语。', py: 'Wǒ de shìyǒu huì shuō yìdiǎn Fǎyǔ.', en: 'My roommate can speak a little French.' },
      { zh: '我只会说一点中文。', py: 'Wǒ zhǐ huì shuō yìdiǎn Zhōngwén.', en: 'I can only speak a little Chinese.' },
    ],
  },
  '说得不太好': {
    title: '说得不太好',
    pinyin: 'shuō de bú tài hǎo',
    translation: 'do not speak very well',
    explanation: '说得 describes how well someone speaks. 不太好 gives a modest, softened negative assessment: “not very well.”',
    examples: [
      { zh: '我的中文说得不太好。', py: 'Wǒ de Zhōngwén shuō de bú tài hǎo.', en: 'I do not speak Chinese very well.' },
      { zh: '我会说一点，不过说得不太好。', py: 'Wǒ huì shuō yìdiǎn, búguò shuō de bú tài hǎo.', en: 'I can speak a little, but not very well.' },
      { zh: '他英文说得不太好。', py: 'Tā Yīngwén shuō de bú tài hǎo.', en: 'He does not speak English very well.' },
      { zh: '我今天说得不太好。', py: 'Wǒ jīntiān shuō de bú tài hǎo.', en: 'I did not speak very well today.' },
      { zh: '她说得不太好，但是听得懂。', py: 'Tā shuō de bú tài hǎo, dànshì tīng de dǒng.', en: 'She does not speak very well, but she can understand.' },
    ],
  },
  '刚搬来': {
    title: '刚搬来',
    pinyin: 'gāng bān lái',
    translation: 'just moved here / just moved in',
    explanation: '刚 marks a very recent action. 搬来 describes moving toward or into the current place.',
    examples: [
      { zh: '我今天刚搬来。', py: 'Wǒ jīntiān gāng bān lái.', en: 'I just moved in today.' },
      { zh: '你刚搬来吗？', py: 'Nǐ gāng bān lái ma?', en: 'Did you just move here?' },
      { zh: '新室友昨天刚搬来。', py: 'Xīn shìyǒu zuótiān gāng bān lái.', en: 'The new roommate just moved in yesterday.' },
      { zh: '她刚搬来这个城市。', py: 'Tā gāng bān lái zhège chéngshì.', en: 'She just moved to this city.' },
      { zh: '因为我刚搬来，所以还不太熟悉。', py: 'Yīnwèi wǒ gāng bān lái, suǒyǐ hái bú tài shúxī.', en: 'Because I just moved here, I am still not very familiar with it.' },
    ],
  },
  '不太熟悉': {
    title: '不太熟悉',
    pinyin: 'bú tài shúxī',
    translation: 'not very familiar with',
    explanation: '不太 softens the negative meaning. 熟悉 means to know a place, person, or situation well.',
    examples: [
      { zh: '我对这里还不太熟悉。', py: 'Wǒ duì zhèlǐ hái bú tài shúxī.', en: 'I am still not very familiar with this place.' },
      { zh: '他对学校不太熟悉。', py: 'Tā duì xuéxiào bú tài shúxī.', en: 'He is not very familiar with the school.' },
      { zh: '我不太熟悉这条路。', py: 'Wǒ bú tài shúxī zhè tiáo lù.', en: 'I am not very familiar with this road.' },
      { zh: '新室友对附近还不太熟悉。', py: 'Xīn shìyǒu duì fùjìn hái bú tài shúxī.', en: 'The new roommate is still not very familiar with the neighborhood.' },
      { zh: '如果你不太熟悉，我可以帮你。', py: 'Rúguǒ nǐ bú tài shúxī, wǒ kěyǐ bāng nǐ.', en: 'If you are not very familiar with it, I can help you.' },
    ],
  },
  '一起': {
    title: '一起',
    pinyin: 'yìqǐ',
    translation: 'together',
    explanation: '一起 normally comes before the action: 我们一起看看 means “let’s take a look together.”',
    examples: [
      { zh: '我们一起看看吧。', py: 'Wǒmen yìqǐ kànkan ba.', en: 'Let’s take a look together.' },
      { zh: '我和室友一起吃饭。', py: 'Wǒ hé shìyǒu yìqǐ chīfàn.', en: 'My roommate and I eat together.' },
      { zh: '明天我们一起去学校。', py: 'Míngtiān wǒmen yìqǐ qù xuéxiào.', en: 'Tomorrow we will go to school together.' },
      { zh: '大家一起帮新来的同学。', py: 'Dàjiā yìqǐ bāng xīn lái de tóngxué.', en: 'Everyone helps the new student together.' },
      { zh: '你想一起喝咖啡吗？', py: 'Nǐ xiǎng yìqǐ hē kāfēi ma?', en: 'Would you like to have coffee together?' },
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
      '刷卡 means paying with a bank card or credit card. In daily shopping and restaurant Chinese, 可以刷卡吗 is very common.',
    examples: [
      { zh: '可以刷卡吗？', py: 'Kěyǐ shuākǎ ma?', en: 'Can I pay by card?' },
      { zh: '这里可以刷卡吗？', py: 'Zhèlǐ kěyǐ shuākǎ ma?', en: 'Can I pay by card here?' },
      { zh: '我想刷卡。', py: 'Wǒ xiǎng shuākǎ.', en: 'I want to pay by card.' },
      { zh: '不好意思，这里不能刷卡。', py: 'Bù hǎoyìsi, zhèlǐ bù néng shuākǎ.', en: 'Sorry, you cannot pay by card here.' },
      { zh: '刷卡还是付现金？', py: 'Shuākǎ háishi fù xiànjīn?', en: 'Pay by card or pay cash?' },
    ],
  },
  '多少钱': {
    title: '多少钱',
    pinyin: 'duōshao qián',
    translation: 'how much money / how much does it cost',
    explanation: '多少钱 is the most common way to ask the price of something. In shopping, you can ask 这个多少钱？ or 这个包多少钱？',
    examples: [
      { zh: '这个多少钱？', py: 'Zhège duōshao qián?', en: 'How much is this?' },
      { zh: '这个包多少钱？', py: 'Zhège bāo duōshao qián?', en: 'How much is this bag?' },
      { zh: '一共多少钱？', py: 'Yígòng duōshao qián?', en: 'How much is it in total?' },
      { zh: '这件衣服多少钱？', py: 'Zhè jiàn yīfu duōshao qián?', en: 'How much is this piece of clothing?' },
      { zh: '请问，这个多少钱？', py: 'Qǐngwèn, zhège duōshao qián?', en: 'Excuse me, how much is this?' },
    ],
  },
  '打折': {
    title: '打折',
    pinyin: 'dǎzhé',
    translation: 'to be discounted / to have a discount',
    explanation: '打折 means something is on discount. In shopping, 今天打折 means “there is a discount today.”',
    examples: [
      { zh: '这个包今天打折。', py: 'Zhège bāo jīntiān dǎzhé.', en: 'This bag is discounted today.' },
      { zh: '这件衣服打折吗？', py: 'Zhè jiàn yīfu dǎzhé ma?', en: 'Is this piece of clothing discounted?' },
      { zh: '今天很多东西都打折。', py: 'Jīntiān hěn duō dōngxi dōu dǎzhé.', en: 'Many things are discounted today.' },
      { zh: '打折以后多少钱？', py: 'Dǎzhé yǐhòu duōshao qián?', en: 'How much is it after the discount?' },
      { zh: '这个没有打折。', py: 'Zhège méiyǒu dǎzhé.', en: 'This one is not discounted.' },
    ],
  },
  '有点儿': {
    title: '有点儿',
    pinyin: 'yǒudiǎnr',
    translation: 'a little / somewhat',
    explanation: '有点儿 usually comes before an adjective. It often softens a negative or inconvenient feeling, such as expensive, far, tired, busy, or uncomfortable. The pattern is 有点儿 + adjective.',
    examples: [
      { zh: '有点儿贵。', py: 'Yǒudiǎnr guì.', en: 'It is a little expensive.' },
      { zh: '今天有点儿冷。', py: 'Jīntiān yǒudiǎnr lěng.', en: 'Today is a little cold.' },
      { zh: '我有点儿累。', py: 'Wǒ yǒudiǎnr lèi.', en: 'I am a little tired.' },
      { zh: '这个地方有点儿远。', py: 'Zhège dìfang yǒudiǎnr yuǎn.', en: 'This place is a little far.' },
      { zh: '我有点儿不舒服。', py: 'Wǒ yǒudiǎnr bù shūfu.', en: 'I feel a little unwell.' },
    ],
  },
  '太贵了': {
    title: '太贵了',
    pinyin: 'tài guì le',
    translation: 'too expensive',
    explanation: '太 + Adj + 了 means “too Adj.” It shows the speaker feels something is beyond a normal or acceptable level. In shopping, 太贵了 can sound direct if used alone. Softer alternatives include 有点儿贵 or 太贵了，我想看看别的.',
    examples: [
      { zh: '这个太贵了。', py: 'Zhège tài guì le.', en: 'This is too expensive.' },
      { zh: '三百八十块太贵了。', py: 'Sānbǎi bāshí kuài tài guì le.', en: '380 yuan is too expensive.' },
      { zh: '这个包太贵了。', py: 'Zhège bāo tài guì le.', en: 'This bag is too expensive.' },
      { zh: '太贵了，我想看看别的。', py: 'Tài guì le, wǒ xiǎng kànkan bié de.', en: 'It is too expensive. I want to look at something else.' },
      { zh: '有点儿贵，我想看看别的。', py: 'Yǒudiǎnr guì, wǒ xiǎng kànkan bié de.', en: 'It is a little expensive. I want to look at something else.' },
    ],
  },
  '便宜一点': {
    title: '便宜一点',
    pinyin: 'piányi yìdiǎn',
    translation: 'a little cheaper',
    explanation: '便宜一点 means “a little cheaper.” It is useful when asking whether the seller can lower the price.',
    examples: [
      { zh: '可以便宜一点吗？', py: 'Kěyǐ piányi yìdiǎn ma?', en: 'Can it be a little cheaper?' },
      { zh: '这个能便宜一点吗？', py: 'Zhège néng piányi yìdiǎn ma?', en: 'Can this be a little cheaper?' },
      { zh: '有没有便宜一点的？', py: 'Yǒu méiyǒu piányi yìdiǎn de?', en: 'Do you have something a little cheaper?' },
      { zh: '便宜一点的话，我就买。', py: 'Piányi yìdiǎn de huà, wǒ jiù mǎi.', en: 'If it is a little cheaper, I will buy it.' },
      { zh: '这个比那个便宜一点。', py: 'Zhège bǐ nàge piányi yìdiǎn.', en: 'This one is a little cheaper than that one.' },
    ],
  },
  '看看别的': {
    title: '看看别的',
    pinyin: 'kànkan bié de',
    translation: 'look at something else',
    explanation: '看看别的 is a soft way to say you want to look at other options. 看看 makes the action lighter and less direct.',
    examples: [
      { zh: '我想看看别的。', py: 'Wǒ xiǎng kànkan bié de.', en: 'I want to look at something else.' },
      { zh: '这个太贵了，我想看看别的。', py: 'Zhège tài guì le, wǒ xiǎng kànkan bié de.', en: 'This is too expensive. I want to look at something else.' },
      { zh: '可以看看别的吗？', py: 'Kěyǐ kànkan bié de ma?', en: 'Can I look at something else?' },
      { zh: '我先看看别的。', py: 'Wǒ xiān kànkan bié de.', en: 'I will first look at something else.' },
      { zh: '还有别的吗？我想看看。', py: 'Hái yǒu bié de ma? Wǒ xiǎng kànkan.', en: 'Is there anything else? I want to take a look.' },
    ],
  },
  '换一个': {
    title: '换一个',
    pinyin: 'huàn yí ge',
    translation: 'change to another one / switch to another one',
    explanation: '换一个 means to change to another one. In shopping, it can mean choosing a different item, color, size, or option.',
    examples: [
      { zh: '我想换一个。', py: 'Wǒ xiǎng huàn yí ge.', en: 'I want to change to another one.' },
      { zh: '可以换一个颜色吗？', py: 'Kěyǐ huàn yí ge yánsè ma?', en: 'Can I change to another color?' },
      { zh: '这个太大了，我想换一个。', py: 'Zhège tài dà le, wǒ xiǎng huàn yí ge.', en: 'This is too big. I want to change to another one.' },
      { zh: '有没有小一点的？我想换一个。', py: 'Yǒu méiyǒu xiǎo yìdiǎn de? Wǒ xiǎng huàn yí ge.', en: 'Do you have a smaller one? I want to change to another one.' },
      { zh: '这个不太合适，可以换一个吗？', py: 'Zhège bú tài héshì, kěyǐ huàn yí ge ma?', en: 'This one is not very suitable. Can I change to another one?' },
    ],
  },
  '现金': {
    title: '现金',
    pinyin: 'xiànjīn',
    translation: 'cash',
    explanation: '现金 means cash. In payment situations, 刷卡还是现金？ means “card or cash?”',
    examples: [
      { zh: '可以付现金吗？', py: 'Kěyǐ fù xiànjīn ma?', en: 'Can I pay cash?' },
      { zh: '我没有现金。', py: 'Wǒ méiyǒu xiànjīn.', en: 'I do not have cash.' },
      { zh: '刷卡还是现金？', py: 'Shuākǎ háishi xiànjīn?', en: 'Card or cash?' },
      { zh: '我想付现金。', py: 'Wǒ xiǎng fù xiànjīn.', en: 'I want to pay cash.' },
      { zh: '这里只有现金可以吗？', py: 'Zhèlǐ zhǐyǒu xiànjīn kěyǐ ma?', en: 'Is cash the only option here?' },
    ],
  },
  '帮忙': {
    title: '帮忙',
    pinyin: 'bāngmáng',
    translation: 'to help / help',
    explanation: '帮忙 means to help someone with a problem. It is commonly used in polite requests like 需要帮忙吗？ or 可以帮忙吗？',
    examples: [
      { zh: '你需要帮忙吗？', py: 'Nǐ xūyào bāngmáng ma?', en: 'Do you need help?' },
      { zh: '可以帮忙吗？', py: 'Kěyǐ bāngmáng ma?', en: 'Can you help?' },
      { zh: '谢谢你帮忙。', py: 'Xièxie nǐ bāngmáng.', en: 'Thank you for helping.' },
      { zh: '我想请你帮忙。', py: 'Wǒ xiǎng qǐng nǐ bāngmáng.', en: 'I would like to ask you for help.' },
      { zh: '他正在帮忙。', py: 'Tā zhèngzài bāngmáng.', en: 'He is helping.' },
    ],
  },
  '帮我一下': {
    title: '帮我一下',
    pinyin: 'bāng wǒ yíxià',
    translation: 'help me for a moment / give me a hand',
    explanation: '帮我一下 is a soft and practical way to ask someone to help you briefly. 一下 makes the request feel lighter.',
    examples: [
      { zh: '可以帮我一下吗？', py: 'Kěyǐ bāng wǒ yíxià ma?', en: 'Could you help me for a moment?' },
      { zh: '麻烦你帮我一下。', py: 'Máfan nǐ bāng wǒ yíxià.', en: 'Sorry to trouble you, please help me for a moment.' },
      { zh: '你能帮我一下吗？', py: 'Nǐ néng bāng wǒ yíxià ma?', en: 'Can you help me for a moment?' },
      { zh: '我找不到钱包，可以帮我一下吗？', py: 'Wǒ zhǎo bú dào qiánbāo, kěyǐ bāng wǒ yíxià ma?', en: 'I cannot find my wallet. Could you help me?' },
      { zh: '不好意思，可以帮我一下吗？', py: 'Bù hǎoyìsi, kěyǐ bāng wǒ yíxià ma?', en: 'Excuse me, could you help me for a moment?' },
    ],
  },
  '着急': {
    title: '着急',
    pinyin: 'zháojí',
    translation: 'worried / anxious / in a hurry',
    explanation: '着急 describes a worried or anxious feeling, often because something is urgent or going wrong.',
    examples: [
      { zh: '你看起来很着急。', py: 'Nǐ kàn qǐlái hěn zháojí.', en: 'You look worried.' },
      { zh: '别着急。', py: 'Bié zháojí.', en: 'Don’t worry.' },
      { zh: '我有点儿着急。', py: 'Wǒ yǒudiǎnr zháojí.', en: 'I am a little worried.' },
      { zh: '他找不到手机，所以很着急。', py: 'Tā zhǎo bú dào shǒujī, suǒyǐ hěn zháojí.', en: 'He cannot find his phone, so he is worried.' },
      { zh: '不要着急，我帮你看看。', py: 'Bú yào zháojí, wǒ bāng nǐ kànkan.', en: 'Don’t worry. I’ll help you take a look.' },
    ],
  },
  '手机': {
    title: '手机',
    pinyin: 'shǒujī',
    translation: 'mobile phone / cell phone',
    explanation: '手机 means mobile phone or cell phone. It is a very common everyday word.',
    examples: [
      { zh: '我的手机没电了。', py: 'Wǒ de shǒujī méi diàn le.', en: 'My phone is out of battery.' },
      { zh: '你看到我的手机了吗？', py: 'Nǐ kàn dào wǒ de shǒujī le ma?', en: 'Have you seen my phone?' },
      { zh: '我把手机放在桌子上了。', py: 'Wǒ bǎ shǒujī fàng zài zhuōzi shàng le.', en: 'I put my phone on the table.' },
      { zh: '他的手机在包里。', py: 'Tā de shǒujī zài bāo lǐ.', en: 'His phone is in the bag.' },
      { zh: '我需要给手机充电。', py: 'Wǒ xūyào gěi shǒujī chōngdiàn.', en: 'I need to charge my phone.' },
    ],
  },
  '没电了': {
    title: '没电了',
    pinyin: 'méi diàn le',
    translation: 'out of battery / no power',
    explanation: '没电了 means something has run out of power. The 了 shows a changed situation: it had battery before, but now it does not.',
    examples: [
      { zh: '我的手机没电了。', py: 'Wǒ de shǒujī méi diàn le.', en: 'My phone is out of battery.' },
      { zh: '电脑没电了。', py: 'Diànnǎo méi diàn le.', en: 'The computer is out of battery.' },
      { zh: '耳机没电了。', py: 'Ěrjī méi diàn le.', en: 'The earphones are out of battery.' },
      { zh: '不好意思，我的手机没电了。', py: 'Bù hǎoyìsi, wǒ de shǒujī méi diàn le.', en: 'Sorry, my phone is out of battery.' },
      { zh: '手机快没电了。', py: 'Shǒujī kuài méi diàn le.', en: 'The phone is almost out of battery.' },
    ],
  },
  '半小时前': {
    title: '半小时前',
    pinyin: 'bàn ge xiǎoshí qián',
    translation: 'half an hour ago',
    explanation: '半小时前 places the time before the place and action when you explain when something happened.',
    examples: [
      { zh: '半小时前，我还在咖啡馆。', py: 'Bàn ge xiǎoshí qián, wǒ hái zài kāfēiguǎn.', en: 'Half an hour ago, I was still at the café.' },
      { zh: '我半小时前看到过钱包。', py: 'Wǒ bàn ge xiǎoshí qián kàn dào guo qiánbāo.', en: 'I saw the wallet half an hour ago.' },
      { zh: '她半小时前给我打过电话。', py: 'Tā bàn ge xiǎoshí qián gěi wǒ dǎ guo diànhuà.', en: 'She called me half an hour ago.' },
      { zh: '半小时前，咖啡馆还开着。', py: 'Bàn ge xiǎoshí qián, kāfēiguǎn hái kāi zhe.', en: 'The café was still open half an hour ago.' },
      { zh: '我们半小时前到的。', py: 'Wǒmen bàn ge xiǎoshí qián dào de.', en: 'We arrived half an hour ago.' },
    ],
  },
  '咖啡馆': {
    title: '咖啡馆',
    pinyin: 'kāfēiguǎn',
    translation: 'café',
    explanation: '咖啡馆 means café. Use 在咖啡馆 to place an action at the café.',
    examples: [
      { zh: '我在咖啡馆买过东西。', py: 'Wǒ zài kāfēiguǎn mǎi guo dōngxi.', en: 'I bought something at the café.' },
      { zh: '钱包可能在咖啡馆。', py: 'Qiánbāo kěnéng zài kāfēiguǎn.', en: 'The wallet may be at the café.' },
      { zh: '咖啡馆在地铁站旁边。', py: 'Kāfēiguǎn zài dìtiězhàn pángbiān.', en: 'The café is next to the subway station.' },
      { zh: '我给咖啡馆打电话。', py: 'Wǒ gěi kāfēiguǎn dǎ diànhuà.', en: 'I am calling the café.' },
      { zh: '这家咖啡馆几点关门？', py: 'Zhè jiā kāfēiguǎn jǐ diǎn guānmén?', en: 'What time does this café close?' },
    ],
  },
  '过': {
    title: 'V过',
    pinyin: 'V guo',
    translation: 'have done / did before',
    explanation: '过 after a verb marks past experience. In this scene, 买过 and 用过 help explain what happened before now.',
    examples: [
      { zh: '我在这里买过东西。', py: 'Wǒ zài zhèlǐ mǎi guo dōngxi.', en: 'I have bought something here.' },
      { zh: '我用过这个钱包。', py: 'Wǒ yòng guo zhège qiánbāo.', en: 'I have used this wallet.' },
      { zh: '我去过北京。', py: 'Wǒ qù guo Běijīng.', en: 'I have been to Beijing.' },
      { zh: '你看过这个电影吗？', py: 'Nǐ kàn guo zhège diànyǐng ma?', en: 'Have you seen this movie?' },
      { zh: '她没用过这个软件。', py: 'Tā méi yòng guo zhège ruǎnjiàn.', en: 'She has not used this software.' },
    ],
  },
  '什么样': {
    title: '什么样',
    pinyin: 'shénme yàng',
    translation: 'what kind / what does it look like',
    explanation: '什么样 asks for identifying qualities such as size, color, or shape.',
    examples: [
      { zh: '钱包是什么样的？', py: 'Qiánbāo shì shénme yàng de?', en: 'What does the wallet look like?' },
      { zh: '你喜欢什么样的包？', py: 'Nǐ xǐhuan shénme yàng de bāo?', en: 'What kind of bag do you like?' },
      { zh: '你在找什么样的钱包？', py: 'Nǐ zài zhǎo shénme yàng de qiánbāo?', en: 'What kind of wallet are you looking for?' },
      { zh: '那个房间是什么样的？', py: 'Nàge fángjiān shì shénme yàng de?', en: 'What is that room like?' },
      { zh: '他想买什么样的手机？', py: 'Tā xiǎng mǎi shénme yàng de shǒujī?', en: 'What kind of phone does he want to buy?' },
    ],
  },
  '里面有': {
    title: '里面有',
    pinyin: 'lǐmiàn yǒu',
    translation: 'there is / are inside',
    explanation: '里面有 introduces the contents of an object clearly.',
    examples: [
      { zh: '里面有银行卡。', py: 'Lǐmiàn yǒu yínhángkǎ.', en: 'There is a bank card inside.' },
      { zh: '钱包里面有身份证。', py: 'Qiánbāo lǐmiàn yǒu shēnfènzhèng.', en: 'There is an ID inside the wallet.' },
      { zh: '箱子里面有几本书。', py: 'Xiāngzi lǐmiàn yǒu jǐ běn shū.', en: 'There are several books inside the box.' },
      { zh: '房间里面有一张桌子。', py: 'Fángjiān lǐmiàn yǒu yì zhāng zhuōzi.', en: 'There is a table inside the room.' },
      { zh: '里面有我的名字和电话。', py: 'Lǐmiàn yǒu wǒ de míngzi hé diànhuà.', en: 'My name and phone number are inside.' },
    ],
  },
  '不是': {
    title: '不是A，是B',
    pinyin: 'bú shì A, shì B',
    translation: 'not A, but B',
    explanation: '不是A，是B corrects a misunderstanding by rejecting the wrong detail before supplying the right one.',
    examples: [
      { zh: '不是手机，是钱包。', py: 'Bú shì shǒujī, shì qiánbāo.', en: 'It is not the phone; it is the wallet.' },
      { zh: '不是今天，是明天。', py: 'Bú shì jīntiān, shì míngtiān.', en: 'It is not today; it is tomorrow.' },
      { zh: '不是黑色，是蓝色。', py: 'Bú shì hēisè, shì lánsè.', en: 'It is not black; it is blue.' },
      { zh: '不是在这里，是在那里。', py: 'Bú shì zài zhèlǐ, shì zài nàli.', en: 'It is not here; it is over there.' },
      { zh: '不是我打的电话，是他打的。', py: 'Bú shì wǒ dǎ de diànhuà, shì tā dǎ de.', en: 'It was not me who called; it was him.' },
    ],
  },
  '联系': {
    title: '联系',
    pinyin: 'liánxì',
    translation: 'to contact',
    explanation: '联系 means to contact a person or place to get information or arrange the next step.',
    examples: [
      { zh: '可以帮我联系咖啡馆吗？', py: 'Kěyǐ bāng wǒ liánxì kāfēiguǎn ma?', en: 'Could you help me contact the café?' },
      { zh: '我会联系他们。', py: 'Wǒ huì liánxì tāmen.', en: 'I will contact them.' },
      { zh: '请先联系工作人员。', py: 'Qǐng xiān liánxì gōngzuò rényuán.', en: 'Please contact the staff first.' },
      { zh: '我联系不上咖啡馆。', py: 'Wǒ liánxì bú shàng kāfēiguǎn.', en: 'I cannot reach the café.' },
      { zh: '有消息请联系我。', py: 'Yǒu xiāoxi qǐng liánxì wǒ.', en: 'Please contact me if there is any news.' },
    ],
  },
  '确认': {
    title: '确认',
    pinyin: 'quèrèn',
    translation: 'to confirm / verify',
    explanation: '确认 means to check that information or an item is correct before acting.',
    examples: [
      { zh: '请确认里面的东西。', py: 'Qǐng quèrèn lǐmiàn de dōngxi.', en: 'Please confirm what is inside.' },
      { zh: '我去咖啡馆确认一下。', py: 'Wǒ qù kāfēiguǎn quèrèn yíxià.', en: 'I will go to the café to confirm it.' },
      { zh: '请确认你的名字。', py: 'Qǐng quèrèn nǐ de míngzi.', en: 'Please confirm your name.' },
      { zh: '我想确认一下时间。', py: 'Wǒ xiǎng quèrèn yíxià shíjiān.', en: 'I would like to confirm the time.' },
      { zh: '信息已经确认了。', py: 'Xìnxī yǐjīng quèrèn le.', en: 'The information has been confirmed.' },
    ],
  },
  '失物登记表': {
    title: '失物登记表',
    pinyin: 'shīwù dēngjìbiǎo',
    translation: 'lost-property form',
    explanation: '失物登记表 is a form used to record details about a lost item.',
    examples: [
      { zh: '请给我失物登记表。', py: 'Qǐng gěi wǒ shīwù dēngjìbiǎo.', en: 'Please give me a lost-property form.' },
      { zh: '我先填写失物登记表。', py: 'Wǒ xiān tiánxiě shīwù dēngjìbiǎo.', en: 'I will fill out the lost-property form first.' },
      { zh: '失物登记表在哪里？', py: 'Shīwù dēngjìbiǎo zài nǎli?', en: 'Where is the lost-property form?' },
      { zh: '请把信息写在失物登记表上。', py: 'Qǐng bǎ xìnxī xiě zài shīwù dēngjìbiǎo shàng.', en: 'Please write the information on the lost-property form.' },
      { zh: '工作人员正在看失物登记表。', py: 'Gōngzuò rényuán zhèngzài kàn shīwù dēngjìbiǎo.', en: 'The staff member is reviewing the lost-property form.' },
    ],
  },
  '充电': {
    title: '充电',
    pinyin: 'chōngdiàn',
    translation: 'to charge / charge battery',
    explanation: '充电 means to charge an electronic device. 给手机充电 means “charge the phone.”',
    examples: [
      { zh: '这里可以充电吗？', py: 'Zhèlǐ kěyǐ chōngdiàn ma?', en: 'Can I charge here?' },
      { zh: '我想给手机充电。', py: 'Wǒ xiǎng gěi shǒujī chōngdiàn.', en: 'I want to charge my phone.' },
      { zh: '手机正在充电。', py: 'Shǒujī zhèngzài chōngdiàn.', en: 'The phone is charging.' },
      { zh: '哪里可以充电？', py: 'Nǎlǐ kěyǐ chōngdiàn?', en: 'Where can I charge?' },
      { zh: '你有充电器吗？', py: 'Nǐ yǒu chōngdiànqì ma?', en: 'Do you have a charger?' },
    ],
  },
  '找不到': {
    title: '找不到',
    pinyin: 'zhǎo bú dào',
    translation: 'cannot find',
    explanation: '找不到 means you try to find something, but you cannot find it. It is a result complement: 找 + 不到.',
    examples: [
      { zh: '我找不到钱包。', py: 'Wǒ zhǎo bú dào qiánbāo.', en: 'I cannot find my wallet.' },
      { zh: '他找不到手机。', py: 'Tā zhǎo bú dào shǒujī.', en: 'He cannot find his phone.' },
      { zh: '我找不到地铁站。', py: 'Wǒ zhǎo bú dào dìtiězhàn.', en: 'I cannot find the subway station.' },
      { zh: '你找不到什么？', py: 'Nǐ zhǎo bú dào shénme?', en: 'What can’t you find?' },
      { zh: '我刚才找不到你。', py: 'Wǒ gāngcái zhǎo bú dào nǐ.', en: 'I could not find you just now.' },
    ],
  },
  '钱包': {
    title: '钱包',
    pinyin: 'qiánbāo',
    translation: 'wallet',
    explanation: '钱包 means wallet. In daily situations, 我找不到钱包 is a useful sentence for explaining a small emergency.',
    examples: [
      { zh: '我找不到钱包。', py: 'Wǒ zhǎo bú dào qiánbāo.', en: 'I cannot find my wallet.' },
      { zh: '你的钱包在这里。', py: 'Nǐ de qiánbāo zài zhèlǐ.', en: 'Your wallet is here.' },
      { zh: '他的钱包在包里。', py: 'Tā de qiánbāo zài bāo lǐ.', en: 'His wallet is in the bag.' },
      { zh: '这是你的钱包吗？', py: 'Zhè shì nǐ de qiánbāo ma?', en: 'Is this your wallet?' },
      { zh: '我的钱包不见了。', py: 'Wǒ de qiánbāo bú jiàn le.', en: 'My wallet is missing.' },
    ],
  },
  '麻烦你了': {
    title: '麻烦你了',
    pinyin: 'máfan nǐ le',
    translation: 'sorry to trouble you / thanks for the trouble',
    explanation: '麻烦你了 is a polite phrase used when someone helps you or when you ask someone to do something. It shows you understand you are causing them some trouble.',
    examples: [
      { zh: '麻烦你了。', py: 'Máfan nǐ le.', en: 'Sorry to trouble you.' },
      { zh: '太谢谢了，麻烦你了。', py: 'Tài xièxie le, máfan nǐ le.', en: 'Thank you so much. Sorry to trouble you.' },
      { zh: '不好意思，麻烦你了。', py: 'Bù hǎoyìsi, máfan nǐ le.', en: 'Sorry, thank you for the trouble.' },
      { zh: '麻烦你帮我一下。', py: 'Máfan nǐ bāng wǒ yíxià.', en: 'Sorry to trouble you, please help me for a moment.' },
      { zh: '今天真的麻烦你了。', py: 'Jīntiān zhēn de máfan nǐ le.', en: 'I really troubled you today. / Thank you for your help today.' },
    ],
  },
  '太谢谢了': {
    title: '太谢谢了',
    pinyin: 'tài xièxie le',
    translation: 'thank you so much',
    explanation: '太谢谢了 is an emotional and warm way to say thank you very much. 太谢谢你了 is a fuller and very natural version when thanking a person directly. Both sound stronger than 谢谢.',
    examples: [
      { zh: '太谢谢了！', py: 'Tài xièxie le!', en: 'Thank you so much!' },
      { zh: '太谢谢你了！', py: 'Tài xièxie nǐ le!', en: 'Thank you so much!' },
      { zh: '太谢谢了，麻烦你了。', py: 'Tài xièxie le, máfan nǐ le.', en: 'Thank you so much. Sorry to trouble you.' },
      { zh: '你帮了我，太谢谢了。', py: 'Nǐ bāng le wǒ, tài xièxie le.', en: 'You helped me. Thank you so much.' },
      { zh: '找到了！太谢谢你了！', py: 'Zhǎo dào le! Tài xièxie nǐ le!', en: 'Found it! Thank you so much!' },
    ],
  },
  '请问': {
    title: '请问',
    pinyin: 'qǐngwèn',
    translation: 'excuse me / may I ask',
    explanation: '请问 is a polite opener before asking a question, especially to strangers or staff.',
    examples: [
      { zh: '请问，地铁站怎么走？', py: 'Qǐngwèn, dìtiězhàn zěnme zǒu?', en: 'Excuse me, how do I get to the subway station?' },
      { zh: '请问，洗手间在哪儿？', py: 'Qǐngwèn, xǐshǒujiān zài nǎr?', en: 'Excuse me, where is the restroom?' },
      { zh: '请问，前面是地铁站吗？', py: 'Qǐngwèn, qiánmiàn shì dìtiězhàn ma?', en: 'Excuse me, is the subway station ahead?' },
      { zh: '请问，这里到地铁站远吗？', py: 'Qǐngwèn, zhèlǐ dào dìtiězhàn yuǎn ma?', en: 'Excuse me, is it far from here to the subway station?' },
      { zh: '请问，可以再说一遍吗？', py: 'Qǐngwèn, kěyǐ zài shuō yí biàn ma?', en: 'Excuse me, could you say it again?' },
    ],
  },
  '地铁站': {
    title: '地铁站',
    pinyin: 'dìtiězhàn',
    translation: 'subway station / metro station',
    explanation: '地铁站 means subway or metro station. It is a common place word in city travel.',
    examples: [
      { zh: '地铁站在哪儿？', py: 'Dìtiězhàn zài nǎr?', en: 'Where is the subway station?' },
      { zh: '我想去地铁站。', py: 'Wǒ xiǎng qù dìtiězhàn.', en: 'I want to go to the subway station.' },
      { zh: '地铁站不远。', py: 'Dìtiězhàn bù yuǎn.', en: 'The subway station is not far.' },
      { zh: '地铁站在前面。', py: 'Dìtiězhàn zài qiánmiàn.', en: 'The subway station is ahead.' },
      { zh: '请问，怎么去地铁站？', py: 'Qǐngwèn, zěnme qù dìtiězhàn?', en: 'Excuse me, how do I get to the subway station?' },
    ],
  },
  '怎么走': {
    title: '怎么走',
    pinyin: 'zěnme zǒu',
    translation: 'how do I get there / how to go',
    explanation: '怎么走 is used when asking for directions. It does not literally mean only “how to walk”; it asks for the route.',
    examples: [
      { zh: '去地铁站怎么走？', py: 'Qù dìtiězhàn zěnme zǒu?', en: 'How do I get to the subway station?' },
      { zh: '请问，去学校怎么走？', py: 'Qǐngwèn, qù xuéxiào zěnme zǒu?', en: 'Excuse me, how do I get to the school?' },
      { zh: '到地铁站怎么走？', py: 'Dào dìtiězhàn zěnme zǒu?', en: 'How do I get to the subway station?' },
      { zh: '请问，去路口怎么走？', py: 'Qǐngwèn, qù lùkǒu zěnme zǒu?', en: 'Excuse me, how do I get to the intersection?' },
      { zh: '这里到地铁站怎么走？', py: 'Zhèlǐ dào dìtiězhàn zěnme zǒu?', en: 'How do I get from here to the subway station?' },
    ],
  },
  '不远': {
    title: '不远',
    pinyin: 'bù yuǎn',
    translation: 'not far',
    explanation: '不远 means the place is not far away. It is often used before giving simple directions.',
    examples: [
      { zh: '地铁站不远。', py: 'Dìtiězhàn bù yuǎn.', en: 'The subway station is not far.' },
      { zh: '学校离这儿不远。', py: 'Xuéxiào lí zhèr bù yuǎn.', en: 'The school is not far from here.' },
      { zh: '路口不远。', py: 'Lùkǒu bù yuǎn.', en: 'The intersection is not far.' },
      { zh: '这里到地铁站不远。', py: 'Zhèlǐ dào dìtiězhàn bù yuǎn.', en: 'It is not far from here to the subway station.' },
      { zh: '你一直走，不远。', py: 'Nǐ yìzhí zǒu, bù yuǎn.', en: 'Keep going straight. It is not far.' },
    ],
  },
  '一直走': {
    title: '一直走',
    pinyin: 'yìzhí zǒu',
    translation: 'go straight / keep walking',
    explanation: '一直走 is a common direction phrase meaning to keep going straight.',
    examples: [
      { zh: '你一直走。', py: 'Nǐ yìzhí zǒu.', en: 'Keep going straight.' },
      { zh: '一直走，然后左转。', py: 'Yìzhí zǒu, ránhòu zuǒ zhuǎn.', en: 'Go straight, then turn left.' },
      { zh: '我先一直走。', py: 'Wǒ xiān yìzhí zǒu.', en: 'I will go straight first.' },
      { zh: '一直走，地铁站在前面。', py: 'Yìzhí zǒu, dìtiězhàn zài qiánmiàn.', en: 'Go straight. The subway station is ahead.' },
      { zh: '你一直走，到路口左转。', py: 'Nǐ yìzhí zǒu, dào lùkǒu zuǒ zhuǎn.', en: 'Go straight, then turn left at the intersection.' },
    ],
  },
  '左转': {
    title: '左转',
    pinyin: 'zuǒ zhuǎn',
    translation: 'turn left',
    explanation: '左转 means turn left. It is often used after 一直走.',
    examples: [
      { zh: '前面左转。', py: 'Qiánmiàn zuǒ zhuǎn.', en: 'Turn left ahead.' },
      { zh: '一直走，然后左转。', py: 'Yìzhí zǒu, ránhòu zuǒ zhuǎn.', en: 'Go straight, then turn left.' },
      { zh: '到路口左转。', py: 'Dào lùkǒu zuǒ zhuǎn.', en: 'Turn left at the intersection.' },
      { zh: '左转以后就到了。', py: 'Zuǒ zhuǎn yǐhòu jiù dào le.', en: 'After you turn left, you’ll be there.' },
      { zh: '我先一直走，然后左转。', py: 'Wǒ xiān yìzhí zǒu, ránhòu zuǒ zhuǎn.', en: 'I will go straight first, then turn left.' },
    ],
  },
  '右转': {
    title: '右转',
    pinyin: 'yòu zhuǎn',
    translation: 'turn right',
    explanation: '右转 means turn right. It is a basic direction phrase.',
    examples: [
      { zh: '前面右转。', py: 'Qiánmiàn yòu zhuǎn.', en: 'Turn right ahead.' },
      { zh: '到路口右转。', py: 'Dào lùkǒu yòu zhuǎn.', en: 'Turn right at the intersection.' },
      { zh: '一直走，然后右转。', py: 'Yìzhí zǒu, ránhòu yòu zhuǎn.', en: 'Go straight, then turn right.' },
      { zh: '你到路口以后右转。', py: 'Nǐ dào lùkǒu yǐhòu yòu zhuǎn.', en: 'After you reach the intersection, turn right.' },
      { zh: '右转以后，地铁站在前面。', py: 'Yòu zhuǎn yǐhòu, dìtiězhàn zài qiánmiàn.', en: 'After you turn right, the subway station is ahead.' },
    ],
  },
  '没听清楚': {
    title: '没听清楚',
    pinyin: 'méi tīng qīngchu',
    translation: 'did not hear clearly',
    explanation: '没听清楚 is a useful polite phrase when you did not catch what someone said.',
    examples: [
      { zh: '不好意思，我没听清楚。', py: 'Bù hǎoyìsi, wǒ méi tīng qīngchu.', en: 'Sorry, I did not hear clearly.' },
      { zh: '我刚才没听清楚。', py: 'Wǒ gāngcái méi tīng qīngchu.', en: 'I did not hear clearly just now.' },
      { zh: '对不起，我没听清楚。', py: 'Duìbuqǐ, wǒ méi tīng qīngchu.', en: 'Sorry, I did not hear clearly.' },
      { zh: '你说得太快，我没听清楚。', py: 'Nǐ shuō de tài kuài, wǒ méi tīng qīngchu.', en: 'You spoke too fast, so I did not hear clearly.' },
      { zh: '不好意思，前面那句我没听清楚。', py: 'Bù hǎoyìsi, qiánmiàn nà jù wǒ méi tīng qīngchu.', en: 'Sorry, I did not hear that earlier sentence clearly.' },
    ],
  },
  '再说一遍': {
    title: '再说一遍',
    pinyin: 'zài shuō yí biàn',
    translation: 'say it again',
    explanation: '再说一遍 means say it one more time. With 可以吗, it becomes a polite request.',
    examples: [
      { zh: '可以再说一遍吗？', py: 'Kěyǐ zài shuō yí biàn ma?', en: 'Could you say it again?' },
      { zh: '请再说一遍。', py: 'Qǐng zài shuō yí biàn.', en: 'Please say it again.' },
      { zh: '不好意思，可以再说一遍吗？', py: 'Bù hǎoyìsi, kěyǐ zài shuō yí biàn ma?', en: 'Sorry, could you say it again?' },
      { zh: '你可以再说一遍吗？', py: 'Nǐ kěyǐ zài shuō yí biàn ma?', en: 'Could you say it again?' },
      { zh: '请把方向再说一遍。', py: 'Qǐng bǎ fāngxiàng zài shuō yí biàn.', en: 'Please say the directions again.' },
    ],
  },
  '看起来': {
    title: '看起来',
    pinyin: 'kàn qǐlái',
    translation: 'looks / seems',
    explanation: '看起来 is used when you make a guess from what you see. It often means “looks like” or “seems.” The pattern is: person / thing + 看起来 + adjective or state.',
    examples: [
      { zh: '你看起来很累。', py: 'Nǐ kàn qǐlái hěn lèi.', en: 'You look tired.' },
      { zh: '他看起来很忙。', py: 'Tā kàn qǐlái hěn máng.', en: 'He looks busy.' },
      { zh: '你看起来不太舒服。', py: 'Nǐ kàn qǐlái bú tài shūfu.', en: 'You do not look very well.' },
      { zh: '这个地方看起来很安静。', py: 'Zhège dìfang kàn qǐlái hěn ānjìng.', en: 'This place looks very quiet.' },
      { zh: '你看起来迷路了。', py: 'Nǐ kàn qǐlái mílù le.', en: 'You look lost.' },
    ],
  },
  '迷路了': {
    title: '迷路了',
    pinyin: 'mílù le',
    translation: 'got lost / be lost',
    explanation: '迷路 means to lose the way. 迷路了 means the person has become lost or is now lost. The 了 shows a changed situation.',
    examples: [
      { zh: '我迷路了。', py: 'Wǒ mílù le.', en: 'I am lost.' },
      { zh: '你迷路了吗？', py: 'Nǐ mílù le ma?', en: 'Are you lost?' },
      { zh: '他去地铁站的时候迷路了。', py: 'Tā qù dìtiězhàn de shíhou mílù le.', en: 'He got lost while going to the subway station.' },
      { zh: '不好意思，我好像迷路了。', py: 'Bù hǎoyìsi, wǒ hǎoxiàng mílù le.', en: 'Sorry, I think I am lost.' },
      { zh: '你看起来迷路了。', py: 'Nǐ kàn qǐlái mílù le.', en: 'You look lost.' },
    ],
  },
  '以后': {
    title: '以后',
    pinyin: 'yǐhòu',
    translation: 'after / after that / later',
    explanation: '以后 can mean “after” when it comes after an action, or “later / in the future” in other contexts. In directions, Action + 以后 often means “after you do this step.”',
    examples: [
      { zh: '左转以后，就到了。', py: 'Zuǒ zhuǎn yǐhòu, jiù dào le.', en: 'After you turn left, you will be there.' },
      { zh: '吃饭以后，我回家。', py: 'Chīfàn yǐhòu, wǒ huí jiā.', en: 'After eating, I go home.' },
      { zh: '下课以后，我去地铁站。', py: 'Xiàkè yǐhòu, wǒ qù dìtiězhàn.', en: 'After class, I go to the subway station.' },
      { zh: '到路口以后，右转。', py: 'Dào lùkǒu yǐhòu, yòu zhuǎn.', en: 'After you reach the intersection, turn right.' },
      { zh: '以后我想学更多中文。', py: 'Yǐhòu wǒ xiǎng xué gèng duō Zhōngwén.', en: 'In the future, I want to learn more Chinese.' },
    ],
  },
  '路口': {
    title: '路口',
    pinyin: 'lùkǒu',
    translation: 'intersection / street corner',
    explanation: '路口 means the place where roads meet. In directions, 到路口 means “when you reach the intersection.”',
    examples: [
      { zh: '到路口右转。', py: 'Dào lùkǒu yòu zhuǎn.', en: 'Turn right at the intersection.' },
      { zh: '前面有一个路口。', py: 'Qiánmiàn yǒu yí ge lùkǒu.', en: 'There is an intersection ahead.' },
      { zh: '你到路口以后左转。', py: 'Nǐ dào lùkǒu yǐhòu zuǒ zhuǎn.', en: 'After you reach the intersection, turn left.' },
      { zh: '地铁站在前面的路口。', py: 'Dìtiězhàn zài qiánmiàn de lùkǒu.', en: 'The subway station is at the intersection ahead.' },
      { zh: '我们在路口见面吧。', py: 'Wǒmen zài lùkǒu jiànmiàn ba.', en: 'Let’s meet at the intersection.' },
    ],
  },
  '前面': {
    title: '前面',
    pinyin: 'qiánmiàn',
    translation: 'ahead / in front',
    explanation: '前面 means “ahead” or “in front.” In directions, 在前面 often means “up ahead.”',
    examples: [
      { zh: '地铁站在前面。', py: 'Dìtiězhàn zài qiánmiàn.', en: 'The subway station is ahead.' },
      { zh: '前面左转。', py: 'Qiánmiàn zuǒ zhuǎn.', en: 'Turn left ahead.' },
      { zh: '前面有一个路口。', py: 'Qiánmiàn yǒu yí ge lùkǒu.', en: 'There is an intersection ahead.' },
      { zh: '你一直走，地铁站就在前面。', py: 'Nǐ yìzhí zǒu, dìtiězhàn jiù zài qiánmiàn.', en: 'Go straight, and the subway station is just ahead.' },
      { zh: '我在前面等你。', py: 'Wǒ zài qiánmiàn děng nǐ.', en: 'I will wait for you up ahead.' },
    ],
  },
  '到': {
    title: '到',
    pinyin: 'dào',
    translation: 'to arrive / reach / to',
    explanation: '到 can mean “to arrive” or “to reach a place.” In 到了, 了 shows that the result of arriving is reached. In directions, 就到了 is a useful chunk meaning “then you’ll be there.”',
    examples: [
      { zh: '我到了。', py: 'Wǒ dào le.', en: 'I have arrived.' },
      { zh: '你到了吗？', py: 'Nǐ dào le ma?', en: 'Have you arrived?' },
      { zh: '左转以后就到了。', py: 'Zuǒ zhuǎn yǐhòu jiù dào le.', en: 'After you turn left, you’ll be there.' },
      { zh: '到路口右转。', py: 'Dào lùkǒu yòu zhuǎn.', en: 'Turn right when you reach the intersection.' },
      { zh: '我想早点儿到。', py: 'Wǒ xiǎng zǎodiǎnr dào.', en: 'I want to arrive a little earlier.' },
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
    speakerRole: 'Roommate',
    avatarLabel: 'RO',
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
        id: 'introduce-name',
        title: 'How to introduce your name with 我叫',
        short: 'Use 我叫 + name, without 是.',
        body: [
          'The normal learner pattern is 我叫 + name: “I am called…” or “My name is…”',
          'Do not insert 是 between 我 and 叫. 我是叫 Alex is not the normal introduction pattern.',
        ],
        examples: [
          { zh: '我叫 Alex。', py: 'Wǒ jiào Alex.', en: 'My name is Alex.' },
          { zh: '我叫王雨，很高兴认识你。', py: 'Wǒ jiào Wáng Yǔ, hěn gāoxìng rènshi nǐ.', en: 'My name is Wang Yu. Nice to meet you.' },
        ],
      },
      {
        id: 'just-moved',
        title: 'How 刚 + Verb and 不太 + adjective work',
        short: '刚 marks a very recent action; 不太 softens a negative description.',
        body: [
          '刚 + verb means the action happened only a short time ago.',
          '不太 + adjective means “not very…”',
        ],
        examples: [
          { zh: '我刚搬来。', py: 'Wǒ gāng bān lái.', en: 'I just moved in.' },
          { zh: '我对这里还不太熟悉。', py: 'Wǒ duì zhèlǐ hái bú tài shúxī.', en: 'I am still not very familiar with this place.' },
        ],
      },
      {
        id: 'polite-trouble',
        title: 'What 麻烦你了 means in a polite request',
        short: 'It acknowledges the effort you are asking someone to make.',
        body: [
          'It does not literally mean “you are troublesome.”',
          'Here it shows: I know I am asking you to do something, and thank you for the trouble.',
        ],
        examples: [
          { zh: '麻烦你了。', py: 'Máfan nǐ le.', en: 'Sorry to trouble you; thank you for the effort.' },
          { zh: '麻烦你带我看看。', py: 'Máfan nǐ dài wǒ kànkan.', en: 'Please show me around.' },
        ],
      },
      {
        id: 'first-meeting-recap',
        title: 'Close with familiar first-meeting language',
        short: 'Reuse thanks, 很高兴认识你, or 麻烦你了 to close naturally.',
        body: ['Decision 6 adds no major new pattern. Choose familiar language that fits the roommate’s final line.'],
        examples: [
          { zh: '谢谢你，很高兴认识你！', py: 'Xièxie nǐ, hěn gāoxìng rènshi nǐ!', en: 'Thank you. Nice to meet you!' },
          { zh: '好的，谢谢你。麻烦你了。', py: 'Hǎo de, xièxie nǐ. Máfan nǐ le.', en: 'Okay, thank you. Sorry to trouble you.' },
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
        npcGlossary: ['新来的', '室友'],
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
            glossary: ['新来的', '室友'],
          },
          {
            id: 'B',
            zh: '对，我是。',
            py: 'Duì, wǒ shì.',
            en: 'Yes, I am.',
            rating: 'Stiff',
            score: 2,
            relationship: 2,
            explanation: 'Correct, but too short for a first meeting. It sounds cold rather than friendly.',
            correction: '你好，对，我是新来的室友。',
            correctionPy: 'Nǐ hǎo, duì, wǒ shì xīn lái de shìyǒu.',
            correctionEn: 'Hi, yes, I’m the new roommate.',
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
            correctionPy: 'Wǒ shì xīn lái de shìyǒu.',
            correctionEn: 'I’m the new roommate.',
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
            correctionPy: 'Nǐ hǎo, duì, wǒ shì xīn lái de shìyǒu.',
            correctionEn: 'Hi, yes, I’m the new roommate.',
            glossary: ['新来的', '室友'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Introduce your name and respond warmly.',
        npc: 'Roommate',
        npcLineZh: '我叫李明，你呢？',
        npcLinePy: 'Wǒ jiào Lǐ Míng, nǐ ne?',
        npcLineEn: 'My name is Li Ming. What about you?',
        npcGlossary: ['我叫'],
        options: [
          {
            id: 'A',
            zh: '我叫 Alex，很高兴认识你。',
            py: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.',
            en: 'My name is Alex. Nice to meet you.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and friendly. It gives your name and adds an appropriate first-meeting phrase.',
            correction: null,
            glossary: ['我叫', '很高兴认识你'],
          },
          {
            id: 'B',
            zh: '我叫 Alex。',
            py: 'Wǒ jiào Alex.',
            en: 'My name is Alex.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct, but brief. Adding 很高兴认识你 makes the first meeting warmer.',
            correction: '我叫 Alex，很高兴认识你。',
            correctionPy: 'Wǒ jiào Alex, hěn gāoxìng rènshi nǐ.',
            correctionEn: 'My name is Alex. Nice to meet you.',
            glossary: ['我叫'],
          },
          {
            id: 'C',
            zh: '我是叫 Alex。',
            py: 'Wǒ shì jiào Alex.',
            en: 'I am called Alex.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'This follows English-style structure. Chinese normally says 我叫 Alex, without 是.',
            correction: '我叫 Alex。',
            correctionPy: 'Wǒ jiào Alex.',
            correctionEn: 'My name is Alex.',
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
            explanation: 'The sentence is missing the verb 叫.',
            correction: '我叫 Alex。',
            correctionPy: 'Wǒ jiào Alex.',
            correctionEn: 'My name is Alex.',
            glossary: [],
          },
        ],
      },
      {
        id: 3,
        mission: 'Say where you are from and describe your Chinese ability.',
        npc: 'Roommate',
        npcLineZh: '你是哪国人？中文说得怎么样？',
        npcLinePy: 'Nǐ shì nǎ guó rén? Zhōngwén shuō de zěnmeyàng?',
        npcLineEn: 'Where are you from? How well do you speak Chinese?',
        npcGlossary: ['哪国人', '中文', '说得怎么样'],
        options: [
          {
            id: 'A',
            zh: '我是美国人。我会说一点中文，不过说得不太好。',
            py: 'Wǒ shì Měiguó rén. Wǒ huì shuō yìdiǎn Zhōngwén, búguò shuō de bú tài hǎo.',
            en: 'I’m American. I can speak a little Chinese, but not very well.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and complete. It answers both questions clearly and sounds realistic for a learner.',
            correction: null,
            glossary: ['会说一点', '中文', '说得不太好'],
          },
          {
            id: 'B',
            zh: '我是美国人。我会一点中文。',
            py: 'Wǒ shì Měiguó rén. Wǒ huì yìdiǎn Zhōngwén.',
            en: 'I’m American. I know a little Chinese.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Understandable, but 我会说一点中文 sounds more natural than 我会一点中文.',
            correction: '我是美国人。我会说一点中文。',
            correctionPy: 'Wǒ shì Měiguó rén. Wǒ huì shuō yìdiǎn Zhōngwén.',
            correctionEn: 'I’m American. I can speak a little Chinese.',
            glossary: ['中文'],
          },
          {
            id: 'C',
            zh: '我来自美国人，我中文一点会。',
            py: 'Wǒ láizì Měiguó rén, wǒ Zhōngwén yìdiǎn huì.',
            en: 'I come from American person, I Chinese a little can.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'This combines 来自美国人 with English-like word order.',
            correction: '我是美国人。我会说一点中文。',
            correctionPy: 'Wǒ shì Měiguó rén. Wǒ huì shuō yìdiǎn Zhōngwén.',
            correctionEn: 'I’m American. I can speak a little Chinese.',
            glossary: ['中文'],
          },
          {
            id: 'D',
            zh: '我是美国中文。',
            py: 'Wǒ shì Měiguó Zhōngwén.',
            en: 'I am America Chinese.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'Nationality and language ability must be expressed separately.',
            correction: '我是美国人。我会说一点中文。',
            correctionPy: 'Wǒ shì Měiguó rén. Wǒ huì shuō yìdiǎn Zhōngwén.',
            correctionEn: 'I’m American. I can speak a little Chinese.',
            glossary: ['中文'],
          },
        ],
      },
      {
        id: 4,
        mission: 'Explain that you just moved in and are not familiar with the apartment yet.',
        npc: 'Roommate',
        npcLineZh: '你今天刚搬来吗？',
        npcLinePy: 'Nǐ jīntiān gāng bān lái ma?',
        npcLineEn: 'Did you just move in today?',
        npcGlossary: ['刚搬来'],
        options: [
          {
            id: 'A',
            zh: '对，我今天刚搬来，对这里还不太熟悉。',
            py: 'Duì, wǒ jīntiān gāng bān lái, duì zhèlǐ hái bú tài shúxī.',
            en: 'Yes, I just moved in today, so I’m still not very familiar with this place.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and useful. It answers the question and explains why you may need help.',
            correction: null,
            glossary: ['刚搬来', '不太熟悉'],
          },
          {
            id: 'B',
            zh: '对，我今天刚搬来。',
            py: 'Duì, wǒ jīntiān gāng bān lái.',
            en: 'Yes, I just moved in today.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct, but it does not explain that the place is still unfamiliar.',
            correction: '对，我今天刚搬来，对这里还不太熟悉。',
            correctionPy: 'Duì, wǒ jīntiān gāng bān lái, duì zhèlǐ hái bú tài shúxī.',
            correctionEn: 'Yes, I just moved in today, so I’m still not very familiar with this place.',
            glossary: ['刚搬来'],
          },
          {
            id: 'C',
            zh: '对，我今天来搬，还是不熟悉这里。',
            py: 'Duì, wǒ jīntiān lái bān, háishi bù shúxī zhèlǐ.',
            en: 'Yes, I come move today and still unfamiliar here.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The meaning is guessable, but 来搬 and the word order are not natural here.',
            correction: '对，我今天刚搬来，对这里还不太熟悉。',
            correctionPy: 'Duì, wǒ jīntiān gāng bān lái, duì zhèlǐ hái bú tài shúxī.',
            correctionEn: 'Yes, I just moved in today, so I’m still not very familiar with this place.',
            glossary: [],
          },
          {
            id: 'D',
            zh: '我不是今天，我是美国人。',
            py: 'Wǒ bú shì jīntiān, wǒ shì Měiguó rén.',
            en: 'I am not today. I am American.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This does not answer whether you just moved in.',
            correction: '对，我今天刚搬来。',
            correctionPy: 'Duì, wǒ jīntiān gāng bān lái.',
            correctionEn: 'Yes, I just moved in today.',
            glossary: [],
          },
        ],
      },
      {
        id: 5,
        mission: 'Accept your roommate’s offer to help.',
        npc: 'Roommate',
        npcLineZh: '需要我带你看看吗？',
        npcLinePy: 'Xūyào wǒ dài nǐ kànkan ma?',
        npcLineEn: 'Would you like me to show you around?',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '好啊，麻烦你了。我们一起看看吧。',
            py: 'Hǎo a, máfan nǐ le. Wǒmen yìqǐ kànkan ba.',
            en: 'Sure. Sorry to trouble you. Let’s take a look together.',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'Natural and warm. It accepts the offer, acknowledges the help, and suggests doing it together.',
            correction: null,
            glossary: ['麻烦你了', '一起'],
          },
          {
            id: 'B',
            zh: '好，你带我看看。',
            py: 'Hǎo, nǐ dài wǒ kànkan.',
            en: 'Okay, show me around.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Understandable, but direct. 麻烦你了 makes the request more considerate.',
            correction: '好啊，麻烦你了。我们一起看看吧。',
            correctionPy: 'Hǎo a, máfan nǐ le. Wǒmen yìqǐ kànkan ba.',
            correctionEn: 'Sure. Sorry to trouble you. Let’s take a look together.',
            glossary: [],
          },
          {
            id: 'C',
            zh: '好，我们看一起，麻烦。',
            py: 'Hǎo, wǒmen kàn yìqǐ, máfan.',
            en: 'Okay, we look together, trouble.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The intended meaning is visible, but 一起 and 麻烦 are not placed naturally.',
            correction: '好啊，麻烦你了。我们一起看看吧。',
            correctionPy: 'Hǎo a, máfan nǐ le. Wǒmen yìqǐ kànkan ba.',
            correctionEn: 'Sure. Sorry to trouble you. Let’s take a look together.',
            glossary: [],
          },
          {
            id: 'D',
            zh: '不用了，我不住这里。',
            py: 'Bú yòng le, wǒ bú zhù zhèlǐ.',
            en: 'No need. I don’t live here.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This contradicts the fact that you are the new roommate.',
            correction: '好啊，麻烦你带我看看吧。',
            correctionPy: 'Hǎo a, máfan nǐ dài wǒ kànkan ba.',
            correctionEn: 'Sure, please show me around.',
            glossary: [],
          },
        ],
      },
      {
        id: 6,
        mission: 'Close the first meeting naturally or repair the interaction.',
        npc: 'Roommate',
        npcLineZh: '没问题，我带你看看。欢迎你搬进来！',
        npcLinePy: 'Méi wèntí, wǒ dài nǐ kànkan. Huānyíng nǐ bān jìnlái!',
        npcLineEn: 'No problem. I’ll show you around. Welcome to the apartment!',
        npcGlossary: [],
        options: CHAPTER1_BRANCH_NODES.decision6.strong.options,
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
            relationship: 3,
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
            relationship: -10,
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
            relationship: -8,
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
            relationship: 3,
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
            relationship: 3,
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
            relationship: -5,
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
            relationship: 12,
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
            relationship: -10,
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
            relationship: -10,
            explanation: 'You repeated the waiter’s question instead of answering it and asking about payment.',
            correction: '要打包。可以刷卡吗？',
            glossary: ['打包'],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter4',
    label: 'Chapter 4',
    shortTitle: 'Ask for Directions',
    title: 'Ask for Directions Without Sounding Lost',
    subtitle: 'Ask where to go, confirm directions, and respond politely.',
    level: 'HSK 2–3',
    icon: Compass,
    scene: 'Street / Subway Station',
    goals: [
      'Ask for directions politely',
      'Ask how to get somewhere',
      'Confirm directions when you did not hear clearly',
      'Thank someone naturally after receiving help',
    ],
    grammarNotes: [
      {
        id: 'kanqilai-state',
        title: 'How 看起来 works',
        short: '看起来 means “looks / seems” when you guess from what you see.',
        body: [
          '看起来 is used when you judge from appearance.',
          'The common pattern is: person / thing + 看起来 + adjective or state.',
          'In 你看起来迷路了, the speaker sees the situation and guesses “you look lost.”',
        ],
        examples: [
          { zh: '你看起来很累。', py: 'Nǐ kàn qǐlái hěn lèi.', en: 'You look tired.' },
          { zh: '你看起来迷路了。', py: 'Nǐ kàn qǐlái mílù le.', en: 'You look lost.' },
        ],
      },
      {
        id: 'zenme-zou',
        title: 'How 怎么走 works',
        short: '怎么走 asks for the route to a place.',
        body: [
          '怎么走 literally uses 走, but in real use it asks how to get somewhere.',
          'Put the place before 怎么走.',
          'A useful pattern is: 去 + place + 怎么走？',
        ],
        examples: [
          { zh: '去地铁站怎么走？', py: 'Qù dìtiězhàn zěnme zǒu?', en: 'How do I get to the subway station?' },
          { zh: '去咖啡店怎么走？', py: 'Qù kāfēidiàn zěnme zǒu?', en: 'How do I get to the café?' },
        ],
      },
      {
        id: 'yihou-jiu-result',
        title: 'How 以后就…… works in directions',
        short: 'Action + 以后 + 就 + result means after one step, the result happens.',
        body: [
          '以后 means “after” when it comes after an action.',
          '就 often marks the next expected result.',
          'In directions, Action + 以后 + 就 + result means “after you do this, then you will reach the result.”',
          '左转以后就到了 means “After you turn left, you’ll be there.”',
          'Do not over-explain 了 here. For learners, treat 就到了 as a useful chunk meaning “then you’ll be there.”',
        ],
        examples: [
          { zh: '左转以后就到了。', py: 'Zuǒ zhuǎn yǐhòu jiù dào le.', en: 'After you turn left, you’ll be there.' },
          { zh: '到路口以后，就右转。', py: 'Dào lùkǒu yǐhòu, jiù yòu zhuǎn.', en: 'After you reach the intersection, then turn right.' },
        ],
      },
      {
        id: 'confirm-directions',
        title: 'How to ask someone to repeat directions',
        short: '不好意思，我没听清楚。可以再说一遍吗？ is polite and useful.',
        body: [
          'When you do not understand directions, do not just say 听不懂.',
          'Start with 不好意思 to make the request softer.',
          '我没听清楚 explains the problem.',
          '可以再说一遍吗 asks the other person to repeat politely.',
        ],
        examples: [
          { zh: '不好意思，我没听清楚。可以再说一遍吗？', py: 'Bù hǎoyìsi, wǒ méi tīng qīngchu. Kěyǐ zài shuō yí biàn ma?', en: 'Sorry, I did not hear clearly. Could you say it again?' },
          { zh: '不好意思，可以说慢一点吗？', py: 'Bù hǎoyìsi, kěyǐ shuō màn yìdiǎn ma?', en: 'Sorry, could you speak a little more slowly?' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Ask politely how to get to the subway station.',
        npc: 'Passerby',
        npcLineZh: '你好，你看起来迷路了。需要帮忙吗？',
        npcLinePy: 'Nǐ hǎo, nǐ kàn qǐlái mílù le. Xūyào bāngmáng ma?',
        npcLineEn: 'Hi, you look lost. Do you need help?',
        npcGlossary: ['看起来', '迷路了'],
        options: [
          {
            id: 'A',
            zh: '不好意思，请问地铁站怎么走？',
            py: 'Bù hǎoyìsi, qǐngwèn dìtiězhàn zěnme zǒu?',
            en: 'Excuse me, how do I get to the subway station?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and polite. It uses 不好意思 and 请问 before asking for directions.',
            correction: null,
            glossary: ['请问', '地铁站', '怎么走'],
          },
          {
            id: 'B',
            zh: '地铁站在哪儿？',
            py: 'Dìtiězhàn zài nǎr?',
            en: 'Where is the subway station?',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct and understandable, but a little direct. 请问 makes it more polite when asking a stranger.',
            correction: '请问，地铁站怎么走？',
            glossary: ['地铁站'],
          },
          {
            id: 'C',
            zh: '我去地铁站怎么你告诉我。',
            py: 'Wǒ qù dìtiězhàn zěnme nǐ gàosu wǒ.',
            en: 'I go subway station how you tell me.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The meaning is guessable, but the word order is not natural Chinese.',
            correction: '请问，地铁站怎么走？',
            glossary: ['地铁站'],
          },
          {
            id: 'D',
            zh: '你去地铁站吗？',
            py: 'Nǐ qù dìtiězhàn ma?',
            en: 'Are you going to the subway station?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This asks whether the other person is going there. It does not ask for directions.',
            correction: '请问，地铁站怎么走？',
            glossary: ['地铁站'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Respond when the person gives directions but you did not hear clearly.',
        npc: 'Passerby',
        npcLineZh: '地铁站不远。你一直走，然后在前面左转。',
        npcLinePy: 'Dìtiězhàn bù yuǎn. Nǐ yìzhí zǒu, ránhòu zài qiánmiàn zuǒ zhuǎn.',
        npcLineEn: 'The subway station is not far. Go straight, then turn left ahead.',
        npcGlossary: ['地铁站', '不远', '一直走', '前面', '左转'],
        options: [
          {
            id: 'A',
            zh: '不好意思，我没听清楚。可以再说一遍吗？',
            py: 'Bù hǎoyìsi, wǒ méi tīng qīngchu. Kěyǐ zài shuō yí biàn ma?',
            en: 'Sorry, I did not hear clearly. Could you say it again?',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'Natural and polite. It explains the problem and asks for repetition softly.',
            correction: null,
            glossary: ['没听清楚', '再说一遍'],
          },
          {
            id: 'B',
            zh: '请再说一遍。',
            py: 'Qǐng zài shuō yí biàn.',
            en: 'Please say it again.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct, but it sounds a little direct. Adding 不好意思 and 我没听清楚 makes it more natural.',
            correction: '不好意思，我没听清楚。可以再说一遍吗？',
            glossary: ['再说一遍'],
          },
          {
            id: 'C',
            zh: '我听不懂，你说慢。',
            py: 'Wǒ tīng bù dǒng, nǐ shuō màn.',
            en: 'I do not understand. You speak slow.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The meaning is understandable, but it sounds blunt and incomplete.',
            correction: '不好意思，可以说慢一点吗？',
            glossary: [],
          },
          {
            id: 'D',
            zh: '地铁站多少钱？',
            py: 'Dìtiězhàn duōshao qián?',
            en: 'How much is the subway station?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This asks about price, not directions or repetition.',
            correction: '不好意思，我没听清楚。可以再说一遍吗？',
            glossary: ['地铁站'],
          },
        ],
      },
      {
        id: 3,
        mission: 'Confirm the directions and thank the person naturally.',
        npc: 'Passerby',
        npcLineZh: '一直走，左转以后就到了。',
        npcLinePy: 'Yìzhí zǒu, zuǒ zhuǎn yǐhòu jiù dào le.',
        npcLineEn: 'Go straight. After you turn left, you’ll be there.',
        npcGlossary: ['一直走', '左转', '以后', '到'],
        options: [
          {
            id: 'A',
            zh: '好的，我先一直走，然后左转。谢谢你！',
            py: 'Hǎo de, wǒ xiān yìzhí zǒu, ránhòu zuǒ zhuǎn. Xièxie nǐ!',
            en: 'Okay, I’ll go straight first, then turn left. Thank you!',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'Natural and useful. You confirm the route and thank the person.',
            correction: null,
            glossary: ['一直走', '左转'],
          },
          {
            id: 'B',
            zh: '好，谢谢。',
            py: 'Hǎo, xièxie.',
            en: 'Okay, thanks.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct, but very short. Confirming the route shows you understood.',
            correction: '好的，我先一直走，然后左转。谢谢你！',
            glossary: [],
          },
          {
            id: 'C',
            zh: '我走一直，然后左边转，谢谢。',
            py: 'Wǒ zǒu yìzhí, ránhòu zuǒbian zhuǎn, xièxie.',
            en: 'I walk straightly, then left side turn, thanks.',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The words are close, but the direction phrases are not natural Chinese.',
            correction: '我先一直走，然后左转。谢谢你！',
            glossary: ['一直走', '左转'],
          },
          {
            id: 'D',
            zh: '你一直走，左转以后就到了。',
            py: 'Nǐ yìzhí zǒu, zuǒ zhuǎn yǐhòu jiù dào le.',
            en: 'You go straight, then turn left and you will arrive.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This repeats the directions back with 你, so it sounds like you are giving directions to the other person.',
            correction: '我先一直走，然后左转。谢谢你！',
            glossary: ['一直走', '左转', '以后', '到'],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter5',
    label: 'Chapter 5',
    shortTitle: 'Shopping & Price',
    title: 'Shop and Talk About Price Naturally',
    subtitle: 'Ask prices, respond to discounts, and handle payment politely.',
    level: 'HSK 2–3',
    icon: Sparkles,
    scene: 'Small Shop / Market',
    goals: [
      'Ask how much something costs',
      'Respond naturally when something is expensive',
      'Ask to see another option',
      'Ask whether you can pay by card or cash',
    ],
    grammarNotes: [
      {
        id: 'duoshao-qian',
        title: 'How to ask prices with 多少钱',
        short: '多少钱 is the basic shopping question for price.',
        body: [
          '多少钱 asks how much something costs.',
          'The simple pattern is: item + 多少钱？',
          'To sound more polite, add 请问 before the question.',
        ],
        examples: [
          { zh: '这个多少钱？', py: 'Zhège duōshao qián?', en: 'How much is this?' },
          { zh: '请问，这个包多少钱？', py: 'Qǐngwèn, zhège bāo duōshao qián?', en: 'Excuse me, how much is this bag?' },
        ],
      },
      {
        id: 'yidianr-shopping',
        title: '有点儿贵 vs 便宜一点',
        short: '有点儿 + Adj describes a feeling; Adj + 一点儿 asks for or compares a small change.',
        body: [
          '有点儿 + adjective describes how something feels now.',
          '有点儿贵 means “it is a little expensive.”',
          '太 + adjective + 了 is stronger. 太贵了 means “too expensive.”',
          'Adjective + 一点儿 means “a little more in that direction.”',
          '便宜一点 means “a little cheaper,” often used when asking for a lower price or comparing options.',
          'Do not teach 有点儿太贵了 as the main learner pattern. It can appear in casual speech, but 有点儿贵 or 太贵了 is clearer for learners.',
        ],
        examples: [
          { zh: '有点儿贵，我想看看别的。', py: 'Yǒudiǎnr guì, wǒ xiǎng kànkan bié de.', en: 'It is a little expensive. I want to look at something else.' },
          { zh: '可以便宜一点吗？', py: 'Kěyǐ piányi yìdiǎn ma?', en: 'Can it be a little cheaper?' },
        ],
      },
      {
        id: 'kankan-soft-action',
        title: 'Why 看看 sounds softer than 看',
        short: 'Verb reduplication can make an action feel lighter or more casual.',
        body: [
          '看看 means “take a look.”',
          'It sounds lighter and softer than just 看.',
          'In shopping, 我想看看别的 sounds more natural than a blunt direct rejection.',
        ],
        examples: [
          { zh: '我想看看别的。', py: 'Wǒ xiǎng kànkan bié de.', en: 'I want to look at something else.' },
          { zh: '我先看看。', py: 'Wǒ xiān kànkan.', en: 'I will take a look first.' },
        ],
      },
      {
        id: 'payment-choice',
        title: 'How to ask about payment',
        short: '可以刷卡吗？ and 可以付现金吗？ are practical payment questions.',
        body: [
          '可以 + verb + 吗 asks whether something is allowed or possible.',
          '可以刷卡吗 means “Can I pay by card?”',
          '可以付现金吗 means “Can I pay cash?”',
          '刷卡还是现金？ is a common choice question.',
        ],
        examples: [
          { zh: '可以刷卡吗？', py: 'Kěyǐ shuākǎ ma?', en: 'Can I pay by card?' },
          { zh: '刷卡还是现金？', py: 'Shuākǎ háishi xiànjīn?', en: 'Card or cash?' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Ask politely how much the bag costs.',
        npc: 'Shopkeeper',
        npcLineZh: '这个包今天打折，你可以看看。',
        npcLinePy: 'Zhège bāo jīntiān dǎzhé, nǐ kěyǐ kànkan.',
        npcLineEn: 'This bag is discounted today. You can take a look.',
        npcGlossary: ['打折'],
        options: [
          {
            id: 'A',
            zh: '请问，这个包多少钱？',
            py: 'Qǐngwèn, zhège bāo duōshao qián?',
            en: 'Excuse me, how much is this bag?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and polite. 请问 makes the price question sound softer.',
            correction: null,
            glossary: ['多少钱'],
          },
          {
            id: 'B',
            zh: '这个多少钱？',
            py: 'Zhège duōshao qián?',
            en: 'How much is this?',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct and useful, but a little plain. 请问 makes it more polite in a shop.',
            correction: '请问，这个包多少钱？',
            glossary: ['多少钱'],
          },
          {
            id: 'C',
            zh: '这个包钱多少是？',
            py: 'Zhège bāo qián duōshao shì?',
            en: 'This bag money how much is?',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The meaning is guessable, but the word order is not natural Chinese.',
            correction: '这个包多少钱？',
            glossary: ['多少钱'],
          },
          {
            id: 'D',
            zh: '你多少钱？',
            py: 'Nǐ duōshao qián?',
            en: 'How much are you?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This asks about the person, not the item. In shopping, put the item before 多少钱.',
            correction: '这个包多少钱？',
            glossary: ['多少钱'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Say the price is too expensive and ask to look at something else.',
        npc: 'Shopkeeper',
        npcLineZh: '打折以后，三百八十块。',
        npcLinePy: 'Dǎzhé yǐhòu, sānbǎi bāshí kuài.',
        npcLineEn: 'After the discount, it is 380 yuan.',
        npcGlossary: ['打折'],
        options: [
          {
            id: 'A',
            zh: '有点儿贵，我想看看别的。',
            py: 'Yǒudiǎnr guì, wǒ xiǎng kànkan bié de.',
            en: 'It is a little expensive. I want to look at something else.',
            rating: 'Natural',
            score: 3,
            relationship: 13,
            explanation: 'Natural and socially comfortable. 有点儿贵 sounds softer than 太贵了, and 我想看看别的 moves to another option politely.',
            correction: null,
            glossary: ['有点儿', '看看别的'],
          },
          {
            id: 'B',
            zh: '太贵了。',
            py: 'Tài guì le.',
            en: 'Too expensive.',
            rating: 'Stiff',
            score: 2,
            relationship: 2,
            explanation: 'Correct, but blunt if said by itself. 太贵了 sounds like a strong reaction, so adding a softer next step sounds better.',
            correction: '有点儿贵，我想看看别的。',
            glossary: ['太贵了', '看看别的'],
          },
          {
            id: 'C',
            zh: '这个很多钱，我不要这个。',
            py: 'Zhège hěn duō qián, wǒ bú yào zhège.',
            en: 'This is much money. I do not want this.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The listener can understand, but it sounds patched together and too direct.',
            correction: '有点儿贵，我想看看别的。',
            glossary: [],
          },
          {
            id: 'D',
            zh: '这个多少钱？',
            py: 'Zhège duōshao qián?',
            en: 'How much is this?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'The seller already told you the price. Now you need to respond to the price.',
            correction: '有点儿贵，我想看看别的。',
            glossary: ['多少钱'],
          },
        ],
      },
      {
        id: 3,
        mission: 'Accept the cheaper option and ask whether you can pay by card.',
        npc: 'Shopkeeper',
        npcLineZh: '这个便宜一点，两百八十块。',
        npcLinePy: 'Zhège piányi yìdiǎn, liǎngbǎi bāshí kuài.',
        npcLineEn: 'This one is a little cheaper, 280 yuan.',
        npcGlossary: ['便宜一点'],
        options: [
          {
            id: 'A',
            zh: '好的，我要这个。可以刷卡吗？',
            py: 'Hǎo de, wǒ yào zhège. Kěyǐ shuākǎ ma?',
            en: 'Okay, I’ll take this one. Can I pay by card?',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and practical. It confirms the purchase and asks about payment clearly.',
            correction: null,
            glossary: ['刷卡'],
          },
          {
            id: 'B',
            zh: '我要这个。刷卡。',
            py: 'Wǒ yào zhège. Shuākǎ.',
            en: 'I want this. Card.',
            rating: 'Stiff',
            score: 2,
            relationship: 2,
            explanation: 'Understandable, but too abrupt. 可以刷卡吗 sounds more polite.',
            correction: '我要这个。可以刷卡吗？',
            glossary: ['刷卡'],
          },
          {
            id: 'C',
            zh: '我买这个，可以卡刷吗？',
            py: 'Wǒ mǎi zhège, kěyǐ kǎ shuā ma?',
            en: 'I buy this, can card swipe?',
            rating: 'Awkward',
            score: 1,
            relationship: -4,
            explanation: 'The meaning is guessable, but 刷卡 is a fixed word and should not be reversed.',
            correction: '我要这个。可以刷卡吗？',
            glossary: ['刷卡'],
          },
          {
            id: 'D',
            zh: '你可以刷卡吗？',
            py: 'Nǐ kěyǐ shuākǎ ma?',
            en: 'Can you pay by card?',
            rating: 'Incorrect',
            score: 0,
            relationship: -8,
            explanation: 'This asks whether the shopkeeper can pay by card. You need to ask whether you can pay by card.',
            correction: '可以刷卡吗？',
            glossary: ['刷卡'],
          },
        ],
      },
    ],
  },
  {
    id: 'chapter6',
    label: 'Chapter 6',
    shortTitle: 'Asking for Help',
    title: 'Ask for Help Without Sounding Rude',
    subtitle: 'Explain a small problem, ask for help, and thank someone naturally.',
    level: 'HSK 2–3',
    icon: Heart,
    scene: 'Public Place / Small Emergency',
    goals: [
      'Ask for help politely',
      'Explain that your phone is out of battery',
      'Say you cannot find something',
      'Thank someone naturally after receiving help',
    ],
    grammarNotes: [
      {
        id: 'soft-help-request',
        title: 'How to ask for help politely',
        short: '可以帮我一下吗？ is softer than only saying 帮我.',
        body: [
          '可以 + verb + 吗 asks whether something is possible or allowed.',
          '帮我一下 means “help me for a moment.”',
          '一下 makes the request feel lighter and less demanding.',
          '不好意思 before the request makes it even more polite.',
        ],
        examples: [
          { zh: '不好意思，可以帮我一下吗？', py: 'Bù hǎoyìsi, kěyǐ bāng wǒ yíxià ma?', en: 'Excuse me, could you help me for a moment?' },
          { zh: '麻烦你帮我一下。', py: 'Máfan nǐ bāng wǒ yíxià.', en: 'Sorry to trouble you, please help me for a moment.' },
        ],
      },
      {
        id: 'mei-dian-le',
        title: 'How 没电了 works',
        short: '没电了 means something has run out of battery.',
        body: [
          '没电 means there is no battery or power.',
          '了 shows a changed situation.',
          '我的手机没电了 means the phone had battery before, but now it does not.',
          'Treat 没电了 as a useful everyday chunk.',
        ],
        examples: [
          { zh: '我的手机没电了。', py: 'Wǒ de shǒujī méi diàn le.', en: 'My phone is out of battery.' },
          { zh: '手机快没电了。', py: 'Shǒujī kuài méi diàn le.', en: 'The phone is almost out of battery.' },
        ],
      },
      {
        id: 'zhao-bu-dao',
        title: 'How 找不到 works',
        short: '找不到 means you try to find something, but cannot find it.',
        body: [
          '找 means to look for.',
          '到 can show reaching or achieving a result.',
          '找不到 means “look but cannot reach the result of finding.”',
          'It is different from 没有. 没有 means “do not have”; 找不到 means “cannot find.”',
        ],
        examples: [
          { zh: '我找不到钱包。', py: 'Wǒ zhǎo bú dào qiánbāo.', en: 'I cannot find my wallet.' },
          { zh: '我没有钱包。', py: 'Wǒ méiyǒu qiánbāo.', en: 'I do not have a wallet.' },
        ],
      },
      {
        id: 'time-place-guo',
        title: 'Time + place + V过',
        short: 'Put the time first, then the place, then the past action with 过.',
        body: [
          'A clear order is: 半小时前 + 我在咖啡馆 + 买过东西。',
          'Time and place orient the listener before the action.',
          '过 marks an experience or action that happened before now.',
        ],
        examples: [
          { zh: '半小时前，我在咖啡馆买过东西。', py: 'Bàn ge xiǎoshí qián, wǒ zài kāfēiguǎn mǎi guo dōngxi.', en: 'Half an hour ago, I bought something at the café.' },
          { zh: '昨天，我在这里用过钱包。', py: 'Zuótiān, wǒ zài zhèlǐ yòng guo qiánbāo.', en: 'Yesterday, I used my wallet here.' },
        ],
      },
      {
        id: 'describe-object',
        title: 'Describe an object clearly',
        short: 'Give its appearance first, then identify what is inside.',
        body: [
          'Use 是一个 + size or color + noun to identify the object.',
          'Then use 里面有 to list details that can verify it.',
          'Two concrete details are usually more useful than a long description.',
        ],
        examples: [
          { zh: '是一个小黑色钱包。', py: 'Shì yí ge xiǎo hēisè qiánbāo.', en: 'It is a small black wallet.' },
          { zh: '里面有银行卡和身份证。', py: 'Lǐmiàn yǒu yínhángkǎ hé shēnfènzhèng.', en: 'There is a bank card and an ID inside.' },
        ],
      },
      {
        id: 'clarify-not-a',
        title: 'Use 不是A，是B to clarify',
        short: 'Reject the mistaken detail, then immediately give the correct one.',
        body: [
          '不是A identifies what the listener misunderstood.',
          '是B supplies the correct information without restarting the whole story.',
          'Keep the repair short so the conversation can move forward.',
        ],
        examples: [
          { zh: '不是手机，是钱包。', py: 'Bú shì shǒujī, shì qiánbāo.', en: 'It is not the phone; it is the wallet.' },
          { zh: '不是手机丢了，是钱包丢了。', py: 'Bú shì shǒujī diū le, shì qiánbāo diū le.', en: 'It is not the phone that is lost; it is the wallet.' },
        ],
      },
      {
        id: 'practical-next-step',
        title: 'Ask for the practical next step',
        short: 'Confirm the useful detail, then make one polite, actionable request.',
        body: [
          '确认 checks that the information matches the missing item.',
          '联系 or a polite request tells the staff what action would help next.',
          'If the item cannot be confirmed, a 失物登记表 records the details clearly.',
        ],
        examples: [
          { zh: '可以帮我联系一下吗？', py: 'Kěyǐ bāng wǒ liánxì yíxià ma?', en: 'Could you help me contact them?' },
          { zh: '好的，我先填写失物登记表。', py: 'Hǎo de, wǒ xiān tiánxiě shīwù dēngjìbiǎo.', en: 'Okay, I will fill out the lost-property form first.' },
        ],
      },
      {
        id: 'thank-after-help',
        title: 'How to thank someone after help',
        short: '太谢谢了 and 麻烦你了 make your thanks sound warmer and more natural.',
        body: [
          '谢谢 is correct, but sometimes too short after someone helps you.',
          '太谢谢了 sounds warmer and stronger.',
          '麻烦你了 shows you understand the other person spent effort helping you.',
          '太谢谢了，麻烦你了 is a useful polite closing after receiving help.',
        ],
        examples: [
          { zh: '太谢谢了，麻烦你了。', py: 'Tài xièxie le, máfan nǐ le.', en: 'Thank you so much. Sorry to trouble you.' },
          { zh: '找到了！太谢谢你了！', py: 'Zhǎo dào le! Tài xièxie nǐ le!', en: 'Found it! Thank you so much!' },
        ],
      },
    ],
    nodes: [
      {
        id: 1,
        mission: 'Explain that your wallet is missing, your phone is nearly out of battery, and ask for help.',
        npc: 'Staff',
        npcLineZh: '你好，你看起来很着急。需要帮忙吗？',
        npcLinePy: 'Nǐ hǎo, nǐ kàn qǐlái hěn zháojí. Xūyào bāngmáng ma?',
        npcLineEn: 'Hi, you look worried. Do you need help?',
        npcGlossary: ['看起来', '着急', '帮忙'],
        options: [
          {
            id: 'A',
            zh: '不好意思，我的钱包找不到了，手机也快没电了。可以帮我一下吗？',
            py: 'Bù hǎoyìsi, wǒ de qiánbāo zhǎo bú dào le, shǒujī yě kuài méi diàn le. Kěyǐ bāng wǒ yíxià ma?',
            en: 'Excuse me, I cannot find my wallet, and my phone is nearly out of battery. Could you help me?',
            rating: 'Natural',
            score: 3,
            relationship: 14,
            explanation: 'Natural and considerate. It explains both problems clearly and gives the staff a polite next step.',
            correction: null,
            glossary: ['钱包', '找不到', '手机', '没电了', '帮我一下'],
          },
          {
            id: 'B',
            zh: '我的钱包找不到了，手机快没电了。',
            py: 'Wǒ de qiánbāo zhǎo bú dào le, shǒujī kuài méi diàn le.',
            en: 'I cannot find my wallet, and my phone is nearly out of battery.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct and clear, but it leaves the staff to guess what help you want.',
            correction: '我的钱包找不到了，手机也快没电了。可以帮我一下吗？',
            glossary: ['钱包', '找不到', '手机', '没电了'],
          },
          {
            id: 'C',
            zh: '我的钱包没有找到，手机也没有电快了。',
            py: 'Wǒ de qiánbāo méiyǒu zhǎodào, shǒujī yě méiyǒu diàn kuài le.',
            en: 'My wallet has not found, and my phone also no battery soon.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The two problems are guessable, but the word order and result phrasing are unnatural.',
            correction: '我的钱包找不到了，手机也快没电了。可以帮我一下吗？',
            glossary: ['钱包', '手机'],
          },
          {
            id: 'D',
            zh: '你的钱包和手机在哪儿？',
            py: 'Nǐ de qiánbāo hé shǒujī zài nǎr?',
            en: 'Where are your wallet and phone?',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This asks about the staff member’s belongings instead of explaining your own problem.',
            correction: '我的钱包找不到了，手机也快没电了。可以帮我一下吗？',
            glossary: ['钱包', '手机'],
          },
        ],
      },
      {
        id: 2,
        mission: 'Explain when and where you last used the wallet.',
        npc: 'Staff',
        npcLineZh: '你最后一次看到钱包是什么时候？在哪里？',
        npcLinePy: 'Nǐ zuìhòu yí cì kàn dào qiánbāo shì shénme shíhou? Zài nǎli?',
        npcLineEn: 'When and where did you last see your wallet?',
        npcGlossary: [],
        options: [
          {
            id: 'A',
            zh: '大概半小时前，我在那边的咖啡馆买过东西。',
            py: 'Dàgài bàn ge xiǎoshí qián, wǒ zài nàbiān de kāfēiguǎn mǎi guo dōngxi.',
            en: 'About half an hour ago, I bought something at the café over there.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and specific. It gives both a useful time and location.',
            correction: null,
            glossary: [],
          },
          {
            id: 'B',
            zh: '半小时前，在咖啡馆。',
            py: 'Bàn ge xiǎoshí qián, zài kāfēiguǎn.',
            en: 'Half an hour ago, at the café.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Understandable and useful, but it is a clipped answer rather than a complete sentence.',
            correction: '大概半小时前，我在那边的咖啡馆买过东西。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '我看钱包在咖啡馆半小时前。',
            py: 'Wǒ kàn qiánbāo zài kāfēiguǎn bàn ge xiǎoshí qián.',
            en: 'I see wallet at café half an hour ago.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The listener can recover the meaning, but the time and location are arranged unnaturally.',
            correction: '半小时前，我在咖啡馆看到过钱包。',
            glossary: ['钱包'],
          },
          {
            id: 'D',
            zh: '我现在想喝咖啡。',
            py: 'Wǒ xiànzài xiǎng hē kāfēi.',
            en: 'I want to drink coffee now.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This mentions coffee but does not answer when or where you last saw the wallet.',
            correction: '半小时前，我在咖啡馆用过钱包。',
            glossary: [],
          },
        ],
      },
      {
        id: 3,
        mission: 'Describe the wallet clearly enough for the staff to identify it.',
        npc: 'Staff',
        npcLineZh: '钱包是什么样的？里面有什么？',
        npcLinePy: 'Qiánbāo shì shénme yàng de? Lǐmiàn yǒu shénme?',
        npcLineEn: 'What does the wallet look like? What is inside it?',
        npcGlossary: ['钱包'],
        options: [
          {
            id: 'A',
            zh: '是一个小黑色钱包，里面有银行卡和身份证。',
            py: 'Shì yí ge xiǎo hēisè qiánbāo, lǐmiàn yǒu yínhángkǎ hé shēnfènzhèng.',
            en: 'It is a small black wallet with a bank card and ID inside.',
            rating: 'Natural',
            score: 3,
            relationship: 12,
            explanation: 'Natural and precise. The color, size, and contents make the wallet easy to identify.',
            correction: null,
            glossary: ['钱包'],
          },
          {
            id: 'B',
            zh: '黑色的，里面有银行卡。',
            py: 'Hēisè de, lǐmiàn yǒu yínhángkǎ.',
            en: 'Black, with a bank card inside.',
            rating: 'Stiff',
            score: 2,
            relationship: 3,
            explanation: 'Correct and useful, but brief and less complete than the staff requested.',
            correction: '是一个小黑色钱包，里面有银行卡。',
            glossary: [],
          },
          {
            id: 'C',
            zh: '钱包黑色小，银行卡在里面有。',
            py: 'Qiánbāo hēisè xiǎo, yínhángkǎ zài lǐmiàn yǒu.',
            en: 'Wallet black small, bank card inside has.',
            rating: 'Awkward',
            score: 1,
            relationship: -5,
            explanation: 'The details are present, but the word order makes identification harder.',
            correction: '钱包是黑色的，里面有银行卡。',
            glossary: ['钱包'],
          },
          {
            id: 'D',
            zh: '我的手机是白色的。',
            py: 'Wǒ de shǒujī shì báisè de.',
            en: 'My phone is white.',
            rating: 'Incorrect',
            score: 0,
            relationship: -10,
            explanation: 'This describes the phone instead of the missing wallet.',
            correction: '我的钱包是黑色的，里面有银行卡。',
            glossary: ['手机', '钱包'],
          },
        ],
      },
      {
        id: 4,
        mission: 'Confirm that the café is the likely location and ask the staff to contact it.',
        npc: 'Staff',
        npcLineZh: '你是说钱包可能落在咖啡馆了，对吗？',
        npcLinePy: 'Nǐ shì shuō qiánbāo kěnéng là zài kāfēiguǎn le, duì ma?',
        npcLineEn: 'You mean the wallet may have been left at the café, right?',
        npcGlossary: ['钱包'],
        options: [
          { id: 'A', zh: '对，我可能把钱包落在那里了。可以帮我联系一下咖啡馆吗？', py: 'Duì, wǒ kěnéng bǎ qiánbāo là zài nàli le. Kěyǐ bāng wǒ liánxì yíxià kāfēiguǎn ma?', en: 'Yes, I may have left it there. Could you help me contact the café?', rating: 'Natural', score: 3, relationship: 14, explanation: 'Natural and cooperative. It confirms the likely location and asks for a practical next step.', correction: null, glossary: ['钱包'] },
          { id: 'B', zh: '对，可能在咖啡馆。', py: 'Duì, kěnéng zài kāfēiguǎn.', en: 'Yes, it may be at the café.', rating: 'Stiff', score: 2, relationship: 3, explanation: 'Correct, but the staff still has to decide what action to take.', correction: '对，可能在咖啡馆。可以帮我联系一下吗？', glossary: [] },
          { id: 'C', zh: '对，钱包可能忘记咖啡馆。', py: 'Duì, qiánbāo kěnéng wàngjì kāfēiguǎn.', en: 'Yes, wallet maybe forgot café.', rating: 'Awkward', score: 1, relationship: -5, explanation: 'The meaning is recoverable, but 落在 or 忘在 is needed for leaving an object somewhere.', correction: '对，我可能把钱包忘在咖啡馆了。', glossary: ['钱包'] },
          { id: 'D', zh: '不是，我的手机在咖啡馆。', py: 'Bú shì, wǒ de shǒujī zài kāfēiguǎn.', en: 'No, my phone is at the café.', rating: 'Incorrect', score: 0, relationship: -10, explanation: 'This changes the missing item and sends the conversation in the wrong direction.', correction: '对，我的钱包可能在咖啡馆。', glossary: ['手机', '钱包'] },
        ],
      },
      {
        id: 5,
        mission: 'Respond to the café search result and provide the next information needed.',
        npc: 'Staff',
        npcLineZh: '咖啡馆找到一个黑色钱包，不过需要你确认里面的东西。',
        npcLinePy: 'Kāfēiguǎn zhǎo dào yí ge hēisè qiánbāo, búguò xūyào nǐ quèrèn lǐmiàn de dōngxi.',
        npcLineEn: 'The café found a black wallet, but they need you to confirm what is inside.',
        npcGlossary: ['钱包'],
        options: [
          { id: 'A', zh: '里面有一张银行卡和我的身份证，我可以再说明详细一点。', py: 'Lǐmiàn yǒu yì zhāng yínhángkǎ hé wǒ de shēnfènzhèng, wǒ kěyǐ zài shuōmíng xiángxì yìdiǎn.', en: 'There is a bank card and my ID inside. I can give more detail.', rating: 'Natural', score: 3, relationship: 12, explanation: 'Natural and helpful. It gives identifying details and offers to cooperate further.', correction: null, glossary: [] },
          { id: 'B', zh: '有银行卡和身份证。', py: 'Yǒu yínhángkǎ hé shēnfènzhèng.', en: 'There is a bank card and ID.', rating: 'Stiff', score: 2, relationship: 3, explanation: 'Correct and useful, but short and procedural.', correction: '里面有银行卡和我的身份证。', glossary: [] },
          { id: 'C', zh: '里面银行卡身份证都是有。', py: 'Lǐmiàn yínhángkǎ shēnfènzhèng dōu shì yǒu.', en: 'Inside bank card ID all are have.', rating: 'Awkward', score: 1, relationship: -5, explanation: 'The contents are understandable, but the structure is unnatural.', correction: '里面有银行卡和身份证。', glossary: [] },
          { id: 'D', zh: '我不知道咖啡馆在哪里。', py: 'Wǒ bù zhīdào kāfēiguǎn zài nǎli.', en: 'I do not know where the café is.', rating: 'Incorrect', score: 0, relationship: -10, explanation: 'This does not provide the identifying information the café needs.', correction: '里面有银行卡和我的身份证。', glossary: [] },
        ],
      },
      {
        id: 6,
        mission: 'Close the interaction naturally based on the result of the search.',
        npc: 'Staff',
        npcLineZh: '信息对上了。你可以去咖啡馆拿钱包，我也告诉你充电的地方。',
        npcLinePy: 'Xìnxī duì shàng le. Nǐ kěyǐ qù kāfēiguǎn ná qiánbāo, wǒ yě gàosu nǐ chōngdiàn de dìfang.',
        npcLineEn: 'The information matches. You can collect your wallet at the café, and I will show you where to charge your phone.',
        npcGlossary: ['钱包', '充电'],
        options: [
          { id: 'A', zh: '太好了，真的谢谢你！麻烦你告诉我怎么走。', py: 'Tài hǎo le, zhēn de xièxie nǐ! Máfan nǐ gàosu wǒ zěnme zǒu.', en: 'That is great, thank you so much! Please tell me how to get there.', rating: 'Natural', score: 3, relationship: 14, explanation: 'Natural and warm. It thanks the staff and confirms the practical next step.', correction: null, glossary: ['麻烦你了'] },
          { id: 'B', zh: '好，谢谢。', py: 'Hǎo, xièxie.', en: 'Okay, thanks.', rating: 'Stiff', score: 2, relationship: 3, explanation: 'Correct, but brief after receiving substantial help.', correction: '太好了，真的谢谢你！', glossary: [] },
          { id: 'C', zh: '很好，你给我很多帮助谢谢。', py: 'Hěn hǎo, nǐ gěi wǒ hěn duō bāngzhù xièxie.', en: 'Very good, you give me much help thanks.', rating: 'Awkward', score: 1, relationship: -5, explanation: 'The gratitude is clear, but the sentence is not natural Chinese.', correction: '太好了，真的谢谢你帮了我这么多。', glossary: [] },
          { id: 'D', zh: '你的钱包找到了吗？', py: 'Nǐ de qiánbāo zhǎo dào le ma?', en: 'Was your wallet found?', rating: 'Incorrect', score: 0, relationship: -10, explanation: 'This asks about the staff member’s wallet instead of closing your own interaction.', correction: '太好了，真的谢谢你！', glossary: ['钱包'] },
        ],
      },
    ],
  },
];

const highlightTiers = (primaryGlossaryKeys = [], recycledGlossaryKeys = []) => ({
  primaryGlossaryKeys,
  recycledGlossaryKeys,
});

// Chapters 1–5 keep their existing three-decision stories, but every rendered
// NPC line and option now has an explicit curriculum-authored highlight map.
// An empty map is intentional: legacy glossary metadata must not create a
// highlight unless the language is a teaching or review target in that line.
const STORY_HIGHLIGHT_MAP = Object.freeze({
  chapter1: {
    1: {
      npc: highlightTiers(['新来的', '室友']),
      options: {
        A: highlightTiers(['新来的', '室友']),
        B: highlightTiers(),
        C: highlightTiers(),
        D: highlightTiers(['新来的', '室友']),
      },
    },
    2: {
      npc: highlightTiers(['我叫'], ['室友']),
      options: {
        A: highlightTiers(['我叫', '很高兴认识你']),
        B: highlightTiers(['我叫']),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
    3: {
      npc: highlightTiers(['哪国人', '说得怎么样'], ['中文']),
      options: {
        A: highlightTiers(['会说一点', '说得不太好'], ['中文']),
        B: highlightTiers([], ['中文']),
        C: highlightTiers([], ['中文']),
        D: highlightTiers([], ['中文']),
      },
    },
    4: {
      npc: highlightTiers(['刚搬来'], ['会说一点', '说得怎么样']),
      options: {
        A: highlightTiers(['刚搬来', '不太熟悉']),
        B: highlightTiers(['刚搬来']),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
    5: {
      npc: highlightTiers(),
      options: {
        A: highlightTiers(['麻烦你了', '一起']),
        B: highlightTiers(),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
    6: {
      npc: highlightTiers(),
      options: {
        A: highlightTiers([], ['很高兴认识你', '麻烦你了']),
        B: highlightTiers(),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
  },
  chapter2: {
    1: {
      npc: highlightTiers(),
      options: {
        A: highlightTiers(['有时间']),
        B: highlightTiers(['有时间']),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
    2: {
      npc: highlightTiers([], ['有时间']),
      options: {
        A: highlightTiers(),
        B: highlightTiers(),
        C: highlightTiers(),
        D: highlightTiers([], ['有时间']),
      },
    },
    3: {
      npc: highlightTiers(),
      options: {
        A: highlightTiers(['可能', '会', '要不然']),
        B: highlightTiers(['晚一点']),
        C: highlightTiers(['可能', '会', '晚一点']),
        D: highlightTiers(),
      },
    },
  },
  chapter3: {
    1: {
      npc: highlightTiers(['几位']),
      options: {
        A: highlightTiers(['靠窗', '位子']),
        B: highlightTiers(['位子']),
        C: highlightTiers(),
        D: highlightTiers(['几位']),
      },
    },
    2: {
      npc: highlightTiers(),
      options: {
        A: highlightTiers(['来']),
        B: highlightTiers(),
        C: highlightTiers(['来']),
        D: highlightTiers(),
      },
    },
    3: {
      npc: highlightTiers(['一共', '打包']),
      options: {
        A: highlightTiers(['打包', '刷卡']),
        B: highlightTiers(['打包', '刷卡']),
        C: highlightTiers(['刷卡']),
        D: highlightTiers(['打包']),
      },
    },
  },
  chapter4: {
    1: {
      npc: highlightTiers(['看起来', '迷路了']),
      options: {
        A: highlightTiers(['地铁站', '怎么走']),
        B: highlightTiers(['地铁站']),
        C: highlightTiers(['地铁站']),
        D: highlightTiers(['地铁站']),
      },
    },
    2: {
      npc: highlightTiers(['不远', '一直走', '左转'], ['地铁站']),
      options: {
        A: highlightTiers(['没听清楚', '再说一遍']),
        B: highlightTiers(['再说一遍']),
        C: highlightTiers(),
        D: highlightTiers(),
      },
    },
    3: {
      npc: highlightTiers(['以后', '到'], ['一直走', '左转']),
      options: {
        A: highlightTiers([], ['一直走', '左转']),
        B: highlightTiers(),
        C: highlightTiers(),
        D: highlightTiers(['以后', '到'], ['一直走', '左转']),
      },
    },
  },
  chapter5: {
    1: {
      npc: highlightTiers(['打折']),
      options: {
        A: highlightTiers(['多少钱']),
        B: highlightTiers(['多少钱']),
        C: highlightTiers(),
        D: highlightTiers(['多少钱']),
      },
    },
    2: {
      npc: highlightTiers([], ['打折']),
      options: {
        A: highlightTiers(['有点儿', '看看别的']),
        B: highlightTiers(['太贵了']),
        C: highlightTiers(),
        D: highlightTiers([], ['多少钱']),
      },
    },
    3: {
      npc: highlightTiers(['便宜一点']),
      options: {
        A: highlightTiers(['刷卡']),
        B: highlightTiers(['刷卡']),
        C: highlightTiers(),
        D: highlightTiers(['刷卡']),
      },
    },
  },
});

function getAuthoredStoryHighlightTiers(chapterId, nodeId, optionId = null) {
  const nodeMap = STORY_HIGHLIGHT_MAP[chapterId]?.[nodeId];
  return optionId == null ? nodeMap?.npc : nodeMap?.options?.[optionId];
}

function getStoryHighlightSource(chapterId, nodeId, optionId, decisionSupport) {
  return getAuthoredStoryHighlightTiers(chapterId, nodeId, optionId) || decisionSupport || null;
}

function resolveStoryHighlightTiers({ chapterId, nodeId, optionId = null, text = '', decisionSupport = null }) {
  const source = getStoryHighlightSource(chapterId, nodeId, optionId, decisionSupport) || highlightTiers();
  const primaryGlossaryKeys = (Array.isArray(source.primaryGlossaryKeys) ? source.primaryGlossaryKeys : [])
    .filter((key) => typeof key === 'string' && text.includes(key));
  const primarySet = new Set(primaryGlossaryKeys);
  const recycledGlossaryKeys = (Array.isArray(source.recycledGlossaryKeys) ? source.recycledGlossaryKeys : [])
    .filter((key) => typeof key === 'string' && text.includes(key) && !primarySet.has(key));

  return { primaryGlossaryKeys, recycledGlossaryKeys };
}

// Explicit authored pronunciation and meaning support for the Chinese that each
// Teacher note teaches or contrasts. Nothing here is generated from note prose.
const TEACHER_NOTE_SUPPORT = Object.freeze({
  'chapter1:newlai': {
    terms: [{ zh: '新来的', py: 'xīn lái de', en: 'newly arrived; new here', audioText: '新来的' }],
    pattern: { zh: '新 + 来 + 的', py: 'xīn + lái + de', en: 'new + come + attributive marker', audioText: '新，来，的' },
    example: { zh: '新来的室友', py: 'xīn lái de shìyǒu', en: 'newly arrived roommate', audioText: '新来的室友' },
  },
  'chapter1:topic-comment': {
    terms: [
      { zh: '中文', py: 'Zhōngwén', en: 'Chinese language', audioText: '中文' },
      { zh: '说得怎么样', py: 'shuō de zěnmeyàng', en: 'how well someone speaks', audioText: '说得怎么样' },
    ],
    pattern: { zh: '中文 + 说得怎么样？', py: 'Zhōngwén + shuō de zěnmeyàng?', en: 'topic + how well it is done', audioText: '中文说得怎么样？' },
  },
  'chapter1:shuode': {
    terms: [
      { zh: '得', py: 'de', en: 'complement marker for degree or result', audioText: '得' },
      { zh: '说得怎么样', py: 'shuō de zěnmeyàng', en: 'how well someone speaks', audioText: '说得怎么样' },
    ],
    example: { zh: '写得很好 / 做得不错 / 跑得很快', py: 'xiě de hěn hǎo / zuò de búcuò / pǎo de hěn kuài', en: 'write well / do well / run fast', audioText: '写得很好，做得不错，跑得很快。' },
  },
  'chapter1:introduce-name': {
    terms: [
      { zh: '我叫', py: 'wǒ jiào', en: 'my name is; I am called', audioText: '我叫' },
      { zh: '我是叫', py: 'wǒ shì jiào', en: 'not the normal learner pattern for giving a name', audioText: '我是叫' },
    ],
    pattern: { zh: '我叫 + name', py: 'wǒ jiào + name', en: 'My name is + name', audioText: '我叫 Alex。' },
    example: { zh: '我叫 Alex。', py: 'Wǒ jiào Alex.', en: 'My name is Alex.', audioText: '我叫 Alex。' },
  },
  'chapter1:just-moved': {
    terms: [
      { zh: '刚 + Verb', py: 'gāng + verb', en: 'the action happened only a short time ago', audioText: '我刚搬来。' },
      { zh: '不太 + adjective', py: 'bú tài + adjective', en: 'not very + adjective', audioText: '不太熟悉' },
    ],
    pattern: { zh: '刚搬来 + 不太熟悉', py: 'gāng bān lái + bú tài shúxī', en: 'just moved in + not very familiar', audioText: '我刚搬来，对这里还不太熟悉。' },
    example: { zh: '我对这里还不太熟悉。', py: 'Wǒ duì zhèlǐ hái bú tài shúxī.', en: 'I am still not very familiar with this place.', audioText: '我对这里还不太熟悉。' },
  },
  'chapter1:polite-trouble': {
    terms: [{ zh: '麻烦你了', py: 'máfan nǐ le', en: 'sorry to trouble you; thank you for the effort', audioText: '麻烦你了' }],
    example: { zh: '麻烦你带我看看。', py: 'Máfan nǐ dài wǒ kànkan.', en: 'Please show me around.', audioText: '麻烦你带我看看。' },
  },
  'chapter1:first-meeting-recap': {
    terms: [
      { zh: '很高兴认识你', py: 'hěn gāoxìng rènshi nǐ', en: 'nice to meet you', audioText: '很高兴认识你' },
      { zh: '麻烦你了', py: 'máfan nǐ le', en: 'sorry to trouble you; thank you for the effort', audioText: '麻烦你了' },
    ],
  },
  'chapter2:you-time': {
    terms: [{ zh: '有时间', py: 'yǒu shíjiān', en: 'have time; be available', audioText: '有时间' }],
    example: { zh: '你明天有时间吗？', py: 'Nǐ míngtiān yǒu shíjiān ma?', en: 'Are you free tomorrow?', audioText: '你明天有时间吗？' },
  },
  'chapter2:possible-future': {
    terms: [
      { zh: '可能', py: 'kěnéng', en: 'possibly; maybe', audioText: '可能' },
      { zh: '会', py: 'huì', en: 'will or may; marks a predicted outcome here', audioText: '会' },
    ],
    example: { zh: '我明天可能会晚一点', py: 'Wǒ míngtiān kěnéng huì wǎn yìdiǎn', en: 'I may be a little late tomorrow', audioText: '我明天可能会晚一点。' },
  },
  'chapter2:yaoburan': {
    terms: [{ zh: '要不然', py: 'yàoburán', en: 'otherwise; how about this instead', audioText: '要不然' }],
    example: { zh: '要不然我们改时间吧？', py: 'Yàoburán wǒmen gǎi shíjiān ba?', en: 'Otherwise, shall we change the time?', audioText: '要不然我们改时间吧？' },
  },
  'chapter2:buhaoyisi': {
    terms: [
      { zh: '不好意思', py: 'bù hǎoyìsi', en: 'excuse me; sorry', audioText: '不好意思' },
      { zh: '对不起', py: 'duìbuqǐ', en: 'sorry; a stronger or heavier apology', audioText: '对不起' },
    ],
  },
  'chapter3:jiwei-weizi': {
    terms: [
      { zh: '几位', py: 'jǐ wèi', en: 'how many people; how many guests', audioText: '几位' },
      { zh: '位子', py: 'wèizi', en: 'seat; seating', audioText: '位子' },
    ],
    example: { zh: '有没有位子', py: 'yǒu méiyǒu wèizi', en: 'are there any seats or tables available', audioText: '有没有位子' },
  },
  'chapter3:lai-order': {
    terms: [{ zh: '来', py: 'lái', en: 'let me have; let us get', audioText: '来' }],
    example: { zh: '来一份… / 再来两碗… / 先来一个…', py: 'lái yí fèn... / zài lái liǎng wǎn... / xiān lái yí ge...', en: 'one order of... / two more bowls of... / first, one...', audioText: '来一份，再来两碗，先来一个。' },
  },
  'chapter3:yigong-dabao': {
    terms: [
      { zh: '一共', py: 'yígòng', en: 'in total', audioText: '一共' },
      { zh: '打包', py: 'dǎbāo', en: 'pack food to go', audioText: '打包' },
      { zh: '刷卡', py: 'shuākǎ', en: 'pay by card', audioText: '刷卡' },
    ],
  },
  'chapter4:kanqilai-state': {
    terms: [{ zh: '看起来', py: 'kàn qǐlái', en: 'looks; seems', audioText: '看起来' }],
    example: { zh: '你看起来迷路了', py: 'Nǐ kàn qǐlái mílù le', en: 'You look lost', audioText: '你看起来迷路了。' },
  },
  'chapter4:zenme-zou': {
    terms: [{ zh: '怎么走', py: 'zěnme zǒu', en: 'how to get there; which way to go', audioText: '怎么走' }],
    pattern: { zh: '去 + place + 怎么走？', py: 'qù + place + zěnme zǒu?', en: 'How do I get to [place]?', audioText: '去地铁站怎么走？' },
  },
  'chapter4:yihou-jiu-result': {
    terms: [
      { zh: '以后', py: 'yǐhòu', en: 'after; afterward', audioText: '以后' },
      { zh: '就到了', py: 'jiù dào le', en: 'then you will be there', audioText: '就到了' },
    ],
    example: { zh: '左转以后就到了', py: 'Zuǒ zhuǎn yǐhòu jiù dào le', en: 'After you turn left, you will be there', audioText: '左转以后就到了。' },
  },
  'chapter4:confirm-directions': {
    terms: [
      { zh: '听不懂', py: 'tīng bù dǒng', en: 'cannot understand what one hears', audioText: '听不懂' },
      { zh: '不好意思', py: 'bù hǎoyìsi', en: 'excuse me; sorry', audioText: '不好意思' },
      { zh: '我没听清楚', py: 'Wǒ méi tīng qīngchu', en: 'I did not hear clearly', audioText: '我没听清楚。' },
      { zh: '可以再说一遍吗？', py: 'Kěyǐ zài shuō yí biàn ma?', en: 'Could you say it again?', audioText: '可以再说一遍吗？' },
    ],
  },
  'chapter5:duoshao-qian': {
    terms: [
      { zh: '多少钱', py: 'duōshao qián', en: 'how much money; what price', audioText: '多少钱' },
      { zh: '请问', py: 'qǐngwèn', en: 'excuse me; may I ask', audioText: '请问' },
    ],
  },
  'chapter5:yidianr-shopping': {
    terms: [
      { zh: '有点儿贵 / 太贵了', py: 'yǒudiǎnr guì / tài guì le', en: 'a little expensive / too expensive', audioText: '有点儿贵。太贵了。' },
      { zh: '便宜一点', py: 'piányi yìdiǎn', en: 'a little cheaper', audioText: '便宜一点' },
    ],
    example: { zh: '有点儿太贵了', py: 'yǒudiǎnr tài guì le', en: 'a little too expensive; a casual combined form', audioText: '有点儿太贵了。' },
  },
  'chapter5:kankan-soft-action': {
    terms: [
      { zh: '看看', py: 'kànkan', en: 'take a look', audioText: '看看' },
      { zh: '看', py: 'kàn', en: 'look; see', audioText: '看' },
    ],
    example: { zh: '我想看看别的', py: 'Wǒ xiǎng kànkan bié de', en: 'I want to look at something else', audioText: '我想看看别的。' },
  },
  'chapter5:payment-choice': {
    terms: [{ zh: '刷卡还是现金？', py: 'Shuākǎ háishi xiànjīn?', en: 'Card or cash?', audioText: '刷卡还是现金？' }],
    pattern: { zh: '可以 + verb + 吗', py: 'kěyǐ + verb + ma', en: 'Can or may [someone] do something?', audioText: '可以刷卡吗？' },
    example: { zh: '可以刷卡吗？ / 可以付现金吗？', py: 'Kěyǐ shuākǎ ma? / Kěyǐ fù xiànjīn ma?', en: 'Can I pay by card? / Can I pay cash?', audioText: '可以刷卡吗？可以付现金吗？' },
  },
  'chapter6:soft-help-request': {
    terms: [
      { zh: '帮我一下', py: 'bāng wǒ yíxià', en: 'help me for a moment', audioText: '帮我一下' },
      { zh: '一下', py: 'yíxià', en: 'a little; briefly; a request softener', audioText: '一下' },
      { zh: '不好意思', py: 'bù hǎoyìsi', en: 'excuse me; sorry', audioText: '不好意思' },
    ],
    pattern: { zh: '可以 + verb + 吗', py: 'kěyǐ + verb + ma', en: 'Could or can [someone] do something?', audioText: '可以帮我一下吗？' },
  },
  'chapter6:mei-dian-le': {
    terms: [
      { zh: '没电 / 没电了', py: 'méi diàn / méi diàn le', en: 'no power / has run out of power', audioText: '没电。没电了。' },
      { zh: '了', py: 'le', en: 'change-of-state particle here', audioText: '了' },
    ],
    example: { zh: '我的手机没电了', py: 'Wǒ de shǒujī méi diàn le', en: 'My phone is out of battery', audioText: '我的手机没电了。' },
  },
  'chapter6:zhao-bu-dao': {
    terms: [
      { zh: '找', py: 'zhǎo', en: 'look for', audioText: '找' },
      { zh: '到', py: 'dào', en: 'reach; achieve a result', audioText: '到' },
      { zh: '找不到', py: 'zhǎo bú dào', en: 'cannot find', audioText: '找不到' },
      { zh: '没有', py: 'méiyǒu', en: 'not have; there is not', audioText: '没有' },
    ],
  },
  'chapter6:time-place-guo': {
    terms: [{ zh: '过', py: 'guo', en: 'past-experience marker', audioText: '过' }],
    pattern: { zh: '半小时前 + 我在咖啡馆 + 买过东西', py: 'bàn ge xiǎoshí qián + wǒ zài kāfēiguǎn + mǎi guo dōngxi', en: 'time + place + past experience', audioText: '半小时前，我在咖啡馆买过东西。' },
  },
  'chapter6:describe-object': {
    terms: [
      { zh: '是一个……', py: 'shì yí ge...', en: 'it is a...', audioText: '是一个小黑色钱包。' },
      { zh: '里面有', py: 'lǐmiàn yǒu', en: 'there is or are inside', audioText: '里面有' },
    ],
  },
  'chapter6:clarify-not-a': {
    terms: [
      { zh: '不是 A', py: 'bú shì A', en: 'it is not A', audioText: '不是手机' },
      { zh: '是 B', py: 'shì B', en: 'it is B', audioText: '是钱包' },
    ],
    pattern: { zh: '不是 A，是 B', py: 'bú shì A, shì B', en: 'it is not A; it is B', audioText: '不是手机，是钱包。' },
  },
  'chapter6:practical-next-step': {
    terms: [
      { zh: '确认', py: 'quèrèn', en: 'confirm; verify', audioText: '确认' },
      { zh: '联系', py: 'liánxì', en: 'contact; get in touch with', audioText: '联系' },
      { zh: '失物登记表', py: 'shīwù dēngjìbiǎo', en: 'lost-property registration form', audioText: '失物登记表' },
    ],
  },
  'chapter6:thank-after-help': {
    terms: [
      { zh: '谢谢', py: 'xièxie', en: 'thank you', audioText: '谢谢' },
      { zh: '太谢谢了', py: 'tài xièxie le', en: 'thank you so much', audioText: '太谢谢了' },
      { zh: '麻烦你了', py: 'máfan nǐ le', en: 'sorry to trouble you; thank you for the effort', audioText: '麻烦你了' },
    ],
  },
});

function getTeacherNoteSupport(chapter, note) {
  const support = TEACHER_NOTE_SUPPORT[`${chapter?.id}:${note?.id}`];
  return {
    terms: Array.isArray(support?.terms) ? support.terms : [],
    pattern: support?.pattern || null,
    example: support?.example || null,
  };
}

const DEFAULT_CHAPTER_SUPPORT = Object.freeze({
  glossaryExamplePolicy: Object.freeze({ requiredCount: 5, initiallyVisible: 2 }),
  teacherNoteSupport: Object.freeze({ enabled: true }),
  betterVersionSupport: true,
  endingLanguageSupport: null,
  progressiveOptionMeaning: false,
  memoryMoments: null,
  sayBeforeReveal: null,
  memoryReplay: null,
  stageSupport: null,
  branchingSupport: null,
  reactiveAvatar: true,
  alignedLanguageClauses: false,
  resultTierSupport: null,
});

// Lesson content stays in the chapter data above. This map only declares which
// shared support systems have complete, authored data and may safely render.
const CHAPTER_SUPPORT_CONFIG = Object.freeze({
  chapter1: Object.freeze({
    teacherNoteSupport: Object.freeze({
      enabled: true,
      decisionSupport: CHAPTER1_SUPPORT_MAP,
      progressiveExamples: true,
    }),
    betterVersionSupport: true,
    endingLanguageSupport: Object.freeze({
      finalDecision: 6,
      endings: CHAPTER1_ENDINGS,
      thresholds: Object.freeze({ strongComfort: 70, strongNaturalness: 65, mixedComfort: 40, mixedNaturalness: 38 }),
      useIncorrectGuard: false,
    }),
    progressiveOptionMeaning: true,
    memoryMoments: Object.freeze({
      targets: CHAPTER1_MEMORY_TARGETS,
      byDecision: CHAPTER1_RETRIEVAL_BY_DECISION,
    }),
    sayBeforeReveal: Object.freeze({
      decision: 6,
      byBranch: Object.freeze({
        'warm-close': Object.freeze({ targetId: 'strong-close', prompt: 'Your roommate welcomes you to the apartment. Say one natural closing line.' }),
        'polite-close': Object.freeze({ targetId: 'mixed-close', prompt: 'Your roommate agrees to show you around. Thank them politely.' }),
        'repair-close': Object.freeze({ targetId: 'weak-repair', prompt: 'Your roommate thinks you may not need help. Repair the misunderstanding.' }),
      }),
    }),
    memoryReplay: Object.freeze({
      targets: CHAPTER1_MEMORY_TARGETS,
      moments: CHAPTER1_MEMORY_REPLAY_MOMENTS,
    }),
    stageSupport: Object.freeze({
      decisionSupport: CHAPTER1_SUPPORT_MAP,
      transitions: CHAPTER1_STAGE_TRANSITIONS,
    }),
    branchingSupport: Object.freeze({
      mode: 'chapter1-roommate',
      nodes: CHAPTER1_BRANCH_NODES,
      finalThresholds: Object.freeze({ strongComfort: 65, strongNaturalness: 60, mixedComfort: 40, mixedNaturalness: 38 }),
    }),
    reactiveAvatar: true,
    alignedLanguageClauses: true,
  }),
  chapter2: Object.freeze({}),
  chapter3: Object.freeze({}),
  chapter4: Object.freeze({}),
  chapter5: Object.freeze({}),
  chapter6: Object.freeze({
    teacherNoteSupport: Object.freeze({
      enabled: true,
      decisionSupport: CHAPTER6_SUPPORT_MAP,
      progressiveExamples: true,
    }),
    betterVersionSupport: true,
    endingLanguageSupport: Object.freeze({
      finalDecision: 6,
      endings: CHAPTER6_ENDINGS,
    }),
    progressiveOptionMeaning: true,
    memoryMoments: Object.freeze({
      targets: CHAPTER6_MEMORY_TARGETS,
      byDecision: CHAPTER6_RETRIEVAL_BY_DECISION,
    }),
    sayBeforeReveal: Object.freeze({
      decision: 6,
      targetId: 'polite-close',
      prompt: 'The wallet has been recovered and the staff has helped with the phone. Say a warm final response aloud.',
    }),
    memoryReplay: Object.freeze({
      targets: CHAPTER6_MEMORY_TARGETS,
      moments: CHAPTER6_MEMORY_MOMENTS,
    }),
    stageSupport: Object.freeze({
      decisionSupport: CHAPTER6_SUPPORT_MAP,
      transitions: CHAPTER6_STAGE_TRANSITIONS,
    }),
    branchingSupport: Object.freeze({ nodes: CHAPTER6_BRANCH_NODES }),
    reactiveAvatar: true,
    alignedLanguageClauses: true,
    resultTierSupport: Object.freeze({ rewards: CHAPTER6_TIER_REWARDS }),
  }),
});

function getChapterSupport(chapter) {
  const configured = CHAPTER_SUPPORT_CONFIG[chapter?.id] || {};
  return {
    ...DEFAULT_CHAPTER_SUPPORT,
    ...configured,
    glossaryExamplePolicy: {
      ...DEFAULT_CHAPTER_SUPPORT.glossaryExamplePolicy,
      ...(configured.glossaryExamplePolicy || {}),
    },
    teacherNoteSupport: {
      ...DEFAULT_CHAPTER_SUPPORT.teacherNoteSupport,
      ...(configured.teacherNoteSupport || {}),
    },
  };
}

function hasCompleteLanguageLayers(value) {
  return ['zh', 'py', 'en'].every((field) => typeof value?.[field] === 'string' && value[field].trim());
}

function getCompleteGlossaryExamples(entry) {
  if (!Array.isArray(entry?.examples)) return [];
  const glossaryId = normalizeAudioKey(entry.pinyin || entry.title);
  return entry.examples.flatMap((example, sourceIndex) => hasCompleteLanguageLayers(example)
    ? [{
        ...example,
        audioId: `glossary.${glossaryId}.ex${sourceIndex + 1}`,
        saveEnabled: true,
      }]
    : []);
}

function findCompleteMemoryTarget(targets, targetId) {
  const target = Array.isArray(targets) ? targets.find((item) => item?.id === targetId) : null;
  return hasCompleteLanguageLayers(target) && typeof target.audioText === 'string' && target.audioText.trim()
    ? target
    : null;
}

function normalizeMemoryMoment(moment) {
  if (!moment) return null;
  return {
    ...moment,
    contextZh: moment.contextZh || moment.npcContext || '',
    contextPy: moment.contextPy || moment.npcContextPy || '',
    contextEn: moment.contextEn || moment.npcContextEn || '',
    contextAudioText: moment.contextAudioText || moment.npcContext || '',
    taskPrompt: moment.taskPrompt || moment.prompt || '',
  };
}

function resolveMemoryMoment(memorySupport, decisionId) {
  const moment = normalizeMemoryMoment(memorySupport?.byDecision?.[decisionId]);
  const target = findCompleteMemoryTarget(memorySupport?.targets, moment?.targetId);
  const hasCompleteMoment = moment && [
    'contextZh',
    'contextPy',
    'contextEn',
    'contextAudioText',
    'taskPrompt',
    'patternCueZh',
    'patternCuePy',
    'patternCueEn',
    'firstClue',
  ].every((field) => typeof moment[field] === 'string' && moment[field].trim());
  return hasCompleteMoment && target ? { moment, target } : null;
}

function getCompleteMemoryReplay(memoryReplay) {
  if (!Array.isArray(memoryReplay?.moments)) return [];
  return memoryReplay.moments.flatMap((sourceMoment) => {
    const moment = normalizeMemoryMoment(sourceMoment);
    const target = findCompleteMemoryTarget(memoryReplay.targets, moment?.targetId);
    const hasCompleteMoment = moment && [
      'contextZh',
      'contextPy',
      'contextEn',
      'contextAudioText',
      'taskPrompt',
      'patternCueZh',
      'patternCuePy',
      'patternCueEn',
      'firstClue',
    ].every((field) => typeof moment[field] === 'string' && moment[field].trim());
    return hasCompleteMoment && target ? [{ moment, target }] : [];
  });
}

function hasCompleteEnding(ending) {
  return hasCompleteLanguageLayers(ending);
}

function applyBetterVersionTranslations(options) {
  if (!Array.isArray(options)) return;

  options.forEach((option) => {
    if (!option?.correction) return;
    const translation = BETTER_VERSION_TRANSLATIONS[option.correction];
    if (!translation) return;

    option.correctionPy ||= translation.correctionPy;
    option.correctionEn ||= translation.correctionEn;
  });
}

function validateBetterVersionTranslations() {
  if (!import.meta.env.DEV) return;

  const missing = [];
  const inspect = (options, location) => {
    options?.forEach((option) => {
      if (option?.correction && (!option.correctionPy || !option.correctionEn)) {
        missing.push(`${location}: ${option.correction}`);
      }
    });
  };

  chapters.forEach((chapter) => chapter.nodes.forEach((node) => inspect(node.options, `Chapter ${chapter.id}, decision ${node.id}`)));
  Object.entries(CHAPTER6_BRANCH_NODES).forEach(([decisionKey, branches]) => {
    Object.entries(branches).forEach(([branchKey, branch]) => inspect(branch.options, `Chapter 6, ${decisionKey}/${branchKey}`));
  });
  Object.entries(CHAPTER1_BRANCH_NODES).forEach(([decisionKey, branches]) => {
    Object.entries(branches).forEach(([branchKey, branch]) => inspect(branch.options, `Chapter 1, ${decisionKey}/${branchKey}`));
  });

  missing.forEach((entry) => console.warn(`[Better version] Missing authored pinyin or English: ${entry}`));
}

function validateChapter6ContentSupport() {
  if (!import.meta.env.DEV) return;

  if (CHAPTER6_NEW_CORE_LANGUAGE.length > 12) {
    console.warn(`[Chapter 6 support] New-core inventory has ${CHAPTER6_NEW_CORE_LANGUAGE.length} items; maximum is 12.`);
  }

  Object.entries(CHAPTER6_SUPPORT_MAP).forEach(([decisionId, support]) => {
    if (support.primaryNoteIds.length > 1) {
      console.warn(`[Chapter 6 support] Decision ${decisionId} has more than one primary Teacher note.`);
    }
  });

  const inspectText = (text, decisionId, location) => {
    if (!text) return;
    const support = CHAPTER6_SUPPORT_MAP[decisionId];
    const highlighted = support.primaryGlossaryKeys.filter((key) => text.includes(key));
    if (highlighted.length > 3) {
      console.warn(`[Chapter 6 support] Decision ${decisionId} ${location} has ${highlighted.length} primary highlights.`);
    }
  };
  const inspectNode = (node, decisionId, location) => {
    inspectText(node.npcLineZh, decisionId, `${location} NPC line`);
    node.options?.forEach((option) => {
      inspectText(option.zh, decisionId, `${location} option ${option.id}`);
      inspectText(option.correction, decisionId, `${location} option ${option.id} correction`);
    });
  };

  const chapter6 = chapters.find((chapter) => chapter.id === 'chapter6');
  chapter6?.nodes.forEach((node) => inspectNode(node, node.id, 'base'));
  Object.entries(CHAPTER6_BRANCH_NODES).forEach(([decisionKey, branches]) => {
    const decisionId = Number(decisionKey.replace('decision', ''));
    Object.entries(branches).forEach(([branchKey, branch]) => inspectNode(branch, decisionId, branchKey));
  });
}

function validateChapter1ContentSupport() {
  if (!import.meta.env.DEV) return;

  const warnings = [];
  const chapter1 = chapters.find((chapter) => chapter.id === 'chapter1');
  if (chapter1?.nodes?.length !== 6 || chapter1.nodes.some((node, index) => node.id !== index + 1)) {
    warnings.push('Chapter 1 must have exactly six reachable decisions with IDs 1–6.');
  }
  if (CHAPTER1_NEW_CORE_LANGUAGE.length !== 11) {
    warnings.push(`New-core inventory has ${CHAPTER1_NEW_CORE_LANGUAGE.length} items; expected 11.`);
  }

  const inspectOptions = (options, context) => {
    if (!Array.isArray(options) || options.length !== 4) {
      warnings.push(`${context} must have four answer options.`);
      return;
    }
    options.forEach((option) => {
      const missing = ['zh', 'py', 'en', 'rating', 'score', 'relationship']
        .find((field) => option?.[field] === undefined || option?.[field] === null || option?.[field] === '');
      if (missing) warnings.push(`${context} option ${option?.id || '?'} is missing ${missing}.`);
      if (option?.rating !== 'Natural' && (!option?.correction || !option?.correctionPy || !option?.correctionEn)) {
        warnings.push(`${context} option ${option?.id || '?'} lacks a complete multilingual correction.`);
      }
    });
  };

  chapter1?.nodes.forEach((node) => inspectOptions(node.options, `Decision ${node.id}`));
  Object.entries(CHAPTER1_BRANCH_NODES).forEach(([decisionKey, branches]) => {
    Object.entries(branches).forEach(([branchKey, branch]) => {
      const missingNpc = ['npcLineZh', 'npcLinePy', 'npcLineEn'].find((field) => !branch?.[field]);
      if (missingNpc) warnings.push(`${decisionKey}/${branchKey} is missing ${missingNpc}.`);
      if (branch.options) inspectOptions(branch.options, `${decisionKey}/${branchKey}`);
    });
  });

  CHAPTER1_MEMORY_MOMENTS.forEach((moment) => {
    const normalized = normalizeMemoryMoment(moment);
    const target = findCompleteMemoryTarget(CHAPTER1_MEMORY_TARGETS, moment.targetId);
    const missing = ['contextZh', 'contextPy', 'contextEn', 'contextAudioText', 'taskPrompt', 'patternCueZh', 'patternCuePy', 'patternCueEn', 'firstClue']
      .find((field) => !normalized?.[field]);
    if (missing || !target) warnings.push(`${moment.id} lacks complete multilingual context or answer data.`);
  });

  Object.values(CHAPTER1_ENDINGS).forEach((ending) => {
    if (!hasCompleteLanguageLayers(ending) || !ending.audioText) warnings.push(`${ending.label || 'Ending'} lacks complete language or audio data.`);
  });

  warnings.forEach((warning) => console.warn(`[Chapter 1 support] ${warning}`));
  if (warnings.length === 0) console.info('[Chapter 1 support] 0 validation errors.');
}

function validateChapterMemorySupport() {
  if (!import.meta.env.DEV) return;

  chapters.forEach((chapter) => {
    const support = getChapterSupport(chapter);
    const targets = support.memoryReplay?.targets || support.memoryMoments?.targets || [];
    const moments = support.memoryReplay?.moments || Object.values(support.memoryMoments?.byDecision || {});

    targets.forEach((target) => {
      const missingField = ['zh', 'py', 'en', 'audioText', 'firstUseDecision', 'callbackDecision']
        .find((field) => !target?.[field]);
      if (missingField) {
        console.warn(`[${chapter.label} memory] ${target?.id || 'Unknown target'} is missing ${missingField}.`);
      }
      if (target.firstUseDecision < 1 || target.callbackDecision > chapter.nodes.length || target.callbackDecision < target.firstUseDecision) {
        console.warn(`[${chapter.label} memory] ${target.id} has an invalid first-use or callback decision.`);
      }
    });

    moments.forEach((moment) => {
      if (!targets.some((target) => target.id === moment?.targetId)) {
        console.warn(`[${chapter.label} memory] ${moment?.id || 'Unknown moment'} references a missing target.`);
      }
      const missingSupportField = ['npcContext', 'npcContextPy', 'npcContextEn', 'patternCueZh', 'patternCuePy', 'patternCueEn']
        .find((field) => !moment?.[field]);
      if (missingSupportField) {
        console.warn(`[${chapter.label} memory] ${moment?.id || 'Unknown moment'} is missing ${missingSupportField}.`);
      }
    });
  });
}

function forEachStorySentence(inspect) {
  const inspectNode = (chapter, node, source = 'base') => {
    if (!node) return;
    const chapterSupport = getChapterSupport(chapter);
    const decisionSupport = chapterSupport.stageSupport?.decisionSupport?.[node.id] || null;
    inspect({
      chapter,
      node,
      option: null,
      text: node.npcLineZh || '',
      legacyGlossaryKeys: node.npcGlossary,
      decisionSupport,
      source: `${source} NPC`,
    });
    (Array.isArray(node.options) ? node.options : []).forEach((option) => inspect({
      chapter,
      node,
      option,
      text: option?.zh || '',
      legacyGlossaryKeys: option?.glossary,
      decisionSupport,
      source: `${source} option ${option?.id || 'unknown'}`,
    }));
  };

  chapters.forEach((chapter) => {
    chapter.nodes.forEach((node) => inspectNode(chapter, node));
    const branchesByDecision = getChapterSupport(chapter).branchingSupport?.nodes || {};
    Object.entries(branchesByDecision).forEach(([decisionKey, branches]) => {
      const decisionId = Number(decisionKey.replace('decision', ''));
      const baseNode = chapter.nodes.find((node) => node.id === decisionId);
      Object.entries(branches || {}).forEach(([branchName, branch]) => {
        const mergedNode = {
          ...baseNode,
          ...branch,
          id: decisionId,
          options: branch?.options || baseNode?.options || [],
        };
        inspectNode(chapter, mergedNode, `${decisionKey}/${branchName}`);
      });
    });
  });
}

function collectClickableGlossaryReferences() {
  const references = [];
  forEachStorySentence(({ chapter, node, option, text, decisionSupport, source }) => {
    const tiers = resolveStoryHighlightTiers({
      chapterId: chapter.id,
      nodeId: node.id,
      optionId: option?.id ?? null,
      text,
      decisionSupport,
    });
    [...tiers.primaryGlossaryKeys, ...tiers.recycledGlossaryKeys].forEach((key) => {
      references.push({ chapter: chapter.label, highlightedText: key, key, source: `decision ${node.id} ${source}` });
    });
  });
  return references;
}

function validateStoryHighlightMaps() {
  if (!import.meta.env.DEV) return;

  const errors = [];
  const addError = (context, message) => errors.push(`${context}: ${message}`);

  forEachStorySentence(({ chapter, node, option, text, legacyGlossaryKeys, decisionSupport, source }) => {
    const optionId = option?.id ?? null;
    const context = `${chapter.label} · node ${node.id} · ${source}`;
    const authored = getAuthoredStoryHighlightTiers(chapter.id, node.id, optionId);
    const highlightSource = getStoryHighlightSource(chapter.id, node.id, optionId, decisionSupport);

    if (chapter.id !== 'chapter6' && !authored) {
      addError(context, 'is missing an explicit authored highlight map');
    }
    if (!highlightSource && Array.isArray(legacyGlossaryKeys) && legacyGlossaryKeys.length > 0) {
      addError(context, `would fall back to legacy glossary keys [${legacyGlossaryKeys.join(', ')}]`);
    }
    if (highlightSource && (!Array.isArray(highlightSource.primaryGlossaryKeys) || !Array.isArray(highlightSource.recycledGlossaryKeys))) {
      addError(context, 'must define both primaryGlossaryKeys and recycledGlossaryKeys arrays');
      return;
    }

    const sourcePrimary = highlightSource?.primaryGlossaryKeys || [];
    const sourceRecycled = highlightSource?.recycledGlossaryKeys || [];
    const overlap = sourcePrimary.filter((key) => sourceRecycled.includes(key));
    overlap.forEach((key) => addError(context, `key “${key}” is both Primary and Recycled`));

    const tiers = resolveStoryHighlightTiers({
      chapterId: chapter.id,
      nodeId: node.id,
      optionId,
      text,
      decisionSupport,
    });
    if (tiers.primaryGlossaryKeys.length > 3) {
      addError(context, `has ${tiers.primaryGlossaryKeys.length} Primary keys; maximum is 3`);
    }

    [...tiers.primaryGlossaryKeys, ...tiers.recycledGlossaryKeys].forEach((key) => {
      if (!text.includes(key)) addError(context, `key “${key}” does not occur in “${text}”`);
      const entry = glossary[key];
      if (!entry) {
        addError(context, `key “${key}” has no glossary entry`);
        return;
      }
      const examples = Array.isArray(entry.examples) ? entry.examples : [];
      const completeExamples = examples.filter(hasCompleteLanguageLayers);
      if (examples.length !== 5 || completeExamples.length !== 5) {
        addError(context, `key “${key}” has ${completeExamples.length} complete examples out of ${examples.length}; expected exactly 5 complete examples`);
      }
    });
  });

  errors.forEach((error) => console.warn(`[Story highlight validation] ${error}`));
  if (errors.length === 0) {
    console.info('[Story highlight validation] 0 errors across all current NPC lines and answer options.');
  }
}

function validateClickableGlossaryExamples() {
  if (!import.meta.env.DEV) return;

  collectClickableGlossaryReferences().forEach(({ chapter, highlightedText, key, source }) => {
    const entry = glossary[key];
    const context = `${chapter} · ${source} · “${highlightedText}” · key “${key}”`;
    if (!entry) {
      console.warn(`[Glossary validation] ${context} has no glossary entry.`);
      return;
    }

    const examples = Array.isArray(entry.examples) ? entry.examples : [];
    if (examples.length !== 5) {
      console.warn(`[Glossary validation] ${context} resolves to ${examples.length} examples; expected exactly 5.`);
    }

    const seenExamples = new Set();
    examples.forEach((example, index) => {
      const exampleContext = `[Glossary validation] ${context} · example ${index + 1}`;
      if (!example?.zh) console.warn(`${exampleContext} is missing Chinese.`);
      if (!example?.py) console.warn(`${exampleContext} is missing pinyin.`);
      if (!example?.en) console.warn(`${exampleContext} is missing English.`);

      const duplicateKey = `${example?.zh || ''}\u0000${example?.py || ''}\u0000${example?.en || ''}`;
      if (seenExamples.has(duplicateKey)) {
        console.warn(`${exampleContext} duplicates an earlier example.`);
      }
      seenExamples.add(duplicateKey);
    });
  });
}

function validateTeacherNoteTermsAndSpeakers() {
  if (!import.meta.env.DEV) return;
  const containsChinese = (value) => typeof value === 'string' && /[\u3400-\u9fff]/.test(value);

  chapters.forEach((chapter) => {
    (chapter.grammarNotes || []).forEach((note) => {
      const support = getTeacherNoteSupport(chapter, note);
      const languageItems = [
        ...support.terms.map((item, index) => ({ item, kind: `term${index + 1}` })),
        ...(support.pattern ? [{ item: support.pattern, kind: 'pattern' }] : []),
        ...(support.example ? [{ item: support.example, kind: 'example' }] : []),
      ];
      const noteDiscussesChinese = [note.title, note.short, ...(note.body || [])].some(containsChinese);
      if (noteDiscussesChinese && languageItems.length === 0) {
        console.warn(`[Teacher note validation] ${chapter.id}/${note.id} discusses Chinese but has no explicit language support.`);
      }
      languageItems.forEach(({ item, kind }) => {
        const context = `${chapter.id}/${note.id}/${kind}`;
        if (containsChinese(item?.zh) && !item?.py?.trim()) {
          console.warn(`[Teacher note validation] ${context} has Chinese but no pinyin.`);
        }
        if (containsChinese(item?.zh) && !item?.en?.trim()) {
          console.warn(`[Teacher note validation] ${context} has Chinese but no English meaning.`);
        }
        if (containsChinese(item?.zh) && !item?.audioText?.trim()) {
          console.warn(`[Teacher note validation] ${context} has no audio target.`);
        }
      });
    });

    (chapter.nodes || []).forEach((node) => {
      const role = firstAvailableText(
        node?.speakerRole,
        node?.npcRole,
        node?.speaker,
        node?.npc,
        chapter?.speakerRole,
        chapter?.npcRole,
        chapter?.speaker,
      );
      if (role && !resolveSpeakerHeader(chapter, node)) {
        console.warn(`[Speaker validation] ${chapter.id}/node${node.id} has role “${role}” but no speaker header.`);
      }
    });
  });
}

chapters.forEach((chapter) => chapter.nodes.forEach((node) => applyBetterVersionTranslations(node.options)));
Object.values(CHAPTER1_BRANCH_NODES).forEach((branches) => {
  Object.values(branches).forEach((branch) => applyBetterVersionTranslations(branch.options));
});
Object.values(CHAPTER6_BRANCH_NODES).forEach((branches) => {
  Object.values(branches).forEach((branch) => applyBetterVersionTranslations(branch.options));
});
validateBetterVersionTranslations();
validateChapter1ContentSupport();
validateChapter6ContentSupport();
validateChapterMemorySupport();
validateStoryHighlightMaps();
validateClickableGlossaryExamples();
validateTeacherNoteTermsAndSpeakers();

function normalizeAudioKey(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function buildAudioManifest(chaptersData, glossaryData) {
  const manifest = [];

  (Array.isArray(chaptersData) ? chaptersData : []).forEach((chapter) => {
    (Array.isArray(chapter?.nodes) ? chapter.nodes : []).forEach((node) => {
      manifest.push({
        id: `${chapter.id}.node${node.id}.npc`,
        text: node.npcLineZh,
        type: 'npc',
        chapter: chapter.id,
        node: node.id,
        version: 1,
      });

      (Array.isArray(node?.options) ? node.options : []).forEach((option) => {
        const role = option.rating.toLowerCase();
        manifest.push({
          id: `${chapter.id}.node${node.id}.option.${role}`,
          text: option.zh,
          type: 'option',
          role,
          chapter: chapter.id,
          node: node.id,
          version: 1,
        });

        if (option.correction) {
          manifest.push({
            id: `${chapter.id}.node${node.id}.correction.${role}`,
            text: option.correction,
            type: 'correction',
            role,
            chapter: chapter.id,
            node: node.id,
            version: 1,
          });
        }
      });
    });

    (Array.isArray(chapter?.grammarNotes) ? chapter.grammarNotes : []).forEach((note) => {
      (Array.isArray(note?.examples) ? note.examples : []).forEach((example, index) => {
        manifest.push({
          id: `${chapter.id}.grammar.${note.id}.ex${index + 1}`,
          text: example.zh,
          type: 'grammar-example',
          chapter: chapter.id,
          grammarNote: note.id,
          version: 1,
        });
      });
    });
  });

  Object.values(glossaryData || {}).forEach((entry) => {
    const glossaryId = normalizeAudioKey(entry.pinyin || entry.title);

    manifest.push({
      id: `glossary.${glossaryId}.term`,
      text: entry.title,
      type: 'glossary-term',
      glossary: glossaryId,
      version: 1,
    });

    (Array.isArray(entry?.examples) ? entry.examples : []).forEach((example, index) => {
      manifest.push({
        id: `glossary.${glossaryId}.ex${index + 1}`,
        text: example.zh,
        type: 'glossary-example',
        glossary: glossaryId,
        version: 1,
      });
    });
  });

  const deduped = [];
  const seen = new Set();

  manifest.forEach((item) => {
    const key = `${item.id}::${item.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
}

export const AUDIO_MANIFEST = buildAudioManifest(chapters, glossary);
export const AUDIO_TEXT_BY_ID = Object.fromEntries(AUDIO_MANIFEST.map((item) => [item.id, item.text]));

const audioUrlCache = new Map();
const audioUrlInflight = new Map();

async function resolveAudioUrl(audioId, text) {
  const requestText = text || AUDIO_TEXT_BY_ID[audioId] || '';
  if (!requestText) return null;

  const cacheKey = audioId || requestText;

  if (audioUrlCache.has(cacheKey)) return audioUrlCache.get(cacheKey);
  if (audioUrlInflight.has(cacheKey)) return audioUrlInflight.get(cacheKey);

  const request = fetch('/api/tts-aliyun', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: requestText,
      voice: 'zhida',
    }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('TTS API error:', data);
        throw new Error(data?.detail || data?.error || 'tts_fetch_failed');
      }

      if (!data?.url) throw new Error('audio_url_missing');

      audioUrlCache.set(cacheKey, data.url);
      return data.url;
    })
    .finally(() => {
      audioUrlInflight.delete(cacheKey);
    });

  audioUrlInflight.set(cacheKey, request);
  return request;
}

function RatingBadge({ rating }) {
  const palette = {
    Natural: { backgroundColor: '#ecfdf5', borderColor: '#059669', color: '#064e3b' },
    Stiff: { backgroundColor: '#fffbeb', borderColor: '#d97706', color: '#78350f' },
    Awkward: { backgroundColor: '#fff7ed', borderColor: '#ea580c', color: '#7c2d12' },
    Incorrect: { backgroundColor: '#fff1f2', borderColor: '#e11d48', color: '#881337' },
  };
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm"
      style={palette[rating] || { backgroundColor: '#f5f5f5', borderColor: '#737373', color: '#262626' }}
    >
      {rating}
    </span>
  );
}

function firstAvailableText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || '';
}

function resolveBetterVersion({ selectedOption, currentNode, currentNodeAudioPrefix }) {
  const zh = firstAvailableText(selectedOption?.correction);
  if (!zh) return null;

  const options = Array.isArray(currentNode?.options) ? currentNode.options : [];
  const matchingOption = options.find((option) => option?.zh === zh) || null;
  const matchingNaturalOption = options.find(
    (option) => option?.rating === 'Natural' && option?.zh === zh
  ) || null;
  const sourceOption = matchingOption || matchingNaturalOption;
  const authoredDetails = BETTER_VERSION_TRANSLATIONS[zh] || {};
  const legacyDetails = CHAPTER6_CORRECTION_DETAILS[zh] || {};
  const audioRole = firstAvailableText(sourceOption?.rating, selectedOption?.rating, 'correction').toLowerCase();

  return {
    zh,
    py: firstAvailableText(
      selectedOption?.correctionPy,
      authoredDetails.correctionPy,
      sourceOption?.py,
      legacyDetails.py
    ),
    en: firstAvailableText(
      selectedOption?.correctionEn,
      authoredDetails.correctionEn,
      sourceOption?.en,
      legacyDetails.en
    ),
    audioText: zh,
    audioId: firstAvailableText(
      selectedOption?.correctionAudioId,
      selectedOption?.betterVersionAudioId,
      `${currentNodeAudioPrefix}.correction.${audioRole}`
    ),
  };
}

function SceneMetricBar({ icon: Icon, label, value, previousValue, tone }) {
  const changed = Number.isFinite(previousValue);
  const delta = changed ? value - previousValue : 0;
  const colors = tone === 'amber'
    ? {
        icon: 'text-amber-700',
        track: 'bg-amber-100',
        fill: 'bg-amber-500',
        delta: delta >= 0 ? 'text-amber-800' : 'text-rose-700',
      }
    : {
        icon: 'text-indigo-700',
        track: 'bg-indigo-100',
        fill: 'bg-indigo-500',
        delta: delta >= 0 ? 'text-indigo-800' : 'text-rose-700',
      };

  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2 font-semibold text-[#2b241f]">
          <Icon className={`h-4 w-4 shrink-0 ${colors.icon}`} />
          <span>{label}</span>
        </div>
        <div className="shrink-0 font-semibold tabular-nums text-[#2b241f]" aria-live="polite">
          {changed ? (
            <span className="flex items-center gap-1.5">
              <span className="text-neutral-500">{previousValue}</span>
              <span aria-hidden="true">→</span>
              <span>{value}</span>
              <span className={`rounded-full bg-white px-1.5 py-0.5 text-[11px] ${colors.delta}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            </span>
          ) : value}
        </div>
      </div>
      <div className={`h-2.5 overflow-hidden rounded-full ${colors.track}`}>
        <motion.div
          key={`${previousValue ?? value}-${value}`}
          initial={{ width: `${changed ? previousValue : value}%` }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors.fill}`}
        />
      </div>
    </div>
  );
}

function StorySceneMetrics({ metrics, transition = null, compact = false }) {
  return (
    <section
      className={`grid gap-3 rounded-[22px] border border-[#e7dccd] bg-[#fffaf3]/75 ${compact ? 'p-3 sm:grid-cols-2' : 'p-4 md:grid-cols-2'}`}
      aria-label="Current scene metrics"
    >
      <SceneMetricBar
        icon={Heart}
        label="Social comfort"
        value={metrics.socialComfort}
        previousValue={transition?.previousMetrics.socialComfort}
        tone="amber"
      />
      <SceneMetricBar
        icon={Sparkles}
        label="Naturalness"
        value={metrics.naturalness}
        previousValue={transition?.previousMetrics.naturalness}
        tone="indigo"
      />
    </section>
  );
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

function AnnotatedText({ text, primaryKeys = [], recycledKeys = [], onOpen, className = '', groupClauses = false, dark = false }) {
  const tokens = [
    ...primaryKeys.slice(0, 3).map((key) => ({ key, tone: 'primary' })),
    ...recycledKeys.map((key) => ({ key, tone: 'recycled' })),
  ]
    .map((token) => ({ ...token, start: text.indexOf(token.key) }))
    .filter((token) => token.start >= 0)
    .sort((a, b) => a.start - b.start || b.key.length - a.key.length || (a.tone === 'primary' ? -1 : 1));

  if (!tokens.length) return <span className={className}>{text}</span>;

  const parts = [];
  let cursor = 0;

  tokens.forEach(({ key, tone, start }, index) => {
    if (start < cursor) return;
    if (start > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, start), id: `t-${index}-${cursor}` });
    }
    parts.push({ type: 'token', value: key, tone, id: `k-${index}-${start}` });
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
            className={part.tone === 'primary'
              ? 'rounded-md bg-[#dbe8f6] px-1 py-0.5 font-semibold text-[#1f4e79] underline decoration-dotted underline-offset-4 transition hover:bg-[#c9dced]'
              : `rounded-sm border-b border-dashed px-0.5 py-0.5 font-medium underline-offset-4 transition ${dark ? 'border-white/55 bg-white/10 text-white hover:bg-white/15' : 'border-[#91a4b6] bg-[#eef3f7]/65 text-[#526779] hover:bg-[#e2eaf0]'}`}
          >
            {part.value}
          </button>
        ) : (
          <React.Fragment key={part.id}>
            {groupClauses
              ? part.value.split(/([。！？])/).map((segment, segmentIndex) => (
                  <React.Fragment key={`${part.id}-${segmentIndex}`}>
                    {segment}
                    {/[。！？]/.test(segment) && text.indexOf(segment) < text.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))
              : <span>{part.value}</span>}
          </React.Fragment>
        )
      )}
    </span>
  );
}

function splitChineseClauses(text = '') {
  return text.match(/[^。！？]+[。！？]?/g)?.map((clause) => clause.trim()).filter(Boolean) || [text];
}

function splitPinyinClauses(text = '') {
  return text.match(/[^.!?]+[.!?]?/g)?.map((clause) => clause.trim()).filter(Boolean) || [text];
}

function StoryLanguageStack({
  zh,
  py,
  en,
  showPinyin,
  showEnglish,
  primaryKeys = [],
  recycledKeys = [],
  onOpen,
  chineseClassName,
  pinyinClassName,
  englishClassName,
  alignClauses = false,
  dark = false,
}) {
  const chineseClauses = splitChineseClauses(zh);
  const pinyinClauses = splitPinyinClauses(py);
  const safelyAligned = alignClauses && chineseClauses.length > 1 && chineseClauses.length === pinyinClauses.length;

  return (
    <div className={safelyAligned ? 'space-y-2.5' : ''}>
      {safelyAligned ? chineseClauses.map((clause, index) => (
        <div key={`${clause}-${index}`} className="space-y-1">
          <div className={chineseClassName}>
            <AnnotatedText
              text={clause}
              primaryKeys={primaryKeys}
              recycledKeys={recycledKeys}
              onOpen={onOpen}
              dark={dark}
            />
          </div>
          {showPinyin && <div className={pinyinClassName}>{pinyinClauses[index]}</div>}
        </div>
      )) : (
        <>
          <div className={chineseClassName}>
            <AnnotatedText
              text={zh}
              primaryKeys={primaryKeys}
              recycledKeys={recycledKeys}
              onOpen={onOpen}
              dark={dark}
            />
          </div>
          {showPinyin && <div className={pinyinClassName}>{py}</div>}
        </>
      )}
      {showEnglish && <div className={englishClassName}>{en}</div>}
    </div>
  );
}

function hasCompleteTeacherNoteLanguage(item) {
  return ['zh', 'py', 'en', 'audioText']
    .every((field) => typeof item?.[field] === 'string' && item[field].trim());
}

function TeacherNoteLanguageRow({ item, kind = 'term' }) {
  if (!hasCompleteTeacherNoteLanguage(item)) return null;
  const dataProps = kind === 'pattern'
    ? { 'data-note-pattern': item.zh }
    : kind === 'example'
    ? { 'data-note-example': item.zh }
    : { 'data-note-term': item.zh };

  return (
    <div {...dataProps} className="min-w-0 border-t border-indigo-100/80 py-2.5 first:border-t-0">
      {kind !== 'term' && (
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700/70">
          {kind === 'pattern' ? 'Pattern' : 'Example'}
        </div>
      )}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 break-words text-[15px] font-semibold leading-snug text-[#2b241f]">{item.zh}</div>
        <AudioButton text={item.audioText} small />
      </div>
      <div className="mt-1 min-w-0 break-words text-xs leading-5 text-neutral-600">
        <span className="text-indigo-700/75">{item.py}</span>
        <span aria-hidden="true"> · </span>
        <span>{item.en}</span>
      </div>
    </div>
  );
}

function TeacherNoteKeyLanguage({
  support,
  expanded = false,
  onToggle,
  disclosure = false,
  showExample = true,
}) {
  const completeTerms = (support?.terms || []).filter(hasCompleteTeacherNoteLanguage);
  const pattern = hasCompleteTeacherNoteLanguage(support?.pattern) ? support.pattern : null;
  const example = showExample && hasCompleteTeacherNoteLanguage(support?.example) ? support.example : null;
  const supportCount = completeTerms.length + Number(Boolean(pattern)) + Number(Boolean(example));
  if (supportCount === 0) return null;

  const reviewCount = completeTerms.length || supportCount;
  if (disclosure && !expanded) {
    return (
      <button
        type="button"
        data-key-language-disclosure
        onClick={onToggle}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/45 px-3 py-2 text-left text-sm font-semibold text-indigo-800"
        aria-expanded="false"
      >
        <span>Review key language ({reviewCount})</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>
    );
  }

  const visibleTerms = disclosure || expanded ? completeTerms : completeTerms.slice(0, 2);
  const hiddenTermCount = Math.max(0, completeTerms.length - visibleTerms.length);

  return (
    <section data-teacher-note-key-language className="min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/35 px-3 py-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Key language</div>
        {disclosure && (
          <button type="button" onClick={onToggle} className="flex min-h-8 items-center gap-1 text-xs font-semibold text-indigo-700" aria-expanded="true">
            Hide
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="min-w-0">
        {visibleTerms.map((term) => (
          <TeacherNoteLanguageRow key={`${term.zh}-${term.py}`} item={term} />
        ))}
        {!disclosure && completeTerms.length > 2 && (
          <button
            type="button"
            onClick={onToggle}
            className="min-h-8 border-t border-indigo-100/80 py-1.5 text-xs font-semibold text-indigo-700"
          >
            {expanded ? 'Show fewer' : `Show ${hiddenTermCount} more`}
          </button>
        )}
        {pattern && <TeacherNoteLanguageRow item={pattern} kind="pattern" />}
        {example && <TeacherNoteLanguageRow item={example} kind="example" />}
      </div>
    </section>
  );
}

function MemoryMomentCard({ moment, target, state = {}, onChange, onDismiss }) {
  if (!moment || !target) return null;
  const contextZh = moment.contextZh || moment.npcContext;
  const contextPy = moment.contextPy || moment.npcContextPy;
  const contextEn = moment.contextEn || moment.npcContextEn;
  const contextAudioText = moment.contextAudioText || contextZh;
  const taskPrompt = moment.taskPrompt || moment.prompt;

  return (
    <section className="rounded-[22px] border border-indigo-100 bg-indigo-50/45 p-4 text-left shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">{moment.label}</div>
          <p className="mt-1 text-sm leading-6 text-neutral-600">Recall the language before asking for support.</p>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="min-h-9 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-600">
            Not now
          </button>
        )}
      </div>
      {contextZh && (
        <div className="mt-3 rounded-2xl border border-indigo-100 bg-white/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold leading-snug text-[#2b241f]">{contextZh}</p>
            <AudioButton text={contextAudioText} small />
          </div>
          {state.showPinyin && contextPy && <p className="mt-2 text-sm leading-6 text-neutral-500">{contextPy}</p>}
          {state.showEnglish && contextEn && <p className="mt-1 text-sm leading-6 text-neutral-700">{contextEn}</p>}
        </div>
      )}
      <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">{taskPrompt}</p>
      {moment.patternCueZh && (
        <div className="mt-2 rounded-xl bg-indigo-100/65 px-3 py-2">
          <p className="font-semibold text-indigo-950">{moment.patternCueZh}</p>
          {state.showPinyin && moment.patternCuePy && <p className="mt-1 text-sm text-indigo-700/75">{moment.patternCuePy}</p>}
          {state.showEnglish && moment.patternCueEn && <p className="mt-1 text-sm text-neutral-700">{moment.patternCueEn}</p>}
        </div>
      )}
      {!state.firstClue && (
        <button type="button" onClick={() => onChange({ ...state, firstClue: true })} className="mt-3 min-h-10 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">
          Show first clue
        </button>
      )}
      {state.firstClue && (
        <>
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-indigo-900"><span className="font-semibold">First clue:</span> {moment.firstClue}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onChange({ ...state, showPinyin: !state.showPinyin })} className={`min-h-10 rounded-full border px-3 py-2 text-xs font-semibold ${state.showPinyin ? 'border-indigo-300 bg-indigo-100 text-indigo-950' : 'border-[#d8cbb8] bg-white text-neutral-600'}`} aria-pressed={Boolean(state.showPinyin)}>
              Memory Pinyin {state.showPinyin ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={() => onChange({ ...state, showEnglish: !state.showEnglish })} className={`min-h-10 rounded-full border px-3 py-2 text-xs font-semibold ${state.showEnglish ? 'border-amber-300 bg-amber-100 text-amber-950' : 'border-[#d8cbb8] bg-white text-neutral-600'}`} aria-pressed={Boolean(state.showEnglish)}>
              Memory English {state.showEnglish ? 'On' : 'Off'}
            </button>
            {!state.revealed && (
              <button type="button" onClick={() => onChange({ ...state, revealed: true })} className="min-h-10 rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-950">
                Reveal answer
              </button>
            )}
          </div>
        </>
      )}
      {state.revealed && (
        <div className="mt-3 rounded-2xl border border-indigo-100 bg-white/80 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-semibold leading-snug text-[#2b241f]">{target.zh}</p>
            <AudioButton text={target.audioText} small />
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{target.py}</p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{target.en}</p>
        </div>
      )}
    </section>
  );
}

function SayBeforeRevealCard({ target, prompt, state = {}, onChange, onDismiss }) {
  if (!target || !prompt) return null;
  return (
    <section className="rounded-[22px] border border-amber-200 bg-amber-50/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Say before reveal</div>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{prompt}</p>
        </div>
        <button type="button" onClick={onDismiss} className="min-h-9 rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-600">Not now</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!state.said && (
          <button type="button" onClick={() => onChange({ ...state, said: true })} className="min-h-10 rounded-full bg-[#2b241f] px-4 py-2 text-sm font-semibold text-white">I said it</button>
        )}
        {state.said && !state.revealed && (
          <button type="button" onClick={() => onChange({ ...state, revealed: true })} className="min-h-10 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950">Reveal model reply</button>
        )}
      </div>
      {state.revealed && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-white/80 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-semibold leading-snug text-[#2b241f]">{target.zh}</p>
            <AudioButton text={target.audioText} small />
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{target.py}</p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{target.en}</p>
        </div>
      )}
    </section>
  );
}

function FeedbackModal({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] bg-[#fffaf3] p-4 shadow-[0_-18px_50px_rgba(43,36,31,0.24)] sm:p-5 md:max-w-2xl md:rounded-[30px] md:p-6 md:shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d8c9b8] md:hidden" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-full border border-[#d8cbb8] bg-white/85 p-2 text-[#6f6257] transition hover:bg-[#fff8ef] hover:text-[#2b241f] sm:right-4 sm:top-4"
              aria-label="Close feedback"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BetterVersionPanel({
  betterVersion,
  open,
  showPinyin,
  showEnglish,
  onToggleOpen,
  onTogglePinyin,
  onToggleEnglish,
}) {
  if (!betterVersion) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-[#d8cbb8] bg-white/60">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-[#2b241f]">Try this more natural version</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onTogglePinyin} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${showPinyin ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-[#d8cbb8] bg-white/70 text-[#6f6257]'}`} aria-pressed={showPinyin}>
            Pinyin {showPinyin ? 'On' : 'Off'}
          </button>
          <button type="button" onClick={onToggleEnglish} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${showEnglish ? 'border-indigo-300 bg-indigo-50 text-indigo-900' : 'border-[#d8cbb8] bg-white/70 text-[#6f6257]'}`} aria-pressed={showEnglish}>
            English {showEnglish ? 'On' : 'Off'}
          </button>
          <button type="button" onClick={onToggleOpen} className="flex items-center gap-1 rounded-full border border-[#d8cbb8] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#6f6257] transition hover:bg-[#fff8ef]" aria-expanded={open}>
            {open ? 'Close' : 'Open'}
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="overflow-hidden">
            <div className="border-t border-[#e7dccd] px-4 pb-4 pt-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xl font-semibold leading-snug text-[#2b241f]">{betterVersion.zh}</p>
                <AudioButton audioId={betterVersion.audioId} text={betterVersion.audioText} small />
              </div>
              {showPinyin && betterVersion.py && <p className="mt-2 text-sm leading-6 text-neutral-500">{betterVersion.py}</p>}
              {showEnglish && betterVersion.en && <p className="mt-1 text-sm leading-6 text-neutral-700">{betterVersion.en}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EndingLanguageSection({ ending, showPinyin, showEnglish, onTogglePinyin, onToggleEnglish, children }) {
  if (!hasCompleteEnding(ending)) return null;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-200/70 px-4 py-3 sm:px-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Your conversation ending</div>
          <h4 className="mt-1 text-xl font-semibold text-[#25222f]">{ending.label}</h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onTogglePinyin} className={`min-h-9 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${showPinyin ? 'border-indigo-300 bg-indigo-100 text-indigo-950' : 'border-[#d8cbb8] bg-white/75 text-neutral-600'}`} aria-pressed={showPinyin}>Ending Pinyin {showPinyin ? 'On' : 'Off'}</button>
          <button type="button" onClick={onToggleEnglish} className={`min-h-9 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${showEnglish ? 'border-amber-300 bg-amber-100 text-amber-950' : 'border-[#d8cbb8] bg-white/75 text-neutral-600'}`} aria-pressed={showEnglish}>Ending English {showEnglish ? 'On' : 'Off'}</button>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold leading-snug text-[#211f2c]">{ending.zh}</p>
          <AudioButton text={ending.zh} small />
        </div>
        {showPinyin && <p className="text-sm leading-6 text-indigo-700/75">{ending.py}</p>}
        {showEnglish && <p className="text-sm leading-6 text-neutral-700">{ending.en}</p>}
        {children}
      </div>
    </>
  );
}

function MemoryReplayPanel({ items, index, state, onStateChange, onIndexChange, onClose }) {
  const current = items[index];
  if (!current) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-indigo-200/70 bg-[#fffaf3]/80">
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Memory replay</div>
            <div className="mt-0.5 text-sm text-neutral-600">Story moment {index + 1}/{items.length}</div>
          </div>
          <button type="button" onClick={onClose} className="min-h-9 rounded-full border border-[#d8cbb8] bg-white px-3 py-1 text-xs font-semibold text-neutral-600">Close replay</button>
        </div>
        <MemoryMomentCard moment={current.moment} target={current.target} state={state} onChange={onStateChange} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="min-h-10 rounded-2xl" disabled={index === 0} onClick={() => onIndexChange(Math.max(0, index - 1))}>Previous moment</Button>
          <Button variant="outline" className="min-h-10 rounded-2xl" disabled={index === items.length - 1} onClick={() => onIndexChange(Math.min(items.length - 1, index + 1))}>Next moment</Button>
        </div>
      </div>
    </motion.div>
  );
}

function AppSectionButton({ active, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-full px-4 py-3 text-left transition ${
        active
          ? 'bg-[#2b241f] text-white shadow-sm'
          : 'text-[#6f6257] hover:bg-[#f3eadf] hover:text-[#2b241f]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${active ? 'bg-white/15' : 'bg-[#fffaf3]'}`}>
          <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-[#6f6257]'}`} />
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#2b241f]'}`}>{title}</div>
          <div className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-neutral-600'}`}>{subtitle}</div>
        </div>
      </div>
    </button>
  );
}
function MobileTabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2.5 text-xs transition active:scale-95 ${
        active
          ? 'bg-[#2b241f] text-white shadow-[0_10px_24px_rgba(43,36,31,0.25)]'
          : 'text-[#7a6d61] hover:bg-[#f3eadf]'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="max-w-full text-[10px] font-medium leading-none sm:text-[11px]">{label}</span>
    </button>
  );
}

export default function ChapterUIPrototype() {
  const persisted = useMemo(() => readPilotState(), []);
  const persistedChapterIndex = clampArrayIndex(persisted?.currentChapterIndex, chapters.length);
  const persistedNodeSelections = persisted?.nodeSelections && typeof persisted.nodeSelections === 'object'
    ? persisted.nodeSelections
    : {};
  const persistedNodeIndex = normalizeRestoredNodeIndex(
    persistedChapterIndex,
    persisted?.currentNodeIndex,
    persistedNodeSelections
  );

  const [currentView, setCurrentView] = useState(persisted?.currentView || 'home');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(persistedChapterIndex);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(persistedNodeIndex);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [nodeSelections, setNodeSelections] = useState(persistedNodeSelections);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sceneRun, setSceneRun] = useState(() => restoreSceneRunFromSelections(
    chapters[persistedChapterIndex],
    persistedChapterIndex,
    persistedNodeSelections
  ));
  const [betterVersionOpen, setBetterVersionOpen] = useState(true);
  const [betterVersionShowPinyin, setBetterVersionShowPinyin] = useState(true);
  const [betterVersionShowEnglish, setBetterVersionShowEnglish] = useState(true);
  const [revealedOptionMeanings, setRevealedOptionMeanings] = useState({});
  const [optionAssistanceByDecision, setOptionAssistanceByDecision] = useState({});
  const [memoryMomentState, setMemoryMomentState] = useState({});
  const [sayBeforeRevealState, setSayBeforeRevealState] = useState({});
  const [memoryReplayOpen, setMemoryReplayOpen] = useState(false);
  const [memoryReplayIndex, setMemoryReplayIndex] = useState(0);
  const [memoryReplayHintState, setMemoryReplayHintState] = useState({});
  const [endingShowPinyin, setEndingShowPinyin] = useState(true);
  const [endingShowEnglish, setEndingShowEnglish] = useState(true);
  const [glossaryExamplesExpanded, setGlossaryExamplesExpanded] = useState(false);
  const [showPinyin, setShowPinyin] = useState(persisted?.showPinyin ?? true);
  const [showEnglish, setShowEnglish] = useState(persisted?.showEnglish ?? true);
  const [notesShowPinyin, setNotesShowPinyin] = useState(true);
  const [notesShowEnglish, setNotesShowEnglish] = useState(true);
  const [reviewShowPinyin, setReviewShowPinyin] = useState(true);
  const [reviewShowEnglish, setReviewShowEnglish] = useState(true);
  const [trust, setTrust] = useState(persisted?.trust || 30);
  const [mastery, setMastery] = useState(persisted?.mastery || 12);
  const [collected, setCollected] = useState(persisted?.collected || persisted?.collectedItems || []);
  const [practiceLog, setPracticeLog] = useState(persisted?.practiceLog || []);
  const [activeNoteId, setActiveNoteId] = useState(persisted?.activeNoteId || chapters[0].grammarNotes[0].id);
  const [selectedGlossaryKey, setSelectedGlossaryKey] = useState(null);
  const [glossaryShowPinyin, setGlossaryShowPinyin] = useState(true);
  const [glossaryShowEnglish, setGlossaryShowEnglish] = useState(true);
  const [quickExamplesShowPinyin, setQuickExamplesShowPinyin] = useState(persisted?.quickExamplesShowPinyin ?? true);
  const [quickExamplesShowEnglish, setQuickExamplesShowEnglish] = useState(persisted?.quickExamplesShowEnglish ?? true);
  const [focusedTeacherNotesOpen, setFocusedTeacherNotesOpen] = useState(false);
  const [teacherQuickExamplesExpanded, setTeacherQuickExamplesExpanded] = useState(false);
  const [teacherKeyLanguageExpanded, setTeacherKeyLanguageExpanded] = useState(false);
  const [feedbackKeyLanguageExpanded, setFeedbackKeyLanguageExpanded] = useState(false);
  const [audioRate, setAudioRate] = useState(persisted?.audioRate ?? 0.75);
  const [fontScale, setFontScale] = useState(persisted?.fontScale || 'md');
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [showChangeNewPassword, setShowChangeNewPassword] = useState(false);
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [showChangeConfirmPassword, setShowChangeConfirmPassword] = useState(false);
  const [syncStatus, setSyncStatus] = useState(supabase ? 'Guest mode. Progress is saved on this device.' : 'Cloud sync is not configured.');
  const [cloudSyncReady, setCloudSyncReady] = useState(false);
  const [pendingCloudState, setPendingCloudState] = useState(null);
  const appStateRef = useRef(null);
  const selectedOptionRestoreRef = useRef({
    chapterIndex: null,
    nodeIndex: null,
    committedOptionId: undefined,
  });

  const makeNodeKey = (chapterIndex, nodeIndex) => `${chapterIndex}-${nodeIndex}`;

  const chineseHeadingClass = fontScale === 'sm' ? 'text-xl' : fontScale === 'lg' ? 'text-3xl' : 'text-2xl';
  const chineseOptionClass = fontScale === 'sm' ? 'text-base' : fontScale === 'lg' ? 'text-xl' : 'text-lg';
  const glossaryTitleClass = fontScale === 'sm' ? 'text-xl' : fontScale === 'lg' ? 'text-3xl' : 'text-2xl';

  const safeCurrentChapterIndex = clampArrayIndex(currentChapterIndex, chapters.length);
  const currentChapter = chapters[safeCurrentChapterIndex] || chapters[0];
  const safeCurrentNodeIndex = clampArrayIndex(currentNodeIndex, currentChapter?.nodes?.length || 0);
  const earliestIncompletePriorDecisionIndex = useMemo(() => {
    for (let decisionIndex = 0; decisionIndex < safeCurrentNodeIndex; decisionIndex += 1) {
      const optionId = nodeSelections[`${safeCurrentChapterIndex}-${decisionIndex}`];
      if (!optionId || sceneRun[decisionIndex]?.optionId !== optionId) return decisionIndex;
    }
    return -1;
  }, [nodeSelections, safeCurrentChapterIndex, safeCurrentNodeIndex, sceneRun]);
  const baseCurrentNode = currentChapter?.nodes?.[safeCurrentNodeIndex] || {
    id: 0,
    mission: '',
    npc: '',
    npcLineZh: '',
    npcLinePy: '',
    npcLineEn: '',
    npcGlossary: [],
    options: [],
  };
  const currentChapterSupport = useMemo(() => getChapterSupport(currentChapter), [currentChapter.id]);
  const decisionSupport = currentChapterSupport.stageSupport?.decisionSupport?.[baseCurrentNode.id] || null;
  const currentMemory = resolveMemoryMoment(currentChapterSupport.memoryMoments, baseCurrentNode.id);
  const currentMemoryMoment = currentMemory?.moment || null;
  const currentMemoryTarget = currentMemory?.target || null;
  const sayBeforeRevealConfig = currentChapterSupport.sayBeforeReveal;
  const replayMemoryItems = useMemo(
    () => getCompleteMemoryReplay(currentChapterSupport.memoryReplay),
    [currentChapterSupport.memoryReplay]
  );
  const supportsBranchingScene = Boolean(currentChapterSupport.branchingSupport);
  const sceneMetricsBeforeCurrent = useMemo(() => {
    if (!supportsBranchingScene) return { socialComfort: 50, naturalness: 50 };
    const earlierChoices = Object.fromEntries(
      Object.entries(sceneRun).filter(([key]) => Number(key) < safeCurrentNodeIndex)
    );
    return calculateSceneRunMetrics(earlierChoices);
  }, [supportsBranchingScene, safeCurrentNodeIndex, sceneRun]);
  const activeStoryBranch = useMemo(() => {
    if (!supportsBranchingScene) return null;
    if (earliestIncompletePriorDecisionIndex >= 0) return null;
    const branchingSupport = currentChapterSupport.branchingSupport;
    const branchNodes = branchingSupport.nodes;
    if (branchingSupport.mode === 'chapter1-roommate') {
      if (safeCurrentNodeIndex === 1 || safeCurrentNodeIndex === 3 || safeCurrentNodeIndex === 4) {
        const sourceIndex = safeCurrentNodeIndex === 1 ? 0 : safeCurrentNodeIndex - 1;
        const rating = sceneRun[sourceIndex]?.rating;
        if (!['Natural', 'Stiff', 'Awkward', 'Incorrect'].includes(rating)) return null;
        const tier = rating === 'Natural' ? 'strong' : rating === 'Stiff' ? 'mixed' : 'weak';
        return branchNodes[`decision${safeCurrentNodeIndex + 1}`]?.[tier] || null;
      }
      if (safeCurrentNodeIndex === 5) {
        const thresholds = branchingSupport.finalThresholds;
        const tier = sceneMetricsBeforeCurrent.socialComfort >= thresholds.strongComfort
          && sceneMetricsBeforeCurrent.naturalness >= thresholds.strongNaturalness
          ? 'strong'
          : sceneMetricsBeforeCurrent.socialComfort >= thresholds.mixedComfort
            && sceneMetricsBeforeCurrent.naturalness >= thresholds.mixedNaturalness
          ? 'mixed'
          : 'weak';
        return branchNodes.decision6?.[tier] || null;
      }
      return null;
    }
    if (safeCurrentNodeIndex === 3) {
      const tier = sceneMetricsBeforeCurrent.naturalness >= 65
        ? 'high'
        : sceneMetricsBeforeCurrent.naturalness >= 40
        ? 'medium'
        : 'low';
      return branchNodes.decision4?.[tier] || null;
    }
    if (safeCurrentNodeIndex === 4 || safeCurrentNodeIndex === 5) {
      const tier = sceneMetricsBeforeCurrent.naturalness >= 65 && sceneMetricsBeforeCurrent.socialComfort >= 65
        ? 'strong'
        : sceneMetricsBeforeCurrent.naturalness >= 40 && sceneMetricsBeforeCurrent.socialComfort >= 40
        ? 'mixed'
        : 'weak';
      return branchNodes[safeCurrentNodeIndex === 4 ? 'decision5' : 'decision6']?.[tier] || null;
    }
    return null;
  }, [currentChapterSupport.branchingSupport, earliestIncompletePriorDecisionIndex, safeCurrentNodeIndex, sceneMetricsBeforeCurrent, sceneRun, supportsBranchingScene]);
  const currentNode = useMemo(() => {
    if (!activeStoryBranch) return baseCurrentNode;
    return {
      ...baseCurrentNode,
      ...activeStoryBranch,
      options: activeStoryBranch.options || baseCurrentNode.options,
    };
  }, [activeStoryBranch, baseCurrentNode]);
  const activeSayBeforeRevealConfig = sayBeforeRevealConfig?.decision === baseCurrentNode.id
    ? sayBeforeRevealConfig.byBranch?.[currentNode.branchKey] || sayBeforeRevealConfig
    : null;
  const sayBeforeRevealTarget = activeSayBeforeRevealConfig
    ? findCompleteMemoryTarget(
        currentChapterSupport.memoryMoments?.targets || currentChapterSupport.memoryReplay?.targets,
        activeSayBeforeRevealConfig.targetId
      )
    : null;
  const currentSpeaker = useMemo(
    () => resolveSpeakerHeader(currentChapter, currentNode),
    [currentChapter, currentNode]
  );
  const currentDeviceLabel = useMemo(() => getCurrentDeviceLabel(), []);
  const displayOptions = useMemo(() => {
    const shuffled = shuffleArray(Array.isArray(currentNode.options) ? currentNode.options : []);
    const labels = ['A', 'B', 'C', 'D'];
    return shuffled.map((option, index) => ({
      ...option,
      displayId: labels[index] || option.id,
    }));
  }, [currentNode, safeCurrentChapterIndex, safeCurrentNodeIndex]);
  const npcHighlightTiers = resolveStoryHighlightTiers({
    chapterId: currentChapter.id,
    nodeId: baseCurrentNode.id,
    text: currentNode.npcLineZh,
    decisionSupport,
  });
  const selectedOption = useMemo(
    () => (Array.isArray(currentNode.options) ? currentNode.options : []).find((o) => o.id === selectedOptionId) || null,
    [currentNode, selectedOptionId]
  );
  const currentNodeKey = makeNodeKey(safeCurrentChapterIndex, safeCurrentNodeIndex);
  const committedChoice = sceneRun[safeCurrentNodeIndex] || null;
  const committedOptionId = committedChoice?.optionId || null;
  const committedOption = useMemo(() => {
    if (!committedOptionId) return null;
    return (Array.isArray(currentNode.options) ? currentNode.options : [])
      .find((option) => option.id === committedOptionId) || null;
  }, [committedOptionId, currentNode]);
  const hasSelectedDraft = Boolean(selectedOption);
  const isCurrentReplySubmitted = Boolean(
    committedChoice
    && hasSelectedDraft
    && committedOptionId === selectedOptionId
  );
  const hasUnsubmittedDraft = Boolean(
    hasSelectedDraft
    && (!committedChoice || committedOptionId !== selectedOptionId)
  );
  const isUpdatingSubmittedReply = Boolean(committedChoice && hasUnsubmittedDraft);
  const currentNodeAudioPrefix = `${currentChapter.id}.node${currentNode.id}${currentNode.branchKey ? `.${currentNode.branchKey}` : ''}`;
  const currentAssistanceDecisionKey = `${currentChapter.id}:${safeCurrentNodeIndex}`;
  const optionEnglishRevealCount = Object.values(optionAssistanceByDecision)
    .reduce((total, optionIds) => total + optionIds.length, 0);
  const optionEnglishDecisionCount = Object.keys(optionAssistanceByDecision).length;
  const completionSupportLabel = optionEnglishRevealCount > 0
    ? 'English-supported'
    : showPinyin
    ? 'Pinyin-supported'
    : 'Independent';
  const sceneMetrics = useMemo(() => calculateSceneRunMetrics(sceneRun), [sceneRun]);
  const latestSceneRating = sceneRun[safeCurrentNodeIndex]?.rating || null;
  const sceneMetricTransition = showFeedback ? sceneRun[safeCurrentNodeIndex] || null : null;
  const submittedSceneDeltas = sceneMetricTransition
    ? {
        socialComfort: sceneMetricTransition.newMetrics.socialComfort - sceneMetricTransition.previousMetrics.socialComfort,
        naturalness: sceneMetricTransition.newMetrics.naturalness - sceneMetricTransition.previousMetrics.naturalness,
      }
    : null;
  const betterVersion = useMemo(
    () => currentChapterSupport.betterVersionSupport
      ? resolveBetterVersion({ selectedOption, currentNode, currentNodeAudioPrefix })
      : null,
    [currentChapterSupport.betterVersionSupport, currentNode, currentNodeAudioPrefix, selectedOption]
  );
  const activeNote = currentChapter.grammarNotes.find((note) => note.id === activeNoteId) || currentChapter.grammarNotes[0];
  const primaryTeacherNote = decisionSupport
    ? currentChapter.grammarNotes.find((note) => decisionSupport.primaryNoteIds.includes(note.id)) || currentChapter.grammarNotes[0]
    : null;
  const visibleTeacherNote = primaryTeacherNote && (!focusedTeacherNotesOpen || activeNote.id === primaryTeacherNote.id)
    ? primaryTeacherNote
    : activeNote;
  const additionalTeacherNotes = primaryTeacherNote
    ? currentChapter.grammarNotes.filter((note) => note.id !== primaryTeacherNote.id)
    : [];
  const visibleTeacherNoteExamples = Array.isArray(visibleTeacherNote.examples) ? visibleTeacherNote.examples : [];
  const visibleTeacherNoteSupport = getTeacherNoteSupport(currentChapter, visibleTeacherNote);
  const visibleQuickExamples = currentChapterSupport.teacherNoteSupport.progressiveExamples && !teacherQuickExamplesExpanded
    ? visibleTeacherNoteExamples.slice(0, 2)
    : visibleTeacherNoteExamples;
  const stageTransition = currentChapterSupport.stageSupport && sceneRun[safeCurrentNodeIndex]
    ? currentChapterSupport.stageSupport.transitions?.[baseCurrentNode.id] || null
    : null;
  const selectedGlossary = selectedGlossaryKey ? glossary[selectedGlossaryKey] : null;
  const selectedGlossaryExamples = getCompleteGlossaryExamples(selectedGlossary);
  const glossaryExamplePolicy = currentChapterSupport.glossaryExamplePolicy;
  const glossaryExamplesForDisplay = selectedGlossaryExamples.slice(0, glossaryExamplePolicy.requiredCount);
  const canExpandGlossaryExamples = selectedGlossaryExamples.length === glossaryExamplePolicy.requiredCount
    && selectedGlossary?.examples?.length === glossaryExamplePolicy.requiredCount;
  const visibleGlossaryExamples = glossaryExamplesExpanded
    ? glossaryExamplesForDisplay
    : glossaryExamplesForDisplay.slice(0, glossaryExamplePolicy.initiallyVisible);

  useEffect(() => {
    if (!primaryTeacherNote) return;
    setActiveNoteId(primaryTeacherNote.id);
    setFocusedTeacherNotesOpen(false);
    setTeacherQuickExamplesExpanded(false);
  }, [primaryTeacherNote?.id]);

  useEffect(() => {
    setTeacherKeyLanguageExpanded(false);
  }, [currentChapter.id, visibleTeacherNote?.id]);

  useEffect(() => {
    setFeedbackKeyLanguageExpanded(false);
  }, [showFeedback, selectedOption]);

  useEffect(() => {
    setRevealedOptionMeanings({});
    setMemoryMomentState({});
    setSayBeforeRevealState({});
  }, [safeCurrentChapterIndex, safeCurrentNodeIndex]);

  useEffect(() => {
    setMemoryReplayHintState({});
  }, [memoryReplayIndex]);

  useEffect(() => {
    setGlossaryExamplesExpanded(false);
  }, [selectedGlossaryKey]);

  const conversationEnding = useMemo(() => {
    const endingSupport = currentChapterSupport.endingLanguageSupport;
    const finalNodeIndex = Number(endingSupport?.finalDecision) - 1;
    if (!endingSupport || safeCurrentNodeIndex !== finalNodeIndex || !sceneRun[finalNodeIndex]) return null;
    const incorrectCount = Object.values(sceneRun).filter((choice) => choice.rating === 'Incorrect').length;
    const thresholds = endingSupport.thresholds || {
      strongComfort: 70,
      strongNaturalness: 70,
      mixedComfort: 40,
      mixedNaturalness: 40,
    };
    const passesIncorrectGuard = endingSupport.useIncorrectGuard === false || incorrectCount < 2;
    const ending = sceneMetrics.socialComfort >= thresholds.strongComfort
      && sceneMetrics.naturalness >= thresholds.strongNaturalness
      && passesIncorrectGuard
      ? endingSupport.endings?.smooth
      : sceneMetrics.socialComfort >= thresholds.mixedComfort
        && sceneMetrics.naturalness >= thresholds.mixedNaturalness
        && passesIncorrectGuard
      ? endingSupport.endings?.clarified
      : endingSupport.endings?.delayed;
    if (!hasCompleteEnding(ending)) return null;
    const weakDecisions = Object.entries(sceneRun)
      .filter(([, choice]) => choice.rating !== 'Natural')
      .map(([index, choice]) => `Decision ${Number(index) + 1}: ${choice.rating}`);
    return {
      ...ending,
      explanation: weakDecisions.length > 0
        ? `Your path included ${weakDecisions.join(', ')}. Those choices produced the final scene values used for this ending.`
        : 'Six natural replies kept the request clear, cooperative, and easy to act on.',
    };
  }, [currentChapterSupport.endingLanguageSupport, safeCurrentNodeIndex, sceneMetrics, sceneRun]);

  useEffect(() => {
    if (!conversationEnding) return;
    setEndingShowPinyin(true);
    setEndingShowEnglish(true);
  }, [conversationEnding?.label]);

  const chapterDecisionTotal = currentChapter.nodes.length;
  const currentChapterSubmittedCount = currentChapter.nodes
    .filter((_, nodeIndex) => nodeSelections[makeNodeKey(safeCurrentChapterIndex, nodeIndex)])
    .length;
  const chapterProgress = chapterDecisionTotal > 0
    ? (currentChapterSubmittedCount / chapterDecisionTotal) * 100
    : 0;
  const overallProgress = ((safeCurrentChapterIndex + 1) / chapters.length) * 100;
  const isLastNode = chapterDecisionTotal > 0 && safeCurrentNodeIndex === chapterDecisionTotal - 1;
  const isLastChapter = safeCurrentChapterIndex === chapters.length - 1;
  const sceneResultTier = useMemo(() => {
    if (!currentChapterSupport.resultTierSupport || !isLastNode || !sceneRun[safeCurrentNodeIndex]) return null;
    const rewards = currentChapterSupport.resultTierSupport.rewards;
    const choices = Object.values(sceneRun);
    const incorrectCount = choices.filter((choice) => choice.rating === 'Incorrect').length;
    const naturalCount = choices.filter((choice) => choice.rating === 'Natural').length;
    const supportSummary = `${optionEnglishRevealCount} option meaning${optionEnglishRevealCount === 1 ? '' : 's'} across ${optionEnglishDecisionCount} decision${optionEnglishDecisionCount === 1 ? '' : 's'}`;
    if (sceneMetrics.socialComfort < 40 || sceneMetrics.naturalness < 40 || incorrectCount >= 2) {
      return { ...rewards.needsRepair, supportSummary, supportRule: 'Scene repair comes first; English help did not lower either scene metric.' };
    }
    if (sceneMetrics.socialComfort >= 80 && sceneMetrics.naturalness >= 80 && incorrectCount === 0 && naturalCount >= 2) {
      return optionEnglishRevealCount <= 1
        ? { ...rewards.nativeRecovery, supportSummary, supportRule: 'Tier 4 combines excellent scene results with no more than one English-option reveal.' }
        : { ...rewards.strongRecovery, supportSummary, supportRule: 'Excellent scene results earned Tier 3; replay with one or fewer English-option reveals to reach the language-reward Tier 4.' };
    }
    if (sceneMetrics.socialComfort >= 65 && sceneMetrics.naturalness >= 65 && incorrectCount < 2) {
      return optionEnglishRevealCount <= 2
        ? { ...rewards.strongRecovery, supportSummary, supportRule: 'Tier 3 combines strong scene results with no more than two English-option reveals.' }
        : { ...rewards.usefulRecovery, supportSummary, supportRule: 'The result stayed workable with support; replay with two or fewer English-option reveals for Tier 3.' };
    }
    return { ...rewards.usefulRecovery, supportSummary, supportRule: 'English help is allowed and never changes the scene result; stronger metrics or less support can raise the language-reward tier.' };
  }, [currentChapterSupport.resultTierSupport, sceneMetrics, sceneRun, safeCurrentNodeIndex, isLastNode, optionEnglishDecisionCount, optionEnglishRevealCount]);
  const chapterOverview = useMemo(() => {
    const overview = chapters.map((chapter, index) => {
      const completed = chapter.nodes.filter((_, nodeIndex) => nodeSelections[makeNodeKey(index, nodeIndex)]).length;
      const total = chapter.nodes.length;
      const status = completed === 0 ? 'Not started' : completed >= total ? 'Completed' : 'In progress';
      const action = status === 'Not started' ? 'Start' : status === 'Completed' ? 'Review' : 'Continue';
      return { chapter, index, completed, total, status, action };
    });
    const firstIncomplete = overview.find((item) => item.status !== 'Completed');
    return overview.map((item) => ({
      ...item,
      recommended: item.index === (firstIncomplete?.index ?? currentChapterIndex),
    }));
  }, [currentChapterIndex, nodeSelections]);

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

  const getReviewSourceOption = (item, text = item.selected) => {
    const sourceChapter = chapters.find((chapter) => chapter.shortTitle === item.chapter || chapter.title === item.chapter);
    const chapterPool = sourceChapter ? [sourceChapter] : chapters;
    for (const chapter of chapterPool) {
      for (const node of chapter.nodes) {
        if (item.mission && node.mission !== item.mission) continue;
        const option = node.options.find((candidate) => candidate.zh === text);
        if (option) return option;
      }
    }
    return null;
  };

  const appState = useMemo(() => ({
    currentView,
    currentChapterIndex: safeCurrentChapterIndex,
    currentNodeIndex: safeCurrentNodeIndex,
    showPinyin,
    showEnglish,
    trust,
    mastery,
    collected,
    collectedItems: collected,
    practiceLog,
    reviewItems,
    activeNoteId,
    quickExamplesShowPinyin,
    quickExamplesShowEnglish,
    audioRate,
    fontScale,
    nodeSelections,
  }), [
    currentView,
    safeCurrentChapterIndex,
    safeCurrentNodeIndex,
    showPinyin,
    showEnglish,
    trust,
    mastery,
    collected,
    practiceLog,
    reviewItems,
    activeNoteId,
    quickExamplesShowPinyin,
    quickExamplesShowEnglish,
    audioRate,
    fontScale,
    nodeSelections,
  ]);
  appStateRef.current = appState;

  useEffect(() => {
    if (earliestIncompletePriorDecisionIndex < 0) return;
    setCurrentNodeIndex(earliestIncompletePriorDecisionIndex);
    setShowFeedback(false);
    setSelectedGlossaryKey(null);
  }, [earliestIncompletePriorDecisionIndex]);

  useEffect(() => {
    if (currentChapterIndex === safeCurrentChapterIndex && currentNodeIndex === safeCurrentNodeIndex) return;

    setCurrentChapterIndex(safeCurrentChapterIndex);
    setCurrentNodeIndex(safeCurrentNodeIndex);
    setSelectedOptionId(null);
    setShowFeedback(false);
    setSelectedGlossaryKey(null);
    setSceneRun({});
  }, [
    currentChapter.id,
    currentChapterIndex,
    currentNodeIndex,
    safeCurrentChapterIndex,
    safeCurrentNodeIndex,
  ]);

  const isCollected = (id) => collected.some((item) => item.id === id);

  const toggleCollected = (item) => {
    setCollected((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      return exists ? prev.filter((entry) => entry.id !== item.id) : [...prev, item];
    });
  };

  const applyAppState = (state) => {
    if (!state || typeof state !== 'object') return;

    const nextChapterIndex = clampArrayIndex(state.currentChapterIndex, chapters.length);
    const nextSelections = state.nodeSelections && typeof state.nodeSelections === 'object' ? state.nodeSelections : {};
    const nextNodeIndex = normalizeRestoredNodeIndex(nextChapterIndex, state.currentNodeIndex, nextSelections);

    setCurrentView(typeof state.currentView === 'string' ? state.currentView : 'home');
    setCurrentChapterIndex(nextChapterIndex);
    setCurrentNodeIndex(nextNodeIndex);
    setNodeSelections(nextSelections);
    setSceneRun(restoreSceneRunFromSelections(chapters[nextChapterIndex], nextChapterIndex, nextSelections));
    setShowPinyin(typeof state.showPinyin === 'boolean' ? state.showPinyin : true);
    setShowEnglish(typeof state.showEnglish === 'boolean' ? state.showEnglish : true);
    setTrust(typeof state.trust === 'number' ? state.trust : 30);
    setMastery(typeof state.mastery === 'number' ? state.mastery : 12);
    setCollected(Array.isArray(state.collected) ? state.collected : Array.isArray(state.collectedItems) ? state.collectedItems : []);
    setPracticeLog(Array.isArray(state.practiceLog) ? state.practiceLog : []);
    setActiveNoteId(typeof state.activeNoteId === 'string' ? state.activeNoteId : chapters[nextChapterIndex].grammarNotes[0].id);
    setQuickExamplesShowPinyin(typeof state.quickExamplesShowPinyin === 'boolean' ? state.quickExamplesShowPinyin : true);
    setQuickExamplesShowEnglish(typeof state.quickExamplesShowEnglish === 'boolean' ? state.quickExamplesShowEnglish : true);
    setAudioRate(typeof state.audioRate === 'number' ? state.audioRate : 0.75);
    setFontScale(typeof state.fontScale === 'string' ? state.fontScale : 'md');
    setShowFeedback(false);
    setSelectedGlossaryKey(null);
  };

  const saveAppStateLocally = (state) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const hasMeaningfulLocalProgress = (state) => {
    if (!state || typeof state !== 'object') return false;
    return (
      state.currentChapterIndex > 0 ||
      state.currentNodeIndex > 0 ||
      state.trust !== 30 ||
      state.mastery !== 12 ||
      (Array.isArray(state.collected) && state.collected.length > 0) ||
      (Array.isArray(state.collectedItems) && state.collectedItems.length > 0) ||
      (Array.isArray(state.practiceLog) && state.practiceLog.length > 0) ||
      (state.nodeSelections && Object.keys(state.nodeSelections).length > 0)
    );
  };

  const appStatesMatch = (left, right) => {
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    saveAppStateLocally(appState);
  }, [appState]);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setSyncStatus(`Cloud sync unavailable: ${error.message}`);
        return;
      }
      setSession(data.session);
      if (data.session && typeof window !== 'undefined' && window.location.href.includes('type=recovery')) {
        setPasswordRecovery(true);
        setCurrentView('settings');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setCurrentView('settings');
        setAuthMessage('');
      }
      if (!nextSession) {
        setCloudSyncReady(false);
        setPendingCloudState(null);
        setPasswordRecovery(false);
        setSyncStatus('Guest mode. Progress is saved on this device.');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return undefined;

    let cancelled = false;
    setCloudSyncReady(false);
    setPendingCloudState(null);
    setSyncStatus('Signed in. Checking cloud sync...');

    const loadCloudState = async () => {
      try {
        const { data, error } = await supabase
          .from('user_app_state')
          .select('state')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setSyncStatus(`Cloud sync unavailable: ${error.message}`);
          return;
        }

        if (data?.state) {
          const localState = appStateRef.current || appState;
          const shouldAskBeforeLoading = hasMeaningfulLocalProgress(localState) && !appStatesMatch(localState, data.state);

          if (shouldAskBeforeLoading) {
            setPendingCloudState(data.state);
            setSyncStatus('Cloud progress found.');
            return;
          }

          appStateRef.current = data.state;
          applyAppState(data.state);
          setSyncStatus('Cloud progress loaded.');
          setCloudSyncReady(true);
          return;
        }

        const { error: uploadError } = await supabase
          .from('user_app_state')
          .upsert({
            user_id: session.user.id,
            state: appStateRef.current || appState,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (cancelled) return;

        if (uploadError) {
          setSyncStatus(`Cloud sync unavailable: ${uploadError.message}`);
          return;
        }

        setSyncStatus('Local progress uploaded to cloud.');
        setCloudSyncReady(true);
      } catch (error) {
        if (!cancelled) setSyncStatus(`Cloud sync unavailable: ${error.message}`);
      }
    };

    loadCloudState();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!supabase || !session?.user?.id || !cloudSyncReady) return undefined;

    const timeoutId = window.setTimeout(async () => {
      setSyncStatus('Syncing...');
      try {
        const { error } = await supabase
          .from('user_app_state')
          .upsert({
            user_id: session.user.id,
            state: appState,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        setSyncStatus(error ? `Cloud sync unavailable: ${error.message}` : 'Synced to cloud.');
      } catch (error) {
        setSyncStatus(`Cloud sync unavailable: ${error.message}`);
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [appState, cloudSyncReady, session?.user?.id]);

  useEffect(() => {
    const previousRestore = selectedOptionRestoreRef.current;
    const locationChanged = previousRestore.chapterIndex !== safeCurrentChapterIndex
      || previousRestore.nodeIndex !== safeCurrentNodeIndex;
    const committedOptionChanged = previousRestore.committedOptionId !== committedOptionId;
    if (!locationChanged && !committedOptionChanged) return;

    selectedOptionRestoreRef.current = {
      chapterIndex: safeCurrentChapterIndex,
      nodeIndex: safeCurrentNodeIndex,
      committedOptionId,
    };
    setSelectedOptionId(committedOptionId);
  }, [committedOptionId, safeCurrentChapterIndex, safeCurrentNodeIndex]);

  useEffect(() => {
    if (!showFeedback) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowFeedback(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showFeedback]);

  useEffect(() => {
    setBetterVersionOpen(true);
    setBetterVersionShowPinyin(true);
    setBetterVersionShowEnglish(true);
    setRevealedOptionMeanings({});
    setOptionAssistanceByDecision({});
    setMemoryMomentState({});
    setSayBeforeRevealState({});
    setMemoryReplayOpen(false);
    setMemoryReplayIndex(0);
    setMemoryReplayHintState({});
    setSceneRun(restoreSceneRunFromSelections(currentChapter, safeCurrentChapterIndex, nodeSelections));
  }, [currentChapter.id]);

  const handleSelectOption = (optionId) => {
    setSelectedOptionId(optionId);
  };

  const handleOptionMeaningToggle = (optionId, event) => {
    event.stopPropagation();
    const willReveal = !revealedOptionMeanings[optionId];
    setRevealedOptionMeanings((prev) => ({ ...prev, [optionId]: willReveal }));
    if (!willReveal) return;

    setOptionAssistanceByDecision((prev) => {
      const usedOptionIds = prev[currentAssistanceDecisionKey] || [];
      if (usedOptionIds.includes(optionId)) return prev;
      return { ...prev, [currentAssistanceDecisionKey]: [...usedOptionIds, optionId] };
    });
  };

  const switchChapter = (index) => {
    const nextChapterIndex = clampArrayIndex(index, chapters.length);
    const nextChapter = chapters[nextChapterIndex];
    const firstIncompleteChapter1Node = nextChapter.id === 'chapter1'
      ? nextChapter.nodes.findIndex((_, nodeIndex) => !nodeSelections[makeNodeKey(nextChapterIndex, nodeIndex)])
      : -1;
    const nextNodeIndex = firstIncompleteChapter1Node >= 0 ? firstIncompleteChapter1Node : 0;
    setSceneRun(restoreSceneRunFromSelections(nextChapter, nextChapterIndex, nodeSelections));
    setRevealedOptionMeanings({});
    setOptionAssistanceByDecision({});
    setMemoryMomentState({});
    setSayBeforeRevealState({});
    setMemoryReplayOpen(false);
    setMemoryReplayIndex(0);
    setMemoryReplayHintState({});
    setCurrentChapterIndex(nextChapterIndex);
    setCurrentNodeIndex(nextNodeIndex);
    setShowFeedback(false);
    setSelectedGlossaryKey(null);
    setActiveNoteId(chapters[nextChapterIndex].grammarNotes[0].id);
    setCurrentView('story');
  };

  const handleSubmit = () => {
    if (!selectedOption || isCurrentReplySubmitted) return;

    const earlierChoices = Object.fromEntries(
      Object.entries(sceneRun).filter(([key]) => Number(key) < safeCurrentNodeIndex)
    );
    const previousMetrics = calculateSceneRunMetrics(earlierChoices);
    const newMetrics = applySceneMetricChoice(previousMetrics, selectedOption);
    const nextSceneRun = {
      ...earlierChoices,
      [safeCurrentNodeIndex]: {
        optionId: selectedOption.id,
        rating: selectedOption.rating,
        relationship: selectedOption.relationship,
        branchKey: currentNode.branchKey || 'base',
        previousMetrics,
        newMetrics,
      },
    };

    setSceneRun(nextSceneRun);
    setNodeSelections((prev) => {
      const retainedSelections = Object.fromEntries(
        Object.entries(prev).filter(([key]) => {
          const [chapterIndex, decisionIndex] = key.split('-').map(Number);
          return chapterIndex !== safeCurrentChapterIndex || decisionIndex < safeCurrentNodeIndex;
        })
      );
      return { ...retainedSelections, [currentNodeKey]: selectedOption.id };
    });

    if (isUpdatingSubmittedReply) {
      setRevealedOptionMeanings({});
      setMemoryMomentState({});
      setSayBeforeRevealState({});
      setMemoryReplayOpen(false);
      setMemoryReplayIndex(0);
      setMemoryReplayHintState({});
      setOptionAssistanceByDecision((prev) => Object.fromEntries(
        Object.entries(prev).filter(([key]) => {
          const [chapterId, decisionIndex] = key.split(':');
          return chapterId !== currentChapter.id || Number(decisionIndex) <= safeCurrentNodeIndex;
        })
      ));
    }

    setBetterVersionOpen(selectedOption.rating !== 'Natural');
    setBetterVersionShowPinyin(true);
    setBetterVersionShowEnglish(true);
    setShowFeedback(true);
    const previousRelationship = committedChoice?.relationship || 0;
    const previousMasteryEffect = (committedOption?.score || 0) * 8;
    setTrust((prev) => Math.max(0, Math.min(100, prev + selectedOption.relationship - previousRelationship)));
    setMastery((prev) => Math.max(0, Math.min(100, prev + (selectedOption.score * 8) - previousMasteryEffect)));

    const selectedRole = selectedOption.rating.toLowerCase();
    const logItem = {
      chapter: currentChapter.shortTitle,
      mission: currentNode.mission,
      selected: selectedOption.zh,
      selectedPinyin: selectedOption.py,
      selectedEnglish: selectedOption.en,
      selectedAudioId: `${currentNodeAudioPrefix}.option.${selectedRole}`,
      rating: selectedOption.rating,
      correction: selectedOption.correction,
      correctionAudioId: selectedOption.correction ? `${currentNodeAudioPrefix}.correction.${selectedRole}` : '',
      timestamp: Date.now(),
    };
    const invalidatedMissions = new Set(
      currentChapter.nodes.slice(safeCurrentNodeIndex).map((node) => node.mission)
    );
    setPracticeLog((prev) => [
      ...prev.filter((item) => item.chapter !== logItem.chapter || !invalidatedMissions.has(item.mission)),
      logItem,
    ]);
  };

  const handleContinue = () => {
    if (!isCurrentReplySubmitted) return;
    setShowFeedback(false);
    if (!isLastNode) {
      setCurrentNodeIndex(safeCurrentNodeIndex + 1);
      return;
    }
    if (!isLastChapter) {
      switchChapter(safeCurrentChapterIndex + 1);
    }
  };

  const handlePreviousNode = () => {
    if (safeCurrentNodeIndex === 0) return;
    setShowFeedback(false);
    setCurrentNodeIndex(safeCurrentNodeIndex - 1);
  };

  const handleNextNode = () => {
    if (isLastNode || !isCurrentReplySubmitted) return;
    setShowFeedback(false);
    setCurrentNodeIndex(safeCurrentNodeIndex + 1);
  };

  const handleStoryRewind = (nodeIndex) => {
    const safeNodeIndex = clampArrayIndex(nodeIndex, chapterDecisionTotal);
    setSceneRun((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => Number(key) < safeNodeIndex)
    ));
    setNodeSelections((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => {
        const [chapterIndex, decisionIndex] = key.split('-').map(Number);
        return chapterIndex !== safeCurrentChapterIndex || decisionIndex < safeNodeIndex;
      })
    ));
    setSelectedOptionId(null);
    setRevealedOptionMeanings({});
    setMemoryMomentState({});
    setSayBeforeRevealState({});
    setMemoryReplayOpen(false);
    setMemoryReplayHintState({});
    setOptionAssistanceByDecision((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => {
        const [chapterId, decisionIndex] = key.split(':');
        return chapterId !== currentChapter.id || Number(decisionIndex) < safeNodeIndex;
      })
    ));
    setShowFeedback(false);
    setCurrentNodeIndex(safeNodeIndex);
  };

  const handleStoryReplay = () => {
    setSceneRun({});
    setRevealedOptionMeanings({});
    setOptionAssistanceByDecision({});
    setMemoryMomentState({});
    setSayBeforeRevealState({});
    setMemoryReplayOpen(false);
    setMemoryReplayIndex(0);
    setMemoryReplayHintState({});
    setNodeSelections((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => Number(key.split('-')[0]) !== safeCurrentChapterIndex)
    ));
    setSelectedOptionId(null);
    setShowFeedback(false);
    setCurrentNodeIndex(0);
  };

  const handleAuthSubmit = async (mode) => {
    if (!supabase) {
      setAuthMessage('Cloud sync is not configured for this build.');
      return;
    }

    if (!authEmail.trim() || !authPassword) {
      setAuthMessage('Enter an email and password.');
      return;
    }

    if (mode === 'signup' && !isStrongPassword(authPassword)) {
      setAuthMessage(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (mode === 'signup' && authPassword !== signupConfirmPassword) {
      setAuthMessage('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    const credentials = {
      email: authEmail.trim(),
      password: authPassword,
    };

    const { data, error } = mode === 'signup'
      ? await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        })
      : await supabase.auth.signInWithPassword(credentials);

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (data.session) {
      setAuthPassword('');
      setSignupConfirmPassword('');
      setAuthMessage(mode === 'signup' ? 'Signed in. Progress is ready to sync.' : 'Signed in.');
      return;
    }

    setAuthPassword('');
    setSignupConfirmPassword('');
    setAuthMessage('Check your email to confirm your account, then sign in.');
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthPassword('');
    setSignupConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setPasswordRecovery(false);
    setShowChangePassword(false);
    setAuthMessage('Signed out. Guest mode is still available.');
  };

  const handleSendPasswordReset = async () => {
    if (!supabase) {
      setAuthMessage('Cloud sync is not configured for this build.');
      return;
    }

    const email = resetEmail.trim() || authEmail.trim();
    if (!email) {
      setAuthMessage('Enter your email to reset your password.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage('Password reset email sent. Please check your inbox.');
  };

  const handleUpdatePassword = async () => {
    if (!supabase) return;

    if (!isStrongPassword(newPassword)) {
      setAuthMessage(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthMessage('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordRecovery(false);
    setAuthMessage('Password updated. You can continue using your account.');
  };

  const handleChangePassword = async () => {
    if (!supabase) return;

    if (!currentPassword) {
      setAuthMessage('Enter your current password.');
      return;
    }

    if (!isStrongPassword(changeNewPassword)) {
      setAuthMessage(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (currentPassword === changeNewPassword) {
      setAuthMessage('New password cannot be the same as your current password.');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setAuthMessage('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    const { error: currentPasswordError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email || '',
      password: currentPassword,
    });

    if (currentPasswordError) {
      setAuthLoading(false);
      setAuthMessage(currentPasswordError.message);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: changeNewPassword });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setAuthMessage('Password updated.');
  };

  const handleSyncNow = async () => {
    if (!supabase || !session?.user?.id) {
      setSyncStatus('Guest mode. Progress is saved on this device.');
      return;
    }

    setSyncStatus('Syncing...');

    try {
      const { error } = await supabase
        .from('user_app_state')
        .upsert({
          user_id: session.user.id,
          state: appStateRef.current || appState,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        setSyncStatus(`Cloud sync unavailable: ${error.message}`);
        return;
      }

      setCloudSyncReady(true);
      setSyncStatus('Synced to cloud.');
    } catch (error) {
      setSyncStatus(`Cloud sync unavailable: ${error.message}`);
    }
  };

  const handleUseCloudProgress = () => {
    if (!pendingCloudState) return;

    appStateRef.current = pendingCloudState;
    saveAppStateLocally(pendingCloudState);
    applyAppState(pendingCloudState);
    setPendingCloudState(null);
    setCloudSyncReady(true);
    setSyncStatus('Cloud progress loaded.');
  };

  const handleKeepDeviceProgress = async () => {
    if (!supabase || !session?.user?.id) return;

    const localState = appStateRef.current || appState;
    setPendingCloudState(null);
    setSyncStatus('Syncing...');

    try {
      const { error } = await supabase
        .from('user_app_state')
        .upsert({
          user_id: session.user.id,
          state: localState,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        setSyncStatus(`Cloud sync unavailable: ${error.message}`);
        return;
      }

      setCloudSyncReady(true);
      setSyncStatus('This device progress uploaded to cloud.');
    } catch (error) {
      setSyncStatus(`Cloud sync unavailable: ${error.message}`);
    }
  };

  const resetPilot = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    setCurrentView('home');
    setCurrentChapterIndex(0);
    setCurrentNodeIndex(0);
    setSelectedOptionId(null);
    setNodeSelections({});
    setShowFeedback(false);
    setSceneRun({});
    setBetterVersionOpen(true);
    setBetterVersionShowPinyin(true);
    setBetterVersionShowEnglish(true);
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
      const recommendedPractice = chapterOverview.find((item) => item.recommended) || chapterOverview[currentChapterIndex] || chapterOverview[0];
      const pathItems = chapterOverview.filter((item) => item.chapter.id !== recommendedPractice?.chapter.id);
      const RecommendedIcon = recommendedPractice?.chapter.icon || Compass;
      const recommendedPrimary = recommendedPractice?.action !== 'Review';
      const nextNodeIndex = recommendedPractice
        ? recommendedPractice.chapter.nodes.findIndex((_, nodeIndex) => !nodeSelections[makeNodeKey(recommendedPractice.index, nodeIndex)])
        : -1;
      const recommendedNode = recommendedPractice
        ? recommendedPractice.chapter.nodes[nextNodeIndex >= 0 ? nextNodeIndex : 0]
        : null;
      return (
        <div className="space-y-6 md:space-y-10">
          <section className="overflow-hidden rounded-[28px] bg-[#2b241f] text-white shadow-[0_22px_60px_rgba(43,36,31,0.16)] md:rounded-[34px]">
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="p-4 sm:p-5 md:p-7">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d6a856] sm:text-xs sm:tracking-[0.22em]">Mandarin practice studio</div>
                  <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">Step into today's Mandarin practice</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
                    Start with one real scene, listen for what feels natural, and keep the phrases you can imagine saying.
                  </p>
                  {recommendedNode && (
                    <div className="mt-5 border-l-2 border-[#d6a856] pl-3 sm:pl-4 md:mt-6">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45 sm:text-xs">Next line to work with</div>
                      <div className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl md:text-4xl">{recommendedNode.npcLineZh}</div>
                      <div className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{recommendedNode.mission}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5 md:p-6">
                <div className="text-sm font-semibold text-white">Your place</div>
                <div className="mt-3 text-sm leading-6 text-white/68">
                  {currentChapter.label}: {currentChapter.shortTitle}
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/58">
                    <span>Practice path</span>
                    <span>{currentChapterIndex + 1}/{chapters.length}</span>
                  </div>
                  <Progress value={overallProgress} className="h-2 bg-white/15" />
                </div>
                <div className="mt-5 space-y-2 text-sm text-white/64">
                  <div>{collected.length} saved language notes</div>
                  <div>{reviewItems.length} replies ready to revisit</div>
                </div>
              </div>
            </div>
          </section>

          {recommendedPractice && (
            <section className="rounded-[26px] bg-[#fffaf3] p-4 shadow-sm ring-1 ring-[#eadfce] sm:p-5 md:rounded-[30px] md:p-6">
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="rounded-[18px] bg-[#f3eadf] p-2.5 sm:rounded-[22px] sm:p-3">
                    <RecommendedIcon className="h-6 w-6 text-[#6f4f18]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#8a6a28]">Pick up here</div>
                    <h3 className="mt-1 text-xl font-semibold leading-tight text-[#2b241f] sm:text-2xl">{recommendedPractice.chapter.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{recommendedPractice.chapter.subtitle}</p>
                    <div className="mt-4 max-w-md">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">{recommendedPractice.completed} / {recommendedPractice.total} completed</span>
                        <span className="font-medium text-neutral-700">{recommendedPractice.status}</span>
                      </div>
                      <Progress value={(recommendedPractice.completed / recommendedPractice.total) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
                <Button
                  variant={recommendedPrimary ? 'default' : 'outline'}
                  className="h-12 w-full rounded-2xl px-6 text-base font-semibold md:w-auto"
                  onClick={() => switchChapter(recommendedPractice.index)}
                >
                  {recommendedPractice.action}
                </Button>
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 px-1 md:px-0">
              <h3 className="text-lg font-semibold">Choose a practice scene</h3>
              <p className="mt-1 text-sm text-neutral-500">Each scene is a short lesson in how Mandarin sounds in real social moments.</p>
            </div>
            <div className="divide-y divide-[#e7dccd] border-y border-[#eadfce] bg-[#fffaf3]/50">
              {pathItems.map(({ chapter, index, completed, total, status, action }) => {
                const Icon = chapter.icon;
                const primaryAction = action !== 'Review';
                return (
                  <div key={chapter.id} className="py-4 md:px-2 md:py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-2xl bg-[#f3eadf]/85 p-2">
                          <Icon className="h-5 w-5 text-[#6f6257]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">{chapter.label}</div>
                          <h4 className="mt-1 font-semibold leading-snug text-neutral-900">{chapter.title}</h4>
                          <p className="mt-1 text-sm leading-5 text-neutral-600">{chapter.subtitle}</p>
                          <div className="mt-2 text-sm text-neutral-500">{completed} / {total} completed - {status}</div>
                        </div>
                      </div>
                      <Button
                        variant={primaryAction ? 'default' : 'outline'}
                        className="h-11 w-full rounded-2xl px-5 text-sm font-semibold sm:w-auto"
                        onClick={() => switchChapter(index)}
                      >
                        {action}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 px-1 md:px-0">
              <h3 className="text-lg font-semibold">Recent saved phrases</h3>
              <p className="mt-1 text-sm text-neutral-500">A few phrases from your notebook, ready to hear again.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {recentCollected.length === 0 ? (
                <div className="border-l-2 border-[#d6a856] bg-[#fffaf3]/65 py-4 pl-4 pr-3 text-sm leading-6 text-neutral-500 lg:col-span-2">
                  No saved phrases yet. During practice, save language that sounds useful enough to try in your own speech.
                </div>
              ) : (
                recentCollected.map((item) => (
                  <article key={item.id} className="border-l-2 border-[#d6a856] bg-[#fffaf3]/70 py-4 pl-4 pr-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 text-xl font-semibold leading-snug">{item.expression}</div>
                      <AudioButton audioId={item.audioId} text={item.expression} small />
                    </div>
                    {item.pinyin && <div className="mt-2 text-sm leading-5 text-neutral-500">{item.pinyin}</div>}
                    {item.english && <div className="mt-1 text-sm leading-5 text-neutral-700">{item.english}</div>}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <Badge variant="outline" className="rounded-full">{item.type}</Badge>
                      <span>{item.source || item.chapter}</span>
                    </div>
                    {item.mission && <div className="mt-1 text-sm text-neutral-600">{item.mission}</div>}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      );
    }

    if (currentView === 'favorites') {
      return (
        <div className="space-y-5 pb-8 md:space-y-7 md:pb-0">
          <section className="px-1 md:px-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="text-sm font-medium text-[#8a6a28]">Phrase notebook</div>
                <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">Your Mandarin phrase notebook</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  A quiet place for phrases you want to hear again, say aloud, and bring back into real conversation.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 md:w-[260px] md:shrink-0">
                <DisplayToggleButton active={notesShowPinyin} label="Pinyin" onClick={() => setNotesShowPinyin((v) => !v)} compact />
                <DisplayToggleButton active={notesShowEnglish} label="English" onClick={() => setNotesShowEnglish((v) => !v)} compact />
              </div>
            </div>
          </section>

          <section>
            <div className="space-y-4">
              {collected.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#d8cbb8] bg-[#fffaf3]/75 p-6 text-sm leading-6 text-neutral-500 md:p-8">
                  No saved phrases yet. During practice, save anything that sounds useful, natural, or worth trying in your own speech.
                </div>
              ) : (
                collected.map((item) => (
                  <article key={item.id} className="border-l-2 border-[#d6a856] bg-[#fffaf3]/78 px-3 py-4 sm:px-4 sm:py-5 md:rounded-r-[28px] md:px-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1 text-2xl font-semibold leading-tight text-[#2b241f] sm:text-3xl md:text-4xl">{item.expression}</div>
                          <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-[#f3eadf] px-3 py-1.5 text-xs font-medium text-[#6f6257]">
                            <span className="hidden sm:inline">Listen</span>
                            <AudioButton audioId={item.audioId} text={item.expression} small />
                          </div>
                        </div>
                        {notesShowPinyin && item.pinyin && <div className="text-sm leading-6 text-neutral-500 md:text-base">{item.pinyin}</div>}
                        {notesShowEnglish && item.english && <div className="text-sm leading-6 text-neutral-700">{item.english}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCollected(item)}
                        className="rounded-full p-2 text-neutral-400 transition hover:bg-[#f3eadf] hover:text-neutral-700"
                        aria-label="Remove saved phrase"
                        title="Remove saved phrase"
                      >
                        <Bookmark className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-5 text-neutral-500">
                      <span className="rounded-full bg-[#f3eadf]/85 px-2.5 py-1">{item.type}</span>
                      <span>{item.source || item.chapter}</span>
                    </div>
                    {item.mission && <div className="mt-2 border-l border-[#d8cbb8] pl-3 text-sm leading-6 text-neutral-600">{item.mission}</div>}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      );
    }

    if (currentView === 'review') {
      return (
        <div className="space-y-5 md:space-y-6">
          <Card className="overflow-hidden rounded-[28px] border-0 bg-[#fffaf3]/95 shadow-sm ring-1 ring-[#eadfce] md:rounded-3xl">
            <CardHeader className="px-4 py-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Review practice</CardTitle>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">Come back to replies that sounded stiff, awkward, or unclear.</p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:min-w-[260px]">
                  <DisplayToggleButton active={reviewShowPinyin} label="Pinyin" onClick={() => setReviewShowPinyin((v) => !v)} compact />
                  <DisplayToggleButton active={reviewShowEnglish} label="English" onClick={() => setReviewShowEnglish((v) => !v)} compact />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-5 md:px-6 md:pb-6">
              {reviewItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  Nothing to review yet. Replies that need another look will appear here.
                </div>
              ) : (
                reviewItems.map((item, idx) => {
                  const sourceOption = getReviewSourceOption(item);
                  const correctionSourceOption = item.correction ? getReviewSourceOption(item, item.correction) : null;
                  const reviewPinyin = item.selectedPinyin || item.pinyin || sourceOption?.py || '';
                  const reviewEnglish = item.selectedEnglish || item.english || sourceOption?.en || '';
                  const reviewExplanation = item.explanation || sourceOption?.explanation || '';
                  const correctionPinyin = item.betterPinyin || item.correctionPinyin || item.improvedPinyin || item.naturalPinyin || correctionSourceOption?.py || '';
                  const correctionEnglish = item.betterEnglish || item.correctionEnglish || item.improvedEnglish || item.naturalEnglish || correctionSourceOption?.en || '';
                  return (
                  <div key={`${item.selected}-${idx}`} className="rounded-2xl border border-[#eadfce] bg-white/74 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingBadge rating={item.rating} />
                      <span className="text-xs text-neutral-500">{item.chapter}</span>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xl font-semibold leading-snug text-[#2b241f] sm:text-2xl">{item.selected}</div>
                        {reviewShowPinyin && reviewPinyin && <div className="mt-2 text-sm leading-5 text-neutral-500">{reviewPinyin}</div>}
                        {reviewShowEnglish && reviewEnglish && <div className="mt-1 text-sm leading-5 text-neutral-700">{reviewEnglish}</div>}
                      </div>
                      <AudioButton audioId={item.selectedAudioId} text={item.selected} small />
                    </div>
                    {reviewShowEnglish && item.mission && <div className="mt-2 text-sm text-neutral-600">{item.mission}</div>}
                    {reviewShowEnglish && reviewExplanation && <div className="mt-2 text-sm leading-6 text-neutral-700">{reviewExplanation}</div>}
                    {item.correction && (
                      <div className="mt-3 rounded-xl bg-[#f3eadf]/75 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 font-medium">
                        <span>Better version</span>
                        <AudioButton audioId={item.correctionAudioId} text={item.correction} small />
                      </div>
                      <div className="mt-1 text-base font-medium leading-snug text-[#2b241f]">{item.correction}</div>
                      {reviewShowPinyin && correctionPinyin && <div className="mt-1 text-sm leading-5 text-neutral-500">{correctionPinyin}</div>}
                      {reviewShowEnglish && correctionEnglish && <div className="mt-1 text-sm leading-5 text-neutral-700">{correctionEnglish}</div>}
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'settings') {
      return (
        <div className="space-y-6 pb-8 md:space-y-8 md:pb-0">
          <section className="px-1 md:px-0">
            <div className="max-w-2xl">
              <div className="text-sm font-medium text-[#8a6a28]">Your practice space</div>
              <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">Settings</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {session?.user ? 'Progress is syncing with your account.' : 'Guest progress stays on this device. Sign in to sync across devices.'}
              </p>
            </div>
          </section>

          <section className="space-y-6">
              <div className="border-t border-[#eadfce] pt-5">
                <div className="mb-4">
                  <div className="font-semibold">Account and sync</div>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">Keep your practice available here, or carry it to another device when you sign in.</p>
                </div>
                {session?.user ? (
                  <div className="mt-3 space-y-3">
                    <div className="min-w-0 border-l-2 border-[#d6a856] bg-[#fffaf3]/70 py-3 pl-3 pr-2 text-sm">
                      <div className="text-neutral-500">Signed in as</div>
                      <div className="mt-1 break-words font-medium text-neutral-900">{session.user.email}</div>
                    </div>
                    {passwordRecovery && (
                      <div className="rounded-[24px] bg-[#fffaf3]/78 p-4 text-sm ring-1 ring-[#eadfce]/85">
                        <div className="font-medium text-neutral-900">Set new password</div>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">Choose a new password for this account.</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <PasswordInput
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="New password"
                            visible={showNewPassword}
                            onToggle={() => setShowNewPassword((value) => !value)}
                          />
                          <PasswordInput
                            value={confirmNewPassword}
                            onChange={setConfirmNewPassword}
                            placeholder="Confirm new password"
                            visible={showConfirmNewPassword}
                            onToggle={() => setShowConfirmNewPassword((value) => !value)}
                          />
                        </div>
                        <div className="mt-2">
                          <PasswordRequirements />
                        </div>
                        <Button className="mt-3 h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto md:h-9" onClick={handleUpdatePassword} disabled={authLoading}>
                          Update password
                        </Button>
                      </div>
                    )}
                    <div className="rounded-[24px] bg-[#fffaf3]/78 p-4 text-sm ring-1 ring-[#eadfce]/85">
                      <button
                        type="button"
                        onClick={() => setShowChangePassword((value) => !value)}
                        className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                      >
                        Change password
                      </button>
                      {showChangePassword && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-3 md:grid-cols-3">
                            <PasswordInput
                              value={currentPassword}
                              onChange={setCurrentPassword}
                              placeholder="Current password"
                              visible={showCurrentPassword}
                              onToggle={() => setShowCurrentPassword((value) => !value)}
                            />
                            <PasswordInput
                              value={changeNewPassword}
                              onChange={setChangeNewPassword}
                              placeholder="New password"
                              visible={showChangeNewPassword}
                              onToggle={() => setShowChangeNewPassword((value) => !value)}
                            />
                            <PasswordInput
                              value={changeConfirmPassword}
                              onChange={setChangeConfirmPassword}
                              placeholder="Confirm new password"
                              visible={showChangeConfirmPassword}
                              onToggle={() => setShowChangeConfirmPassword((value) => !value)}
                            />
                          </div>
                          <PasswordRequirements />
                          <Button className="h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto md:h-9" onClick={handleChangePassword} disabled={authLoading}>
                            Update password
                          </Button>
                        </div>
                      )}
                    </div>
                    {pendingCloudState && (
                      <div className="rounded-[24px] bg-[#fffaf3]/78 p-4 text-sm ring-1 ring-[#eadfce]/85">
                        <div className="font-medium text-neutral-900">Cloud progress found.</div>
                        <p className="mt-1 leading-6 text-neutral-500">Choose which practice record should become your account copy.</p>
                        <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                          <Button className="h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto md:h-9" onClick={handleUseCloudProgress}>
                            Use cloud progress
                          </Button>
                          <Button variant="outline" className="h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto md:h-9" onClick={handleKeepDeviceProgress}>
                            Keep this device
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                      <Button className="h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto md:h-9" onClick={handleSyncNow} disabled={authLoading}>
                        Sync now
                      </Button>
                      <Button variant="outline" className="h-11 w-full rounded-2xl border-[#d8cbb8] bg-transparent px-4 text-sm font-semibold text-neutral-700 sm:w-auto md:h-9" onClick={handleSignOut} disabled={authLoading}>
                        Sign out
                      </Button>
                    </div>
                    {authMessage && <div className="text-sm leading-6 text-neutral-600">{authMessage}</div>}
                    <div className="rounded-[22px] bg-[#f3eadf]/70 p-3 text-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Sync status</div>
                      <div className="mt-1 font-medium leading-6 text-neutral-800">{syncStatus}</div>
                      <div className="mt-2 text-xs leading-5 text-neutral-500">Use Sync now before switching devices if you want to save immediately.</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Email"
                        className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-500"
                      />
                      <PasswordInput
                        value={authPassword}
                        onChange={setAuthPassword}
                        placeholder="Password"
                        visible={showAuthPassword}
                        onToggle={() => setShowAuthPassword((value) => !value)}
                      />
                      <PasswordInput
                        value={signupConfirmPassword}
                        onChange={setSignupConfirmPassword}
                        placeholder="Confirm password for sign up"
                        visible={showSignupConfirmPassword}
                        onToggle={() => setShowSignupConfirmPassword((value) => !value)}
                      />
                    </div>
                    <PasswordRequirements />
                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <Button className="h-11 w-full rounded-2xl px-4 text-sm font-semibold sm:w-auto" onClick={() => handleAuthSubmit('signin')} disabled={authLoading}>
                        Sign in
                      </Button>
                      <Button variant="outline" className="h-11 w-full rounded-2xl border-[#d8cbb8] bg-transparent px-4 text-sm font-semibold text-neutral-700 sm:w-auto" onClick={() => handleAuthSubmit('signup')} disabled={authLoading}>
                        Sign up
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-2xl border-[#d8cbb8] bg-transparent px-4 text-sm font-semibold text-neutral-700 sm:w-auto"
                        onClick={() => {
                          setResetEmail(authEmail);
                          setShowPasswordReset((value) => !value);
                        }}
                        disabled={authLoading}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    {showPasswordReset && (
                      <div className="rounded-[24px] bg-[#fffaf3]/78 p-4 text-sm ring-1 ring-[#eadfce]/85">
                        <div className="font-medium text-neutral-900">Reset password</div>
                        <p className="mt-1 leading-6 text-neutral-500">Send a recovery link to your email, then return here to set a new password.</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Email"
                            className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-500"
                          />
                          <Button className="h-11 w-full rounded-2xl px-4 text-sm font-semibold md:w-auto" onClick={handleSendPasswordReset} disabled={authLoading}>
                            Send reset email
                          </Button>
                        </div>
                      </div>
                    )}
                    {authMessage && <div className="text-sm leading-6 text-neutral-600">{authMessage}</div>}
                    <div className="rounded-[22px] bg-[#f3eadf]/70 p-3 text-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Sync status</div>
                      <div className="mt-1 font-medium leading-6 text-neutral-800">{syncStatus}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[#eadfce] pt-5">
                <div className="mb-4">
                  <div className="font-semibold">Device and progress</div>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">A quick check before you sync or switch devices.</p>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div className="min-w-0 border-l-2 border-[#d6a856] bg-[#fffaf3]/65 py-3 pl-3 pr-2">
                    <div className="text-neutral-500">Current device</div>
                    <div className="mt-1 break-words font-medium text-neutral-900">{currentDeviceLabel}</div>
                  </div>
                  <div className="min-w-0 border-l-2 border-[#d6a856] bg-[#fffaf3]/65 py-3 pl-3 pr-2">
                    <div className="text-neutral-500">Current progress</div>
                    <div className="mt-1 break-words font-medium text-neutral-900">Chapter {currentChapterIndex + 1} &middot; {currentChapter.shortTitle}</div>
                    <div className="mt-1 text-neutral-600">Question {safeCurrentNodeIndex + 1}</div>
                  </div>
                  <div className="min-w-0 border-l-2 border-[#d6a856] bg-[#fffaf3]/65 py-3 pl-3 pr-2">
                    <div className="text-neutral-500">Last synced</div>
                    <div className="mt-1 font-medium text-neutral-900">Not yet</div>
                  </div>
                </div>
                <div className="mt-3 text-xs leading-5 text-neutral-500">This helps you check which device progress you are about to sync.</div>
              </div>
              <div className="border-t border-[#eadfce] pt-5">
                <div className="font-semibold">Reading support</div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">Choose what helps you read during practice.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                  <DisplayToggleButton active={showPinyin} label="Pinyin" onClick={() => setShowPinyin((v) => !v)} compact />
                  <DisplayToggleButton active={showEnglish} label="English" onClick={() => setShowEnglish((v) => !v)} compact />
                </div>
              </div>
              <div className="border-t border-[#eadfce] pt-5">
                <div className="font-semibold">Example notes</div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">Control how much support appears in quick examples.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                  <DisplayToggleButton active={quickExamplesShowPinyin} label="Quick Pinyin" onClick={() => setQuickExamplesShowPinyin((v) => !v)} compact />
                  <DisplayToggleButton active={quickExamplesShowEnglish} label="Quick English" onClick={() => setQuickExamplesShowEnglish((v) => !v)} compact />
                </div>
              </div>
              <div className="border-t border-[#eadfce] pt-5">
                <div className="font-semibold">Audio speed</div>
                <p className="mt-1 text-sm text-neutral-600">Choose the playback speed for all Chinese audio in the app.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[0.5, 0.75, 1].map((rate) => (
                    <Button
                      key={rate}
                      variant={audioRate === rate ? 'default' : 'outline'}
                      className="h-11 rounded-2xl"
                      onClick={() => setAudioRate(rate)}
                    >
                      {rate.toFixed(2).replace(/\.00$/, '.0')}x
                    </Button>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#eadfce] pt-5">
                <div className="font-semibold">Chinese text size</div>
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
                      className="h-11 rounded-2xl"
                      onClick={() => setFontScale(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="border-t border-rose-200 pt-5">
                <div className="font-medium text-rose-700">Reset local practice data</div>
                <p className="mt-1 text-sm text-neutral-600">This clears current progress, collection, review items, and local settings on this device.</p>
                <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl border-rose-200 bg-transparent text-rose-700 hover:bg-rose-50 sm:w-auto" onClick={resetPilot}>Reset local data</Button>
              </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-8 md:space-y-6 md:pb-0">
        <Card className="hidden overflow-hidden rounded-3xl border-0 shadow-sm md:block">
          <div className="h-56 bg-[radial-gradient(circle_at_top_left,_#fff4e0,_#f1e6d8_58%,_#fffaf3)] p-6">
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

        <Card className="rounded-[26px] border-0 bg-[#fffaf3]/95 shadow-sm ring-1 ring-[#eadfce] md:rounded-3xl md:bg-white md:ring-0">
          <CardContent className="px-4 py-5 md:p-7">
            <div className="mb-5 flex flex-col gap-4 border-b border-[#e7dccd] pb-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 w-full md:w-auto">
                <p className="text-sm font-medium text-[#8a6a28]">Practice focus</p>
                <h3 className="mt-1 max-w-2xl text-xl font-semibold leading-snug md:text-2xl">{currentNode.mission}</h3>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:flex md:items-center">
                <DisplayToggleButton active={showPinyin} label="Pinyin" onClick={() => setShowPinyin((v) => !v)} compact />
                <DisplayToggleButton active={showEnglish} label="English" onClick={() => setShowEnglish((v) => !v)} compact />
              </div>
            </div>

            <div className="mb-4 flex items-start justify-between gap-3 text-neutral-500">
              <span className="min-w-0 flex-1 text-xs leading-5 sm:text-sm">Tap highlighted words for meaning, examples, and teacher notes.</span>
              <span className="shrink-0 text-sm font-medium">{safeCurrentNodeIndex + 1}/{chapterDecisionTotal}</span>
            </div>
            <Progress value={chapterProgress} className="h-2" />

            <div className="mt-4">
              <StorySceneMetrics metrics={sceneMetrics} transition={sceneMetricTransition} />
            </div>

            <motion.div layout className="mt-5 rounded-[24px] bg-[#f3eadf]/85 p-4 sm:p-5 md:mt-6 md:rounded-[28px] md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d8cbb8] pb-4 text-sm text-neutral-600">
                <SpeakerHeader speaker={currentSpeaker} rating={latestSceneRating} />
                <div className="flex items-center gap-2 rounded-full bg-[#fffaf3]/85 px-3 py-1.5 text-xs font-medium text-[#6f6257]">
                  <span>Play line</span>
                  <AudioButton audioId={`${currentNodeAudioPrefix}.npc`} text={currentNode.npcLineZh} />
                </div>
              </div>
              <StoryLanguageStack
                zh={currentNode.npcLineZh}
                py={currentNode.npcLinePy}
                en={currentNode.npcLineEn}
                showPinyin={showPinyin}
                showEnglish={showEnglish}
                primaryKeys={npcHighlightTiers.primaryGlossaryKeys}
                recycledKeys={npcHighlightTiers.recycledGlossaryKeys}
                onOpen={setSelectedGlossaryKey}
                chineseClassName={`${fontScale === 'sm' ? 'text-2xl sm:text-3xl' : fontScale === 'lg' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} font-semibold leading-tight tracking-tight text-[#2b241f]`}
                pinyinClassName="text-sm leading-6 text-neutral-500 md:text-base"
                englishClassName="mt-2 text-sm leading-5 text-neutral-600"
                alignClauses={currentChapterSupport.alignedLanguageClauses}
              />
            </motion.div>

            {currentMemoryMoment && currentMemoryTarget && !memoryMomentState.dismissed && (
              <div className="mt-5">
                <MemoryMomentCard
                  moment={currentMemoryMoment}
                  target={currentMemoryTarget}
                  state={memoryMomentState}
                  onChange={setMemoryMomentState}
                  onDismiss={() => setMemoryMomentState({ dismissed: true })}
                />
              </div>
            )}

            {sayBeforeRevealTarget && !sayBeforeRevealState.dismissed && (
              <div className="mt-5">
                <SayBeforeRevealCard
                  target={sayBeforeRevealTarget}
                  prompt={activeSayBeforeRevealConfig.prompt}
                  state={sayBeforeRevealState}
                  onChange={setSayBeforeRevealState}
                  onDismiss={() => setSayBeforeRevealState((prev) => ({ ...prev, dismissed: true }))}
                />
              </div>
            )}

            <div className="mt-6 grid gap-3 md:mt-7">
              <div>
                <div className="text-sm font-medium text-[#8a6a28]">Your turn</div>
                <p className="mt-1 text-sm text-neutral-500">Pick the reply you would actually say in this moment.</p>
              </div>
              {displayOptions.map((option) => {
                const active = selectedOptionId === option.id;
                const meaningRevealed = Boolean(revealedOptionMeanings[option.id]);
                const optionHighlightTiers = resolveStoryHighlightTiers({
                  chapterId: currentChapter.id,
                  nodeId: baseCurrentNode.id,
                  optionId: option.id,
                  text: option.zh,
                  decisionSupport,
                });
                const optionCollectionItem = createCollectionItem({
                  expression: option.zh,
                  pinyin: option.py,
                  english: option.en,
                  audioId: `${currentNodeAudioPrefix}.option.${option.rating.toLowerCase()}`,
                  type: 'option',
                  source: `${currentChapter.shortTitle} · Option`,
                  chapter: currentChapter.shortTitle,
                  mission: currentNode.mission,
                });
                const optionSaved = isCollected(optionCollectionItem.id);

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectOption(option.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectOption(option.id);
                      }
                    }}
                    className={`rounded-[22px] border p-3.5 text-left transition active:scale-[0.99] sm:p-4 md:rounded-[26px] md:p-5 ${
                      active
                        ? 'border-[#8a6a28] bg-[#5a3f30] text-white shadow-[0_16px_35px_rgba(90,63,48,0.18)]'
                        : 'border-[#eadfce] bg-white/82 hover:border-[#d6a856] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 w-full">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-medium opacity-90">
                          <span>{active ? 'Selected reply' : `Reply ${option.displayId}`}</span>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {currentChapterSupport.progressiveOptionMeaning && (
                              <button
                                type="button"
                                onClick={(event) => handleOptionMeaningToggle(option.id, event)}
                                className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-[#d8cbb8] bg-[#fffaf3] text-[#6f6257] hover:bg-[#f3eadf]'}`}
                                aria-expanded={meaningRevealed}
                              >
                                {meaningRevealed ? 'Hide meaning' : 'Show meaning'}
                              </button>
                            )}
                            <span className="hidden text-xs sm:inline">Listen</span>
                            <AudioButton audioId={`${currentNodeAudioPrefix}.option.${option.rating.toLowerCase()}`} text={option.zh} dark={active} small />
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
                        <StoryLanguageStack
                          zh={option.zh}
                          py={option.py}
                          en={option.en}
                          showPinyin={showPinyin}
                          showEnglish={currentChapterSupport.progressiveOptionMeaning ? meaningRevealed : showEnglish}
                          primaryKeys={optionHighlightTiers.primaryGlossaryKeys}
                          recycledKeys={optionHighlightTiers.recycledGlossaryKeys}
                          onOpen={setSelectedGlossaryKey}
                          chineseClassName={`${fontScale === 'sm' ? 'text-lg sm:text-xl' : fontScale === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-semibold leading-snug`}
                          pinyinClassName={`mt-1 text-sm leading-5 ${active ? 'text-white/75' : 'text-neutral-500'}`}
                          englishClassName={`mt-2 rounded-xl px-3 py-2 text-sm leading-5 ${active ? 'bg-white/10 text-white/90' : 'bg-[#f5efe7] text-neutral-700'}`}
                          alignClauses={currentChapterSupport.alignedLanguageClauses}
                          dark={active}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 space-y-3 border-t border-[#e7dccd] pt-5">
              <div className="flex w-full items-center gap-2 rounded-2xl bg-[#fff8ef] px-4 py-3 text-left text-sm leading-5 text-[#6f6257]">
                <BrainCircuit className="h-4 w-4 shrink-0" />
                <span className="min-w-0">Natural Chinese is about the relationship, not just the words.</span>
              </div>

              <AnimatePresence>
                {stageTransition && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="border-l-2 border-indigo-300 px-3 py-1 text-sm text-neutral-600"
                  >
                    <span className="font-semibold text-indigo-800">{stageTransition.title}</span>
                    <span className="ml-2">{stageTransition.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid w-full grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-base font-semibold"
                  onClick={handlePreviousNode}
                  disabled={safeCurrentNodeIndex === 0 || showFeedback}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-base font-semibold disabled:bg-neutral-100 disabled:text-neutral-400"
                  onClick={handleNextNode}
                  disabled={isLastNode || showFeedback || !isCurrentReplySubmitted}
                  aria-disabled={isLastNode || showFeedback || !isCurrentReplySubmitted}
                >
                  {isCurrentReplySubmitted ? 'Next' : 'Submit to continue'}
                </Button>
              </div>

              {selectedOptionId && (
                <p className={`px-1 text-center text-sm leading-5 ${isCurrentReplySubmitted ? 'text-emerald-700' : 'text-[#6f6257]'}`}>
                  {isCurrentReplySubmitted
                    ? 'Reply submitted. Your choice shapes the next response.'
                    : 'Submit this reply to see how the conversation responds.'}
                </p>
              )}

              <Button
                className="h-14 w-full rounded-[22px] bg-[#2b241f] text-base font-semibold shadow-[0_14px_30px_rgba(43,36,31,0.20)]"
                disabled={!selectedOption || isCurrentReplySubmitted || showFeedback}
                aria-disabled={!selectedOption || isCurrentReplySubmitted || showFeedback}
                onClick={handleSubmit}
              >
                {isUpdatingSubmittedReply ? 'Update reply' : 'Submit reply'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <section className="space-y-5 rounded-[24px] bg-[#fffaf3]/90 p-4 ring-1 ring-[#eadfce] lg:hidden">
          <div>
            <div className="text-sm font-medium text-[#8a6a28]">Teacher notes</div>
            <p className="mt-1 text-sm leading-6 text-neutral-600">Use these notes after the main practice when you want a little more support.</p>
          </div>

          {primaryTeacherNote ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveNoteId(primaryTeacherNote.id)}
                className="w-full rounded-2xl border border-[#d6a856] bg-[#f3eadf] px-3 py-2 text-left text-sm font-semibold text-[#2b241f]"
              >
                Current focus · {primaryTeacherNote.title}
              </button>
              <button
                type="button"
                onClick={() => setFocusedTeacherNotesOpen((open) => !open)}
                className="flex min-h-10 w-full items-center justify-between rounded-2xl border border-[#eadfce] bg-white/65 px-3 py-2 text-left text-sm text-neutral-600"
                aria-expanded={focusedTeacherNotesOpen}
              >
                More notes
                {focusedTeacherNotesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {focusedTeacherNotesOpen && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {additionalTeacherNotes.map((note) => (
                    <button key={note.id} type="button" onClick={() => setActiveNoteId(note.id)} className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${activeNote.id === note.id ? 'border-[#d6a856] bg-[#f3eadf]' : 'border-[#eadfce] bg-white/65 text-neutral-600'}`}>
                      {note.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {currentChapter.grammarNotes.map((note) => (
                <button key={note.id} onClick={() => setActiveNoteId(note.id)} className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${activeNote.id === note.id ? 'border-[#d6a856] bg-[#f3eadf] text-[#2b241f]' : 'border-[#eadfce] bg-[#fffaf3]/75 text-neutral-600 hover:border-[#d6a856]'}`}>
                  {note.title}
                </button>
              ))}
            </div>
          )}

          <div className="border-l-2 border-[#d6a856] bg-white/60 py-3 pl-4 pr-3">
            <h4 className="font-semibold">{visibleTeacherNote.title}</h4>
            <p className="mt-1 text-sm leading-6 text-neutral-600">{visibleTeacherNote.short}</p>
          </div>

          <TeacherNoteKeyLanguage
            support={visibleTeacherNoteSupport}
            expanded={teacherKeyLanguageExpanded}
            onToggle={() => setTeacherKeyLanguageExpanded((expanded) => !expanded)}
          />

          <div className="space-y-3 text-sm leading-6 text-neutral-700">
            {visibleTeacherNote.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium">Quick examples</div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <DisplayToggleButton active={quickExamplesShowPinyin} label="Quick Pinyin" onClick={() => setQuickExamplesShowPinyin((v) => !v)} compact />
                <DisplayToggleButton active={quickExamplesShowEnglish} label="Quick English" onClick={() => setQuickExamplesShowEnglish((v) => !v)} compact />
              </div>
            </div>

            <div className="space-y-2">
              {visibleQuickExamples.map((example, index) => {
                const quickExampleItem = createCollectionItem({
                  expression: example.zh,
                  pinyin: example.py,
                  english: example.en,
                  audioId: `${currentChapter.id}.grammar.${visibleTeacherNote.id}.ex${index + 1}`,
                  type: 'quick-example',
                  source: `${visibleTeacherNote.title} - Quick example`,
                  chapter: currentChapter.shortTitle,
                });
                const quickSaved = isCollected(quickExampleItem.id);
                return (
                  <div key={example.zh} className="rounded-2xl border border-[#eadfce] bg-white/70 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold leading-snug text-[#2b241f]">{example.zh}</div>
                      <div className="flex shrink-0 items-center gap-1">
                        <AudioButton audioId={`${currentChapter.id}.grammar.${visibleTeacherNote.id}.ex${index + 1}`} text={example.zh} small />
                        <SaveButton saved={quickSaved} onClick={() => toggleCollected(quickExampleItem)} />
                      </div>
                    </div>
                    {quickExamplesShowPinyin && <div className="mt-2 text-sm leading-5 text-neutral-500">{example.py}</div>}
                    {quickExamplesShowEnglish && <div className="mt-1 text-sm leading-5 text-neutral-700">{example.en}</div>}
                  </div>
                );
              })}
            </div>
            {currentChapterSupport.teacherNoteSupport.progressiveExamples && visibleTeacherNoteExamples.length > 2 && (
              <button type="button" onClick={() => setTeacherQuickExamplesExpanded((expanded) => !expanded)} className="min-h-10 rounded-full border border-[#d8cbb8] bg-white/70 px-3 py-2 text-sm font-semibold text-[#6f6257]">
                {teacherQuickExamplesExpanded ? 'Show fewer' : `Show ${visibleTeacherNoteExamples.length - 2} more`}
              </button>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (currentView === 'home') {
      return (
        <div className="space-y-5 text-sm">
          <section className="border-l-2 border-[#d6a856] bg-[#fffaf3]/55 py-1 pl-4">
            <h3 className="font-semibold text-[#2b241f]">Teacher notes</h3>
            <div className="mt-3 space-y-3 leading-6 text-neutral-600">
              <p>Begin with one scene. Listen for tone before you decide which reply sounds natural.</p>
              <p>Save only the phrases you can imagine saying again.</p>
              <p>Review is for hearing a better shape, not for feeling wrong.</p>
            </div>
          </section>
          <section className="border-t border-[#eadfce] pt-4 leading-6 text-neutral-600">
            <h3 className="font-semibold text-[#2b241f]">Keep your place</h3>
            <p className="mt-2">Your practice can stay on this device or sync with your account when you sign in.</p>
          </section>
        </div>
      );
    }

    if (currentView === 'favorites') {
      return (
        <div className="space-y-4 text-sm">
          <Card className="rounded-3xl border-0 bg-[#fffaf3]/70 shadow-none ring-1 ring-[#eadfce]/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Saving phrases well</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-neutral-600">
              <div className="border-l-2 border-[#d6a856] pl-3">Save phrases because you can imagine saying them, not because they look difficult.</div>
              <div className="border-l-2 border-[#d6a856] pl-3">Your notes become a small personal phrasebook for review.</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'review') {
      return (
        <div className="space-y-4 text-sm">
          <Card className="rounded-3xl border-0 bg-[#fffaf3]/70 shadow-none ring-1 ring-[#eadfce]/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Review gently</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-neutral-600">
              <div className="border-l-2 border-[#d6a856] pl-3">Awkward answers are useful. They show you where a sentence needs a more natural shape.</div>
              <div className="border-l-2 border-[#d6a856] pl-3">Review is for listening again, not for feeling wrong.</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'settings') {
      return (
        <div className="space-y-5 text-sm">
          <section className="border-l-2 border-[#d6a856] bg-[#fffaf3]/55 py-1 pl-4">
            <h3 className="font-semibold text-[#2b241f]">Teacher notes</h3>
            <div className="mt-3 space-y-3 leading-6 text-neutral-600">
              <p>Keep the display comfortable for how you like to read Chinese.</p>
              <p>Use sync when you want this practice record to follow you to another device.</p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-sm">
        <Card className="rounded-3xl border-0 bg-[#fffaf3]/70 shadow-none ring-1 ring-[#eadfce]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Teacher notes</CardTitle>
            <p className="text-sm text-neutral-500">Grammar is explained where the learner is most likely to get stuck.</p>
          </CardHeader>
          <CardContent>
            {primaryTeacherNote ? (
              <div className="mb-4 space-y-2">
                <button type="button" onClick={() => setActiveNoteId(primaryTeacherNote.id)} className="w-full rounded-2xl border border-[#d6a856] bg-[#f3eadf] px-3 py-2 text-left text-sm font-semibold text-[#2b241f]">
                  Current focus · {primaryTeacherNote.title}
                </button>
                <button type="button" onClick={() => setFocusedTeacherNotesOpen((open) => !open)} className="flex min-h-10 w-full items-center justify-between rounded-2xl border border-[#eadfce] bg-white/65 px-3 py-2 text-left text-sm text-neutral-600" aria-expanded={focusedTeacherNotesOpen}>
                  More notes
                  {focusedTeacherNotesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {focusedTeacherNotesOpen && (
                  <div className="space-y-2">
                    {additionalTeacherNotes.map((note) => (
                      <button key={note.id} type="button" onClick={() => setActiveNoteId(note.id)} className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${activeNote.id === note.id ? 'border-[#d6a856] bg-[#f3eadf]' : 'border-[#eadfce] bg-white/65 text-neutral-600'}`}>
                        {note.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {currentChapter.grammarNotes.map((note) => (
                  <button key={note.id} onClick={() => setActiveNoteId(note.id)} className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${activeNote.id === note.id ? 'border-[#d6a856] bg-[#f3eadf] text-[#2b241f]' : 'border-[#eadfce] bg-[#fffaf3]/75 text-neutral-600 hover:border-[#d6a856]'}`}>
                    {note.title}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
              <h4 className="font-semibold">{visibleTeacherNote.title}</h4>
              <p className="mt-1 text-sm text-neutral-600">{visibleTeacherNote.short}</p>
            </div>

            <TeacherNoteKeyLanguage
              support={visibleTeacherNoteSupport}
              expanded={teacherKeyLanguageExpanded}
              onToggle={() => setTeacherKeyLanguageExpanded((expanded) => !expanded)}
            />

            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              {visibleTeacherNote.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-3 flex flex-col gap-2">
                <div className="text-sm font-medium">Quick examples</div>
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                  <DisplayToggleButton active={quickExamplesShowPinyin} label="Quick Pinyin" onClick={() => setQuickExamplesShowPinyin((v) => !v)} compact />
                  <DisplayToggleButton active={quickExamplesShowEnglish} label="Quick English" onClick={() => setQuickExamplesShowEnglish((v) => !v)} compact />
                </div>
              </div>
              <div className="space-y-2">
                {visibleQuickExamples.map((example, index) => {
                  const quickExampleItem = createCollectionItem({
                    expression: example.zh,
                    pinyin: example.py,
                    english: example.en,
                    audioId: `${currentChapter.id}.grammar.${visibleTeacherNote.id}.ex${index + 1}`,
                    type: 'quick-example',
                    source: `${visibleTeacherNote.title} · Quick example`,
                    chapter: currentChapter.shortTitle,
                  });
                  const quickSaved = isCollected(quickExampleItem.id);
                  return (
                    <div key={example.zh} className="rounded-xl border border-neutral-200 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium">{example.zh}</div>
                        <div className="flex items-center gap-1">
                          <AudioButton audioId={`${currentChapter.id}.grammar.${visibleTeacherNote.id}.ex${index + 1}`} text={example.zh} small />
                          <SaveButton saved={quickSaved} onClick={() => toggleCollected(quickExampleItem)} />
                        </div>
                      </div>
                      {quickExamplesShowPinyin && <div className="mt-1 text-neutral-500">{example.py}</div>}
                      {quickExamplesShowEnglish && <div className="mt-2 text-neutral-700">{example.en}</div>}
                    </div>
                  );
                })}
              </div>
              {currentChapterSupport.teacherNoteSupport.progressiveExamples && visibleTeacherNoteExamples.length > 2 && (
                <button type="button" onClick={() => setTeacherQuickExamplesExpanded((expanded) => !expanded)} className="mt-2 min-h-10 rounded-full border border-[#d8cbb8] bg-white/70 px-3 py-2 text-sm font-semibold text-[#6f6257]">
                  {teacherQuickExamplesExpanded ? 'Show fewer' : `Show ${visibleTeacherNoteExamples.length - 2} more`}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-[#fffaf3]/70 shadow-none ring-1 ring-[#eadfce]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Practice rhythm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-neutral-600">
            <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
              <div className="font-medium">1. Listen for naturalness</div>
              <p className="mt-1 text-neutral-600">The order changes, so the work is to hear which reply fits the social moment.</p>
            </div>
            <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
              <div className="font-medium">2. Keep useful language</div>
              <p className="mt-1 text-neutral-600">Save the expressions you would want in your own speaking.</p>
            </div>
            <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
              <div className="font-medium">3. Notice the social effect</div>
              <p className="mt-1 text-neutral-600">Each reply changes the mood of the conversation, not just a score.</p>
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
        audioId: `glossary.${normalizeAudioKey(selectedGlossary.pinyin || selectedGlossary.title)}.term`,
        type: 'glossary-term',
        source: 'Glossary term',
        chapter: currentChapter.shortTitle,
      })
    : null;
  const glossaryTermSaved = glossaryTermItem ? isCollected(glossaryTermItem.id) : false;

  return (
    <div className="min-h-screen bg-[#f7f2ea] bg-[radial-gradient(circle_at_top_left,_#fffaf3_0,_#f7f2ea_42%,_#efe7db_100%)] px-3 pb-44 pt-4 text-[#2b241f] md:p-6">
      <div className="mx-auto mb-6 hidden max-w-[1440px] rounded-full bg-[#fffaf3]/80 p-2 shadow-sm ring-1 ring-[#eadfce] md:grid md:grid-cols-5">
        <AppSectionButton active={currentView === 'home'} icon={House} title="Home" subtitle="Pick up practice" onClick={() => setCurrentView('home')} />
        <AppSectionButton active={currentView === 'story'} icon={Compass} title="Story" subtitle="Practice a scene" onClick={() => setCurrentView('story')} />
        <AppSectionButton active={currentView === 'favorites'} icon={Bookmark} title="Notes" subtitle="Saved phrases" onClick={() => setCurrentView('favorites')} />
        <AppSectionButton active={currentView === 'review'} icon={RotateCcw} title="Review" subtitle="Listen again" onClick={() => setCurrentView('review')} />
        <AppSectionButton active={currentView === 'settings'} icon={Settings2} title="Settings" subtitle="Practice setup" onClick={() => setCurrentView('settings')} />
      </div>

      <div className="mx-auto mb-4 max-w-7xl md:hidden">
        <div className="relative overflow-hidden rounded-[34px] bg-[#2b241f] p-5 text-white shadow-[0_20px_50px_rgba(43,36,31,0.22)]">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#d6a856]/25 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Yun Mandarin Lab
              </div>
              <div className="rounded-full bg-[#d6a856] px-3 py-1 text-xs font-semibold text-[#2b241f]">
                {currentChapter.level}
              </div>
            </div>

            <div className="mt-6 text-sm text-white/60">{currentChapter.label}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{currentChapter.shortTitle}</div>
            <div className="mt-2 max-w-xs text-sm leading-5 text-white/75">{currentChapter.subtitle}</div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                <span>Chapter progress</span>
                <span>{safeCurrentNodeIndex + 1}/{chapterDecisionTotal}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#d6a856]" style={{ width: `${chapterProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mb-4 max-w-7xl md:hidden">
        <select
          value={currentChapterIndex}
          onChange={(e) => {
            const nextIndex = Number(e.target.value);
            setCurrentChapterIndex(nextIndex);
            setCurrentNodeIndex(0);
            setSelectedOptionId(null);
            setShowFeedback(false);
            setActiveNoteId(chapters[nextIndex].grammarNotes[0].id);
          }}
          className="w-full appearance-none rounded-[24px] border border-[#eadfce] bg-white/90 px-4 py-4 text-sm font-semibold text-[#2b241f] shadow-[0_10px_30px_rgba(43,36,31,0.08)] outline-none"
        >
          {chapters.map((chapter, index) => (
            <option key={chapter.id} value={index}>
              {chapter.label}: {chapter.shortTitle}
            </option>
          ))}
        </select>
      </div>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[240px_minmax(640px,920px)_260px] lg:items-start xl:grid-cols-[260px_minmax(720px,1020px)_280px]">
        <Card className="hidden rounded-[28px] border-0 bg-[#fffaf3]/82 shadow-sm ring-1 ring-[#eadfce] lg:block">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-[#2b241f] text-white">Yun Mandarin Lab</Badge>
              <Badge variant="outline" className="rounded-full border-[#d8cbb8] bg-[#fffaf3] text-[#6f6257]">Practice studio</Badge>
            </div>
            <CardTitle className="pt-2 text-2xl">Yun Mandarin Lab</CardTitle>
            <p className="text-sm leading-6 text-neutral-600">Guided Mandarin practice for everyday scenes, natural replies, and phrases worth keeping.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-500">Practice path</span>
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
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-[#2b241f] bg-[#2b241f] text-white shadow-sm'
                        : 'border-transparent bg-transparent hover:bg-[#f3eadf]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-2 ${active ? 'bg-white/15' : 'bg-[#f3eadf]'}`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-[#6f6257]'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm ${active ? 'text-white/75' : 'text-neutral-500'}`}>{chapter.label}</div>
                        <div className="font-semibold">{chapter.shortTitle}</div>
                        <div className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-neutral-600'}`}>{chapter.subtitle}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentView !== 'story' && (
              <>
                <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-4 w-4" /> Social comfort
                  </div>
                  <Progress value={trust} className="h-2" />
                  <p className="mt-2 text-xs text-neutral-500">How polite, safe, and smooth your reply feels in the situation.</p>
                </div>

                <div className="rounded-2xl bg-[#f3eadf]/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" /> Naturalness mastery
                  </div>
                  <Progress value={mastery} className="h-2" />
                  <p className="mt-2 text-xs text-neutral-500">How close your Chinese is to something a real person would naturally say.</p>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-dashed border-[#d8cbb8] bg-[#fffaf3]/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" /> Language notes
              </div>
              <div className="space-y-2 text-sm">
                {collected.length === 0 ? (
                  <p className="text-neutral-500">Save phrases you want to hear again.</p>
                ) : (
                  collected.slice(-5).reverse().map((item) => (
                    <div key={item.id} className="rounded-xl bg-[#f3eadf]/80 p-2">{item.expression}</div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#2b241f] p-4 text-sm text-white">
              <div className="font-semibold">Yun Mandarin Lab</div>
              <div className="mt-1 text-white/80">Mandarin practice for real conversations.</div>
              <div className="mt-2 text-white/70">Yun Mandarin Lab</div>
            </div>
          </CardContent>
        </Card>

        <main className="min-w-0">
          {renderMainView()}
        </main>

        <aside className="hidden lg:block">
          {renderRightPanel()}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-3 z-40 px-3 md:hidden">
        <div className="mx-auto flex max-w-md gap-1 rounded-[30px] border border-[#eadfce] bg-[#fffaf3]/95 p-2 shadow-[0_18px_45px_rgba(43,36,31,0.18)] backdrop-blur">
          <MobileTabButton active={currentView === 'home'} icon={House} label="Home" onClick={() => setCurrentView('home')} />
          <MobileTabButton active={currentView === 'story'} icon={Compass} label="Story" onClick={() => setCurrentView('story')} />
          <MobileTabButton active={currentView === 'favorites'} icon={Bookmark} label="Saved" onClick={() => setCurrentView('favorites')} />
          <MobileTabButton active={currentView === 'review'} icon={RotateCcw} label="Review" onClick={() => setCurrentView('review')} />
          <MobileTabButton active={currentView === 'settings'} icon={Settings2} label="Settings" onClick={() => setCurrentView('settings')} />
        </div>
      </div>

      <FeedbackModal
        open={Boolean(showFeedback && selectedOption && currentView === 'story')}
        onClose={() => setShowFeedback(false)}
      >
        {selectedOption && (
          <>
              <div className="flex items-start justify-between gap-4 pr-10">
                <SpeakerHeader speaker={currentSpeaker} rating={selectedOption.rating} compact />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 text-sm font-medium text-[#8a6a28]">Teacher feedback</div>
                  <div className="mb-2 flex items-center gap-2">
                    {selectedOption.rating === 'Natural' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-600" />
                    )}
                    <RatingBadge rating={selectedOption.rating} />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className={`${fontScale === 'sm' ? 'text-xl sm:text-2xl' : fontScale === 'lg' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} font-semibold leading-tight text-[#2b241f]`}>{selectedOption.zh}</h3>
                    <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-[#f3eadf] px-3 py-1.5 text-xs font-medium text-[#6f6257]">
                      <span className="hidden sm:inline">Hear it</span>
                      <AudioButton audioId={`${currentNodeAudioPrefix}.option.${selectedOption.rating.toLowerCase()}`} text={selectedOption.zh} />
                    </div>
                  </div>
                  {showPinyin && <p className="mt-2 text-sm leading-6 text-neutral-500">{selectedOption.py}</p>}
                  {showEnglish && <p className="mt-1 text-sm leading-6 text-neutral-700">{selectedOption.en}</p>}
                </div>
              </div>

              <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
                <div data-feedback-teacher-note className="border-l-2 border-[#d6a856] bg-white/60 py-3 pl-4 pr-3">
                  <div className="mb-2 text-sm font-medium">Teacher note</div>
                  {selectedOption.rating === 'Natural' ? (
                    <p className="text-sm leading-6 text-neutral-700">{selectedOption.explanation}</p>
                  ) : (
                    <div className="space-y-1.5 text-sm leading-6 text-neutral-700">
                      <p className="font-medium">{visibleTeacherNote.short}</p>
                      <p className="text-neutral-600">{selectedOption.explanation}</p>
                    </div>
                  )}
                </div>
                <div data-feedback-how-it-lands className="border-l-2 border-[#d6a856] bg-white/60 py-3 pl-4 pr-3">
                  <div className="mb-2 text-sm font-medium">How it lands</div>
                  <p className="text-sm text-neutral-700">
                    Social comfort {(submittedSceneDeltas?.socialComfort ?? selectedOption.relationship) >= 0 ? '+' : ''}{submittedSceneDeltas?.socialComfort ?? selectedOption.relationship}
                    {' · '}Naturalness {(submittedSceneDeltas?.naturalness ?? SCENE_NATURALNESS_DELTA[selectedOption.rating]) >= 0 ? '+' : ''}
                    {submittedSceneDeltas?.naturalness ?? SCENE_NATURALNESS_DELTA[selectedOption.rating]}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
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

              <div className="mt-3">
                <TeacherNoteKeyLanguage
                  support={visibleTeacherNoteSupport}
                  expanded={feedbackKeyLanguageExpanded}
                  onToggle={() => setFeedbackKeyLanguageExpanded((expanded) => !expanded)}
                  disclosure
                  showExample={false}
                />
              </div>

              <div className="mt-4">
                <StorySceneMetrics metrics={sceneMetrics} transition={sceneMetricTransition} compact />
              </div>

              {isLastNode && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d8cbb8] bg-white/60 px-4 py-3 text-sm">
                  <span className="font-semibold text-[#2b241f]">Completion support</span>
                  <span className="rounded-full bg-[#f3eadf] px-3 py-1 font-semibold text-[#6f6257]">{completionSupportLabel}</span>
                </div>
              )}

              <BetterVersionPanel
                betterVersion={betterVersion}
                open={betterVersionOpen}
                showPinyin={betterVersionShowPinyin}
                showEnglish={betterVersionShowEnglish}
                onToggleOpen={() => setBetterVersionOpen((open) => !open)}
                onTogglePinyin={() => setBetterVersionShowPinyin((visible) => !visible)}
                onToggleEnglish={() => setBetterVersionShowEnglish((visible) => !visible)}
              />

              <AnimatePresence mode="wait">
                {conversationEnding && (
                  <motion.section
                    key={conversationEnding.label}
                    initial={{ opacity: 0, y: 14, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="mt-5 overflow-hidden rounded-[26px] border border-indigo-200 bg-[linear-gradient(135deg,_#f5f3fa_0%,_#fff9ed_100%)]"
                  >
                    <EndingLanguageSection
                      ending={conversationEnding}
                      showPinyin={endingShowPinyin}
                      showEnglish={endingShowEnglish}
                      onTogglePinyin={() => setEndingShowPinyin((visible) => !visible)}
                      onToggleEnglish={() => setEndingShowEnglish((visible) => !visible)}
                    />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/70 p-3 text-sm">
                          <div className="text-neutral-500">Final Social comfort</div>
                          <div className="mt-1 text-xl font-semibold text-[#25222f]">{sceneMetrics.socialComfort}</div>
                        </div>
                        <div className="rounded-2xl bg-white/70 p-3 text-sm">
                          <div className="text-neutral-500">Final Naturalness</div>
                          <div className="mt-1 text-xl font-semibold text-[#25222f]">{sceneMetrics.naturalness}</div>
                        </div>
                      </div>
                      <p className="border-l-2 border-amber-500 pl-3 text-sm leading-6 text-neutral-600">{conversationEnding.explanation}</p>
                    </div>
                    <div className="grid gap-2 border-t border-indigo-200/70 bg-white/45 p-3 sm:grid-cols-2">
                      <Button variant="outline" className="min-h-11 rounded-2xl bg-white/75" onClick={() => handleStoryRewind(0)}>Rewind to decision 1</Button>
                      <Button variant="outline" className="min-h-11 rounded-2xl bg-white/75" onClick={() => handleStoryRewind(2)}>Rewind to decision 3</Button>
                      <Button variant="outline" className="min-h-11 rounded-2xl bg-white/75" onClick={() => handleStoryRewind(4)}>Rewind to decision 5</Button>
                      <Button variant="outline" className="min-h-11 rounded-2xl border-indigo-300 bg-indigo-50 text-indigo-950 hover:bg-indigo-100" onClick={handleStoryReplay}>Replay with less English support</Button>
                      {replayMemoryItems.length > 0 && (
                        <Button
                          variant="outline"
                          className="min-h-11 rounded-2xl border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 sm:col-span-2"
                          onClick={() => {
                            setMemoryReplayOpen(true);
                            setMemoryReplayIndex(0);
                            setMemoryReplayHintState({});
                          }}
                        >
                          Replay the language moments
                        </Button>
                      )}
                    </div>
                    <AnimatePresence initial={false}>
                      {memoryReplayOpen && replayMemoryItems.length > 0 && (
                        <MemoryReplayPanel
                          items={replayMemoryItems}
                          index={memoryReplayIndex}
                          state={memoryReplayHintState}
                          onStateChange={setMemoryReplayHintState}
                          onIndexChange={(index) => {
                            setMemoryReplayHintState({});
                            setMemoryReplayIndex(index);
                          }}
                          onClose={() => {
                            setMemoryReplayOpen(false);
                            setMemoryReplayHintState({});
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}
              </AnimatePresence>

              {sceneResultTier && (
                <motion.section
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="mt-5 overflow-hidden rounded-[24px] border border-indigo-200 bg-[linear-gradient(135deg,_#f5f3fa,_#fff8ea)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/70 px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">{sceneResultTier.tier}</div>
                      <h4 className="mt-0.5 text-lg font-semibold text-[#25222f]">{sceneResultTier.label}</h4>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold text-[#25222f]">
                      <span className="rounded-full bg-white/80 px-2.5 py-1">Comfort {sceneMetrics.socialComfort}</span>
                      <span className="rounded-full bg-white/80 px-2.5 py-1">Naturalness {sceneMetrics.naturalness}</span>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <p className="text-sm leading-6 text-neutral-700">{sceneResultTier.intro}</p>
                    <div className="rounded-2xl border border-indigo-100 bg-white/65 px-3 py-2 text-sm leading-5 text-neutral-600">
                      <div className="font-semibold text-[#25222f]">{completionSupportLabel} · {sceneResultTier.supportSummary}</div>
                      <div className="mt-1">{sceneResultTier.supportRule}</div>
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">What you earned in this run</div>
                    <div className="text-sm font-semibold text-[#25222f]">{sceneResultTier.title}</div>
                    {sceneResultTier.examples ? (
                      <div className="space-y-3">
                        {sceneResultTier.examples.map((example) => (
                          <div key={example.zh} className="border-l-2 border-indigo-300 pl-3">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1 text-lg font-semibold leading-snug text-[#25222f]">{example.zh}</div>
                              <div className="shrink-0"><AudioButton text={example.zh} /></div>
                            </div>
                            {showPinyin && <div className="mt-1 text-sm leading-5 text-indigo-700/75">{example.py}</div>}
                            {showEnglish && <div className="mt-1 text-sm leading-5 text-neutral-600">{example.en}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-l-2 border-indigo-300 pl-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1 text-lg font-semibold leading-snug text-[#25222f]">{sceneResultTier.zh}</div>
                          <div className="shrink-0"><AudioButton text={sceneResultTier.zh} /></div>
                        </div>
                        {showPinyin && <div className="mt-1 text-sm leading-5 text-indigo-700/75">{sceneResultTier.py}</div>}
                        {showEnglish && <div className="mt-1 text-sm leading-5 text-neutral-600">{sceneResultTier.en}</div>}
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-between">
                <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                  <Button variant="outline" className="h-11 rounded-2xl md:h-auto" onClick={handlePreviousNode} disabled={safeCurrentNodeIndex === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" className="h-11 rounded-2xl md:h-auto" onClick={handleNextNode} disabled={isLastNode || !isCurrentReplySubmitted}>
                    Next
                  </Button>
                </div>
                <Button className="h-12 w-full rounded-2xl px-6 text-base font-semibold md:h-auto md:w-auto" onClick={handleContinue} disabled={!isCurrentReplySubmitted}>
                  {isLastNode ? (isLastChapter ? 'Finish practice' : 'Next chapter') : 'Back to lesson'}
                </Button>
              </div>
          </>
        )}
      </FeedbackModal>

      <AnimatePresence>
        {selectedGlossary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-0 md:p-4"
            onClick={() => setSelectedGlossaryKey(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] bg-[#fffaf3] p-4 shadow-[0_-18px_50px_rgba(43,36,31,0.22)] sm:p-5 md:max-w-3xl md:rounded-[28px] md:bg-white md:p-6 md:shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d8c9b8] md:hidden" />
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                 <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-sky-100 text-sky-800">Tap Glossary</Badge>
                    {glossaryShowPinyin && <Badge variant="outline" className="rounded-full">{selectedGlossary.pinyin}</Badge>}
                  </div>
                   
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className={`${glossaryTitleClass} font-semibold`}>{selectedGlossary.title}</h3>
                      <AudioButton audioId={`glossary.${normalizeAudioKey(selectedGlossary.pinyin || selectedGlossary.title)}.term`} text={selectedGlossary.title} />
                    </div>
                    
                    {glossaryTermItem && (
                      <SaveButton saved={glossaryTermSaved} onClick={() => toggleCollected(glossaryTermItem)} />
                    )}
                  </div>
                   
                  {glossaryShowEnglish && <p className="mt-1 text-sm text-neutral-600">{selectedGlossary.translation}</p>}
                </div>
                  
                <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:mt-0 md:max-w-sm">
                  <DisplayToggleButton active={glossaryShowPinyin} label="Glossary Pinyin" onClick={() => setGlossaryShowPinyin((v) => !v)} compact />
                  <DisplayToggleButton active={glossaryShowEnglish} label="Glossary English" onClick={() => setGlossaryShowEnglish((v) => !v)} compact />
                  <Button variant="outline" className="h-11 rounded-2xl sm:col-span-2" onClick={() => setSelectedGlossaryKey(null)}>
                    Close
                  </Button>
                </div>
              </div>
              

              {glossaryShowEnglish && (
                <div className="mt-5 rounded-2xl bg-[#f3eadf]/70 p-4 text-sm leading-6 text-neutral-700">
                  {selectedGlossary.explanation}
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium">Practical examples</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleGlossaryExamples.map((example, index) => {
                    const glossaryExampleItem = createCollectionItem({
                      expression: example.zh,
                      pinyin: example.py,
                      english: example.en,
                      audioId: example.audioId,
                      type: 'glossary-example',
                      source: `${selectedGlossary.title} · Glossary example`,
                      chapter: currentChapter.shortTitle,
                    });
                    const glossaryExampleSaved = isCollected(glossaryExampleItem.id);
                    return (
                      <div key={example.zh} className="rounded-2xl border border-neutral-200 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-1">
                          <div className={`${fontScale === 'sm' ? 'text-sm' : fontScale === 'lg' ? 'text-lg' : 'text-base'} min-w-0 font-semibold leading-snug`}>{example.zh}</div>
                          <AudioButton audioId={example.audioId} text={example.zh} small />
                        </div>
                        <SaveButton saved={glossaryExampleSaved} onClick={() => toggleCollected(glossaryExampleItem)} />
                        </div>
                        {glossaryShowPinyin && <div className="mt-1 text-sm text-neutral-500">{example.py}</div>}
                        {glossaryShowEnglish && <div className="mt-2 text-sm text-neutral-700">{example.en}</div>}
                      </div>
                    );
                  })}
                </div>
                {canExpandGlossaryExamples && (
                  <button
                    type="button"
                    onClick={() => setGlossaryExamplesExpanded((expanded) => !expanded)}
                    className="mt-3 min-h-10 rounded-full border border-[#d8cbb8] bg-white px-4 py-2 text-sm font-semibold text-[#6f6257]"
                  >
                    {glossaryExamplesExpanded ? 'Show fewer' : `Show ${glossaryExamplePolicy.requiredCount - glossaryExamplePolicy.initiallyVisible} more`}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
