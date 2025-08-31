import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <Component {...pageProps} />
      <style jsx global>{`
        html, body, #__next { height: 100%; margin: 0; background: #fafafa; }
        .container { max-width: 960px; margin: 0 auto; padding: 16px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 12px; }
        input, button, textarea { font-size: 14px; padding: 8px; }
        input, textarea { border: 1px solid #ddd; border-radius: 8px; }
        button { background: #0a84ff; color: #fff; border: 0; border-radius: 8px; cursor: pointer; }
        button:disabled { opacity: .5; cursor: not-allowed; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
        a { color: #0a84ff; text-decoration: none; }
        .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .kv { display: grid; grid-template-columns: 160px 1fr; gap: 6px 10px; align-items: center; }
        .ok { color: #047857; }
        .err { color: #b91c1c; }
      `}</style>
    </div>
  );
}