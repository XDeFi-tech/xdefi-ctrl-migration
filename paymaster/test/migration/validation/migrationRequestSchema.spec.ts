import { z as zod } from "zod";
import { describe, expect, it, vi } from "vitest";
import { migrationRequestSchema } from "../../../migration/validation/migrationRequestSchema";
import { XDEFI_TOKEN_ADDRESS } from "../../../config/config";

vi.mock("../../../config/config.ts", () => ({
  XDEFI_TOKEN_ADDRESS: "0xXdefiTokenAddress",
  VXDEFI_TOKEN_ADDRESS: "0xVXdefiTokenAddress",
  PROVIDER_RPC_URL: "https://localhost/test",
  MIGRATION_CONTRACT_ADDRESS: "0xMigrationContractAddress",
  USD_VALUE_THRESHOLD: 100,
}));

describe("migrationRequestSchema", () => {
  it("should fail validation when deadline is expired", () => {
    const deadlineInpast = Math.floor(Date.now() / 1000) - 1000;

    const result = migrationRequestSchema.safeParse({
      deadline: deadlineInpast,
      tokenAddress: XDEFI_TOKEN_ADDRESS,
      r: "0xr",
      v: "0xv",
      s: "0xs",
      user: "0xe3CA57348c1909A353234c3DaE043abFB434bC16",
    } as zod.infer<typeof migrationRequestSchema>);

    const errors = result.error?.flatten();

    expect(result.success).toBe(false);
    expect(errors?.fieldErrors?.deadline?.[0]).toBe(
      "Deadline cannot be in past"
    );
  });

  it("should fail validation when tokenAddress is wrong", () => {
    const deadline = Math.floor(Date.now() / 1000) + 10000;

    const result = migrationRequestSchema.safeParse({
      deadline,
      tokenAddress: "0xWrongTokenAddress",
      r: "0xr",
      v: "0xv",
      s: "0xs",
      user: "0xe3CA57348c1909A353234c3DaE043abFB434bC16",
    } as zod.infer<typeof migrationRequestSchema>);

    const errors = result.error?.flatten();

    expect(result.success).toBe(false);
    expect(errors?.fieldErrors?.tokenAddress?.[0]).toBe("Wrong token address");
  });

  it("should fail validation when user is not valid evm address", () => {
    const deadline = Math.floor(Date.now() / 1000) + 10000;

    const result = migrationRequestSchema.safeParse({
      deadline,
      tokenAddress: XDEFI_TOKEN_ADDRESS,
      r: "0xr",
      v: "0xv",
      s: "0xs",
      user: "D4efTZwZbxDeJCZPVakDEbxTz925KFCtuEVWtkbi25em",
    } as zod.infer<typeof migrationRequestSchema>);

    const errors = result.error?.flatten();

    expect(result.success).toBe(false);
    expect(errors?.fieldErrors?.user?.[0]).toBe(
      "Given address is not evm address"
    );
  });

  it("should pass validation", () => {
    const deadline = Math.floor(Date.now() / 1000) + 10000;

    const result = migrationRequestSchema.safeParse({
      deadline,
      tokenAddress: XDEFI_TOKEN_ADDRESS,
      r: "0xr",
      v: "0xv",
      s: "0xs",
      user: "0xe3CA57348c1909A353234c3DaE043abFB434bC16",
    } as zod.infer<typeof migrationRequestSchema>);

    const errors = result.error?.flatten();

    expect(result.success).toBe(true);
  });
});
