"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { adminLogin, AdminLoginParams } from "@/api/admin/auth";
import { useAdminAuth } from "@/store/adminAuth";
import { visibleAdminMenu } from "@/config/adminMenu";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAdminAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginParams>();

  const onSubmit = async (values: AdminLoginParams) => {
    setError(null);
    setSubmitting(true);
    try {
      const { token, id, username, role } = await adminLogin(values);
      setAuth(token, { id, username, status: 1, role });
      const redirect = searchParams.get("redirect");
      // 管理画面内のパスのみ許可し、オープンリダイレクトを防止する。既定の遷移先は固定パスではなく本人のロールで見える最初のメニュー
      router.replace(
        redirect?.startsWith("/admin") ? redirect : visibleAdminMenu(role)[0]?.href ?? "/admin"
      );
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <Paper sx={{ width: 420, p: 4 }}>
        <Typography variant="h5" gutterBottom>
          管理画面ログイン
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="管理者アカウント"
              autoComplete="username"
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              {...field("username", { required: "管理者アカウントを入力してください" })}
            />
            <TextField
              label="パスワード"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...field("password", { required: "パスワードを入力してください" })}
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? "ログイン中…" : "ログイン"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
