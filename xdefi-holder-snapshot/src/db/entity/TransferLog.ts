import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({
  name: "transfer_log",
})
export class TransferLog extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ name: "transaction_hash" })
  transactionHash!: string;

  @Column({ name: "block_number" })
  blockNumber!: number;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column({ type: "numeric" })
  amount!: string;

  @Index()
  @Column()
  chain!: string;
}
