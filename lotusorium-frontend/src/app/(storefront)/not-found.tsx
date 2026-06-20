import Link from "next/link";
import { Container } from "@/components/storefront/container";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center py-24 text-center sm:py-32">
      <p className="tracking-luxe text-xs font-medium uppercase text-accent">
        404
      </p>
      <h1 className="mt-4 text-3xl text-foreground sm:text-4xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-3 max-w-sm text-balance text-sm text-muted-foreground">
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
      </p>
      <Link href="/" className={`${buttonVariants()} mt-8`}>
        Ana Sayfaya Dön
      </Link>
    </Container>
  );
}
