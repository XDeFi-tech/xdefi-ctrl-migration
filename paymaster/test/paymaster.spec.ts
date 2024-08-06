import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { Mnemonic, randomBytes } from "ethers";
import { handler } from "../paymaster";
import { APIGatewayEvent } from "aws-lambda";
import { getTokenPrice } from "../migration/getTokenPrice";
import { getTokenHolding } from "../migration/getTokenHolding";
import {
  getMigrationContext,
  MigrationContext,
} from "../migration/MigrationContext";
import { USD_VALUE_THRESHOLD } from "../config/config";

vi.mock("../migration/MigrationContext.ts", () => ({
  getMigrationContext: vi.fn(),
  initMigrationContext: vi.fn(),
}));

vi.mock("../migration/getTokenHolding.ts", () => ({
  getTokenHolding: vi.fn(),
}));

vi.mock("../config/config.ts", () => ({
  XDEFI_TOKEN_ADDRESS: "0xXdefiTokenAddress",
  VXDEFI_TOKEN_ADDRESS: "0xVXdefiTokenAddress",
  PROVIDER_RPC_URL: "https://localhost/test",
  MIGRATION_CONTRACT_ADDRESS: "0xMigrationContractAddress",
  USD_VALUE_THRESHOLD: 100,
}));

vi.mock("../migration/getMnemonic.ts", () => ({
  getMnemonic: () => Promise.resolve(Mnemonic.entropyToPhrase(randomBytes(32))),
}));

vi.mock("../migration/getTokenPrice.ts", () => ({
  getTokenPrice: vi.fn(),
}));

describe("Paymaster handler", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it("should return error when address is not on holders list", async () => {
    const user = "0xTest-address";
    const event = {
      body: JSON.stringify({
        deadline: Math.floor(Date.now() / 1000) + 60 * 60,
        user,
        amount: "10",
        v: 0,
        s: 0,
        r: 0,
        tokenAddress: "0xXdefiTokenAddress",
      }),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce(
      undefined
    );

    (
      getMigrationContext as Mock<typeof getMigrationContext>
    ).mockImplementationOnce(() => {
      return Promise.resolve({
        migrationContract: vi.fn(),
        xdefiContract: {
          balanceOf: vi.fn().mockResolvedValue(1_000_000_000n),
        },
        provider: vi.fn(),
        wallet: vi.fn(),
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    expect(JSON.parse(response.body).message).equals(
      `address ${user} missing on token holders list`
    );
  });

  it("should return error when balance amount in USD below given threshold", async () => {
    const user = "0x123";
    const event = {
      body: JSON.stringify({
        deadline: Math.floor(Date.now() / 1000) + 60 * 60,
        user,
        v: 0,
        s: 0,
        r: 0,
        tokenAddress: "0xXdefiTokenAddress",
      }),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce({
      address: "",
      balance: (100n * 10n ** 18n).toString(),
    });

    (getTokenPrice as Mock<typeof getTokenPrice>).mockResolvedValueOnce({
      current_price: 0.99,
      symbol: "XDEFI",
      name: "XDEFI",
      id: "111",
      image: "",
    });

    (
      getMigrationContext as Mock<typeof getMigrationContext>
    ).mockImplementationOnce(() => {
      return Promise.resolve({
        migrationContract: vi.fn(),
        xdefiContract: {
          balanceOf: vi.fn().mockResolvedValue(100n * 10n ** 18n),
        },
        provider: vi.fn(),
        wallet: vi.fn(),
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    expect(JSON.parse(response.body).message).equals(
      `holding amount below threshold ${USD_VALUE_THRESHOLD} USD`
    );
  });

  it("should perform gasless migration successfully", async () => {
    const user = "0x123";
    const event = {
      body: JSON.stringify({
        deadline: Math.floor(Date.now() / 1000) + 60 * 60,
        user,
        v: 0,
        s: 0,
        r: 0,
        tokenAddress: "0xXdefiTokenAddress",
      }),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce({
      address: "",
      balance: (100n * 10n ** 18n).toString(),
    });

    (getTokenPrice as Mock<typeof getTokenPrice>).mockResolvedValueOnce({
      current_price: 1,
      symbol: "XDEFI",
      name: "XDEFI",
      id: "111",
      image: "",
    });

    (
      getMigrationContext as Mock<typeof getMigrationContext>
    ).mockImplementationOnce(() => {
      return Promise.resolve({
        migrationContract: {
          migrateWithGaslessApproval: vi.fn().mockResolvedValueOnce({
            wait: () => Promise.resolve({ hash: "0x111" }),
          }),
        },
        xdefiContract: {
          balanceOf: vi.fn().mockResolvedValue(100n * 10n ** 18n),
        },
        provider: vi.fn(),
        wallet: vi.fn(),
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(200);
    expect(JSON.parse(response.body).txHash).equals(`0x111`);
  });
});
