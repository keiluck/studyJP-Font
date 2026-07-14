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
      // 只允许站内路径，防开放重定向
      router.replace(redirect?.startsWith("/") ? redirect : "/articles");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 4 }}>
      <Typography variant="h5" gutterBottom>
        登录
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="用户名"
            autoComplete="username"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message}
            {...field("username", { required: "请输入用户名" })}
          />
          <TextField
            label="密码"
            type="password"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...field("password", { required: "请输入密码" })}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "登录中…" : "登录"}
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            还没有账号？{" "}
            <Typography component={Link} href="/register" variant="body2" color="primary">
              去注册
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
