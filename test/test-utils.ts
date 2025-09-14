import { join } from "node:path";

export async function createTestServer(assetsDir: string) {
  const server = Bun.serve({
    port: 0, // random available port
    fetch(req) {
      const url = new URL(req.url);
      const filePath = join(assetsDir, url.pathname.replace(/^\//, ""));
      const f = Bun.file(filePath);
      if (!f.size) return new Response("Not found", { status: 404 });
      return new Response(f);
    },
  });

  return server;
}

export function setUpProgressEventPolyfill() {
  // Polyfill ProgressEvent for three.js loader under Bun (Node environment)
  if (typeof (globalThis as unknown as { ProgressEvent: unknown }).ProgressEvent === "undefined") {
    class ProgressEventPolyfill extends Event {
      lengthComputable: boolean;
      loaded: number;
      total: number;
      constructor(type: string, init: { lengthComputable?: boolean; loaded?: number; total?: number } = {}) {
        super(type);
        this.lengthComputable = !!init.lengthComputable;
        this.loaded = init.loaded ?? 0;
        this.total = init.total ?? 0;
      }
    }
    (globalThis as unknown as { ProgressEvent: typeof ProgressEventPolyfill }).ProgressEvent = ProgressEventPolyfill;
  }

  // Polyfill document for Pixi.js under Bun
  if (typeof (globalThis as unknown as { document: unknown }).document === "undefined") {
    const documentPolyfill = {
      createElement: (tagName: string) => {
        if (tagName === "video" || tagName === "img") {
          return {
            src: "",
            load: () => void 0,
            play: () => Promise.resolve(),
            pause: () => void 0,
            addEventListener: () => void 0,
            removeEventListener: () => void 0,
          };
        }
        return {};
      },
    };
    (globalThis as unknown as { document: typeof documentPolyfill }).document = documentPolyfill;
  }
}
