import { createHttp } from "./createHttp";

/** ユーザー側の http インスタンス。user_token を保持し、/api/user/** 用のAPIにのみ使用する */
const request = createHttp({
  tokenKey: "user_token",
  loginPath: "/login",
});

export default request;
