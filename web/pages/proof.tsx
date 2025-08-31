import { useState } from "react";
import { getProofById } from "../components/api";

export default function ProofPage() {
  const [proofId, setProofId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const onQuery = async () => {
    setErr(null); setData(null); setLoading(true);
    try {
      if (!proofId.startsWith("0x") || proofId.length !== 66) throw new Error("请输入合法的 proofId（0x+64hex）");
      const res = await getProofById(proofId);
      setData(res);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openIPFS = () => {
    if (!data?.cid) return;
    const path = String(data.cid).replace("ipfs://", "");
    window.open("https://ipfs.io/ipfs/" + path, "_blank");
  };

  return (
    <div className="container">
      <h1>凭证查询</h1>
      <div className="card">
        <div className="row">
          <input placeholder="0x..." value={proofId} onChange={e => setProofId(e.target.value)} style={{ flex: 1 }} />
          <button onClick={onQuery} disabled={loading}>查询</button>
        </div>
        {loading && <div>查询中...</div>}
        {err && <div className="err">{err}</div>}
        {data && (
          <div className="kv" style={{ marginTop: 8 }}>
            <div>存在</div><div>{data.exists ? "是" : "否"}</div>
            <div>提交人</div><div><code>{data.submitter}</code></div>
            <div>SBT ID</div><div><code>{data.sbtId}</code></div>
            <div>CID</div><div><code>{data.cid}</code> {data.cid ? <a onClick={openIPFS} href="#" style={{ marginLeft: 8 }}>打开</a> : null}</div>
            <div>内容哈希</div><div><code>{data.contentHash}</code></div>
            <div>时间戳</div><div><code>{data.timestamp}</code></div>
          </div>
        )}
      </div>
    </div>
  );
}