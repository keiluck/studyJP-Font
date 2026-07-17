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
import EnAudioPlayer, { EnTranslationMode } from "@/components/EnArticle/EnAudioPlayer";
import EnSentenceItem from "@/components/EnArticle/EnSentenceItem";
import EnWordSheet from "@/components/EnArticle/EnWordSheet";
import { fetchEnArticleDetail } from "@/api/enArticle";
import { indexAtFraction, parseEnglishSentences, startFractionOf } from "@/lib/enArticleContent";
import type { EnArticleDetail } from "@/types/enArticle";

const formatDate = (createdAt: string) => {
  const date = new Date(createdAt.replace(" ", "T"));
  if (isNaN(date.getTime())) return createdAt;
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 英語精読ページ：日本語版の読書ページ（`(user)/articles/[id]/page.tsx`）とは独立した実装。
 * - 分文・難語マッチは `lib/enArticleContent.ts`（日本語版の `lib/articleContent.ts` とは独立）。
 * - 単語表は2つの入口（底部「単語」ボタン／句中の難語クリック）から同じ `EnWordSheet` を開く。
 */
export default function EnArticleReaderPage() {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<EnArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [speed, setSpeed] = useState(1.0);
  const [translationMode, setTranslationMode] = useState<EnTranslationMode>("always");
  const [listeningMode, setListeningMode] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [audioIndex, setAudioIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 単語表ボトムシート：sheetOpen で開閉、activeWordId は句中クリック（入口B）のときのみ設定される
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);

  const activeRef = useRef<HTMLDivElement | null>(null);
  const listeningModeRef = useRef(listeningMode);
  listeningModeRef.current = listeningMode;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setArticle(await fetchEnArticleDetail(Number(id)));
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

  const units = useMemo(
    () => (article ? parseEnglishSentences(article.content, article.translation) : []),
    [article]
  );
  const unitTexts = useMemo(() => units.map((u) => u.text), [units]);
  const words = article?.words ?? [];

  useEffect(() => {
    document.body.style.overflow = listeningMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [listeningMode]);

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

  useEffect(() => {
    if (!listeningMode && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, listeningMode]);

  const jumpToUnit = (idx: number) => {
    if (idx < 0 || idx >= unitTexts.length) return;
    setActiveIndex(idx);
    setListeningIndex(idx);
    const audio = document.querySelector("audio");
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = startFractionOf(unitTexts, idx) * audio.duration;
    audio.play().catch(console.error);
  };

  const openWordSheetFromButton = () => {
    setActiveWordId(null);
    setSheetOpen(true);
  };

  const openWordSheetFromSentence = (wordId: number) => {
    setActiveWordId(wordId);
    setSheetOpen(true);
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
    <Box sx={{ maxWidth: 720, mx: "auto", pb: currentAudio ? "170px" : 4 }}>
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

      {audios.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
          {audios.map((audio, index) => (
            <Chip
              key={audio.id}
              label={audio.title || `音频 ${index + 1}`}
              color={index === audioIndex ? "primary" : "default"}
              onClick={() => setAudioIndex(index)}
            />
          ))}
        </Stack>
      )}

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden" }}>
        {units.map((u, idx) => (
          <div key={u.id} ref={activeIndex === idx ? activeRef : null}>
            <EnSentenceItem
              text={u.text}
              words={words}
              translation={u.translation}
              isActive={activeIndex === idx}
              translationMode={translationMode}
              onWordClick={openWordSheetFromSentence}
            />
          </div>
        ))}
      </Box>

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
          <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 1.5, bgcolor: "background.paper" }}>
            <IconButton onClick={() => setListeningMode(false)} aria-label="返回">
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>返回</Typography>
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
                <Typography sx={{ bgcolor: "#f0f0f0", borderRadius: 4, px: 1.5, py: 0.5, fontSize: 14, fontWeight: 600 }}>
                  {speed}x
                </Typography>
              </Box>
              {listeningSentence &&
                (showText ? (
                  <Box component="p" sx={{ m: 0, fontSize: 20, lineHeight: 2, color: "#1a1a2e" }}>
                    {listeningSentence.text}
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
          <Box sx={{ height: 88 }} />
        </Box>
      )}

      {currentAudio && (
        <EnAudioPlayer
          key={currentAudio.url}
          src={currentAudio.url}
          onTimeUpdate={handleTimeUpdate}
          speed={speed}
          onSpeedChange={setSpeed}
          onOpenListening={() => setListeningMode(true)}
          translationMode={translationMode}
          onTranslationModeChange={setTranslationMode}
          onOpenWords={openWordSheetFromButton}
          isListeningMode={listeningMode}
          showText={showText}
          onToggleText={() => setShowText((v) => !v)}
          onPrevSentence={() => jumpToUnit(listeningIndex - 1)}
          onNextSentence={() => jumpToUnit(listeningIndex + 1)}
        />
      )}

      <EnWordSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        words={words}
        activeWordId={activeWordId}
      />
    </Box>
  );
}
