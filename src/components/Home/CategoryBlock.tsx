"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export interface CategoryTile {
  label: string;
  coverUrl?: string | null;
  icon?: React.ReactNode;
}

interface CategoryBlockProps {
  color: string; // ブランドカラー（例 #c2185b）
  tint: string; // 薄塗り背景（例 rgba(194,24,91,0.1)）
  gradientFrom: string;
  gradientTo: string;
  title: string;
  headline: string;
  meta: string;
  moreHref: string;
  tiles: CategoryTile[]; // 先頭2件は常時表示、3・4件目はPC幅のみ表示
}

/**
 * トップページの3ブロック（日本語コース／英語精読／問題演習）で共用するプレビューカード。
 * 内容ブロックが上、画像タイルが横並びで下（モバイル2枚・PC4枚）。PC幅でも複数カラムのグリッドにはしない。
 */
export default function CategoryBlock({
  color,
  tint,
  gradientFrom,
  gradientTo,
  title,
  headline,
  meta,
  moreHref,
  tiles,
}: CategoryBlockProps) {
  return (
    <Box sx={{ mb: { xs: 3.5, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
        <Typography sx={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{title}</Typography>
        <Box
          component={Link}
          href={moreHref}
          sx={{
            display: "flex",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "text.secondary",
            textDecoration: "none",
          }}
        >
          もっと見る
          <ChevronRightIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      <Box
        component={Link}
        href={moreHref}
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 1,
          flexWrap: "wrap",
          borderRadius: "14px",
          p: { xs: "12px 14px", md: "16px 20px" },
          mb: 1,
          bgcolor: tint,
          color,
          textDecoration: "none",
        }}
      >
        <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700 }}>{headline}</Typography>
        <Typography sx={{ fontSize: { xs: 11.5, md: 12.5 }, opacity: 0.85 }}>{meta}</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, height: { xs: 112, md: 128 } }}>
        {tiles.map((tile, i) => (
          <Box
            key={i}
            component={Link}
            href={moreHref}
            sx={{
              display: i < 2 ? "flex" : { xs: "none", md: "flex" },
              flex: 1,
              minWidth: 0,
              borderRadius: "14px",
              position: "relative",
              overflow: "hidden",
              alignItems: "flex-end",
              p: 1,
              textDecoration: "none",
              backgroundImage: tile.coverUrl
                ? `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%), url(${tile.coverUrl})`
                : `linear-gradient(140deg, ${gradientFrom}, ${gradientTo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {tile.icon && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  width: 22,
                  height: 22,
                  borderRadius: "6px",
                  bgcolor: "rgba(255,255,255,0.24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                {tile.icon}
              </Box>
            )}
            <Typography sx={{ position: "relative", color: "#fff", fontSize: 10.5, fontWeight: 600, lineHeight: 1.3 }}>
              {tile.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
