import { QueryRunner } from "typeorm";
import { MigrationTracking } from "../../db/entity/MigrationTracking";

export type IsAlreadyMigratedParams = {
  user: string;
  tokenAddress: string;
};
export async function isAlreadyMigrated(
  queryRunner: QueryRunner,
  { user, tokenAddress }: IsAlreadyMigratedParams
) {
  const trackRecord = await queryRunner.manager.findOneBy(MigrationTracking, {
    chain: "ethereum",
    token: tokenAddress.toLowerCase(),
    walletAddress: user.toLowerCase(),
  });

  return Boolean(trackRecord);
}
