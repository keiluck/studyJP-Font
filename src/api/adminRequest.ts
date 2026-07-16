import { createHttp } from "./createHttp";

/** 管理画面用の http インスタンス。admin_token を保持し、/api/admin/** 用のAPIにのみ使用する */
const adminRequest = createHttp({
  tokenKey: "admin_token",
  loginPath: "/admin/login",
});

export default adminRequest;
