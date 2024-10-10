import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
  name: "migration_tracking",
})
export class MigrationTracking extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ name: "transaction_hash", type: "text" })
  transactionHash!: string;

  @Column({ name: "wallet_address", type: "text" })
  walletAddress!: string;

  @Column({
    nullable: true,
    type: "text",
  })
  token!: string;

  @Column({
    type: "text",
  })
  chain!: string;
}
