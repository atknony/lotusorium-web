"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary that replaces the root layout (so it must render its own
 * <html>/<body>). Tailwind/layout aren't guaranteed here — use inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#faf7f2",
          color: "#2a2521",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
          Bir şeyler ters gitti
        </h1>
        <p style={{ color: "#7a6e60", maxWidth: "24rem", margin: 0 }}>
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            cursor: "pointer",
            borderRadius: "0.5rem",
            border: "none",
            background: "#97604a",
            color: "#fbf6f0",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
