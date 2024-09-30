import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import { getMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { migrationRequestSchema } from "./migration/validation/migrationRequestSchema";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*", // Allow from anywhere
  "Access-Control-Allow-Methods": "POST", // Allow only POST request
};

const waitWithTimeout = (promise: Promise<any>, timeoutMs: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    ),
  ]);
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

    const userAmount = (await migrationContext.xdefiContract.balanceOf(
      user
    )) as bigint;

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

    try {
      // Wait for the transaction to be mined with a 30-second timeout
      const receipt = await waitWithTimeout(tx.wait(), 30000);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          txHash: receipt?.transactionHash,
        }),
      };
    } catch (e: any) {
      if (e.message === "timeout") {
        // If timeout occurs, return the transaction hash without waiting for confirmation
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            txHash: tx.hash,
            message: "Transaction is still pending. Please check later for confirmation.",
          }),
        };
      }
      throw e; // Rethrow the error if it's not a timeout
    }
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
