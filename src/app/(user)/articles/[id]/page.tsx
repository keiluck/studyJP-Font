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
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import Link from "next/link";
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
 * 読書ページ：バックエンドから受け取ったリッチテキスト本文を「。！？」で自動分文して表示する（振り仮名注記/翻訳/集中リスニング）。
 * - 分文と中国語訳の対応付けルールは lib/articleContent.ts を参照（管理画面では段落単位で貼り付けるだけでよい）。
 * - 振り仮名注記と品詞着色はフロント側の kuromoji で生成する（lib/furigana.ts を参照）。
 * - バックエンドに文単位のタイムラインがまだ無いため、再生ハイライト/文クリックによるジャンプ再生は文字数比率で概算する（lib/articleContent.ts）。
 *   バックエンドの対応データが揃い次第、正確な同期に置き換える。
 */
export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vipRequired, setVipRequired] = useState(false);

  // ツールバーの状態（ページ側で保持し、プレイヤーを制御する）
  const [showRuby, setShowRuby] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [translationMode, setTranslationMode] = useState<TranslationMode>("always");
  const [listeningMode, setListeningMode] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [audioIndex, setAudioIndex] = useState(0); // 複数音声がある場合の現在のトラック
  const [activeIndex, setActiveIndex] = useState<number | null>(null); // 現在読み上げ中の文（概算）

  const activeRef = useRef<HTMLDivElement | null>(null);
  const listeningModeRef = useRef(listeningMode);
  listeningModeRef.current = listeningMode;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setVipRequired(false);
      setArticle(await fetchArticleDetail(Number(id)));
      setAudioIndex(0);
      setListeningIndex(0);
    } catch (err) {
      if ((err as { status?: number }).status === 403) {
        setVipRequired(true);
      } else {
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // リッチテキスト → 文単位（読書リストと集中リスニングで共用。翻訳は既に文単位で対応付け済み）
  const units = useMemo(
    () => (article ? parseReaderSentences(article.content, article.translation) : []),
    [article]
  );
  const unitTexts = useMemo(() => units.map((u) => u.text), [units]);

  // 振り仮名注記と品詞：文単位で生成する。辞書の読み込み完了前はプレーンテキストを表示する
  const [ruby, setRuby] = useState<RubyWord[][] | null>(null);
  useEffect(() => {
    setRuby(null);
    if (unitTexts.length === 0) return;
    let cancelled = false;
    annotateTexts(unitTexts)
      .then((all) => {
        if (!cancelled) setRuby(all);
      })
      .catch((err) => console.warn("振り仮名注記の生成に失敗しました。プレーンテキストで表示します", err));
    return () => {
      cancelled = true;
    };
  }, [unitTexts]);

  // リスニングモード時は背景のスクロールをロックする
  useEffect(() => {
    document.body.style.overflow = listeningMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [listeningMode]);

  // 再生進捗 → 現在の文を概算してハイライトする（タイムラインが無いため文字数比率で計算）
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

  // ハイライトされる文が変わったら画面中央にスクロールする（通常モード）
  useEffect(() => {
    if (!listeningMode && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, listeningMode]);

  /** idx 番目の文の概算開始位置にジャンプして再生する（通常モードの文クリック、リスニングモードの前/次の文で共用） */
  const jumpToUnit = (idx: number) => {
    if (idx < 0 || idx >= unitTexts.length) return;
    setActiveIndex(idx);
    setListeningIndex(idx);
    const audio = document.querySelector("audio");
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = startFractionOf(unitTexts, idx) * audio.duration;
    audio.play().catch(console.error); // モバイル端末の自動再生ポリシーにより拒否される場合がある
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (vipRequired) {
    return (
      <Box
        sx={{
          maxWidth: 480,
          mx: "auto",
          textAlign: "center",
          py: 8,
          px: 3,
        }}
      >
        <WorkspacePremiumIcon sx={{ fontSize: 56, color: "warning.main", mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          この記事はVIP会員限定です
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          VIP会員になると、すべてのコースを制限なくご利用いただけます。
        </Typography>
        <Button component={Link} href="/articles" variant="outlined">
          コース一覧に戻る
        </Button>
      </Box>
    );
  }
  if (error || !article) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            再試行
          </Button>
        }
      >
        {error || "記事が見つかりません"}
      </Alert>
    );
  }

  const audios = [...article.audios].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentAudio = audios[audioIndex];
  const listeningSentence = units[listeningIndex];

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: currentAudio ? "220px" : 4 }}>
      {/* カバー画像＋タイトル＋日付 */}
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

      {/* 複数音声がある場合のトラック切り替え */}
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

      {/* 文リスト：振り仮名注記＋品詞背景着色＋文ごとの翻訳。文をクリックすると概算開始位置からジャンプ再生する */}
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

      {/* 集中リスニングモード：全画面オーバーレイ（プレイヤーより下、AppBar より上） */}
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
          {/* 下部にプレイヤーの操作バー分のスペースを確保する */}
          <Box sx={{ height: 88 }} />
        </Box>
      )}

      {/* 下部プレイヤー（両モードで共用し、音声の再生を中断しないようマウントを維持する）。トラック切り替え時は再生成して進捗をリセットする */}
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
