import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({
  name: "holder_balance",
})
export class HolderBalance extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column()
  address!: string;

  @Column({ type: "numeric" })
  balance!: string;

  @Index()
  @Column()
  chain!: string;
}
