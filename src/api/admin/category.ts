import adminRequest from "../adminRequest";
import type {
  CategoryCreatePayload,
  CategoryItem,
  CategoryScope,
  CategoryUpdatePayload,
} from "@/types/category";

/** 有効/無効を問わず全件返す（管理画面用） */
export function fetchAdminCategories(scope: CategoryScope): Promise<CategoryItem[]> {
  return adminRequest.get("/api/admin/categories", { params: { scope } });
}

export function createCategory(data: CategoryCreatePayload): Promise<CategoryItem> {
  return adminRequest.post("/api/admin/categories", data);
}

export function updateCategory(
  id: number,
  data: CategoryUpdatePayload
): Promise<CategoryItem> {
  return adminRequest.put(`/api/admin/categories/${id}`, data);
}

export function deleteCategory(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/categories/${id}`);
}
