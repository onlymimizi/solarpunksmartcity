import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <h1>TaigongChain 官网</h1>
      <p>基于 SBT + ProofRegistry + ERC-6551 TBA 的垂钓生态。这里提供查询与管理入口：</p>

      <div className="card">
        <h3>查询入口</h3>
        <ul>
          <li><Link href="/proof">凭证查询（proofId）</Link></li>
          <li><Link href="/cert">证书查询（地址）</Link></li>
        </ul>
      </div>

      <div className="card">
        <h3>管理员面板</h3>
        <ul>
          <li><Link href="/admin">平台操作（登录/铸证/发积分/绑定TBA/上链凭证）</Link></li>
        </ul>
      </div>

      <div className="card">
        <h3>后端 API</h3>
        <p>默认后端地址：<code>{process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000"}</code></p>
      </div>
    </div>
  );
}