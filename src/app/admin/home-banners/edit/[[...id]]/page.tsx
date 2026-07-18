"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  createHomeBanner,
  fetchAdminHomeBannerDetail,
  updateHomeBanner,
} from "@/api/admin/homeBanner";
import { uploadImage } from "@/api/admin/upload";
import type { BannerLinkType, HomeBannerSavePayload } from "@/types/homeBanner";

const LINK_TYPE_OPTIONS: { value: BannerLinkType; label: string; helper: string }[] = [
  { value: "ARTICLE", label: "日本語コース記事", helper: "リンク先に記事IDを入力してください（例：8）" },
  { value: "EN_ARTICLE", label: "英語精読記事", helper: "リンク先に記事IDを入力してください（例：1）" },
  { value: "PRACTICE", label: "問題演習", helper: "リンク先の入力は不要です（/practice に遷移します）" },
  { value: "URL", label: "外部URL", helper: "リンク先に完全なURLを入力してください（例：https://example.com）" },
  { value: "NONE", label: "リンクなし", helper: "クリックしても遷移しません" },
];

export default function HomeBannerEditPage() {
  const params = useParams<{ id?: string[] }>();
  const router = useRouter();
  const id = params.id?.[0] ? Number(params.id[0]) : null;

  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tag, setTag] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<BannerLinkType>("NONE");
  const [linkTarget, setLinkTarget] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState(true);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const detail = await fetchAdminHomeBannerDetail(id);
      setTitle(detail.title);
      setSubtitle(detail.subtitle || "");
      setTag(detail.tag || "");
      setImageUrl(detail.imageUrl);
      setLinkType(detail.linkType);
      setLinkTarget(detail.linkTarget || "");
      setSortOrder(String(detail.sortOrder));
      setStatus(detail.status === 1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      setImageUrl(await uploadImage(file));
      setImageError(null);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setUploadingImage(false);
    }
  };

  const currentOption = LINK_TYPE_OPTIONS.find((o) => o.value === linkType);
  const requiresTarget = linkType === "ARTICLE" || linkType === "EN_ARTICLE" || linkType === "URL";

  const handleSave = async () => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError("タイトルを入力してください");
      hasError = true;
    } else {
      setTitleError(null);
    }
    if (!imageUrl) {
      setImageError("画像をアップロードしてください");
      hasError = true;
    } else {
      setImageError(null);
    }
    if (hasError) return;

    setSaving(true);
    try {
      const payload: HomeBannerSavePayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        tag: tag.trim() || null,
        imageUrl: imageUrl as string,
        linkType,
        linkTarget: requiresTarget ? linkTarget.trim() : null,
        sortOrder: Number(sortOrder) || 0,
        status: status ? 1 : 0,
      };
      if (id) await updateHomeBanner(id, payload);
      else await createHomeBanner(payload);
      router.push("/admin/home-banners");
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

  const busy = saving || uploadingImage;

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => router.push("/admin/home-banners")} aria-label="一覧に戻る">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{id ? `バナーの編集 #${id}` : "新規バナー"}</Typography>
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

          <TextField
            label="補足説明（任意）"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            fullWidth
          />

          <TextField
            label="タグ（任意、例：日本語コース）"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            sx={{ width: 260 }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              主図画像（jpg/png/webp、5MB以下）
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {imageUrl && (
                <Box
                  component="img"
                  src={imageUrl}
                  alt="主図プレビュー"
                  sx={{ width: 160, height: 90, objectFit: "cover", borderRadius: 1 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
              >
                {uploadingImage ? "アップロード中…" : imageUrl ? "画像を変更" : "画像をアップロード"}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file);
                  e.target.value = "";
                }}
              />
            </Stack>
            {imageError && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                {imageError}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="リンク種別"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as BannerLinkType)}
              sx={{ width: 220 }}
            >
              {LINK_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="リンク先"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
              disabled={!requiresTarget}
              helperText={currentOption?.helper}
              fullWidth
            />
          </Stack>

          <TextField
            label="並び順（小さい順に表示）"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            sx={{ width: 200 }}
          />

          <FormControlLabel
            control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />}
            label={status ? "有効（トップページに表示）" : "無効（トップページに表示しない）"}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => router.push("/admin/home-banners")}>キャンセル</Button>
            <Button variant="contained" disabled={busy} onClick={handleSave}>
              {saving ? "保存中…" : "保存"}
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
