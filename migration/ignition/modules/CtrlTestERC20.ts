import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const CtrlTestERC20Module = buildModule("CtrlTestERC20Module", (m) => {
  const name = "CtrlTest";
    const symbol = "TCTRL";
  const ctrlTest = m.contract("CtrlTestERC20", [
    name,
    symbol,
  ], {});

  return { ctrlTest };
});

export default CtrlTestERC20Module;
