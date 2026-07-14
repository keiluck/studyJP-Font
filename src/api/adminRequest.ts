import { createHttp } from "./createHttp";

/** 管理端 http 实例，携带 admin_token，仅用于 /api/admin/** 接口 */
const adminRequest = createHttp({
  tokenKey: "admin_token",
  loginPath: "/admin/login",
});

export default adminRequest;
