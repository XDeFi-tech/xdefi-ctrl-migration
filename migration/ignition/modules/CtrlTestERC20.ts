import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CtrlTestERC20Module = buildModule("CtrlTestERC20Module", (m) => {
  const name = "CtrlTest";
  const symbol = "TCTRL";
  const ctrl = m.contract("CtrlTestERC20", [name, symbol], {});

  return { ctrl };
});

export default CtrlTestERC20Module;
