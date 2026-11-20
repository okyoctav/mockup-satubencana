/**
 * Fetch ke layanan eksternal untuk staging/prod:
 * timeout + retry + pesan error jelas.
 */

export type UpstreamFetchOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  /** Terima response non-2xx tanpa throw (caller yang putuskan). Default false. */
  acceptHttpError?: boolean;
};

export type UpstreamFetchResult = {
  ok: boolean;
  status: number;
  text: string;
  attempts: number;
  timedOut: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'SatuBencana-MDB/1.0 (+server-proxy)',
};

/**
 * GET/POST upstream dengan timeout per attempt + retry pada timeout / 5xx / network.
 */
export async function fetchUpstream(
  url: string,
  opts: UpstreamFetchOptions = {}
): Promise<UpstreamFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const maxAttempts = opts.maxAttempts ?? 3;
  const method = opts.method ?? 'GET';
  let lastStatus = 0;
  let lastText = '';
  let timedOut = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    timedOut = false;
    try {
      const res = await fetch(url, {
        method,
        body: opts.body,
        cache: 'no-store',
        signal: ctrl.signal,
        headers: { ...DEFAULT_HEADERS, ...opts.headers },
      });
      const text = await res.text();
      lastStatus = res.status;
      lastText = text;

      if (res.ok || opts.acceptHttpError) {
        return { ok: res.ok, status: res.status, text, attempts: attempt, timedOut: false };
      }

      // Retry hanya untuk 408/429/5xx
      const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= maxAttempts) {
        return { ok: false, status: res.status, text, attempts: attempt, timedOut: false };
      }
    } catch (e) {
      const isAbort = e instanceof Error && e.name === 'AbortError';
      timedOut = isAbort;
      lastText = isAbort
        ? `timeout ${timeoutMs}ms`
        : e instanceof Error
          ? e.message
          : 'upstream fetch gagal';
      lastStatus = 0;
      if (attempt >= maxAttempts) {
        return { ok: false, status: 0, text: lastText, attempts: attempt, timedOut };
      }
    } finally {
      clearTimeout(timer);
    }
    await sleep(400 * attempt * attempt);
  }

  return { ok: false, status: lastStatus, text: lastText, attempts: maxAttempts, timedOut };
}

export type UpstreamJsonResult<T = unknown> = {
  data: T | null;
  meta: UpstreamFetchResult;
  error?: string;
};

export async function fetchUpstreamJson<T = unknown>(
  url: string,
  opts: UpstreamFetchOptions = {}
): Promise<UpstreamJsonResult<T>> {
  const meta = await fetchUpstream(url, opts);
  if (!meta.ok) {
    return { data: null, meta, error: meta.text.slice(0, 200) || `HTTP ${meta.status}` };
  }
  try {
    const data = JSON.parse(meta.text) as T;
    return { data, meta };
  } catch {
    return { data: null, meta, error: 'Response bukan JSON' };
  }
}
