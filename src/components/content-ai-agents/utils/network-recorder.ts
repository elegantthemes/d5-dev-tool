export type NetworkRecordKind = 'et-ai' | 'wp-rest' | 'other';

export type NetworkRecord = {
  id: string;
  kind: NetworkRecordKind;
  method: string;
  url: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  status: number | null;
  statusText: string;
  ok: boolean | null;
  isStream: boolean;
  requestBody: string | null;
  responseBody: string | null;
  error: string | null;
};

type RecorderState = {
  isInstalled: boolean;
  installedAt: number | null;
  records: NetworkRecord[];
  listeners: Array<() => void>;
  nextId: number;
};

const MAX_RECORDS = 300;
const ASSET_PATTERN = /\.(?:js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|ico|map)(?:\?|$)/i;
const API_PATTERN = /(?:\/wp-json\/|\/divi\/v1\/|\/wp\/v2\/|admin-ajax\.php)/i;
const ET_AI_PATTERN = /(?:ai_server|\/agent(?:\/|\?|$)|generate-layout)/i;

const state: RecorderState = {
  isInstalled: false,
  installedAt: null,
  records: [],
  listeners: [],
  nextId: 0,
};

const notifyListeners = (): void => {
  state.listeners.slice().forEach(listener => {
    try {
      listener();
    } catch {
      // A failing debug listener must never break the intercepted request.
    }
  });
};

const isCrossOrigin = (url: string): boolean => {
  if (/^https?:\/\//i.test(url)) {
    return 0 !== url.indexOf(window.location.origin);
  }

  return false;
};

const shouldRecord = (url: string): boolean => {
  if (ASSET_PATTERN.test(url)) {
    return false;
  }

  return API_PATTERN.test(url) || ET_AI_PATTERN.test(url) || isCrossOrigin(url);
};

const classifyUrl = (url: string): NetworkRecordKind => {
  if (ET_AI_PATTERN.test(url) && isCrossOrigin(url)) {
    return 'et-ai';
  }

  if (API_PATTERN.test(url)) {
    return 'wp-rest';
  }

  if (isCrossOrigin(url)) {
    return 'et-ai';
  }

  return 'other';
};

const resolveUrl = (input: RequestInfo | URL): string => {
  if ('string' === typeof input) {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return (input as Request)?.url ?? '';
};

const resolveMethod = (input: RequestInfo | URL, init?: RequestInit): string => {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if ('string' !== typeof input && !(input instanceof URL)) {
    return ((input as Request)?.method ?? 'GET').toUpperCase();
  }

  return 'GET';
};

const describeRequestBody = (body: unknown): string | null => {
  if (null === body || undefined === body) {
    return null;
  }

  if ('string' === typeof body) {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof FormData) {
    return '[FormData]';
  }

  if (body instanceof Blob) {
    return `[Blob ${body.size} bytes]`;
  }

  if (body instanceof ArrayBuffer) {
    return `[ArrayBuffer ${body.byteLength} bytes]`;
  }

  return '[Unreadable body stream]';
};

const appendRecord = (record: NetworkRecord): void => {
  state.records = state.records.concat([record]).slice(-MAX_RECORDS);
  notifyListeners();
};

const updateRecord = (id: string, changes: Partial<NetworkRecord>): void => {
  state.records = state.records.map(record => (
    record.id === id ? { ...record, ...changes } : record
  ));
  notifyListeners();
};

/**
 * Reads a cloned SSE response body without touching the original stream the
 * agent consumes. Updates the record when the stream finishes.
 */
const bufferStreamResponse = (
  recordId: string,
  response: Response,
  startedAt: number,
): void => {
  const finish = (responseBody: string): void => {
    const endedAt = Date.now();

    updateRecord(recordId, {
      endedAt,
      durationMs: endedAt - startedAt,
      responseBody,
    });
  };

  if (!response.body) {
    finish('[Empty stream body]');

    return;
  }

  let clone: Response;

  try {
    clone = response.clone();
  } catch {
    finish('[Response body could not be cloned]');

    return;
  }

  const reader = clone.body?.getReader();

  if (!reader) {
    finish('[Stream reader unavailable]');

    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
    if (done) {
      buffer += decoder.decode();
      finish(buffer);

      return;
    }

    buffer += decoder.decode(value, { stream: true });

    // Progressive updates keep in-flight SSE requests visible while streaming.
    if (buffer.trim()) {
      updateRecord(recordId, { responseBody: buffer });
    }

    return pump();
  });

  pump().catch(() => {
    finish(buffer.trim() ? buffer : '[Stream read failed]');
  });
};

/**
 * Patches `window.fetch` so AI Agent REST and ET AI Server traffic can be
 * inspected per Build phase. Installation is idempotent and never removed —
 * requests made before installation are not captured.
 */
export const installNetworkRecorder = (): void => {
  if (state.isInstalled || 'function' !== typeof window.fetch) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveUrl(input);

    if (!url || !shouldRecord(url)) {
      return originalFetch(input as RequestInfo, init);
    }

    state.nextId += 1;

    const id = `net-${state.nextId}`;
    const startedAt = Date.now();

    appendRecord({
      id,
      kind: classifyUrl(url),
      method: resolveMethod(input, init),
      url,
      startedAt,
      endedAt: null,
      durationMs: null,
      status: null,
      statusText: '',
      ok: null,
      isStream: false,
      requestBody: describeRequestBody(init?.body),
      responseBody: null,
      error: null,
    });

    return originalFetch(input as RequestInfo, init).then((response: Response) => {
      const contentType = response.headers?.get?.('content-type') ?? '';
      const isStream = /text\/event-stream/i.test(contentType);

      if (isStream) {
        updateRecord(id, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          isStream: true,
        });

        bufferStreamResponse(id, response, startedAt);
      } else {
        const endedAt = Date.now();

        updateRecord(id, {
          endedAt,
          durationMs: endedAt - startedAt,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          isStream: false,
        });

        try {
          response.clone().text().then((text: string) => {
            updateRecord(id, { responseBody: text });
          }).catch(() => {
            updateRecord(id, { responseBody: '[Response body unavailable]' });
          });
        } catch {
          updateRecord(id, { responseBody: '[Response body could not be cloned]' });
        }
      }

      return response;
    }).catch((error: unknown) => {
      const endedAt = Date.now();

      updateRecord(id, {
        endedAt,
        durationMs: endedAt - startedAt,
        error: (error as { message?: string })?.message ?? 'Request failed',
      });

      throw error;
    });
  };

  state.isInstalled = true;
  state.installedAt = Date.now();
  notifyListeners();
};

/**
 * Subscribes to recorded-request changes. Returns an unsubscribe callback.
 */
export const subscribeToNetworkRecords = (listener: () => void): (() => void) => {
  state.listeners = state.listeners.concat([listener]);

  return () => {
    state.listeners = state.listeners.filter(existing => existing !== listener);
  };
};

/**
 * Returns the captured requests. The array identity changes on every update.
 */
export const getNetworkRecords = (): NetworkRecord[] => state.records;

/**
 * Timestamp when interception started, or null when not yet installed.
 */
export const getNetworkRecorderInstalledAt = (): number | null => state.installedAt;

/**
 * Discards all captured requests.
 */
export const clearNetworkRecords = (): void => {
  state.records = [];
  notifyListeners();
};
