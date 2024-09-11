## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    0.94 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    0.85 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    0.94 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 138,423 |     5 |    2.50 |
|        *migrateFromVXDEFI*          |       - |       - | 170,406 |     5 |    3.08 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 170,952 |     5 |    3.09 |
|        *migrateWithGaslessApproval* |       - |       - | 139,015 |     5 |    2.51 |
|        *setTimeLock*                |  28,934 |  46,070 |  37,502 |     2 |    0.68 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    0.80 |
|        *withdrawOldTokens*          |       - |       - |  44,643 |     1 |    0.81 |
|        *withdrawPoolTokens*         |       - |       - |  55,222 |     1 |    1.00 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    2.04 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    0.94 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlERC20**        |   - |    - | 1,744,339 |     0 % |   31.49 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   44.89 |
| **XdefiToCtrlMigration** |   - |    - | 1,577,850 |     0 % |   28.48 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   61.29 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 7 gwei                |
| Token Price         | 2578.78 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |

