import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import { getMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const reqBody: any = event.body ? JSON.parse(event.body) : event;

  const { user, deadline, tokenAddress, v, r, s } = reqBody;

  const migrationContext = await getMigrationContext();

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
