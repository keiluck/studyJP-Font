import { createHttp } from "./createHttp";

/** 用户端 http 实例，携带 user_token，仅用于 /api/user/** 接口 */
const request = createHttp({
  tokenKey: "user_token",
  loginPath: "/login",
});

export default request;
