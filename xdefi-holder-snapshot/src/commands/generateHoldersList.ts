import { QueryRunner } from "typeorm";
import { Chain, Token } from "../types";
import * as fs from "fs";

export type GenerateHoldersListParams = {
  queryRunner: QueryRunner;
  chain: Chain;
  token: Token;
};
export async function generateHoldersList({
  queryRunner,
  chain,
  token,
}: GenerateHoldersListParams) {
  const query = `
     SELECT * from holder_balance  WHERE "chain"='${chain}' and "token"='${token}' and balance > 0
    `;

  const resultset = await queryRunner.manager.query(query);

  const holders: any = {
    ["__created_at__"]: new Date().toISOString(),
  };

  resultset.forEach((holderRecord: any) => {
    holders[holderRecord.address] = {
      address: holderRecord.address,
      balance: holderRecord.balance,
    };
  });

  fs.writeFileSync(
    `${token}_holders_${chain}.json`,
    JSON.stringify(holders, null, 2)
  );
}
