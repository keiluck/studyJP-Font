"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AudioPlayer, { TranslationMode } from "@/components/AudioPlayer";
import SentenceItem, { renderRubyWords } from "@/components/SentenceItem";
import { fetchArticleDetail } from "@/api/article";
import type { ArticleDetail, Sentence } from "@/types";

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

export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 工具栏状态（页面持有，播放器受控）
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [showRuby, setShowRuby] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [translationMode, setTranslationMode] = useState<TranslationMode>("always");
  const [listeningMode, setListeningMode] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [showText, setShowText] = useState(true);

  const activeSentenceRef = useRef<HTMLDivElement | null>(null);
  const listeningModeRef = useRef(listeningMode);
  listeningModeRef.current = listeningMode;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setArticle(await fetchArticleDetail(Number(id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const displaySentences = article?.sentences ?? [];

  // 播放进度 → 高亮当前句
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!article) return;
      const idx = article.sentences.findIndex(
        (s) => currentTime >= s.startTime && currentTime < s.endTime
      );
      if (idx !== -1) {
        setActiveSentenceId(article.sentences[idx].id);
        if (listeningModeRef.current) setListeningIndex(idx);
      }
    },
    [article]
  );

  // 普通模式下高亮句变化时滚到屏幕中央
  useEffect(() => {
    if (!listeningMode && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSentenceId, listeningMode]);

  // 听力模式锁背景滚动
  useEffect(() => {
    document.body.style.overflow = listeningMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [listeningMode]);

  /** 跳到第 idx 句并从其起点播放（听力模式上/下一句、普通模式点句共用） */
  const jumpToSentence = (idx: number) => {
    if (!article) return;
    const sentences = article.sentences;
    if (idx < 0 || idx >= sentences.length) return;
    setListeningIndex(idx);
    setActiveSentenceId(sentences[idx].id);
    const audio = document.querySelector("audio");
    if (!audio) return;
    audio.currentTime = sentences[idx].startTime;
    audio.play().catch(console.error);
  };

  const toggleListeningMode = () => {
    setListeningMode((v) => !v);
    // 进入时定位到当前高亮句，体验连贯
    if (!listeningMode && activeSentenceId) {
      const idx = displaySentences.findIndex((s) => s.id === activeSentenceId);
      if (idx !== -1) setListeningIndex(idx);
    }
  };

  /** 句子渲染（听力模式大字卡片用）：带假名标注，不做背景标注 */
  const renderSentenceText = (sentence: Sentence) => (
    <Box
      component="p"
      sx={{
        m: 0,
        fontSize: 22,
        lineHeight: showRuby && sentence.rubyWords?.length ? 2.4 : 2,
        wordBreak: "break-all",
        color: "#1a1a2e",
      }}
    >
      {renderRubyWords(sentence.text, sentence.rubyWords, showRuby, false)}
    </Box>
  );

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

  const listeningSentence = displaySentences[listeningIndex];

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: "220px" }}>
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatDate(article.createdAt)}
      </Typography>

      {/* 句子列表 */}
      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden" }}>
        {displaySentences.map((s, idx) => (
          <div key={s.id} ref={activeSentenceId === s.id ? activeSentenceRef : null}>
            <SentenceItem
              text={s.text}
              rubyWords={s.rubyWords}
              translation={s.translation}
              isActive={activeSentenceId === s.id}
              showRuby={showRuby}
              translationMode={translationMode}
              onClick={() => jumpToSentence(idx)}
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
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              py: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <IconButton onClick={toggleListeningMode} aria-label="戻る">
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
                <Typography
                  sx={{
                    bgcolor: "#f0f0f0",
                    borderRadius: 4,
                    px: 1.5,
                    py: 0.5,
                    fontSize: 14,
                  }}
                >
                  <b>{listeningIndex + 1}</b>
                  <span style={{ color: "#999" }}> / {displaySentences.length}</span>
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
                  renderSentenceText(listeningSentence)
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

      {/* 底部播放器（两模式共用，保持挂载音频不中断） */}
      {article.audioUrl && (
        <AudioPlayer
          src={article.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          speed={speed}
          onSpeedChange={setSpeed}
          showRuby={showRuby}
          onToggleRuby={() => setShowRuby((v) => !v)}
          translationMode={translationMode}
          onTranslationModeChange={setTranslationMode}
          onOpenListening={toggleListeningMode}
          isListeningMode={listeningMode}
          showText={showText}
          onToggleText={() => setShowText((v) => !v)}
          onPrevSentence={() => jumpToSentence(listeningIndex - 1)}
          onNextSentence={() => jumpToSentence(listeningIndex + 1)}
        />
      )}
    </Box>
  );
}
