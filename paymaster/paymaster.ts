import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import {
  initMigrationContext,
  getMigrationContext,
} from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { hasEnoughAmount } from "./migration/validation/hasEnoughAmount";

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

initMigrationContext();

const getDeadlineUnixTimestamp = (deadlineInMinutes: number) => {
  return Math.floor(Date.now() / 1000) + 60 * deadlineInMinutes;
};

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const reqBody: any = event.body ? JSON.parse(event.body) : event;

  // const spender = await migrationContext.migrationContract.getAddress();

  // const domain = {
  //   chainId: await migrationContext.provider.send("eth_chainId", []),
  //   verifyingContract: XDEFI_TOKEN_ADDRESS,
  // };

  const { user, deadline, tokenAddress, v, r, s } = reqBody;

  const migrationContext = await getMigrationContext();

  // const nonce = await migrationContext.xdefiContract.nonces(user);
  // const deadline = getDeadlineInSeconds(10);

  // const message = {
  //   owner: user,
  //   spender,
  //   value: BigInt(amount),
  //   nonce: Number(nonce),
  //   deadline,
  // };

  // const signature = await Wallet.fromPhrase(PRIVATE_KEY).signTypedData(
  //   domain,
  //   {
  //     Permit,
  //   },
  //   message
  // );

  // const { r, s, v } = Signature.from(signature);

  try {
    const [isAllowed, message] = await isMigrationAllowed(migrationContext, {
      user,
      tokenAddress,
    });

    if (!isAllowed) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message,
        }),
      };
    }

    const amount = (await migrationContext.xdefiContract.balanceOf(
      user
    )) as BigInt;

    const tx = await migrateGaslessFrom(migrationContext, tokenAddress, {
      user,
      amount,
      deadline: parseInt(deadline),
      v,
      r,
      s,
    });

    const receipt = await tx.wait();

    return {
      statusCode: 200,
      body: JSON.stringify({
        txHash: receipt?.hash,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: e.message,
      }),
    };
  }
};
