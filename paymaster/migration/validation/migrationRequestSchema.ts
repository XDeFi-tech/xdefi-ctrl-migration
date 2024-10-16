import { z as zod } from "zod";
import { VXDEFI_TOKEN_ADDRESS, XDEFI_TOKEN_ADDRESS } from "../../config/config";

const getUnixTimestampNow = () => Math.floor(Date.now() / 1000);

const ALLOWED_TOKENS = [
  XDEFI_TOKEN_ADDRESS.toLowerCase(),
  VXDEFI_TOKEN_ADDRESS.toLowerCase(),
];

export const migrationRequestSchema = zod.object({
  user: zod.string().refine(
    (addr) => {
      const regex = /^0x[a-fA-F0-9]{40}$/;
      return regex.test(addr);
    },
    {
      message: "Given address is not evm address",
    }
  ),
  deadline: zod.coerce.number().refine(
    (deadline) => {
      return deadline > getUnixTimestampNow();
    },
    {
      message: "Deadline cannot be in past",
    }
  ),
  v: zod.coerce.number(),
  r: zod.string(),
  s: zod.string(),
  tokenAddress: zod.string().refine(
    (tokenAddress) => {
      return ALLOWED_TOKENS.includes(tokenAddress.toLowerCase());
    },
    {
      message: "Wrong token address",
    }
  ),
  amount: zod.coerce.bigint(),
});
