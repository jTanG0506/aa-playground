import { ENTRYPOINT_ADDRESS_V07, getSenderAddress } from "permissionless";
import { createPublicClient, encodeFunctionData } from "viem";

export const FACTORY_ADDRESS = "0xA5142B3F2edD0D30221cf664B295A8A77aC5cCe3";

export const getFactoryData = (ownerAddress: `0x${string}`, salt: bigint) => {
  const factoryData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "owner", type: "address" },
          { name: "salt", type: "uint256" },
        ],
        name: "createAccount",
        outputs: [{ name: "ret", type: "address" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [ownerAddress, salt],
  });

  return factoryData;
};

export const getProxyWalletAddress = async (
  factoryData: `0x${string}`,
  publicClient: ReturnType<typeof createPublicClient>
) => {
  const senderAddress = await getSenderAddress(publicClient, {
    factory: FACTORY_ADDRESS,
    factoryData,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
  return senderAddress;
};
