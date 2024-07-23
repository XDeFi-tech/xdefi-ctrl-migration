import { AppDataSource } from "./db/app-data-source";
import { pullEventLogs } from "./pullEventLogs";

export async function main() {
  const dataSource = await AppDataSource.initialize();
  await pullEventLogs({ dataSource, chain: "ethereum" });
}
