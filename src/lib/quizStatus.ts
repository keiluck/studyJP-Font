import type { PracticeCardItem } from "@/types/quiz";

/** 答題カード/結果ページで共用する3状態判定 */
export type ItemStatus = "unanswered" | "correct" | "wrong";

export function itemStatus(item: PracticeCardItem): ItemStatus {
  if (!item.answered) return "unanswered";
  return item.correct ? "correct" : "wrong";
}

/** ラベル集合（順不同）が一致するか。フッターの「您選択」の色分けに使用する */
export function labelsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}
