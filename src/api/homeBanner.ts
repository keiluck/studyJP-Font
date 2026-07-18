import request from "./request";
import type { HomeBannerItem } from "@/types/homeBanner";

/** トップページの有効な主図バナーを sortOrder 順に全件取得する */
export function fetchHomeBanners(): Promise<HomeBannerItem[]> {
  return request.get("/api/user/home-banners");
}
