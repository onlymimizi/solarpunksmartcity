import { useState } from "react";
import {
  API_BASE,
  login,
  me,
  sbtMint,
  ipfsUpload,
  proofSubmit,
  pointsMint,
  pointsMintForSbt,
  bindTba,
  setApiKey
} from "../components/api";

export default function AdminPage() {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [apiKey, setApiKeyState] = useState("");

  // SBT mint
  const [mintUserId, setMintUserId] = useState("");
  const [tokenUri, setTokenUri] = useState("ipfs://");
  const [kycHex, setKycHex] = useState("0x" + "0".repeat(64));

  // IPFS + proof
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<{ cid: string; contentHash: string } | null>(null);
  const [proofSbtId, setProofSbtId] = useState("");

  // Points
  const [pointsUserId, setPointsUserId] = useState("");
  const [pointsAmount, setPointsAmount] = useState("100");

  // Points for SBT
  const [sbtIdForPoints, setSbtIdForPoints] = useState("");
  const [amountForSbt, setAmountForSbt] = useState("100");

  // TBA
  const [tbaTokenId, setTbaTokenId] = useState("");

  async function doLogin() {
    setStatus("登录中...");
    try {
      const r = await login({ phone });
      setToken(r.token);
      const m = await me(r.token);
      setUser(m);
      setMintUserId(m.id);
      setPointsUserId(m.id);
      setStatus("登录成功");
    } catch (e: any) {
      setStatus("登录失败：" + e.message);
    }
  }

  async function doMintSbt() {
    setStatus("铸证中...");
    try {
      const r = await sbtMint(mintUserId, tokenUri, kycHex);
      setStatus("铸证成功 tx=" + r.txHash);
    } catch (e: any) {
      setStatus("铸证失败：" + e.message);
    }
  }

  async function doUpload() {
    if (!file) return;
    setStatus("上传到 IPFS...");
    try {
      const r = await ipfsUpload(file);
      setUploaded(r);
      setStatus("上传成功：" + r.cid);
    } catch (e: any) {
      setStatus("上传失败：" + e.message);
    }
  }

  async function doSubmitProof() {
    if (!token || !uploaded) return;
    setStatus("提交凭证上链...");
    try {
      const r = await proofSubmit(token, proofSbtId, uploaded.cid, uploaded.contentHash);
      setStatus("提交成功：tx=" + r.hash + (r.proofId ? " proofId=" + r.proofId : ""));
    } catch (e: any) {
      setStatus("提交失败：" + e.message);
    }
  }

  async function doMintPoints() {
    setStatus("发放积分中...");
    try {
      const r = await pointsMint(pointsUserId, pointsAmount);
      setStatus("发放成功 tx=" + r.hash);
    } catch (e: any) {
      setStatus("发放失败：" + e.message);
    }
  }

  async function doMintPointsForSbt() {
    setStatus("按 SBT 发放积分中...");
    try {
      const r = await pointsMintForSbt(sbtIdForPoints, amountForSbt);
      setStatus("发放成功 tx=" + r.hash);
    } catch (e: any) {
      setStatus("发放失败：" + e.message);
    }
  }

  async function doBindTba() {
    setStatus("绑定/创建 TBA 中...");
    try {
      const r = await bindTba(tbaTokenId);
      setStatus("已绑定 TBA: " + r.tba);
    } catch (e: any) {
      setStatus("绑定失败：" + e.message);
    }
  }

  return (
    <div className="container">
      <h1>管理员面板</h1>
      <div className="card">
        <div className="kv">
          <div>后端地址</div><div><code>{API_BASE}</code></div>
        </div>
      </div>

      <div className="card">
        <h3>管理 API Key</h3>
        <div className="row">
          <input placeholder="输入 ADMIN_API_KEY（可选）" value={apiKey} onChange={e => setApiKeyState(e.target.value)} />
          <button onClick={() => { setApiKey(apiKey); setStatus('已设置管理 API Key'); }}>设置</button>
        </div>
      </div>

      <div className="card">
        <h3>登录（演示托管钱包）</h3>
        <div className="row">
          <input placeholder="手机号（演示）" value={phone} onChange={e => setPhone(e.target.value)} />
          <button onClick={doLogin}>登录/注册</button>
        </div>
        {user && (
          <div className="kv" style={{ marginTop: 8 }}>
            <div>UserID</div><div><code>{user.id}</code></div>
            <div>Address</div><div><code>{user.address}</code></div>
            <div>Token</div><div><code style={{ wordBreak: "break-all" }}>{token}</code></div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>铸造 SBT（平台代理）</h3>
        <div className="kv">
          <div>userId</div><div><input value={mintUserId} onChange={e => setMintUserId(e.target.value)} /></div>
          <div>tokenUri</div><div><input value={tokenUri} onChange={e => setTokenUri(e.target.value)} /></div>
          <div>kycHex</div><div><input value={kycHex} onChange={e => setKycHex(e.target.value)} /></div>
        </div>
        <button onClick={doMintSbt}>铸证</button>
      </div>

      <div className="card">
        <h3>上传凭证（到 IPFS）</h3>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={doUpload} disabled={!file}>上传</button>
        {uploaded && (
          <div className="kv" style={{ marginTop: 8 }}>
            <div>CID</div><div><code>{uploaded.cid}</code></div>
            <div>内容哈希</div><div><code>{uploaded.contentHash}</code></div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>提交凭证上链（用户托管钱包签名）</h3>
        <div className="kv">
          <div>SBT ID</div><div><input value={proofSbtId} onChange={e => setProofSbtId(e.target.value)} /></div>
        </div>
        <button onClick={doSubmitProof} disabled={!token || !uploaded}>提交</button>
      </div>

      <div className="card">
        <h3>发放积分（to 地址）</h3>
        <div className="kv">
          <div>userId</div><div><input value={pointsUserId} onChange={e => setPointsUserId(e.target.value)} /></div>
          <div>amount</div><div><input value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} /></div>
        </div>
        <button onClick={doMintPoints}>发放</button>
      </div>

      <div className="card">
        <h3>按 SBT 发积分（优先 TBA）</h3>
        <div className="kv">
          <div>tokenId</div><div><input value={sbtIdForPoints} onChange={e => setSbtIdForPoints(e.target.value)} /></div>
          <div>amount</div><div><input value={amountForSbt} onChange={e => setAmountForSbt(e.target.value)} /></div>
        </div>
        <button onClick={doMintPointsForSbt}>发放</button>
      </div>

      <div className="card">
        <h3>绑定/创建 TBA</h3>
        <div className="kv">
          <div>tokenId</div><div><input value={tbaTokenId} onChange={e => setTbaTokenId(e.target.value)} /></div>
        </div>
        <button onClick={doBindTba}>绑定</button>
      </div>

      <div className="card">
        <div className="ok">{status}</div>
      </div>
    </div>
  );
}