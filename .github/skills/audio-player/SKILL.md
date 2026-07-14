---
name: audio-player
description: 语音播放器组件（AudioPlayer）的实现与使用规范，含进度条拖动、多音频列表场景
---

# 语音播放器（AudioPlayer）

课程详情页的核心组件，位置：`src/components/AudioPlayer.tsx`。基于 HTML5 `<audio>` + MUI 自定义 UI，不引入第三方播放器库。

## 组件接口

```tsx
interface AudioPlayerProps {
  src: string;      // 后端返回的音频 URL（/uploads/audio/...）
  title?: string;   // 段落/音频名称
}
```

## 实现要点

1. `<audio>` 元素用 `useRef` 持有，不渲染原生控件（不加 `controls` 属性）。
2. **播放/暂停**：IconButton 切换 `PlayArrow` / `Pause` 图标；监听 `onPlay` / `onPause` / `onEnded` 同步按钮状态（不要只依赖点击事件翻转本地状态）。
3. **进度条**：MUI `Slider`
   - `onTimeUpdate` 更新 Slider 值；
   - 拖动中（`onChange`）只更新显示值、不写 `currentTime`，松手（`onChangeCommitted`）才 seek —— 避免拖动时音频疯狂跳跃；
   - `max` 用 `onLoadedMetadata` 拿到的 `duration`，注意 duration 为 `NaN`/`Infinity` 时的兜底。
4. **时间显示**：当前时间 / 总时长，格式 `mm:ss`，抽一个 `formatTime` 工具函数。
5. **加载与错误**：`onError` 时显示"音频加载失败"占位，不让组件崩掉；`onWaiting` 可显示缓冲态。

## 多音频列表（详情页场景）

一篇文章可能带多条音频（按 `sort_order` 排序）。约定：

- 详情页渲染 `AudioPlayer` 列表，每条音频一个实例；
- **同一时刻只允许一条音频播放**：某条开始播放时暂停其他实例。实现方式：详情页用一个 `playingId` state 下发，或组件内部监听全局 `document` 上的自定义事件，二选一，保持简单。

## 自检

- 播放 → 拖动进度 → 暂停 → 继续播放，状态与 UI 始终一致。
- 播放到结尾按钮回到「播放」态、进度归零或停在末尾（选一种，保持一致）。
- 播放 A 时点播 B，A 自动暂停。
- 断网/404 音频 URL 时组件显示错误态而非白屏。
