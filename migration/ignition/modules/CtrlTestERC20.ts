import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CtrlERC20Module = buildModule("CtrlERC20Module", (m) => {
  const name = "CtrlTest";
  const symbol = "TCTRL";
  const ctrl = m.contract("CtrlERC20", [name, symbol], {});

  return { ctrl };
});

export default CtrlERC20Module;
