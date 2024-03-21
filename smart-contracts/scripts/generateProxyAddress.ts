import { getFactoryData, getProxyWalletAddress } from "./utils";
import "dotenv/config";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function main() {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const publicClient = createPublicClient({
    transport: http("https://rpc.ankr.com/eth_sepolia"),
    chain: sepolia,
  });

  const factoryData = getFactoryData(owner.address, 0n);
  console.log("Generated factoryData:", factoryData);

  const senderAddress = await getProxyWalletAddress(factoryData, publicClient);
  console.log("Calculated sender address:", senderAddress);
}

main();
