import { QueryRunner } from "typeorm";
import { MigrationTracking } from "../db/entity/MigrationTracking";

export type SaveMigrationRecordParams = {
  user: string;
  tokenAddress: string;
  txHash: string;
};
export async function saveMigrationRecord(
  queryRunner: QueryRunner,
  { user, tokenAddress, txHash }: SaveMigrationRecordParams
) {
  const trackRecord = queryRunner.manager.create(MigrationTracking, {
    chain: "ethereum",
    token: tokenAddress.toLowerCase(),
    transactionHash: txHash,
    walletAddress: user.toLowerCase(),
  });

  await queryRunner.manager.save(trackRecord);
}
