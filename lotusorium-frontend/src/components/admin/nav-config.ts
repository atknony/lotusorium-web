import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Package,
  ScrollText,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only rendered for super_admin. The API also enforces this server-side. */
  superAdminOnly?: boolean;
}

/** The admin information architecture. Later phases fill in the linked pages. */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/yonetim", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/yonetim/urunler", label: "Ürünler", icon: Package },
  { href: "/yonetim/kategoriler", label: "Kategoriler", icon: FolderTree },
  { href: "/yonetim/one-cikanlar", label: "Öne Çıkanlar", icon: Star },
  { href: "/yonetim/analitik", label: "Analitik", icon: BarChart3 },
  {
    href: "/yonetim/kullanicilar",
    label: "Kullanıcılar",
    icon: Users,
    superAdminOnly: true,
  },
  {
    href: "/yonetim/kayitlar",
    label: "Kayıtlar",
    icon: ScrollText,
    superAdminOnly: true,
  },
];
