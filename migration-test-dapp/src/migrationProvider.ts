import { Contract, JsonRpcProvider, Wallet, Signature } from "ethers";
import {
  CLIENT_WALLET_MNEMONIC,
  MIGRATION_CONTRACT_ADDRESS,
  PROVIDER_RPC_URL,
  XDEFI_TOKEN_ADDRESS,
  vXDEFI_TOKEN_ADDRESS,
  CTRL_TOKEN_ADDRESS,
} from "./config";
import { erc20Abi } from "./abis/erc20Abi";

const provider = new JsonRpcProvider(PROVIDER_RPC_URL);

const vXdefiContract = new Contract(vXDEFI_TOKEN_ADDRESS, erc20Abi, provider);

const xdefiContract = new Contract(XDEFI_TOKEN_ADDRESS, erc20Abi, provider);

const ctrlContract = new Contract(CTRL_TOKEN_ADDRESS, erc20Abi, provider);

export const supportedTokens = [
  {
    contract: XDEFI_TOKEN_ADDRESS,
    symbol: "XDEFI",
  },
  {
    contract: vXDEFI_TOKEN_ADDRESS,
    symbol: "vXDEFI",
  },
];

const clientWallet = new Wallet(
  Wallet.fromPhrase(CLIENT_WALLET_MNEMONIC).privateKey,
  provider
);

function getDeadlineUnixTimestamp(deadlineInMinutes: number) {
  return Math.floor(Date.now() / 1000) + 60 * deadlineInMinutes;
}

export const contractToName: Record<any, string> = {
  [vXDEFI_TOKEN_ADDRESS]: "vXDEFI",
  [XDEFI_TOKEN_ADDRESS]: "XDEFI",
};

export const Permit = [
  {
    name: "owner",
    type: "address",
  },
  {
    name: "spender",
    type: "address",
  },
  {
    name: "value",
    type: "uint256",
  },
  {
    name: "nonce",
    type: "uint256",
  },
  {
    name: "deadline",
    type: "uint256",
  },
];

export async function getBalances(walletAddress: string) {
  const [xdefiBalance, vXdefiBalance, ctrlBalance] = await Promise.all<bigint>([
    xdefiContract.balanceOf(walletAddress),
    vXdefiContract.balanceOf(walletAddress),
    ctrlContract.balanceOf(walletAddress),
  ]);
  return [
    {
      symbol: "XDEFI",
      balance: xdefiBalance,
      decimals: 18,
      contract: XDEFI_TOKEN_ADDRESS,
    },
    {
      symbol: "vXDEFI",
      balance: vXdefiBalance,
      decimals: 18,
      contract: vXDEFI_TOKEN_ADDRESS,
    },
    {
      symbol: "CTRL",
      balance: ctrlBalance,
      decimals: 18,
      contract: CTRL_TOKEN_ADDRESS,
    },
  ];
}

export async function permitMigration(
  walletAddress: string,
  tokenAddress: string
) {
  let domain, nonce;

  let balance: bigint;
  switch (tokenAddress) {
    case XDEFI_TOKEN_ADDRESS: {
      balance = (await xdefiContract.balanceOf(walletAddress)) / 10n;
      nonce = await xdefiContract.nonces(walletAddress);
      domain = {
        chainId: await provider.send("eth_chainId", []),
        verifyingContract: tokenAddress,
      };
      break;
    }
    case vXDEFI_TOKEN_ADDRESS: {
      balance = (await vXdefiContract.balanceOf(walletAddress)) / 10n;
      nonce = await vXdefiContract.nonces(walletAddress);
      domain = {
        name: "vXDEFI",
        version: "1",
        chainId: await provider.send("eth_chainId", []),
        verifyingContract: tokenAddress,
      };
      break;
    }
    default:
      throw new Error(`unsupported contract address ${tokenAddress}`);
  }

  const deadline = getDeadlineUnixTimestamp(60);
  const message = {
    owner: walletAddress,
    spender: MIGRATION_CONTRACT_ADDRESS,
    nonce: parseInt(nonce),
    deadline,
    value: balance.toString(),
  };

  const signature = await clientWallet.signTypedData(
    domain,
    { Permit },
    message
  );
  const { r, s, v } = Signature.from(signature);

  return {
    r,
    s,
    v,
    tokenAddress,
    user: walletAddress,
    deadline,
    amount: balance.toString(),
  };
}
