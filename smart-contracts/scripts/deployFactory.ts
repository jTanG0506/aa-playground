import { ethers } from "hardhat";

const ENTRYPOINT_ADDRESS_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
  const Factory = await ethers.getContractFactory("ProxyWalletAccountFactory");
  const contract = await Factory.deploy(ENTRYPOINT_ADDRESS_V07);
  const res = await contract.waitForDeployment();
  console.log("Contract deployed to:", res);
}

main();
