"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LanguageIcon from "@mui/icons-material/Language";
import QuizIcon from "@mui/icons-material/Quiz";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import AbcIcon from "@mui/icons-material/Abc";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import Link from "next/link";
import HeroSwiper from "@/components/Home/HeroSwiper";
import CategoryBlock, { CategoryTile } from "@/components/Home/CategoryBlock";
import { fetchHomeBanners } from "@/api/homeBanner";
import { fetchArticles } from "@/api/article";
import { fetchEnArticles } from "@/api/enArticle";
import type { HomeBannerItem } from "@/types/homeBanner";

const BRAND_JP = "#c2185b";
const BRAND_JP_TINT = "rgba(194, 24, 91, 0.1)";
const BRAND_EN = "#1f5c57";
const BRAND_EN_TINT = "rgba(31, 92, 87, 0.1)";
const BRAND_QUIZ = "#b8722c";
const BRAND_QUIZ_TINT = "rgba(184, 114, 44, 0.12)";

const QUICKLINKS = [
  { href: "/articles", label: "日本語コース", color: BRAND_JP, tint: BRAND_JP_TINT, icon: <MenuBookIcon /> },
  { href: "/en-articles", label: "英語精読", color: BRAND_EN, tint: BRAND_EN_TINT, icon: <LanguageIcon /> },
  { href: "/practice", label: "問題演習", color: BRAND_QUIZ, tint: BRAND_QUIZ_TINT, icon: <QuizIcon /> },
];

const QUIZ_TILES: CategoryTile[] = [
  { label: "文法専項", icon: <SpellcheckIcon sx={{ fontSize: 13 }} /> },
  { label: "聴解問題", icon: <HeadphonesIcon sx={{ fontSize: 13 }} /> },
  { label: "語彙特訓", icon: <AbcIcon sx={{ fontSize: 13 }} /> },
  { label: "発音判別", icon: <RecordVoiceOverIcon sx={{ fontSize: 13 }} /> },
];

export default function HomePage() {
  const [banners, setBanners] = useState<HomeBannerItem[]>([]);
  const [jpTiles, setJpTiles] = useState<CategoryTile[]>([]);
  const [enTiles, setEnTiles] = useState<CategoryTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetchHomeBanners(),
      fetchArticles({ page: 1, pageSize: 4 }),
      fetchEnArticles({ page: 1, pageSize: 4 }),
    ]).then(([bannerRes, articleRes, enArticleRes]) => {
      if (bannerRes.status === "fulfilled") setBanners(bannerRes.value);
      if (articleRes.status === "fulfilled") {
        setJpTiles(articleRes.value.list.map((a) => ({ label: a.title, coverUrl: a.coverUrl })));
      }
      if (enArticleRes.status === "fulfilled") {
        setEnTiles(enArticleRes.value.list.map((a) => ({ label: a.title, coverUrl: a.coverUrl })));
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 920, mx: "auto" }}>
      {banners.length > 0 && (
        <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
          <HeroSwiper banners={banners} />
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: { xs: "space-around", md: "flex-start" }, gap: { md: 5 }, mb: { xs: 3, md: 4 } }}>
        {QUICKLINKS.map((q) => (
          <Box
            key={q.href}
            component={Link}
            href={q.href}
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, textDecoration: "none" }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: q.tint,
                color: q.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {q.icon}
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.primary" }}>{q.label}</Typography>
          </Box>
        ))}
      </Box>

      <CategoryBlock
        color={BRAND_JP}
        tint={BRAND_JP_TINT}
        gradientFrom="#d24576"
        gradientTo="#7a1338"
        title="日本語コース"
        headline="N5からN1まで"
        meta="文単位の対訳・かな注記つき"
        moreHref="/articles"
        tiles={jpTiles.length > 0 ? jpTiles : [{ label: "新着記事はまだありません" }]}
      />

      <CategoryBlock
        color={BRAND_EN}
        tint={BRAND_EN_TINT}
        gradientFrom="#2c8177"
        gradientTo="#123a34"
        title="英語精読"
        headline="原文を読んで身につける"
        meta="英文と日本語訳、単語帳つき"
        moreHref="/en-articles"
        tiles={enTiles.length > 0 ? enTiles : [{ label: "新着記事はまだありません" }]}
      />

      <CategoryBlock
        color={BRAND_QUIZ}
        tint={BRAND_QUIZ_TINT}
        gradientFrom="#d99a4e"
        gradientTo="#7a4a15"
        title="問題演習"
        headline="解いて弱点を発見"
        meta="文法・聴解・語彙をまとめて演習"
        moreHref="/practice"
        tiles={QUIZ_TILES}
      />
    </Box>
  );
}
