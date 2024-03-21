import {
  FACTORY_ADDRESS,
  getFactoryData,
  getProxyWalletAddress,
} from "./utils";
import "dotenv/config";
import {
  ENTRYPOINT_ADDRESS_V07,
  UserOperation,
  bundlerActions,
  signUserOperationHashWithECDSA,
} from "permissionless";
import {
  Hex,
  createClient,
  createPublicClient,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  pimlicoBundlerActions,
  pimlicoPaymasterActions,
} from "permissionless/actions/pimlico";
import { ethers } from "hardhat";

const DUMMY_SIGNATURE =
  "0xa15569dd8f8324dbeabf8073fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c";

async function main() {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const apiKey = "1e2bdb4a-0db5-4dff-94b2-c604982d8b47";
  const endpointUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;

  const publicClient = createPublicClient({
    transport: http("https://rpc.ankr.com/eth_sepolia"),
    chain: sepolia,
  });

  const bundlerClient = createClient({
    transport: http(endpointUrl),
    chain: sepolia,
  })
    .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
    .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07));

  const paymasterClient = createClient({
    transport: http(endpointUrl),
    chain: sepolia,
  }).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

  const proxyWalletSalt = 0n;
  const factoryData = getFactoryData(owner.address, proxyWalletSalt);
  const proxyWalletAddress = await getProxyWalletAddress(
    factoryData,
    publicClient
  );

  const merchantWallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik
  const feeWallet = "0xc75099a5133138D67a8A5dcDe3F738323dBcA851";

  const gasPrice = await bundlerClient.getUserOperationGasPrice();

  const callData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "_recipients", type: "address[]" },
          { name: "_amounts", type: "uint256[]" },
        ],
        name: "splitNativePayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [
      [merchantWallet, feeWallet],
      [ethers.parseEther("0.0099"), ethers.parseEther("0.0001")],
    ],
  });

  const userOperation = {
    sender: proxyWalletAddress,
    nonce: 0n,
    factory: FACTORY_ADDRESS as `0x${string}`,
    factoryData,
    callData,
    maxFeePerGas: gasPrice.fast.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
    signature: DUMMY_SIGNATURE as Hex,
  };

  const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation(
    {
      userOperation,
    }
  );

  const sponsoredUserOperation: UserOperation<"v0.7"> = {
    ...userOperation,
    ...sponsorUserOperationResult,
  };

  console.log("Received paymaster sponsor result:", sponsorUserOperationResult);

  const signature = await signUserOperationHashWithECDSA({
    account: owner,
    userOperation: sponsoredUserOperation,
    chainId: sepolia.id,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
  sponsoredUserOperation.signature = signature;

  const userOperationHash = await bundlerClient.sendUserOperation({
    userOperation: sponsoredUserOperation,
  });

  console.log("Received User Operation hash:", userOperationHash);

  // let's also wait for the userOperation to be included, by continually querying for the receipts
  console.log("Querying for receipts...");
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOperationHash,
  });
  const txHash = receipt.receipt.transactionHash;

  console.log(
    `UserOperation included: https://sepolia.etherscan.io/tx/${txHash}`
  );
}

main();
