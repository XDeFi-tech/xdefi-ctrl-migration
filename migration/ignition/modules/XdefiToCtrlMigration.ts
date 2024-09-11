import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const XdefiToCtrlMigrationModule = buildModule(
  "XdefiToCtrlMigrationModule",
  (m) => {
    const _oldToken = m.contractAt(
      "XdefiTestERC20",
      "0x0D6118C80cb2F954cf791EC5736FC218Ba644d05"
    );
    const _newToken = m.contractAt(
      "CtrlERC20",
      "0x3A1ccBF76c9649DD3C57A0f641658678B30af1E5"
    );
    const _poolToken = m.contractAt(
      "XDEFIVault",
      "0x97890070f6144012b2F8aEd70a8818E3972156af"
    );

    const xdefiToCtrlMigrationContract = m.contract(
      "XdefiToCtrlMigration",
      [_oldToken, _newToken, _poolToken],
      {}
    );

    return { xdefiToCtrlMigrationContract };
  }
);

export default XdefiToCtrlMigrationModule;
