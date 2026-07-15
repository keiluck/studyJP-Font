// TODO: mock —— 后端阶段三接口就绪后删除本文件（src/api/article.ts 中 USE_MOCK 置 false）
import type {
  ArticleDetail,
  ArticleListItem,
  PageResult,
  Sentence,
} from "@/types";
import type { ArticleQuery } from "../article";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/**
 * 文章一：完整形态（sentences 含时间轴 + rubyWords 假名标注）。
 * 文本与 public/audio/001.mp3 的真实语音内容（自己紹介，约 13.05s）一致；
 * 时间轴按句子字数比例分配，联调时可按实际听感微调。
 */
const article1Sentences: Sentence[] = [
  {
    id: "s1",
    text: "はじめまして、ケイと申します。",
    translation: "您好，我叫 Kei。",
    startTime: 0,
    endTime: 2.72,
    rubyWords: [
      { text: "はじめまして、" },
      { text: "ケイ" },
      { text: "と" },
      { text: "申します", ruby: "もうします" },
      { text: "。" },
    ],
  },
  {
    id: "s2",
    text: "フロントエンドエンジニアとして働いています。",
    translation: "目前担任前端工程师。",
    startTime: 2.72,
    endTime: 6.71,
    rubyWords: [
      { text: "フロントエンドエンジニア" },
      { text: "として" },
      { text: "働いて", ruby: "はたらいて" },
      { text: "います。" },
    ],
  },
  {
    id: "s3",
    text: "現在はJavaとAWSも勉強しています。",
    translation: "除了前端开发之外，我也在持续学习 Java 和 AWS，希望进一步提升全栈开发能力。",
    startTime: 6.71,
    endTime: 10.15,
    rubyWords: [
      { text: "現在", ruby: "げんざい" },
      { text: "は" },
      { text: "Java" },
      { text: "と" },
      { text: "AWS" },
      { text: "も" },
      { text: "勉強", ruby: "べんきょう" },
      { text: "して" },
      { text: "います。" },
    ],
  },
  {
    id: "s4",
    text: "どうぞよろしくお願いいたします。",
    translation: "很高兴认识您，请多多指教。",
    startTime: 10.15,
    endTime: 13.05,
    rubyWords: [
      { text: "どうぞ" },
      { text: "よろしく" },
      { text: "お願い", ruby: "おねがい" },
      { text: "いたします。" },
    ],
  },
];

const listItems: ArticleListItem[] = [
  {
    id: 1,
    title: "自己紹介",
    level: "N5",
    category: "生活",
    coverUrl: null,
    createdAt: "2026-06-14 10:00:00",
  },
  {
    id: 2,
    title: "新しい切符「ＱＲコード」が始まる",
    level: "N4",
    category: "生活",
    coverUrl: null,
    createdAt: "2026-06-20 14:00:00",
  },
  {
    id: 3,
    title: "夏の花火大会が３年ぶりに開かれる",
    level: "N5",
    category: "文化",
    coverUrl: null,
    createdAt: "2026-06-25 09:30:00",
  },
  {
    id: 4,
    title: "新幹線に新しい車両が登場",
    level: "N4",
    category: "ニュース",
    coverUrl: null,
    createdAt: "2026-06-28 08:00:00",
  },
  {
    id: 5,
    title: "日本の会社　週休３日を試す",
    level: "N2",
    category: "ニュース",
    coverUrl: null,
    createdAt: "2026-07-01 10:00:00",
  },
  {
    id: 6,
    title: "コンビニのおにぎり　値段が上がる",
    level: "N5",
    category: "生活",
    coverUrl: null,
    createdAt: "2026-07-03 12:00:00",
  },
  {
    id: 7,
    title: "京都の祇園祭が始まった",
    level: "N3",
    category: "文化",
    coverUrl: null,
    createdAt: "2026-07-05 09:00:00",
  },
  {
    id: 8,
    title: "ＡＩが天気予報を手伝う",
    level: "N2",
    category: "科学",
    coverUrl: null,
    createdAt: "2026-07-08 15:00:00",
  },
  {
    id: 9,
    title: "小学校でタブレット学習が広がる",
    level: "N3",
    category: "科学",
    coverUrl: null,
    createdAt: "2026-07-10 11:00:00",
  },
  {
    id: 10,
    title: "富士山の登山　今年のルールが決まる",
    level: "N4",
    category: "生活",
    coverUrl: null,
    createdAt: "2026-07-11 10:00:00",
  },
  {
    id: 11,
    title: "海の水温が高くなっている",
    level: "N1",
    category: "科学",
    coverUrl: null,
    createdAt: "2026-07-12 16:00:00",
  },
  {
    id: 12,
    title: "外国人観光客が過去最多になった",
    level: "N1",
    category: "ニュース",
    coverUrl: null,
    createdAt: "2026-07-14 09:00:00",
  },
];

const details: Record<number, ArticleDetail> = {
  1: {
    ...listItems[0],
    content: article1Sentences.map((s) => s.text).join("\n"),
    translation: article1Sentences.map((s) => s.translation).join("\n"),
    status: 1,
    audioUrl: "/audio/001.mp3",
    sentences: article1Sentences,
  },
};

export async function mockFetchArticles(
  params: ArticleQuery
): Promise<PageResult<ArticleListItem>> {
  await delay();
  const { page, pageSize, level, category } = params;
  const filtered = listItems.filter(
    (a) => (!level || a.level === level) && (!category || a.category === category)
  );
  const start = (page - 1) * pageSize;
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function mockFetchArticleDetail(
  id: number
): Promise<ArticleDetail> {
  await delay();
  if (details[id]) return details[id];
  const item = listItems.find((a) => a.id === id);
  if (!item) throw new Error("文章不存在");
  // 其余文章复用文章一的完整形态数据，便于逐页浏览演示
  return {
    ...item,
    content: article1Sentences.map((s) => s.text).join("\n"),
    translation: article1Sentences.map((s) => s.translation).join("\n"),
    status: 1,
    audioUrl: "/audio/001.mp3",
    sentences: article1Sentences,
  };
}
