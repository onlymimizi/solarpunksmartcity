export const SBT_ABI = [
  "function mint(address to, string uri, bytes32 kycHash) external returns (uint256)",
  "function tokenIdOf(address account) view returns (uint256)",
  "function setTBA(uint256 tokenId, address tba) external",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tbaOf(uint256 tokenId) view returns (address)",
  "event CertificateMinted(address indexed to, uint256 indexed tokenId, string uri, bytes32 kycHash)"
];

export const PROOF_ABI = [
  "function submitProof(uint256 sbtId, string cid, bytes32 contentHash) external returns (bytes32)",
  "function proofs(bytes32 proofId) view returns (address submitter, uint256 sbtId, string cid, bytes32 contentHash, uint64 timestamp)",
  "function verify(bytes32 proofId, uint256 sbtId, string cid, bytes32 contentHash, address submitter) view returns (bool)",
  "event ProofSubmitted(bytes32 indexed proofId, uint256 indexed sbtId, string cid, bytes32 contentHash, address indexed submitter)"
];

export const POINTS_ABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)"
];

/**
 * 简化版（演示）ERC-6551 Registry ABI（当前项目内置实现）
 */
export const ERC6551_REGISTRY_ABI = [
  "function createAccount(uint256 chainId, address tokenContract, uint256 tokenId, bytes32 salt, address platform) returns (address)",
  "function account(uint256 chainId, address tokenContract, uint256 tokenId, bytes32 salt) view returns (address)"
];

/**
 * 官方 ERC-6551 Registry 参考实现 ABI（双模启用 OFFICIAL_6551=1）
 * 参照 https://eips.ethereum.org/EIPS/eip-6551
 */
export const OFFICIAL_ERC6551_REGISTRY_ABI = [
  "function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, bytes32 salt, bytes initData) returns (address)",
  "function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, bytes32 salt) view returns (address)"
];