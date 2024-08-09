import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import { getMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { migrationRequestSchema } from "./migration/validation/migrationRequestSchema";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const reqBody: any = event.body ? JSON.parse(event.body) : event;

    const result = migrationRequestSchema.safeParse(reqBody);

    if (!result.success || !result.data) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Request validation failed",
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      };
    }

    const { user, deadline, tokenAddress, v, r, s } = result.data;

    const migrationContext = await getMigrationContext();

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
      deadline,
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
        message:
          "Failed to perform migration. Please try again later or contact support.",
      }),
    };
  }
};
