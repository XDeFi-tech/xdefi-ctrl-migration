import {
  AbiCoder,
  getBytes,
  keccak256,
  recoverAddress,
  solidityPacked,
} from "ethers";
import { PERMIT_SIGNATURE_HASH } from "./helpers";

// Approval digest generation function, it uses the keccak256 hash function
export async function getApprovalDigest(
  DOMAIN_SEPARATOR: string,
  approve: {
    owner: string;
    spender: string;
    value: bigint;
  },
  deadline: bigint,
  nonce: bigint
): Promise<string> {
  const structHash = keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
      [
        PERMIT_SIGNATURE_HASH,
        approve.owner,
        approve.spender,
        approve.value,
        nonce,
        deadline,
      ]
    )
  );

  console.log({ structHash });

  return keccak256(
    solidityPacked(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      ["0x19", "0x01", DOMAIN_SEPARATOR, structHash]
    )
  );
}

export async function verifyPermit(
  owner: string,
  spender: string,
  value: bigint,
  nonce: bigint,
  deadline: bigint,
  signature: {
    v: number;
    r: string;
    s: string;
  },
  DOMAIN_SEPARATOR: string
) {
  const digest = await getApprovalDigest(
    DOMAIN_SEPARATOR,
    { owner: owner, spender: spender, value: value },
    deadline,
    nonce
  );
  console.log({ digest });

  const recoveredAddress = recoverAddress(getBytes(digest), signature);
  console.log({ recoveredAddress, owner: owner });
  return recoveredAddress === owner;
}
