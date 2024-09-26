import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { Mnemonic, randomBytes } from "ethers";
import { handler } from "../paymaster";
import { APIGatewayEvent } from "aws-lambda";
import { getTokenHolding } from "../migration/getTokenHolding";
import {
  getMigrationContext,
  MigrationContext,
} from "../migration/MigrationContext";
import { XDEFI_VALUE_THRESHOLD } from "../config/config";
import { migrationRequestSchema } from "../migration/validation/migrationRequestSchema";
import { isAlreadyMigrated } from "../migration/validation/isAlreadyMigrated";
import { saveMigrationRecord } from "../migration/saveMigrationRecord";

vi.mock("../migration/MigrationContext.ts", () => ({
  getMigrationContext: vi.fn().mockResolvedValue({
    dataSource: {
      createQueryRunner: vi
        .fn()
        .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
    },
  }),
  initMigrationContext: vi.fn(),
}));

vi.mock("../migration/validation/migrationRequestSchema.ts", () => ({
  migrationRequestSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("../db/paymaster-data-source.ts", () => ({
  PaymasterDataSource: {
    initialize: vi.fn(),
    createQueryRunner: vi
      .fn()
      .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
  },
}));

vi.mock("../migration/validation/isAlreadyMigrated", () => ({
  isAlreadyMigrated: vi.fn().mockResolvedValue(false),
}));

vi.mock("../migration/saveMigrationRecord", () => ({
  saveMigrationRecord: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../migration/getTokenHolding.ts", () => ({
  getTokenHolding: vi.fn(),
}));

vi.mock("../config/config.ts", () => ({
  XDEFI_TOKEN_ADDRESS: "0xXdefiTokenAddress",
  VXDEFI_TOKEN_ADDRESS: "0xVXdefiTokenAddress",
  PROVIDER_RPC_URL: "https://localhost/test",
  MIGRATION_CONTRACT_ADDRESS: "0xMigrationContractAddress",
  XDEFI_VALUE_THRESHOLD: 10n * 10n ** 18n,
  WHITELISTED_ADDRESS: [],
}));

vi.mock("../migration/getMnemonic.ts", () => ({
  getMnemonic: () => Promise.resolve(Mnemonic.entropyToPhrase(randomBytes(32))),
}));

describe("Paymaster handler", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it("should return error when address is not on holders list", async () => {
    const user = "0xTest-address";
    const requestBody = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
      user,
      v: 27,
      s: "0xs",
      r: "0xr",
      tokenAddress: "0xXdefiTokenAddress",
      amount: "10",
    };
    const event = {
      body: JSON.stringify(requestBody),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce(
      undefined
    );

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: true,
      data: requestBody as any,
    });

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
        dataSource: {
          createQueryRunner: vi
            .fn()
            .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
        },
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    expect(JSON.parse(response.body).message).equals(
      `address ${user} missing on token holders list`
    );
  });

  it("should return request payload validation error", async () => {
    const user = "0xTest-address";
    const requestBody = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
      user,
      v: 27,
      s: "0xs",
      r: "0xr",
      tokenAddress: "0xXdefiTokenAddress",
    };
    const event = {
      body: JSON.stringify(requestBody),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce(
      undefined
    );

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: false,
      error: {
        flatten() {
          return {
            fieldErrors: {
              deadline: ["error"],
            },
          } as any;
        },
      } as any,
    });

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
        dataSource: {
          createQueryRunner: vi
            .fn()
            .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
        },
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).equals(`Request validation failed`);
    expect(responseBody.fieldErrors).toBeDefined();
    expect(responseBody.fieldErrors.deadline).toEqual(["error"]);
  });

  it("should return error when balance amount in below given threshold", async () => {
    const user = "0x123";
    const requestBody = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
      user,
      v: 27,
      s: "0xs",
      r: "0xr",
      tokenAddress: "0xXdefiTokenAddress",
      amount: "10",
    };
    const event = {
      body: JSON.stringify(requestBody),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce({
      address: "",
      balance: (9n * 10n ** 18n).toString(),
    });

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: true,
      data: requestBody as any,
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
        dataSource: {
          createQueryRunner: vi
            .fn()
            .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
        },
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    expect(JSON.parse(response.body).message).equals(
      `holding amount below threshold 10 XDEFI`
    );
  });

  it("should perform gasless migration successfully", async () => {
    const user = "0x123";
    const requestBody = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
      user,
      v: 27,
      s: "0xs",
      r: "0xr",
      tokenAddress: "0xXdefiTokenAddress",
      amount: "100",
    };
    const event = {
      body: JSON.stringify(requestBody),
    } as APIGatewayEvent;

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce({
      address: "",
      balance: (100n * 10n ** 18n).toString(),
    });

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: true,
      data: requestBody as any,
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
        dataSource: {
          createQueryRunner: vi
            .fn()
            .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
        },
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(200);
    expect(JSON.parse(response.body).txHash).equals(`0x111`);
  });

  it("should return generic error when exception accurs", async () => {
    const user = "0x123";
    const requestBody = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
      user,
      v: 27,
      s: "0xs",
      r: "0xr",
      tokenAddress: "0xXdefiTokenAddress",
      amount: "100",
    };
    const event = {
      body: JSON.stringify(requestBody),
    } as APIGatewayEvent;

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: true,
      data: requestBody as any,
    });

    (getTokenHolding as Mock<typeof getTokenHolding>).mockReturnValueOnce({
      address: "",
      balance: (100n * 10n ** 18n).toString(),
    });

    (
      migrationRequestSchema.safeParse as Mock<
        typeof migrationRequestSchema.safeParse
      >
    ).mockReturnValueOnce({
      success: true,
      data: requestBody as any,
    });

    (
      getMigrationContext as Mock<typeof getMigrationContext>
    ).mockImplementationOnce(() => {
      return Promise.resolve({
        migrationContract: {
          migrateWithGaslessApproval: vi
            .fn()
            .mockRejectedValueOnce(new Error("generic error")),
        },
        xdefiContract: {
          balanceOf: vi.fn().mockResolvedValue(100n * 10n ** 18n),
        },
        provider: vi.fn(),
        wallet: vi.fn(),
        dataSource: {
          createQueryRunner: vi
            .fn()
            .mockReturnValue({ release: vi.fn().mockResolvedValue(undefined) }),
        },
      } as any as MigrationContext);
    });

    const response = await handler(event, {} as any);

    expect(response.statusCode).equals(400);
    expect(JSON.parse(response.body).message).equals(
      "Failed to perform migration. Please try again later or contact support."
    );
  });
});
