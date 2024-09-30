import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import { getMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { migrationRequestSchema } from "./migration/validation/migrationRequestSchema";
import { resolveWithTimeout } from "./migration/utils";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*", // Allow from anywhere
  "Access-Control-Allow-Methods": "POST", // Allow only POST request
};

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
        headers,
        body: JSON.stringify({
          message: "Request validation failed",
          fieldErrors: result.error.flatten().fieldErrors,
          canRetry: true,
        }),
      };
    }

    const { user, deadline, tokenAddress, v, r, s, amount } = result.data;

    const migrationContext = await getMigrationContext();

    const [isAllowed, message] = await isMigrationAllowed(migrationContext, {
      user,
      tokenAddress,
    });

    if (!isAllowed) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message,
          canRetry: false,
        }),
      };
    }

    const tokenContract = migrationContext.getTokenContract(tokenAddress);

    const userAmount = (await tokenContract.balanceOf(user)) as bigint;

    if (userAmount < amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: `Requested migration balance is less than actual balance. Requested: ${amount}. Actual: ${userAmount}`,
          canRetry: true,
        }),
      };
    }

    const tx = await migrateGaslessFrom(migrationContext, tokenAddress, {
      user,
      amount,
      deadline,
      v,
      r,
      s,
    });

    const maybeReceipt = await Promise.race([
      tx.wait(),
      resolveWithTimeout("timedOut" as const, 29000),
    ]);

    if (maybeReceipt === "timedOut") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          txHash: tx.hash,
          timedOut: true,
          message:
            "Transaction is still pending. Please check later for confirmation.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        txHash: maybeReceipt?.hash,
      }),
    };
  } catch (e: any) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message:
          "Failed to perform migration. Please try again later or contact support.",
        canRetry: true,
      }),
    };
  }
};
