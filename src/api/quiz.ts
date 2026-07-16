import request from "./request";
import type {
  AnswerResult,
  PracticeCard,
  PracticeStartPayload,
  PracticeStartResult,
  Question,
} from "@/types/quiz";

/** 練習開始：公開済み問題から出題セットを確定し、練習ページへ遷移するための record id を返す */
export function startPractice(
  payload: PracticeStartPayload = {}
): Promise<PracticeStartResult> {
  return request.post("/api/user/practices", payload);
}

/** 答題カード + 集計 */
export function fetchPracticeCard(id: number): Promise<PracticeCard> {
  return request.get(`/api/user/practices/${id}`);
}

/** 出題。answered=true なら myLabels/correctLabels/explanation を含む（未回答時は存在しない） */
export function fetchPracticeQuestion(
  id: number,
  seq: number
): Promise<Question> {
  return request.get(`/api/user/practices/${id}/questions/${seq}`);
}

/** 回答提出。再提出は 400 */
export function submitAnswer(
  id: number,
  seq: number,
  labels: string[]
): Promise<AnswerResult> {
  return request.post(`/api/user/practices/${id}/answers`, { seq, labels });
}

/** 重新練習：同じ問題セット・同じ出題順で新しい record を作成する */
export function retryPractice(id: number): Promise<PracticeStartResult> {
  return request.post(`/api/user/practices/${id}/retry`);
}
