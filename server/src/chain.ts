import { ethers } from "ethers";
import {
  SBT_ABI,
  PROOF_ABI,
  POINTS_ABI,
  ERC6551_REGISTRY_ABI,
  OFFICIAL_ERC6551_REGISTRY_ABI
} from "./abi";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getProvider(): ethers.JsonRpcProvider {
  const rpc =
    process.env.RPC_URL ||
    (process.env.ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : "");
  if (!rpc) throw new Error("Missing RPC_URL or ALCHEMY_API_KEY");
  return new ethers.JsonRpcProvider(rpc);
}

export function getAdminSigner() {
  const pk = process.env.PLATFORM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Missing PLATFORM_PRIVATE_KEY or PRIVATE_KEY in env");
  return new ethers.Wallet(pk, getProvider());
}

export function getUserSigner(userPrivateKey: string) {
  if (!userPrivateKey.startsWith("0x")) throw new Error("userPrivateKey must start with 0x");
  return new ethers.Wallet(userPrivateKey, getProvider());
}

export function getContracts() {
  const provider = getProvider();
  const sbtAddr = requireEnv("CONTRACT_SBT");
  const proofAddr = requireEnv("CONTRACT_PROOF");
  const pointsAddr = requireEnv("CONTRACT_POINTS");
  const sbt = new ethers.Contract(sbtAddr, SBT_ABI, provider);
  const proof = new ethers.Contract(proofAddr, PROOF_ABI, provider);
  const points = new ethers.Contract(pointsAddr, POINTS_ABI, provider);
  return { sbt, proof, points, provider };
}

/**
 * 简化版 Registry（本项目内置）
 */
function getRegistrySimplified() {
  const provider = getProvider();
  const regAddr = requireEnv("CONTRACT_ERC6551_REGISTRY");
  const registry = new ethers.Contract(regAddr, ERC6551_REGISTRY_ABI, provider);
  return { registry, provider };
}

/**
 * 官方 Registry（参考实现）
 * 需要提供 OFFICIAL_6551_REGISTRY 与 ACCOUNT_IMPLEMENTATION
 */
function getRegistryOfficial() {
  const provider = getProvider();
  const regAddr = requireEnv("OFFICIAL_6551_REGISTRY");
  const implAddr = requireEnv("ACCOUNT_IMPLEMENTATION");
  const registry = new ethers.Contract(regAddr, OFFICIAL_ERC6551_REGISTRY_ABI, provider);
  return { registry, provider, implAddr };
}

function parseSalt(saltHex?: string) {
  return (saltHex && saltHex.startsWith("0x") && saltHex.length === 66) ? saltHex : "0x" + "00".repeat(32);
}

/**
 * 创建 TBA（若不存在），并返回账户地址。
 * OFFICIAL_6551=1 时使用官方 Registry 接口；否则使用简化版。
 */
export async function createTbaForSbt(tokenId: bigint, saltHex?: string, platformAddr?: string) {
  const provider = getProvider();
  const { sbt } = getContracts();
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  const tokenContract = await sbt.getAddress();
  const salt = parseSalt(saltHex);

  if (process.env.OFFICIAL_6551 === "1") {
    const { registry, implAddr } = getRegistryOfficial();
    // 尝试读取已存在
    let account: string = await registry.account(implAddr, chainId, tokenContract, tokenId, salt);
    if (!account || account === ethers.ZeroAddress) {
      const admin = getAdminSigner();
      // initData 为空（可根据实现需要传初始化逻辑）
      const tx = await registry.connect(admin).createAccount(implAddr, chainId, tokenContract, tokenId, salt, "0x");
      await tx.wait();
      account = await registry.account(implAddr, chainId, tokenContract, tokenId, salt);
    }
    return account;
  } else {
    const { registry } = getRegistrySimplified();
    // 如果已存在，直接返回
    let account: string = await registry.account(chainId, tokenContract, tokenId, salt);
    if (!account || account === ethers.ZeroAddress) {
      const admin = getAdminSigner();
      const platform = platformAddr || (await admin.getAddress());
      const tx = await registry.connect(admin).createAccount(chainId, tokenContract, tokenId, salt, platform);
      await tx.wait();
      account = await registry.account(chainId, tokenContract, tokenId, salt);
    }
    return account;
  }
}

/**
 * 读取/确认 TBA 地址（若 SBT 已写入 tbaOf 则优先返回）
 */
export async function getTbaAddress(tokenId: bigint, saltHex?: string) {
  const { sbt } = getContracts();
  const mapped: string = await sbt.tbaOf(tokenId);
  if (mapped && mapped !== ethers.ZeroAddress) return mapped;

  const provider = getProvider();
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  const tokenContract = await sbt.getAddress();
  const salt = parseSalt(saltHex);

  if (process.env.OFFICIAL_6551 === "1") {
    const { registry, implAddr } = getRegistryOfficial();
    const account: string = await registry.account(implAddr, chainId, tokenContract, tokenId, salt);
    return account && account !== ethers.ZeroAddress ? account : ethers.ZeroAddress;
  } else {
    const { registry } = getRegistrySimplified();
    const account: string = await registry.account(chainId, tokenContract, tokenId, salt);
    return account && account !== ethers.ZeroAddress ? account : ethers.ZeroAddress;
  }
}

/**
 * 确保 SBT 绑定了 TBA（如果未绑定则创建并 setTBA）
 */
export async function ensureTba(tokenId: bigint, saltHex?: string) {
  const { sbt } = getContracts();
  let tba = await sbt.tbaOf(tokenId);
  if (tba && tba !== ethers.ZeroAddress) return tba;

  tba = await createTbaForSbt(tokenId, saltHex);
  const admin = getAdminSigner();
  const tx = await sbt.connect(admin).setTBA(tokenId, tba);
  await tx.wait();
  return tba;
}

/**
 * 平台代理铸造 SBT；如配置 AUTO_CREATE_TBA=1，则自动为该 SBT 创建并绑定 TBA
 */
export async function mintSBT(to: string, tokenUri: string, kycHex: string) {
  const { sbt } = getContracts();
  const admin = getAdminSigner();
  const tx = await sbt.connect(admin).mint(to, tokenUri, kycHex);
  const receipt = await tx.wait();

  if (process.env.AUTO_CREATE_TBA === "1") {
    // 查询 tokenId 并绑定
    const tokenId = await sbt.tokenIdOf(to);
    try {
      await ensureTba(BigInt(tokenId.toString()));
    } catch (e) {
      console.warn("AUTO_CREATE_TBA failed:", (e as Error).message);
    }
  }
  return { hash: receipt?.hash };
}

export async function setSbtTBA(tokenId: bigint, tba: string) {
  const { sbt } = getContracts();
  const admin = getAdminSigner();
  const tx = await sbt.connect(admin).setTBA(tokenId, tba);
  const receipt = await tx.wait();
  return { hash: receipt?.hash };
}

export async function submitProofWithUser(userPrivateKey: string, sbtId: bigint, cid: string, contentHash: string) {
  const { proof } = getContracts();
  const user = getUserSigner(userPrivateKey);
  const tx = await proof.connect(user).submitProof(sbtId, cid, contentHash);
  const receipt = await tx.wait();
  let proofId: string | undefined;
  try {
    for (const log of receipt!.logs) {
      try {
        const parsed = proof.interface.parseLog(log as any);
        if (parsed?.name === "ProofSubmitted") {
          proofId = parsed.args.proofId as string;
          break;
        }
      } catch {}
    }
  } catch {}
  return { hash: receipt?.hash, proofId };
}

export async function mintPoints(to: string, amount: bigint) {
  const { points } = getContracts();
  const admin = getAdminSigner();
  const tx = await points.connect(admin).mint(to, amount);
  const receipt = await tx.wait();
  return { hash: receipt?.hash };
}

/**
 * 优先将积分发放到 SBT 绑定的 TBA；若未绑定则发给 ownerOf(tokenId)
 */
export async function mintPointsForSbt(tokenId: bigint, amount: bigint) {
  const { sbt } = getContracts();
  let to = await sbt.tbaOf(tokenId);
  if (!to || to === ethers.ZeroAddress) {
    to = await sbt.ownerOf(tokenId);
  }
  return mintPoints(to, amount);
}

export async function getProof(proofId: string) {
  const { proof } = getContracts();
  const p = await proof.proofs(proofId);
  return {
    submitter: p[0] as string,
    sbtId: BigInt(p[1].toString()),
    cid: p[2] as string,
    contentHash: p[3] as string,
    timestamp: Number(p[4])
  };
}

export function keccak256Bytes(buffer: Uint8Array | ArrayBuffer): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return ethers.keccak256(bytes);
}