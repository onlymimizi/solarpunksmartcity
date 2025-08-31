import { useState } from "react";
import { getSbtOf } from "../components/api";

function ipfsToHttp(uri?: string) {
  if (!uri) return "";
  return uri.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + uri.replace("ipfs://", "") : uri;
}

export default function CertPage() {
  const [addr, setAddr] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const onQuery = async () => {
    setErr(null); setRes(null); setMeta(null); setLoading(true);
    try {
      if (!addr.startsWith("0x") || addr.length !== 42) throw new Error("请输入合法地址");
      const d = await getSbtOf(addr);
      setRes(d);
      if (d?.tokenURI) {
        const url = ipfsToHttp(d.tokenURI);
        try {
          const r = await fetch(url, { cache: "no-store" });
          const j = await r.json();
          setMeta(j);
        } catch (e: any) {
          setMeta({ error: e.message });
        }
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>证书查询</h1>
      <div className="card">
        <div className="row">
          <input placeholder="0x 开头地址" value={addr} onChange={e => setAddr(e.target.value)} style={{ flex: 1 }} />
          <button onClick={onQuery} disabled={loading}>查询</button>
        </div>
        {loading && <div>查询中...</div>}
        {err && <div className="err">{err}</div>}
        {res && (
          <>
            <div className="kv" style={{ marginTop: 8 }}>
              <div>存在</div><div>{res.exists ? "是" : "否"}</div>
              <div>Token ID</div><div><code>{res.tokenId}</code></div>
              <div>Owner</div><div><code>{res.owner || "-"}</code></div>
              <div>TokenURI</div><div><code>{res.tokenURI || "-"}</code></div>
            </div>
            {meta && (
              <div className="card" style={{ background: "#fafcff" }}>
                <div className="kv">
                  <div>名称</div><div>{meta.name || meta.error || "-"}</div>
                  <div>描述</div><div>{meta.description || "-"}</div>
                  <div>图片</div><div>{meta.image ? <img src={ipfsToHttp(meta.image)} style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #eee" }} /> : "-"}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}