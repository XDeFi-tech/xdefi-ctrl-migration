import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const XdefiTestERC20Module = buildModule("XdefiTestERC20Module", (m) => {
  const name = "XdefiTest";
  const symbol = "TXDEFI";
  const xdefi = m.contract(
    "XdefiTestERC20",
    [name, symbol, m.getAccount(0)],
    {}
  );

  return { xdefi };
});

export default XdefiTestERC20Module;
