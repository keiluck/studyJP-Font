"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import type { HomeBannerItem } from "@/types/homeBanner";

interface HeroSwiperProps {
  banners: HomeBannerItem[];
}

const AUTOPLAY_MS = 4000;
const DRAG_THRESHOLD_RATIO = 0.18; // コンテナ幅に対するこの比率を超えたら隣のスライドへ

/**
 * トップページの主図スライダー。自動再生（4秒）＋ドット操作＋ポインタードラッグ/スワイプに対応する。
 * 日本語精読・英語精読どちらのコンポーネントとも独立した新規実装。
 */
export default function HeroSwiper({ banners }: HeroSwiperProps) {
  const router = useRouter();
  const count = banners.length;

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const justDraggedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
    },
    [count]
  );

  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && count > 1) {
      timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    }
  }, [count]);

  useEffect(() => {
    restart();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restart]);

  const dragXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    draggingRef.current = true;
    setDragging(true);
    startXRef.current = e.clientX;
    dragXRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    // 注意：ここで setPointerCapture は呼ばない。呼ぶと Chromium 上でドラッグ後の
    // click イベントが（down/up 座標が同じ＝実質タップのケースでも）発火しなくなり、
    // バナーのクリック遷移が丸ごと効かなくなる不具合を実際に踏んだ。
    // 代わりに window にリスナーを張り、コンテナ外に出ても追従できるようにする。
  };

  // ドラッグ中は window レベルで pointermove/pointerup を監視する（コンテナの外に出ても追従させるため）
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - startXRef.current;
      dragXRef.current = dx;
      setDragX(dx);
    };
    const handleUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      const width = containerRef.current?.getBoundingClientRect().width || 1;
      const dx = dragXRef.current;
      if (Math.abs(dx) > 4) justDraggedRef.current = true;
      if (dx < -width * DRAG_THRESHOLD_RATIO) goTo(index + 1);
      else if (dx > width * DRAG_THRESHOLD_RATIO) goTo(index - 1);
      setDragX(0);
      dragXRef.current = 0;
      restart();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, index]);

  const handleSlideClick = (banner: HomeBannerItem) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    switch (banner.linkType) {
      case "ARTICLE":
        if (banner.linkTarget) router.push(`/articles/${banner.linkTarget}`);
        break;
      case "EN_ARTICLE":
        if (banner.linkTarget) router.push(`/en-articles/${banner.linkTarget}`);
        break;
      case "PRACTICE":
        router.push("/practice");
        break;
      case "URL":
        if (banner.linkTarget) window.open(banner.linkTarget, "_blank", "noopener,noreferrer");
        break;
      case "NONE":
      default:
        break;
    }
  };

  if (count === 0) return null;

  const width = containerRef.current?.getBoundingClientRect().width || 1;
  const dragOffsetPercent = dragging ? (dragX / width) * 100 : 0;

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      sx={{
        position: "relative",
        borderRadius: "18px",
        overflow: "hidden",
        height: { xs: 190, md: 260 },
        boxShadow: "0 10px 24px -12px rgba(0,0,0,0.28)",
        touchAction: "pan-y",
        cursor: count > 1 ? (dragging ? "grabbing" : "grab") : "default",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: "100%",
          transform: `translateX(${-index * 100 + dragOffsetPercent}%)`,
          transition: dragging ? "none" : "transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        {banners.map((b) => (
          <Box
            key={b.id}
            onClick={() => handleSlideClick(b)}
            sx={{
              flex: "0 0 100%",
              height: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              p: { xs: 2.25, md: 3.5 },
              color: "#fff",
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%), url(${b.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#37474f",
              cursor: b.linkType === "NONE" ? "inherit" : "pointer",
            }}
          >
            {b.tag && (
              <Box
                component="span"
                sx={{
                  alignSelf: "flex-start",
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.22)",
                  backdropFilter: "blur(2px)",
                  mb: 1,
                }}
              >
                {b.tag}
              </Box>
            )}
            <Box sx={{ fontSize: { xs: 19, md: 26 }, fontWeight: 700, lineHeight: 1.35 }}>{b.title}</Box>
            {b.subtitle && (
              <Box sx={{ fontSize: { xs: 12.5, md: 14 }, opacity: 0.9, mt: 0.5 }}>{b.subtitle}</Box>
            )}
          </Box>
        ))}
      </Box>

      {count > 1 && (
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 10, display: "flex", justifyContent: "center", gap: 0.75 }}>
          {banners.map((b, i) => (
            <Box
              key={b.id}
              onClick={() => {
                goTo(i);
                restart();
              }}
              sx={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.25s",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
