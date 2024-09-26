import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { migrateGaslessFrom } from "./migration/migrateGasless";
import { getMigrationContext } from "./migration/MigrationContext";
import { isMigrationAllowed } from "./migration/validation/isMigrationAllowed";
import { migrationRequestSchema } from "./migration/validation/migrationRequestSchema";
import { isAlreadyMigrated } from "./migration/validation/isAlreadyMigrated";
import { saveMigrationRecord } from "./migration/saveMigrationRecord";

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
        }),
      };
    }

    const { user, deadline, tokenAddress, v, r, s, amount } = result.data;

    const migrationContext = await getMigrationContext();

    const queryRunner = migrationContext.dataSource.createQueryRunner();

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
        }),
      };
    }

    const isMigratedBefore = await isAlreadyMigrated(queryRunner, {
      user,
      tokenAddress,
    });

    if (isMigratedBefore) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: `address ${user} alreasy performed migration of ${tokenAddress} token`,
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

    const receipt = await tx.wait();

    try {
      await saveMigrationRecord(queryRunner, {
        user,
        tokenAddress,
        txHash: receipt?.hash || "",
      });
    } catch (e) {
      console.error(e);
    } finally {
      await queryRunner.release();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        txHash: receipt?.hash,
      }),
    };
  } catch (e: any) {
    console.error(e);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message:
          "Failed to perform migration. Please try again later or contact support.",
      }),
    };
  }
};
