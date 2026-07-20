import adminRequest from "../adminRequest";
import type {
  AdminQuestionDetail,
  AdminQuestionListItem,
  QuestionSavePayload,
  QuestionType,
} from "@/types/quiz";
import type { PageQuery, PageResult } from "@/types";

export interface AdminQuestionQuery extends PageQuery {
  type?: QuestionType;
  subject?: string;
  category?: string;
  status?: number;
  keyword?: string;
}

export function fetchAdminQuestions(
  params: AdminQuestionQuery
): Promise<PageResult<AdminQuestionListItem>> {
  return adminRequest.get("/api/admin/questions", { params });
}

export function fetchAdminQuestionDetail(id: number): Promise<AdminQuestionDetail> {
  return adminRequest.get(`/api/admin/questions/${id}`);
}

export function createQuestion(data: QuestionSavePayload): Promise<AdminQuestionDetail> {
  return adminRequest.post("/api/admin/questions", data);
}

export function updateQuestion(
  id: number,
  data: QuestionSavePayload
): Promise<AdminQuestionDetail> {
  return adminRequest.put(`/api/admin/questions/${id}`, data);
}

export function deleteQuestion(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/questions/${id}`);
}
