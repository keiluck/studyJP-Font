"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TranslateIcon from "@mui/icons-material/Translate";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export type TranslationMode = "always" | "click" | "hidden";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate: (currentTime: number) => void; // 每次 timeupdate 上报，驱动句子高亮
  onPlayingChange?: (isPlaying: boolean) => void;
  // 工具栏（受控，状态由页面持有）
  speed: number;
  onSpeedChange: (speed: number) => void;
  showRuby: boolean; // 假名（振り仮名）显隐
  onToggleRuby: () => void;
  onOpenListening: () => void; // 切换集中听力模式
  translationMode: TranslationMode;
  onTranslationModeChange: (mode: TranslationMode) => void;
  // 集中听力模式专用
  isListeningMode?: boolean;
  showText?: boolean;
  onToggleText?: () => void;
  onPrevSentence?: () => void;
  onNextSentence?: () => void;
}

const SPEED_OPTIONS = [
  { value: 0.6, label: "ゆーっくり" },
  { value: 0.8, label: "ゆっくり" },
  { value: 1.0, label: "ふつう" },
  { value: 1.1, label: "ちょっとはやい" },
  { value: 1.2, label: "ややはやい" },
  { value: 1.5, label: "はやい" },
  { value: 2.0, label: "とてもはやい" },
];

const TRANSLATION_OPTIONS: { value: TranslationMode; label: string }[] = [
  { value: "always", label: "翻訳を表示する" },
  { value: "click", label: "クリックして翻訳を表示する" },
  { value: "hidden", label: "翻訳を非表示する" },
];

const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function AudioPlayer({
  src,
  onTimeUpdate,
  onPlayingChange,
  speed,
  onSpeedChange,
  showRuby,
  onToggleRuby,
  onOpenListening,
  translationMode,
  onTranslationModeChange,
  isListeningMode = false,
  showText = true,
  onToggleText,
  onPrevSentence,
  onNextSentence,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null); // 拖动中只更新显示值
  const [loadError, setLoadError] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [transOpen, setTransOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate(audio.currentTime);
    };
    const onLoaded = () => {
      const d = audio.duration;
      setDuration(isFinite(d) && d > 0 ? d : 0);
    };
    const onPlay = () => {
      setIsPlaying(true);
      onPlayingChange?.(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };
    const onError = () => setLoadError(true);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [onTimeUpdate, onPlayingChange]);

  // 变速：speed 变化时直接设 playbackRate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(console.error); // 移动端自动播放策略可能拒绝
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const playButton = (
    <IconButton
      onClick={togglePlay}
      sx={{ bgcolor: "#1a1a2e", color: "#fff", "&:hover": { bgcolor: "#33334d" } }}
      size="large"
    >
      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
    </IconButton>
  );

  /** 工具栏按钮：图标在上小字在下 */
  const toolButton = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void
  ) => (
    <Box
      key={label}
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        color: "#1a1a2e",
        minWidth: 64,
      }}
    >
      <Box sx={{ height: 28, display: "flex", alignItems: "center" }}>{icon}</Box>
      <Typography variant="caption" color="inherit">
        {label}
      </Typography>
    </Box>
  );

  /** 底部弹窗（速度/翻译共用样式） */
  const bottomSheet = (
    open: boolean,
    onClose: () => void,
    title: string,
    children: React.ReactNode
  ) => (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: "16px 16px 0 0", maxHeight: "70vh", px: 1, pb: 3 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      {children}
    </Drawer>
  );

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (t) => t.zIndex.appBar + 2,
          bgcolor: "background.paper",
          borderTop: "1px solid #eee",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          pb: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {isListeningMode ? (
          /* 集中听力模式：单行控制栏 */
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              py: 1.5,
            }}
          >
            <IconButton onClick={() => seek(-2)} aria-label="2秒戻る">
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  border: "2px solid #1a1a2e",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1a1a2e",
                }}
              >
                2
              </Box>
            </IconButton>
            <IconButton onClick={onPrevSentence} aria-label="前の文">
              <SkipPreviousIcon fontSize="large" />
            </IconButton>
            {playButton}
            <IconButton onClick={onNextSentence} aria-label="次の文">
              <SkipNextIcon fontSize="large" />
            </IconButton>
            <IconButton onClick={onToggleText} aria-label="テキスト表示切替">
              {showText ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
        ) : (
          /* 普通模式：进度条行 + 播放控制行 + 工具栏行 */
          <>
            {loadError ? (
              <Typography color="error" align="center" sx={{ py: 1 }}>
                音频加载失败
              </Typography>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, pt: 1 }}>
                <Button size="small" onClick={() => seek(-10)} sx={{ color: "#1a1a2e", flexShrink: 0 }}>
                  - 10s
                </Button>
                <Box sx={{ flexGrow: 1 }}>
                  <Slider
                    size="small"
                    value={dragValue ?? currentTime}
                    max={duration || 0}
                    step={0.1}
                    onChange={(_, v) => setDragValue(v as number)}
                    onChangeCommitted={(_, v) => {
                      if (audioRef.current) audioRef.current.currentTime = v as number;
                      setDragValue(null);
                    }}
                    sx={{ color: "#1a1a2e", py: 1 }}
                  />
                  <Typography variant="caption" display="block" align="center" sx={{ mt: -0.5 }}>
                    {formatTime(dragValue ?? currentTime)} / {formatTime(duration)}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => seek(10)} sx={{ color: "#1a1a2e", flexShrink: 0 }}>
                  + 10s
                </Button>
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                py: 0.5,
              }}
            >
              <IconButton onClick={() => seek(-30)} aria-label="30秒戻る">
                <SkipPreviousIcon fontSize="large" />
              </IconButton>
              {playButton}
              <IconButton onClick={() => seek(30)} aria-label="30秒進む">
                <SkipNextIcon fontSize="large" />
              </IconButton>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "flex-start",
                pb: 1,
              }}
            >
              {toolButton(
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{speed}x</Typography>,
                "スピード",
                () => setSpeedOpen(true)
              )}
              {toolButton(
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: showRuby ? "#1a1a2e" : "#aaa",
                    textDecoration: showRuby ? "none" : "line-through",
                  }}
                >
                  あ
                </Typography>,
                "カタカナ",
                onToggleRuby
              )}
              {toolButton(<HeadphonesIcon />, "集中的リスニング", onOpenListening)}
              {toolButton(<TranslateIcon />, "通訳", () => setTransOpen(true))}
            </Box>
          </>
        )}
      </Box>

      {bottomSheet(
        speedOpen,
        () => setSpeedOpen(false),
        "スピード",
        <List>
          {SPEED_OPTIONS.map((opt) => (
            <ListItemButton
              key={opt.value}
              onClick={() => {
                onSpeedChange(opt.value);
                setSpeedOpen(false);
              }}
            >
              <ListItemText primary={opt.label} secondary={`${opt.value}x`} />
              {speed === opt.value && <CheckIcon />}
            </ListItemButton>
          ))}
        </List>
      )}

      {bottomSheet(
        transOpen,
        () => setTransOpen(false),
        "通訳",
        <List>
          {TRANSLATION_OPTIONS.map((opt) => (
            <ListItemButton
              key={opt.value}
              onClick={() => {
                onTranslationModeChange(opt.value);
                setTransOpen(false);
              }}
            >
              <ListItemText primary={opt.label} />
              {translationMode === opt.value && <CheckIcon />}
            </ListItemButton>
          ))}
        </List>
      )}
    </>
  );
}
