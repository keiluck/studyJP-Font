"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAdminAuth } from "@/store/adminAuth";
import { visibleAdminMenu } from "@/config/adminMenu";

/**
 * ログイン後の既定遷移先：ロールごとに見えるメニューが異なるため、
 * 固定パス（旧: /admin/articles）ではなく本人のロールで見える最初のメニューへ転送する。
 */
export default function AdminHome() {
  const router = useRouter();
  const { admin } = useAdminAuth();

  useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
      return;
    }
    router.replace(visibleAdminMenu(admin.role)[0]?.href ?? "/admin/login");
  }, [admin, router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
