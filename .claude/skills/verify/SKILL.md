---
name: verify
description: 本项目（Next.js 前端）的运行验证方法：启动、浏览器驱动、常见坑
---

# studyJP-Font 运行验证

## 启动

- 后端需先运行在 8080（`curl http://localhost:8080/api/health` 应返回 200），Next.js 通过 rewrites 代理 `/api` 和 `/uploads`。
- 前端：`npm run dev`（后台运行），就绪判定：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login` 返回 200。

## 浏览器驱动（无项目内 Playwright 依赖）

Playwright 装在 npx 缓存，脚本里按绝对路径引用：

```js
const { chromium } = require("/Users/lany/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
```

（路径失效时用 `find ~/.npm/_npx -maxdepth 3 -name playwright -type d` 重新定位。）

可复用的全流程脚本模板（注册→登录→刷新→退出→守卫→双端隔离）见历史会话 scratchpad 的 `e2e-auth.js`，要点：

- MUI TextField 用 `getByLabel("用户名")`；注册页的「密码」需 `{ exact: true }` 以区分「确认密码」。
- **不要用 `getByRole("alert")` 断言错误提示**——会误抓 Next.js 的 route-announcer（也是 role=alert），用 `page.waitForSelector(".MuiAlert-message")` + `textContent`。
- 测试账号用时间戳生成（`e2e${Date.now()}`），后端 MySQL 会真实入库。

## 坑

- **dev server 运行中不要跑 `npm run build`**：两者共用 `.next` 目录，会把 dev 缓存写坏（页面资源全部 500）。恢复：停 dev → `rm -rf .next` → 重启 dev。需要 build 验证时先停 dev server。
- 首次访问某路由 dev 编译较慢，断言超时给足 30s。

## 值得驱动的流程

- 认证闭环：未登录访问 `/articles` 被拦 → 注册（自动登录）→ 刷新登录态保持 → 退出 → 再拦截。
- 登录页输错密码：应停留登录页并显示后端 message（拦截器对登录页 401 有特判）。
- 双端隔离：持 user_token 访问 `/admin/**` 应被拦到 `/admin/login`。
