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
      // 注册成功后自动登录
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
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 4 }}>
      <Typography variant="h5" gutterBottom>
        注册
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="用户名"
            autoComplete="username"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message || "3-50 个字符"}
            {...field("username", {
              required: "请输入用户名",
              minLength: { value: 3, message: "用户名至少 3 个字符" },
              maxLength: { value: 50, message: "用户名最多 50 个字符" },
            })}
          />
          <TextField
            label="邮箱"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...field("email", {
              required: "请输入邮箱",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "邮箱格式不正确",
              },
            })}
          />
          <TextField
            label="密码"
            type="password"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message || "8-64 个字符"}
            {...field("password", {
              required: "请输入密码",
              minLength: { value: 8, message: "密码至少 8 个字符" },
              maxLength: { value: 64, message: "密码最多 64 个字符" },
            })}
          />
          <TextField
            label="确认密码"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...field("confirmPassword", {
              required: "请再次输入密码",
              validate: (v) => v === watch("password") || "两次输入的密码不一致",
            })}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "注册中…" : "注册"}
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            已有账号？{" "}
            <Typography component={Link} href="/login" variant="body2" color="primary">
              去登录
            </Typography>
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
