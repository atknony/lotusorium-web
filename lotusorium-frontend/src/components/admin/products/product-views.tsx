"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "../ui";
import { adminKeys, getCategories, getProduct } from "@/lib/api/admin";
import { ProductForm } from "./product-form";
import { ProductImageManager } from "./product-image-manager";

export function ProductCreateView() {
  const { data: categories, isLoading } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  if (isLoading) return <LoadingBlock />;

  if (!categories || categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Yeni Ürün" backHref="/yonetim/urunler" />
        <EmptyState
          title="Önce bir kategori gerekli"
          description="Ürün eklemeden önce en az bir kategori oluşturmalısınız."
        >
          <Link href="/yonetim/kategoriler/yeni" className={buttonVariants()}>
            Kategori Oluştur
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Yeni Ürün" backHref="/yonetim/urunler" />
      <ProductForm categories={categories} />
    </div>
  );
}

export function ProductEditView({ id }: { id: string }) {
  const productQuery = useQuery({
    queryKey: adminKeys.product(id),
    queryFn: () => getProduct(id),
  });
  const { data: categories } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  if (productQuery.isLoading) return <LoadingBlock />;
  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBlock message="Ürün bulunamadı." />
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <PageHeader
          title={product.name}
          description="Ürün bilgilerini düzenleyin."
          backHref="/yonetim/urunler"
        >
          {product.status === "published" && (
            <Link
              href={`/urunler/${product.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Mağazada Gör
            </Link>
          )}
        </PageHeader>
        <ProductForm product={product} categories={categories ?? []} />
      </div>

      <div className="border-t border-border pt-8">
        <ProductImageManager productId={product.id} />
      </div>
    </div>
  );
}
