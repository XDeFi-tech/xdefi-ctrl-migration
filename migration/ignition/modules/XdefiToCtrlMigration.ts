import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const XdefiToCtrlMigrationModule = buildModule(
    "XdefiToCtrlMigrationModule",
    (m) => {

        const _oldToken = m.contractAt("XdefiTestERC20", '0x46b01429E0B31e37De7Cdac24071cB94E6de43a6');
        const _newToken =  m.contractAt("CtrlTestERC20", '0xF4a2c191Da5A3D173F36c27626C4397A94b7e50a');

        const xdefiToCtrlMigrationContract = m.contract("XdefiToCtrlMigration", [
            _oldToken,
            _newToken,
        ], {

        });

        return { xdefiToCtrlMigrationContract };
    },
);

export default XdefiToCtrlMigrationModule;
