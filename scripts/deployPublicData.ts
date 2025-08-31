import { ethers } from "hardhat";
import * as fs from "fs/promises";
import * as path from "path";

async function patchFrontendConfig(addr: string) {
  const target = path.join(__dirname, "..", "web", "components", "config.js");
  try {
    let txt = await fs.readFile(target, "utf8");
    const replaced = txt.replace(/CONTRACT_ADDRESS:\s*""/, `CONTRACT_ADDRESS: "${addr}"`);
    if (replaced !== txt) {
      await fs.writeFile(target, replaced, "utf8");
      console.log(`Updated ${path.relative(process.cwd(), target)} with address: ${addr}`);
    } else {
      console.log("Warn: Did not find empty CONTRACT_ADDRESS to replace. Please set it manually.");
    }
  } catch (e: any) {
    console.log("Warn: Failed to update frontend config:", e?.message || e);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("SolarpunkPublicData");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("SolarpunkPublicData deployed at:", address);

  await patchFrontendConfig(address);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);