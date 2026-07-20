"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import AddIcon from "@mui/icons-material/Add";
import {
  createEnArticle,
  fetchAdminEnArticleDetail,
  updateEnArticle,
} from "@/api/admin/enArticle";
import { fetchAdminCategories } from "@/api/admin/category";
import { uploadAudio, uploadImage } from "@/api/admin/upload";
import type { EnArticleSavePayload } from "@/types/enArticle";

// wangEditor はクライアント側でのみ描画可能なため、SSR 読み込みを無効化する
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

interface AudioRow {
  url: string;
  title: string;
}

interface WordRow {
  sentenceIndex: string; // TextField 制御のため文字列で保持し、保存時に数値化する
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningZh: string;
  exampleEn: string;
  exampleZh: string;
}

const EMPTY_HTML = "<p><br></p>";
const EMPTY_WORD: WordRow = {
  sentenceIndex: "0",
  word: "",
  phonetic: "",
  partOfSpeech: "",
  meaningZh: "",
  exampleEn: "",
  exampleZh: "",
};

export default function EnArticleEditPage() {
  const params = useParams<{ id?: string[] }>();
  const router = useRouter();
  const id = params.id?.[0] ? Number(params.id[0]) : null;

  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [translation, setTranslation] = useState("");
  const [audios, setAudios] = useState<AudioRow[]>([]);
  const [words, setWords] = useState<WordRow[]>([]);
  const [accessLevel, setAccessLevel] = useState(0); // 0=無料試読 1=VIP限定（フェーズ9）

  const [titleError, setTitleError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const detail = await fetchAdminEnArticleDetail(id);
      setTitle(detail.title);
      setLevel(detail.level);
      setCategory(detail.category);
      setCoverUrl(detail.coverUrl);
      setContent(detail.content || "");
      setTranslation(detail.translation || "");
      setAccessLevel(detail.accessLevel ?? 0);
      setAudios(
        [...detail.audios].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => ({ url: a.url, title: a.title || "" }))
      );
      setWords(
        [...detail.words].sort((a, b) => a.sortOrder - b.sortOrder).map((w) => ({
          sentenceIndex: String(w.sentenceIndex),
          word: w.word,
          phonetic: w.phonetic || "",
          partOfSpeech: w.partOfSpeech || "",
          meaningZh: w.meaningZh,
          exampleEn: w.exampleEn || "",
          exampleZh: w.exampleZh || "",
        }))
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([fetchAdminCategories("EN_ARTICLE_LEVEL"), fetchAdminCategories("EN_ARTICLE_CATEGORY")])
      .then(([levelItems, categoryItems]) => {
        const activeLevels = levelItems.filter((c) => c.status === 1).map((c) => c.value);
        const activeCategories = categoryItems.filter((c) => c.status === 1).map((c) => c.value);
        setLevelOptions(activeLevels);
        setCategoryOptions(activeCategories);
        if (!id) {
          setLevel((v) => v || activeLevels[0] || "");
          setCategory((v) => v || activeCategories[0] || "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      setCoverUrl(await uploadImage(file));
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    setUploadingAudio(true);
    try {
      const url = await uploadAudio(file);
      const name = file.name.replace(/\.[^.]+$/, "");
      setAudios((list) => [...list, { url, title: name }]);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setUploadingAudio(false);
    }
  };

  const moveAudio = (index: number, dir: -1 | 1) => {
    setAudios((list) => {
      const next = index + dir;
      if (next < 0 || next >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const updateWord = (index: number, patch: Partial<WordRow>) => {
    setWords((list) => list.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const handleSave = async (status: number) => {
    if (!title.trim()) {
      setTitleError("タイトルを入力してください");
      return;
    }
    setTitleError(null);
    setSaving(true);
    try {
      const payload: EnArticleSavePayload = {
        title: title.trim(),
        content: content === EMPTY_HTML ? "" : content,
        translation: translation === EMPTY_HTML ? "" : translation,
        level,
        category,
        coverUrl,
        status,
        accessLevel,
        audios: audios.map((a, i) => ({ url: a.url, title: a.title.trim() || null, sortOrder: i })),
        words: words
          .filter((w) => w.word.trim() && w.meaningZh.trim())
          .map((w, i) => ({
            sentenceIndex: Number(w.sentenceIndex) || 0,
            word: w.word.trim(),
            phonetic: w.phonetic.trim() || null,
            partOfSpeech: w.partOfSpeech.trim() || null,
            meaningZh: w.meaningZh.trim(),
            exampleEn: w.exampleEn.trim() || null,
            exampleZh: w.exampleZh.trim() || null,
            sortOrder: i,
          })),
      };
      if (id) await updateEnArticle(id, payload);
      else await createEnArticle(payload);
      router.push("/admin/en-articles");
    } catch (e) {
      setToast((e as Error).message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (loadError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            再試行
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  }

  const busy = saving || uploadingCover || uploadingAudio;

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => router.push("/admin/en-articles")} aria-label="一覧に戻る">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{id ? `記事の編集 #${id}` : "新規英語精読記事"}</Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!titleError}
            helperText={titleError}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <TextField select label="レベル（CEFR）" value={level} onChange={(e) => setLevel(e.target.value)} sx={{ width: 160 }}>
              {(level && !levelOptions.includes(level) ? [level, ...levelOptions] : levelOptions).map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="カテゴリ" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ width: 180 }}>
              {(category && !categoryOptions.includes(category) ? [category, ...categoryOptions] : categoryOptions).map(
                (c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                )
              )}
            </TextField>
            <TextField
              select
              label="公開レベル"
              value={accessLevel}
              onChange={(e) => setAccessLevel(Number(e.target.value))}
              sx={{ width: 160 }}
              helperText="VIP限定は無料会員には非公開"
            >
              <MenuItem value={0}>無料試読</MenuItem>
              <MenuItem value={1}>VIP限定</MenuItem>
            </TextField>
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              カバー画像（jpg/png/webp、5MB以下）
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {coverUrl && (
                <Box component="img" src={coverUrl} alt="カバー画像プレビュー" sx={{ width: 160, height: 90, objectFit: "cover", borderRadius: 1 }} />
              )}
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? "アップロード中…" : coverUrl ? "カバー画像を変更" : "カバー画像をアップロード"}
              </Button>
              {coverUrl && (
                <Button color="error" onClick={() => setCoverUrl(null)}>
                  削除
                </Button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadCover(file);
                  e.target.value = "";
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              本文（英語、段落ごとに1段落）
            </Typography>
            <RichTextEditor value={content} onChange={setContent} />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              中国語訳（任意、段落の順序は本文と一対一対応）
            </Typography>
            <RichTextEditor value={translation} onChange={setTranslation} />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              音声（mp3/m4a/wav、50MB以下、複数可、表示順に並び替え可）
            </Typography>
            <List dense disablePadding>
              {audios.map((audio, index) => (
                <ListItem key={`${audio.url}-${index}`} disableGutters sx={{ gap: 1, alignItems: "center" }}>
                  <AudiotrackIcon color="action" fontSize="small" />
                  <TextField
                    size="small"
                    placeholder="音声タイトル（任意）"
                    value={audio.title}
                    onChange={(e) =>
                      setAudios((list) => list.map((a, i) => (i === index ? { ...a, title: e.target.value } : a)))
                    }
                    sx={{ width: 220 }}
                  />
                  <Box component="audio" src={audio.url} controls sx={{ height: 36, flexGrow: 1 }} />
                  <IconButton size="small" disabled={index === 0} onClick={() => moveAudio(index, -1)} aria-label="上へ移動">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === audios.length - 1}
                    onClick={() => moveAudio(index, 1)}
                    aria-label="下へ移動"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setAudios((list) => list.filter((_, i) => i !== index))}
                    aria-label="音声を削除"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={uploadingAudio}
              onClick={() => audioInputRef.current?.click()}
              sx={{ mt: 1 }}
            >
              {uploadingAudio ? "アップロード中…" : "音声をアップロード"}
            </Button>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,.mp3,.m4a,.wav"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAudio(file);
                e.target.value = "";
              }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              単語リスト（文中の難語。study-zh スキルで事前生成して貼り付け可）
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              単語は本文の綴りと完全に一致（大文字小文字は区別しないが、時制・単複数などの語形変化は自動一致しない。例：本文が emphasized の場合 emphasize では一致しない）していないと読書ページでハイライトされず、一致しない場合はその単語は表示されない。文番号は現状記録用途のみで、読書ページのハイライト一致には影響しない（ハイライトは本文の実際の内容で検索するため、文番号の正誤には依存しない）。
            </Typography>
            <Stack spacing={2}>
              {words.map((w, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                    <TextField
                      size="small"
                      label="文番号"
                      type="number"
                      value={w.sentenceIndex}
                      onChange={(e) => updateWord(index, { sentenceIndex: e.target.value })}
                      sx={{ width: 90 }}
                    />
                    <TextField
                      size="small"
                      label="単語（本文と綴りが一致）"
                      value={w.word}
                      onChange={(e) => updateWord(index, { word: e.target.value })}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      size="small"
                      label="発音記号"
                      value={w.phonetic}
                      onChange={(e) => updateWord(index, { phonetic: e.target.value })}
                      sx={{ width: 160 }}
                    />
                    <TextField
                      size="small"
                      label="品詞"
                      value={w.partOfSpeech}
                      onChange={(e) => updateWord(index, { partOfSpeech: e.target.value })}
                      sx={{ width: 100 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setWords((list) => list.filter((_, i) => i !== index))}
                      aria-label="単語を削除"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <TextField
                    size="small"
                    label="中国語の意味"
                    value={w.meaningZh}
                    onChange={(e) => updateWord(index, { meaningZh: e.target.value })}
                    fullWidth
                    sx={{ mb: 1.5 }}
                  />
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      size="small"
                      label="例文（英語）"
                      value={w.exampleEn}
                      onChange={(e) => updateWord(index, { exampleEn: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="例文（中国語）"
                      value={w.exampleZh}
                      onChange={(e) => updateWord(index, { exampleZh: e.target.value })}
                      fullWidth
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setWords((list) => [...list, { ...EMPTY_WORD }])}
              sx={{ mt: 1.5 }}
            >
              単語を追加
            </Button>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => router.push("/admin/en-articles")}>キャンセル</Button>
            <Button variant="outlined" disabled={busy} onClick={() => handleSave(0)}>
              {saving ? "保存中…" : "下書き保存"}
            </Button>
            <Button variant="contained" disabled={busy} onClick={() => handleSave(1)}>
              {saving ? "保存中…" : "保存して公開"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
}
