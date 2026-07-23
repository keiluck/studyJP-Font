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
import Badge from "@mui/material/Badge";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SpeedIcon from "@mui/icons-material/Speed";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TranslateIcon from "@mui/icons-material/Translate";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * 英語精読ページ専用のプレイヤー。日本語版 `components/AudioPlayer.tsx` とは独立した実装
 * （振り仮名トグルなど日本語専用の作り込みを含まず、ツールバーは 速度/集中聴力/翻訳/単語 の4項目のみ）。
 */
export type EnTranslationMode = "always" | "click" | "hidden";

interface EnAudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void; // 再生終了時に通知し、跟読ハイライトの解除に使う
  speed: number;
  onSpeedChange: (speed: number) => void;
  onOpenListening: () => void;
  translationMode: EnTranslationMode;
  onTranslationModeChange: (mode: EnTranslationMode) => void;
  onOpenWords: () => void; // 底部「単語」ボタン（入口A）
  // 集中聴力モード専用（true の間はコンパクトな操作バーに切り替える）
  isListeningMode?: boolean;
  showText?: boolean;
  onToggleText?: () => void;
  onPrevSentence?: () => void;
  onNextSentence?: () => void;
}

const SPEED_OPTIONS = [0.6, 0.8, 1.0, 1.1, 1.2, 1.5, 2.0];

const TRANSLATION_OPTIONS: { value: EnTranslationMode; label: string }[] = [
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

export default function EnAudioPlayer({
  src,
  onTimeUpdate,
  onEnded,
  speed,
  onSpeedChange,
  onOpenListening,
  translationMode,
  onTranslationModeChange,
  onOpenWords,
  isListeningMode = false,
  showText = true,
  onToggleText,
  onPrevSentence,
  onNextSentence,
}: EnAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [transOpen, setTransOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const onLoaded = () => {
      const d = audio.duration;
      setDuration(isFinite(d) && d > 0 ? d : 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setLoadError(true);
    const onEndedInternal = () => {
      onPause();
      onEnded?.();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEndedInternal);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEndedInternal);
      audio.removeEventListener("error", onError);
    };
  }, [onTimeUpdate, onEnded]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(console.error); // モバイル端末の自動再生ポリシーにより拒否される場合がある
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const toolButton = (icon: React.ReactNode, label: string, onClick: () => void) => (
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
      PaperProps={{ sx: { borderRadius: "16px 16px 0 0", maxHeight: "70vh", px: 1, pb: 3 } }}
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
          /* 集中聴力モード：コンパクトな1行操作バー */
          <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", py: 1.5 }}>
            <IconButton onClick={onPrevSentence} aria-label="前の文">
              <SkipPreviousIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={togglePlay}
              sx={{ bgcolor: "#1a1a2e", color: "#fff", "&:hover": { bgcolor: "#33334d" } }}
              size="large"
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={onNextSentence} aria-label="次の文">
              <SkipNextIcon fontSize="large" />
            </IconButton>
            <IconButton onClick={onToggleText} aria-label="テキスト表示切替">
              {showText ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
        ) : (
          <>
            {loadError ? (
              <Typography color="error" align="center" sx={{ py: 1 }}>
                音声の読み込みに失敗しました
              </Typography>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, pt: 1 }}>
                <Button size="small" onClick={() => seek(-10)} sx={{ color: "#1a1a2e", flexShrink: 0 }}>
                  -10s
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
                    sx={{ color: "#c8392a", py: 1 }}
                  />
                  <Typography variant="caption" display="block" align="center" sx={{ mt: -0.5 }}>
                    {formatTime(dragValue ?? currentTime)} / {formatTime(duration)}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => seek(10)} sx={{ color: "#1a1a2e", flexShrink: 0 }}>
                  +10s
                </Button>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
              <IconButton
                onClick={togglePlay}
                sx={{ bgcolor: "#1a1a2e", color: "#fff", "&:hover": { bgcolor: "#33334d" } }}
                size="large"
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", pb: 1 }}>
              {toolButton(
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <SpeedIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{speed}x</Typography>
                </Box>,
                "スピード",
                () => setSpeedOpen(true)
              )}
              {toolButton(<HeadphonesIcon />, "集中的リスニング", onOpenListening)}
              {toolButton(<TranslateIcon />, "通訳", () => setTransOpen(true))}
              {toolButton(
                <Badge variant="dot" color="error">
                  <MenuBookIcon sx={{ color: "#1f5c57" }} />
                </Badge>,
                "単語",
                onOpenWords
              )}
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
              key={opt}
              onClick={() => {
                onSpeedChange(opt);
                setSpeedOpen(false);
              }}
            >
              <ListItemText primary={`${opt}x`} />
              {speed === opt && <CheckIcon />}
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
