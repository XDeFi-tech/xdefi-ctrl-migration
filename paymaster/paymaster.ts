import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";

import { migrateGaslessFrom } from "./migration/migrateGasless";
import { createMigrationContext } from "./migration/MigrationContext";

const migrationContext = createMigrationContext();

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const reqBody: any = event.body ? JSON.parse(event.body) : event;
  const { user, amount, deadline, tokenAddress, v, r, s } = reqBody;

  // console.dir(reqBody, { depth: 4 });
  // console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const tx = await migrateGaslessFrom(migrationContext, tokenAddress, {
      user,
      amount: BigInt(amount),
      deadline: parseInt(deadline),
      v,
      r,
      s,
    });

    await tx.wait();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "hello world",
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
