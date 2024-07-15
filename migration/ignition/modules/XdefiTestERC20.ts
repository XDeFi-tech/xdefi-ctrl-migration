import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const XdefiTestERC20Module = buildModule("XdefiTestERC20Module", (m) => {
  const name = "XdefiTest";
    const symbol = "TXDEFI";
  const xdefiTest = m.contract("XdefiTestERC20", [
    name,
    symbol,
  ], {});

  return { xdefiTest };
});

export default XdefiTestERC20Module;
