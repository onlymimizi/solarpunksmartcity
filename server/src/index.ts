import express from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { Web3Storage, File as Web3File } from "web3.storage";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import {
  mintSBT,
  submitProofWithUser,
  mintPoints,
  setSbtTBA,
  getProof,
  keccak256Bytes,
  getContracts,
  ensureTba,
  mintPointsForSbt
} from "./chain";

type User = {
  id: string;
  phone?: string;
  wechatId?: string;
  platformId?: string;
  address: string;
  privateKey: string; // 托管私钥（演示用途，生产请使用HSM/KMS）
  tokenVersion: number; // JWT 吊销版本号
  createdAt: number;
};

type DB = {
  users: User[];
  proofsIndex: Record<string, string>;
};

const app = express();

// CORS 白名单（ALLOWED_ORIGINS 用逗号分隔多个来源；留空放行全部）
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"), false);
    },
    credentials: true
  })
);

// 访问审计日志
app.use(morgan("combined"));

// 全局限流（默认 15 分钟 100 次，可用 RATE_LIMIT_WINDOW_MS、RATE_LIMIT_MAX 覆盖）
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const maxReq = Number(process.env.RATE_LIMIT_MAX || 100);
app.use(rateLimit({ windowMs, max: maxReq, standardHeaders: true, legacyHeaders: false }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.resolve(__dirname, "../../db.json");
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

// 简易DB加载/保存（演示版）
function loadDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const init: DB = { users: [], proofsIndex: {} };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const obj = JSON.parse(raw) as DB;
  if (!(obj as any).proofsIndex) (obj as any).proofsIndex = {};
  if (!(obj as any).users) (obj as any).users = [];
  return obj;
}
function saveDB(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
let db = loadDB();

// 工具
function pickIdentity(body: any) {
  const { phone, wechatId, platformId } = body || {};
  if (!phone && !wechatId && !platformId) {
    throw new Error("phone / wechatId / platformId 至少提供一个");
  }
  return { phone, wechatId, platformId };
}

function signJWT(userId: string, tokenVersion: number) {
  return jwt.sign({ uid: userId, ver: tokenVersion }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.users.find((u) => u.id === payload.uid);
    if (!user) return res.status(401).json({ error: "Invalid user" });
    if (typeof payload.ver !== "number" || payload.ver !== user.tokenVersion) {
      return res.status(401).json({ error: "Token revoked" });
    }
    req.user = user;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: e.message || "Unauthorized" });
  }
}

// 管理 API Key 白名单（未配置 ADMIN_API_KEY 时不启用）
function adminGuard(req: any, res: any, next: any) {
  if (!ADMIN_API_KEY) return next();
  const key = (req.headers["x-api-key"] || req.headers["X-API-KEY"]) as string | undefined;
  if (key && key === ADMIN_API_KEY) return next();
  return res.status(403).json({ error: "Forbidden" });
}

// 登录/注册（托管钱包）
app.post("/auth/login", (req, res) => {
  try {
    const { phone, wechatId, platformId } = pickIdentity(req.body);
    let user = db.users.find(
      (u) =>
        (phone && u.phone === phone) ||
        (wechatId && u.wechatId === wechatId) ||
        (platformId && u.platformId === platformId)
    );
    if (!user) {
      const wallet = ethers.Wallet.createRandom();
      user = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        phone,
        wechatId,
        platformId,
        address: wallet.address,
        privateKey: wallet.privateKey,
        tokenVersion: 1,
        createdAt: Date.now()
      };
      db.users.push(user);
      saveDB(db);
    }
    const token = signJWT(user.id, user.tokenVersion);
    return res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        wechatId: user.wechatId,
        platformId: user.platformId,
        address: user.address
      }
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

// 刷新与登出
app.post("/auth/refresh", authMiddleware, (req: any, res) => {
  const u = req.user as User;
  const token = signJWT(u.id, u.tokenVersion);
  return res.json({ token });
});

app.post("/auth/logout", authMiddleware, (req: any, res) => {
  const u = req.user as User;
  // 吊销：版本号 +1
  u.tokenVersion += 1;
  saveDB(db);
  return res.json({ ok: true });
});

app.get("/me", authMiddleware, (req: any, res) => {
  const u = req.user as User;
  return res.json({
    id: u.id,
    phone: u.phone,
    wechatId: u.wechatId,
    platformId: u.platformId,
    address: u.address
  });
});

// 平台代理铸造 SBT（平台持有 ISSUER_ROLE）
app.post("/sbt/mint", adminGuard, async (req, res) => {
  try {
    const { userId, tokenUri, kycHex } = req.body || {};
    if (!userId || !tokenUri || !kycHex) return res.status(400).json({ error: "userId/tokenUri/kycHex 必填" });
    const user = db.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    const receipt = await mintSBT(user.address, tokenUri, kycHex);
    return res.json({ ok: true, txHash: receipt.hash, to: user.address });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 用户（托管钱包）提交凭证
app.post("/proof/submit", authMiddleware, async (req: any, res) => {
  try {
    const { sbtId, cid, contentHash } = req.body || {};
    if (!sbtId || !cid || !contentHash) return res.status(400).json({ error: "sbtId/cid/contentHash 必填" });
    const user = req.user as User;
    const result = await submitProofWithUser(user.privateKey, BigInt(sbtId), cid, contentHash);
    try {
      if (result.proofId) {
        db.proofsIndex[String(contentHash).toLowerCase()] = result.proofId as string;
        saveDB(db);
      }
    } catch {}
    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 平台发放积分（直接对地址）
app.post("/points/mint", adminGuard, async (req, res) => {
  try {
    const { userId, amount } = req.body || {};
    if (!userId || amount === undefined) return res.status(400).json({ error: "userId/amount 必填" });
    const user = db.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    const result = await mintPoints(user.address, BigInt(amount));
    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 按 SBT 发积分：优先发到 TBA；若未绑定则发到 SBT 拥有者
app.post("/points/mintForSbt", adminGuard, async (req, res) => {
  try {
    const { tokenId, amount } = req.body || {};
    if (!tokenId || amount === undefined) return res.status(400).json({ error: "tokenId/amount 必填" });
    const result = await mintPointsForSbt(BigInt(tokenId), BigInt(amount));
    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 绑定/创建 TBA（官方/简化双模由 chain.ts 负责）
app.post("/tba/bind", adminGuard, async (req, res) => {
  try {
    const { tokenId } = req.body || {};
    if (!tokenId) return res.status(400).json({ error: "tokenId 必填" });
    const tba = await ensureTba(BigInt(tokenId));
    return res.json({ ok: true, tba });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 手工设置 SBT 的 TBA 字段
app.post("/sbt/tba", adminGuard, async (req, res) => {
  try {
    const { tokenId, tba } = req.body || {};
    if (!tokenId || !tba) return res.status(400).json({ error: "tokenId/tba 必填" });
    const result = await setSbtTBA(BigInt(tokenId), tba);
    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// IPFS 上传：使用 Web3.Storage；返回 CID 与内容 keccak256
app.post("/ipfs/upload", upload.single("file"), async (req, res) => {
  try {
    if (!process.env.WEB3_STORAGE_TOKEN) return res.status(400).json({ error: "未配置 WEB3_STORAGE_TOKEN" });
    if (!req.file) return res.status(400).json({ error: "缺少文件字段 file" });

    const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN as string });
    const file = new Web3File([req.file.buffer], req.file.originalname || "proof.bin", {
      type: req.file.mimetype || "application/octet-stream"
    });

    const cid = await client.put([file], { wrapWithDirectory: false, name: req.file.originalname || "proof.bin" });

    const contentHash = keccak256Bytes(req.file.buffer);
    return res.json({ ok: true, cid: `ipfs://${cid}`, contentHash });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 查询链上凭证（供前端扫码/输入 proofId 调用）
app.get("/proof/:proofId", async (req, res) => {
  try {
    const proofId = req.params.proofId;
    if (!proofId?.startsWith("0x") || proofId.length !== 66) {
      return res.status(400).json({ error: "proofId 必须是 0x 开头的 32 字节哈希" });
    }
    const p = await getProof(proofId);
    const exists = p.timestamp > 0;
    return res.json({ exists, ...p });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 通过 proofId 补建本地索引（适用于非本服务提交的凭证）
app.post("/proof/index", adminGuard, async (req, res) => {
  try {
    const { proofId } = req.body || {};
    if (!proofId || !String(proofId).startsWith("0x") || String(proofId).length !== 66) {
      return res.status(400).json({ error: "proofId 必须是 0x 开头的 32 字节哈希" });
    }
    const p = await getProof(proofId);
    if (!p.timestamp) return res.status(404).json({ error: "链上未找到该凭证" });
    const key = String(p.contentHash).toLowerCase();
    db.proofsIndex[key] = String(proofId);
    saveDB(db);
    return res.json({ ok: true, indexed: true, proofId, contentHash: key });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 上传图片校验：按 keccak256 查本地索引，再回链上取详情
app.post("/verify/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "缺少文件字段 file" });
    const hash = keccak256Bytes(req.file.buffer).toLowerCase();
    const proofId = db.proofsIndex[hash];
    if (!proofId) return res.json({ matched: false, contentHash: hash });
    const p = await getProof(proofId);
    const exists = p.timestamp > 0;
    return res.json({ matched: exists, proofId, contentHash: hash, proof: p });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 按内容哈希直接校验
app.get("/verify/byHash", async (req, res) => {
  try {
    const h = String(req.query.contentHash || "").toLowerCase();
    if (!h.startsWith("0x") || h.length !== 66) return res.status(400).json({ error: "contentHash 非法" });
    const proofId = db.proofsIndex[h];
    if (!proofId) return res.json({ matched: false, contentHash: h });
    const p = await getProof(proofId);
    const exists = p.timestamp > 0;
    return res.json({ matched: exists, proofId, contentHash: h, proof: p });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 查询地址对应的 SBT（含 tokenURI）
app.get("/sbt/of/:address", async (req, res) => {
  try {
    const address = req.params.address;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: "非法地址" });
    const { sbt } = getContracts();
    const tokenIdBN = await sbt.tokenIdOf(address);
    const tid = BigInt(tokenIdBN.toString());
    if (tid === 0n) {
      return res.json({ exists: false, tokenId: "0", owner: null, tokenURI: null });
    }
    const owner = await sbt.ownerOf(tid);
    let uri: string | null = null;
    try {
      uri = await sbt.tokenURI(tid);
    } catch {
      uri = null;
    }
    return res.json({ exists: true, tokenId: tid.toString(), owner, tokenURI: uri });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// 静态页面（简易前端）
const PUBLIC_DIR = path.resolve(__dirname, "../../public");
app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});