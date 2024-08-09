## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlTestERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    0.55 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    0.49 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    0.55 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,323 |     5 |    1.43 |
|        *migrateFromVXDEFI*          |       - |       - | 168,284 |     5 |    1.77 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,852 |     5 |    1.78 |
|        *migrateWithGaslessApproval* |       - |       - | 136,870 |     5 |    1.44 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    0.46 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    0.47 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    0.58 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    1.19 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    0.55 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   18.36 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   26.17 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |   15.44 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   35.73 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 4 gwei                |
| Token Price         | 2630.85 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |

