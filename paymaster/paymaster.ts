import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";

import { migrateGaslessFrom } from "./migration/migrateGasless";
import { createMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { hasEnoughAmount } from "./migration/validation/hasEnoughAmount";

const migrationContext = createMigrationContext();

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const reqBody: any = event.body ? JSON.parse(event.body) : event;
  const { user, amount, deadline, tokenAddress, v, r, s } = reqBody;

  try {
    const [isAllowed, message] = await isMigrationAllowed(migrationContext, {
      user,
      tokenAddress,
    });

    const hasEnough = await hasEnoughAmount(
      migrationContext,
      user,
      BigInt(amount)
    );

    if (!isAllowed) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message,
        }),
      };
    }

    if (!hasEnough) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `${user} balance below requested amount`,
        }),
      };
    }

    const tx = await migrateGaslessFrom(migrationContext, tokenAddress, {
      user,
      amount: BigInt(amount),
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
