"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { register as apiRegister, login } from "@/api/user";
import { useUserAuth } from "@/store/userAuth";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useUserAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await apiRegister({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      // 登録成功後、自動的にログインする
      const { token, user } = await login({
        username: values.username,
        password: values.password,
      });
      setAuth(token, user);
      router.replace("/articles");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ width: "100%", maxWidth: 420, p: 4 }}>
      <Typography variant="h5" gutterBottom>
        ユーザー登録
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="ユーザー名"
            autoComplete="username"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message || "3〜50文字"}
            {...field("username", {
              required: "ユーザー名を入力してください",
              minLength: { value: 3, message: "ユーザー名は3文字以上で入力してください" },
              maxLength: { value: 50, message: "ユーザー名は50文字以内で入力してください" },
            })}
          />
          <TextField
            label="メールアドレス"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...field("email", {
              required: "メールアドレスを入力してください",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "メールアドレスの形式が正しくありません",
              },
            })}
          />
          <TextField
            label="パスワード"
            type="password"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message || "8〜64文字"}
            {...field("password", {
              required: "パスワードを入力してください",
              minLength: { value: 8, message: "パスワードは8文字以上で入力してください" },
              maxLength: { value: 64, message: "パスワードは64文字以内で入力してください" },
            })}
          />
          <TextField
            label="パスワード確認"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...field("confirmPassword", {
              required: "パスワードをもう一度入力してください",
              validate: (v) => v === watch("password") || "入力したパスワードが一致しません",
            })}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "登録中…" : "登録"}
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            すでにアカウントをお持ちですか？{" "}
            <Typography component={Link} href="/login" variant="body2" color="primary">
              ログインへ
            </Typography>
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
