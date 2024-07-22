import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const XDEFIVaultModule = buildModule("XDEFIVaultModule", (m) => {
  const name = "XDEFIVault";
  const address = "0x0D6118C80cb2F954cf791EC5736FC218Ba644d05";
  const vXdefi = m.contract("XDEFIVault", [address], {});

  return { vXdefi };
});

export default XDEFIVaultModule;
