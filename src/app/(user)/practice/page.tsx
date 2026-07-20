"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import QuizIcon from "@mui/icons-material/Quiz";
import AppsIcon from "@mui/icons-material/Apps";
import SchoolIcon from "@mui/icons-material/School";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { startPractice } from "@/api/quiz";
import { fetchCategories } from "@/api/category";

export default function PracticeEntryPage() {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ステップ1：学科選択
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // ステップ2：学科選択後の分類選択
  const [subject, setSubject] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    fetchCategories("QUESTION_SUBJECT")
      .then((items) => setSubjects(items.map((c) => c.value)))
      .catch(() => {})
      .finally(() => setLoadingSubjects(false));
  }, []);

  const openSubject = (s: string) => {
    setError(null);
    setSubject(s);
    setLoadingCategories(true);
    fetchCategories("QUESTION_CATEGORY", s)
      .then((items) => setCategories(items.map((c) => c.value)))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  };

  const backToSubjects = () => {
    setSubject(null);
    setCategories([]);
    setError(null);
  };

  const handleStart = async (category?: string) => {
    try {
      setStarting(category ?? "__all__");
      setError(null);
      const { id } = await startPractice({ subject: subject ?? undefined, category });
      router.push(`/practice/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "練習を開始できませんでした");
      setStarting(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {subject ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <IconButton onClick={backToSubjects} aria-label="学科選択に戻る" size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {subject} · 分類を選択
            </Typography>
          </Stack>
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            問題演習
          </Typography>
        )}
        <Typography color="text.secondary">
          {subject
            ? "分類を選んで練習を開始してください。単一選択・多肢選択の問題に挑戦し、回答後にすぐ正誤と解析を確認できます。"
            : "学科を選んでください。日本語・英語・AWSなど、大きな括りで問題を絞り込めます。"}
        </Typography>
      </Box>

      {!subject ? (
        loadingSubjects ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea
                  disabled={starting !== null}
                  onClick={() => handleStart(undefined)}
                  sx={{ height: "100%" }}
                >
                  <CardContent sx={{ textAlign: "center", py: 5 }}>
                    {starting === "__all__" ? (
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                    ) : (
                      <AppsIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      すべて
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      全学科からランダム出題
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {subjects.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={s}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea onClick={() => openSubject(s)} sx={{ height: "100%" }}>
                    <CardContent sx={{ textAlign: "center", py: 5 }}>
                      <SchoolIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {s}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s}の問題を練習
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : loadingCategories ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea
                disabled={starting !== null}
                onClick={() => handleStart(undefined)}
                sx={{ height: "100%" }}
              >
                <CardContent sx={{ textAlign: "center", py: 5 }}>
                  {starting === "__all__" ? (
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                  ) : (
                    <AppsIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
                  )}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    すべて
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {subject}の全分類からランダム出題
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {categories.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea
                  disabled={starting !== null}
                  onClick={() => handleStart(c)}
                  sx={{ height: "100%" }}
                >
                  <CardContent sx={{ textAlign: "center", py: 5 }}>
                    {starting === c ? (
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                    ) : (
                      <QuizIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {c}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c}の問題を練習
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {categories.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                この学科にはまだ分類がありません。「すべて」から練習を開始できます。
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
