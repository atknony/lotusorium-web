import "server-only";

import type { ApiErrorBody } from "./types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface ApiFetchOptions extends Omit<RequestInit, "cache"> {
  /** ISR revalidation window in seconds (passed to Next's fetch cache). */
  revalidate?: number | false;
  /** Cache tags for on-demand revalidation. */
  tags?: string[];
}

/** Thrown when the API responds with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Server-only fetch against the NestJS public API. Used inside Server
 * Components so the browser never talks to the API directly (no CORS, fully
 * cacheable). Default: 60s ISR, matching the API's Cache-Control.
 */
export async function apiServer<T>(
  path: string,
  { revalidate = 60, tags, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    next: { revalidate, ...(tags ? { tags } : {}) },
  });

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body; ignore
    }
    throw new ApiError(
      res.status,
      body?.error ?? `API request failed: ${res.status} ${res.statusText}`,
      body,
    );
  }

  return res.json() as Promise<T>;
}
