/**
 * Client-side fetch against the same-origin BFF (`/api/bff/**`). Used by admin
 * client components / TanStack Query. The browser never sees the API origin or
 * a token — auth rides along in the httpOnly cookies automatically.
 */

/** Thrown on a 401 so the query layer can bounce to the login page. */
export class BffAuthError extends Error {
  constructor() {
    super("Oturum süresi doldu");
    this.name = "BffAuthError";
  }
}

export class BffError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BffError";
  }
}

export async function bffFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    throw new BffAuthError();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new BffError(res.status, body?.error ?? `İstek başarısız (${res.status})`);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}
