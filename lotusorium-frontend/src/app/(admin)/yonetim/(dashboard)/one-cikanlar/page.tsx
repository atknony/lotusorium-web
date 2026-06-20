import type { Metadata } from "next";
import { FeaturedManager } from "@/components/admin/featured/featured-manager";

export const metadata: Metadata = { title: "Öne Çıkanlar" };

export default function FeaturedPage() {
  return <FeaturedManager />;
}
