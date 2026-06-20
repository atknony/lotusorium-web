"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface BuyButtonProps {
  productId: string;
  /** product.trendyolUrl — opened directly for an instant, popup-safe redirect. */
  trendyolUrl: string | null;
  className?: string;
}

/** Per-browser session id for click funnel de-dup (best-effort). */
function getSessionId(): string | undefined {
  try {
    let sid = localStorage.getItem("lts_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("lts_sid", sid);
    }
    return sid;
  } catch {
    return undefined;
  }
}

export function BuyButton({ productId, trendyolUrl, className }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!trendyolUrl) {
    return (
      <button
        type="button"
        disabled
        className={cn(buttonVariants({ size: "lg" }), "w-full", className)}
      >
        Şu anda satışta değil
      </button>
    );
  }

  async function onClick() {
    setLoading(true);
    const sessionId = getSessionId();

    // Record the click via the BFF (fire-and-forget; never blocks navigation).
    void fetch("/api/bff/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, sessionId }),
      keepalive: true,
    }).catch(() => {});

    // Open Trendyol immediately, inside the user gesture (popup-blocker safe).
    window.open(trendyolUrl!, "_blank", "noopener,noreferrer");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(buttonVariants({ size: "lg" }), "w-full", className)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Trendyol&apos;da Satın Al
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
