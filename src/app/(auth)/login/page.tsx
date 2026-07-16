"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
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
import { login, LoginParams } from "@/api/user";
import { useUserAuth } from "@/store/userAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useUserAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginParams>();

  const onSubmit = async (values: LoginParams) => {
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(values);
      setAuth(token, user);
      const redirect = searchParams.get("redirect");
      // サイト内パスのみ許可し、オープンリダイレクトを防止する
      router.replace(redirect?.startsWith("/") ? redirect : "/articles");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ width: "100%", maxWidth: 420, p: 4 }}>
      <Typography variant="h5" gutterBottom>
        ログイン
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="ユーザー"
            autoComplete="username"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message}
            {...field("username", { required: "ユーザー名を入力してください" })}
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
          <Typography variant="body2" color="text.secondary" align="center">
            アカウントをお持ちでない方は{" "}
            <Typography component={Link} href="/register" variant="body2" color="primary">
              新規登録へ
            </Typography>
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
