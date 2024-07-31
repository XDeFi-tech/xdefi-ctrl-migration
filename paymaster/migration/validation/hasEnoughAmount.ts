import { MigrationContext } from "../MigrationContext";

export type HasEnoughAmountParams = {
  amount: BigInt;
  user: string;
};
export async function hasEnoughAmount(
  ctx: MigrationContext,
  user: string,
  amount: BigInt
) {
  const balance = (await ctx.xdefiContract.balanceOf(user)) as BigInt;
  console.log(balance, "<<<<<<<<<<", typeof balance);
  return balance >= amount;

  //   const;
}
