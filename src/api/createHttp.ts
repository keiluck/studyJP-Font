import axios, { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types";

interface HttpOptions {
  /** localStorage 中的 token key：user_token / admin_token */
  tokenKey: "user_token" | "admin_token";
  /** 401 时跳转的登录页 */
  loginPath: "/login" | "/admin/login";
}

export interface Http {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * 创建带 token 注入与统一响应解包的 http 实例。
 * 用户端与管理端各自创建，token 与登录体系完全隔离。
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
    // 已在登录页（如输错密码返回 401）时不重定向，交给表单展示错误
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
      return Promise.reject(new Error(body.message || "请求失败"));
    },
    (error) => {
      if (error.response?.status === 401) {
        handleUnauthorized();
        const message =
          error.response?.data?.message || "登录已过期，请重新登录";
        return Promise.reject(new Error(message));
      }
      const message =
        error.response?.data?.message || error.message || "网络异常，请稍后重试";
      return Promise.reject(new Error(message));
    }
  );

  return {
    get: (url, config) => instance.get(url, config),
    post: (url, data, config) => instance.post(url, data, config),
    put: (url, data, config) => instance.put(url, data, config),
    delete: (url, config) => instance.delete(url, config),
  };
}
