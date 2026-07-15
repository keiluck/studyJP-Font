"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AudioPlayer, { TranslationMode } from "@/components/AudioPlayer";
import SentenceItem, { renderRubyWords } from "@/components/SentenceItem";
import { fetchArticleDetail } from "@/api/article";
import { indexAtFraction, parseReaderSentences, startFractionOf } from "@/lib/articleContent";
import { annotateTexts } from "@/lib/furigana";
import type { ArticleDetail, RubyWord } from "@/types";

const formatDate = (createdAt: string) => {
  const date = new Date(createdAt.replace(" ", "T"));
  if (isNaN(date.getTime())) return createdAt;
  return date.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 阅读页：后端富文本正文按 。！？ 自动分句展示（假名标注/翻译/集中听力）。
 * - 分句与中文逐句配对规则见 lib/articleContent.ts（admin 整段粘贴即可）；
 * - 假名标注与词类着色由前端 kuromoji 生成，见 lib/furigana.ts；
 * - 后端暂无逐句时间轴，播放高亮/点句跳播按字符数比例估算（lib/articleContent.ts），
 *   待后端对齐数据就绪后替换为精确同步。
 */
export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 工具栏状态（页面持有，播放器受控）
  const [showRuby, setShowRuby] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [translationMode, setTranslationMode] = useState<TranslationMode>("always");
  const [listeningMode, setListeningMode] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [audioIndex, setAudioIndex] = useState(0); // 多音频时当前曲目
  const [activeIndex, setActiveIndex] = useState<number | null>(null); // 当前朗读句（估算）

  const activeRef = useRef<HTMLDivElement | null>(null);
  const listeningModeRef = useRef(listeningMode);
  listeningModeRef.current = listeningMode;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setArticle(await fetchArticleDetail(Number(id)));
      setAudioIndex(0);
      setListeningIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // 富文本 → 逐句单元（阅读列表与集中听力共用；翻译已按句配对）
  const units = useMemo(
    () => (article ? parseReaderSentences(article.content, article.translation) : []),
    [article]
  );
  const unitTexts = useMemo(() => units.map((u) => u.text), [units]);

  // 假名标注与词类：按句生成；词典加载完成前先显示纯文本
  const [ruby, setRuby] = useState<RubyWord[][] | null>(null);
  useEffect(() => {
    setRuby(null);
    if (unitTexts.length === 0) return;
    let cancelled = false;
    annotateTexts(unitTexts)
      .then((all) => {
        if (!cancelled) setRuby(all);
      })
      .catch((err) => console.warn("假名标注生成失败，按纯文本展示", err));
    return () => {
      cancelled = true;
    };
  }, [unitTexts]);

  // 听力模式锁背景滚动
  useEffect(() => {
    document.body.style.overflow = listeningMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [listeningMode]);

  // 播放进度 → 估算当前句并高亮（无时间轴，按字符数比例）
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      const audio = document.querySelector("audio");
      const duration = audio?.duration;
      if (!duration || !isFinite(duration) || duration <= 0) return;
      const fraction = Math.min(currentTime / duration, 0.9999);
      const idx = indexAtFraction(unitTexts, fraction);
      setActiveIndex(idx);
      if (listeningModeRef.current) setListeningIndex(idx);
    },
    [unitTexts]
  );

  // 高亮句变化时滚到屏幕中央（普通模式）
  useEffect(() => {
    if (!listeningMode && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, listeningMode]);

  /** 跳到第 idx 句的估算起点并播放（普通模式点句、听力模式上/下一句共用） */
  const jumpToUnit = (idx: number) => {
    if (idx < 0 || idx >= unitTexts.length) return;
    setActiveIndex(idx);
    setListeningIndex(idx);
    const audio = document.querySelector("audio");
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = startFractionOf(unitTexts, idx) * audio.duration;
    audio.play().catch(console.error); // 移动端自动播放策略可能拒绝
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || !article) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            重试
          </Button>
        }
      >
        {error || "文章不存在"}
      </Alert>
    );
  }

  const audios = [...article.audios].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentAudio = audios[audioIndex];
  const listeningSentence = units[listeningIndex];

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: currentAudio ? "220px" : 4 }}>
      {/* 封面 + 标题 + 日期 */}
      {article.coverUrl && (
        <Box
          component="img"
          src={article.coverUrl}
          alt={article.title}
          sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 2, mb: 2 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {article.title}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Chip size="small" label={article.level} color="primary" variant="outlined" />
        <Chip size="small" label={article.category} variant="outlined" />
        <Typography variant="body2" color="text.secondary">
          {formatDate(article.createdAt)}
        </Typography>
      </Stack>

      {/* 多音频时的曲目切换 */}
      {audios.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
          {audios.map((audio, index) => (
            <Chip
              key={audio.id}
              label={audio.title || `音声 ${index + 1}`}
              color={index === audioIndex ? "primary" : "default"}
              onClick={() => setAudioIndex(index)}
            />
          ))}
        </Stack>
      )}

      {/* 句子列表：假名标注 + 词类背景着色 + 逐句翻译；点击句子按估算起点跳播 */}
      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden" }}>
        {units.map((u, idx) => (
          <div key={u.id} ref={activeIndex === idx ? activeRef : null}>
            <SentenceItem
              text={u.text}
              rubyWords={ruby?.[idx]}
              translation={u.translation}
              isActive={activeIndex === idx}
              showRuby={showRuby}
              translationMode={translationMode}
              onClick={currentAudio ? () => jumpToUnit(idx) : undefined}
            />
          </div>
        ))}
      </Box>

      {/* 集中听力模式：全屏覆盖层（低于播放器、高于 AppBar） */}
      {listeningMode && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: (t) => t.zIndex.appBar + 1,
            bgcolor: "#f5f5f5",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", px: 1, py: 1.5, bgcolor: "background.paper" }}
          >
            <IconButton onClick={() => setListeningMode(false)} aria-label="戻る">
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>戻る</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, p: 2, overflow: "hidden" }}>
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: "16px",
                height: "100%",
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                <Typography sx={{ bgcolor: "#f0f0f0", borderRadius: 4, px: 1.5, py: 0.5, fontSize: 14 }}>
                  <b>{listeningIndex + 1}</b>
                  <span style={{ color: "#999" }}> / {units.length}</span>
                </Typography>
                <Typography
                  sx={{
                    bgcolor: "#f0f0f0",
                    borderRadius: 4,
                    px: 1.5,
                    py: 0.5,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {speed}x | 無限 | 5秒
                </Typography>
              </Box>
              {listeningSentence &&
                (showText ? (
                  <Box
                    component="p"
                    sx={{
                      m: 0,
                      fontSize: 22,
                      lineHeight: showRuby && ruby?.[listeningIndex]?.length ? 2.4 : 2,
                      wordBreak: "break-all",
                      color: "#1a1a2e",
                    }}
                  >
                    {renderRubyWords(listeningSentence.text, ruby?.[listeningIndex], showRuby, false)}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bbb",
                      fontSize: 32,
                      letterSpacing: 8,
                    }}
                  >
                    ・・・
                  </Box>
                ))}
            </Box>
          </Box>
          {/* 底部给播放器控制栏留空间 */}
          <Box sx={{ height: 88 }} />
        </Box>
      )}

      {/* 底部播放器（两模式共用，保持挂载音频不中断）；切换曲目时重建重置进度 */}
      {currentAudio && (
        <AudioPlayer
          key={currentAudio.url}
          src={currentAudio.url}
          onTimeUpdate={handleTimeUpdate}
          speed={speed}
          onSpeedChange={setSpeed}
          showRuby={showRuby}
          onToggleRuby={() => setShowRuby((v) => !v)}
          translationMode={translationMode}
          onTranslationModeChange={setTranslationMode}
          onOpenListening={units.length > 0 ? () => setListeningMode(true) : undefined}
          isListeningMode={listeningMode}
          showText={showText}
          onToggleText={() => setShowText((v) => !v)}
          onPrevSentence={() => jumpToUnit(listeningIndex - 1)}
          onNextSentence={() => jumpToUnit(listeningIndex + 1)}
        />
      )}
    </Box>
  );
}
