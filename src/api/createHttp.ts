import axios, { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types";

interface HttpOptions {
  /** localStorage 内の token キー：user_token / admin_token */
  tokenKey: "user_token" | "admin_token";
  /** 401 時に遷移するログインページ */
  loginPath: "/login" | "/admin/login";
}

export interface Http {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * token 注入と共通レスポンスの解包を備えた http インスタンスを作成する。
 * ユーザー側と管理側はそれぞれ個別に作成し、token とログイン体系は完全に分離される。
 */
export function createHttp({ tokenKey, loginPath }: HttpOptions): Http {
  const instance = axios.create({
    timeout: 15000,
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const handleUnauthorized = () => {
    localStorage.removeItem(tokenKey);
    // すでにログインページにいる場合（パスワード誤入力で401が返る場合など）はリダイレクトせず、フォーム側でエラー表示に任せる
    if (window.location.pathname === loginPath) return;
    const redirect = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `${loginPath}?redirect=${redirect}`;
  };

  instance.interceptors.response.use(
    (response) => {
      const body = response.data as ApiResponse;
      if (body.code === 200) {
        return body.data as never;
      }
      if (body.code === 401) {
        handleUnauthorized();
      }
      return Promise.reject(new Error(body.message || "リクエストに失敗しました"));
    },
    (error) => {
      if (error.response?.status === 401) {
        handleUnauthorized();
        const message =
          error.response?.data?.message || "ログインの有効期限が切れました。再度ログインしてください";
        return Promise.reject(Object.assign(new Error(message), { status: 401 }));
      }
      const message =
        error.response?.data?.message || error.message || "ネットワークエラーが発生しました。しばらくしてから再度お試しください";
      // HTTPステータス（403のVIP限定判定など）を呼び出し元で参照できるように付与する
      return Promise.reject(Object.assign(new Error(message), { status: error.response?.status }));
    }
  );

  return {
    get: (url, config) => instance.get(url, config),
    post: (url, data, config) => instance.post(url, data, config),
    put: (url, data, config) => instance.put(url, data, config),
    delete: (url, config) => instance.delete(url, config),
  };
}
