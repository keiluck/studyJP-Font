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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import {
  createArticle,
  fetchAdminArticleDetail,
  updateArticle,
} from "@/api/admin/article";
import { uploadAudio, uploadImage } from "@/api/admin/upload";
import type { ArticleLevel, ArticleSavePayload } from "@/types";

// wangEditor 只能客户端渲染，关闭 SSR 加载
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const LEVELS: ArticleLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const CATEGORIES = ["ニュース", "生活", "文化", "科学"];

/** 编辑中的音频行（未保存前无 id） */
interface AudioRow {
  url: string;
  title: string;
}

const EMPTY_HTML = "<p><br></p>"; // wangEditor 空内容

export default function ArticleEditPage() {
  const params = useParams<{ id?: string[] }>();
  const router = useRouter();
  const id = params.id?.[0] ? Number(params.id[0]) : null;

  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 表单状态（字段少且含富文本/文件，直接 useState 受控，不引入 react-hook-form）
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<string>("N5");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [translation, setTranslation] = useState(""); // 中文翻译富文本，段落与正文一一对应
  const [audios, setAudios] = useState<AudioRow[]>([]);

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
      const detail = await fetchAdminArticleDetail(id);
      setTitle(detail.title);
      setLevel(detail.level);
      setCategory(detail.category);
      setCoverUrl(detail.coverUrl);
      setContent(detail.content || "");
      setTranslation(detail.translation || "");
      setAudios(
        [...detail.audios]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((a) => ({ url: a.url, title: a.title || "" }))
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
      // 默认用文件名（去扩展名）作为音频标题，可再编辑
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

  /** 保存（草稿 status=0 / 发布 status=1），上传中禁止提交 */
  const handleSave = async (status: number) => {
    if (!title.trim()) {
      setTitleError("请输入标题");
      return;
    }
    setTitleError(null);
    setSaving(true);
    try {
      const payload: ArticleSavePayload = {
        title: title.trim(),
        content: content === EMPTY_HTML ? "" : content,
        translation: translation === EMPTY_HTML ? "" : translation,
        level,
        category,
        coverUrl,
        status,
        audios: audios.map((a, i) => ({
          url: a.url,
          title: a.title.trim() || null,
          sortOrder: i,
        })),
      };
      if (id) await updateArticle(id, payload);
      else await createArticle(payload);
      router.push("/admin/articles");
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
            重试
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  }

  const busy = saving || uploadingCover || uploadingAudio;

  return (
    <Box sx={{ maxWidth: 920 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => router.push("/admin/articles")} aria-label="返回列表">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{id ? `编辑文章 #${id}` : "新增文章"}</Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!titleError}
            helperText={titleError}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="等级"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              sx={{ width: 140 }}
            >
              {LEVELS.map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="分类"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ width: 180 }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* 封面上传 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              封面图（jpg/png/webp，≤5MB）
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {coverUrl && (
                <Box
                  component="img"
                  src={coverUrl}
                  alt="封面预览"
                  sx={{ width: 160, height: 90, objectFit: "cover", borderRadius: 1 }}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? "上传中…" : coverUrl ? "更换封面" : "上传封面"}
              </Button>
              {coverUrl && (
                <Button color="error" onClick={() => setCoverUrl(null)}>
                  移除
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
                  e.target.value = ""; // 允许重选同一文件
                }}
              />
            </Stack>
          </Box>

          {/* 正文富文本 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              正文（日语，每段一个段落）
            </Typography>
            <RichTextEditor value={content} onChange={setContent} />
          </Box>

          {/* 中文翻译富文本：段落顺序与正文一一对应，阅读页按段配对展示 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              中文翻译（可选，段落顺序与正文一一对应）
            </Typography>
            <RichTextEditor value={translation} onChange={setTranslation} />
          </Box>

          {/* 音频列表：上传多条、可排序删除 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              音频（mp3/m4a/wav，≤50MB，可多条，按顺序展示）
            </Typography>
            <List dense disablePadding>
              {audios.map((audio, index) => (
                <ListItem
                  key={`${audio.url}-${index}`}
                  disableGutters
                  sx={{ gap: 1, alignItems: "center" }}
                >
                  <AudiotrackIcon color="action" fontSize="small" />
                  <TextField
                    size="small"
                    placeholder="音频标题（可选）"
                    value={audio.title}
                    onChange={(e) =>
                      setAudios((list) =>
                        list.map((a, i) =>
                          i === index ? { ...a, title: e.target.value } : a
                        )
                      )
                    }
                    sx={{ width: 220 }}
                  />
                  <Box component="audio" src={audio.url} controls sx={{ height: 36, flexGrow: 1 }} />
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => moveAudio(index, -1)}
                    aria-label="上移"
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === audios.length - 1}
                    onClick={() => moveAudio(index, 1)}
                    aria-label="下移"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setAudios((list) => list.filter((_, i) => i !== index))}
                    aria-label="删除音频"
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
              {uploadingAudio ? "上传中…" : "上传音频"}
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

          {/* 保存操作 */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => router.push("/admin/articles")}>取消</Button>
            <Button variant="outlined" disabled={busy} onClick={() => handleSave(0)}>
              {saving ? "保存中…" : "存草稿"}
            </Button>
            <Button variant="contained" disabled={busy} onClick={() => handleSave(1)}>
              {saving ? "保存中…" : "保存并发布"}
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
