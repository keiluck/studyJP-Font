import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import QuizIcon from "@mui/icons-material/Quiz";
import CategoryIcon from "@mui/icons-material/Category";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import type { AdminRole } from "@/types/permission";

export interface AdminMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: AdminRole[];
}

/**
 * 権限モジュール（フェーズ9）：各メニューを表示できるロールを固定で対応させる。
 * ここでのフィルタ・ガードは UX 向上のためであり、真の防御はバックエンドの SecurityConfig 側（ADMIN_ROLE_* 権限）である。
 * layout.tsx（メニュー描画・アクセスガード）と page.tsx（ログイン後の遷移先決定）の両方で共用する。
 */
export const ADMIN_MENU: AdminMenuItem[] = [
  { label: "ユーザー管理", href: "/admin/users", icon: <PeopleIcon />, roles: ["SUPER_ADMIN", "USER_ADMIN"] },
  { label: "記事管理", href: "/admin/articles", icon: <ArticleIcon />, roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { label: "問題管理", href: "/admin/questions", icon: <QuizIcon />, roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { label: "分類管理", href: "/admin/categories", icon: <CategoryIcon />, roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { label: "英語精読管理", href: "/admin/en-articles", icon: <MenuBookIcon />, roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { label: "主図バナー管理", href: "/admin/home-banners", icon: <ViewCarouselIcon />, roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { label: "管理者アカウント管理", href: "/admin/admins", icon: <AdminPanelSettingsIcon />, roles: ["SUPER_ADMIN"] },
];

export function visibleAdminMenu(role: AdminRole | undefined | null): AdminMenuItem[] {
  return role ? ADMIN_MENU.filter((item) => item.roles.includes(role)) : [];
}
