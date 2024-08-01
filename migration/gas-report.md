## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlTestERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    1.50 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    1.35 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    1.49 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 138,411 |     5 |    3.98 |
|        *migrateFromVXDEFI*          |       - |       - | 170,406 |     5 |    4.90 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 170,952 |     5 |    4.92 |
|        *migrateWithGaslessApproval* |       - |       - | 139,003 |     5 |    4.00 |
|        *setTimeLock*                |  28,934 |  46,070 |  37,502 |     2 |    1.08 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    1.27 |
|        *withdrawOldTokens*          |       - |       - |  44,643 |     1 |    1.28 |
|        *withdrawPoolTokens*         |       - |       - |  55,222 |     1 |    1.59 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    3.25 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    1.50 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   50.18 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   71.54 |
| **XdefiToCtrlMigration** |   - |    - | 1,577,850 |     0 % |   45.39 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   97.66 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 9 gwei                |
| Token Price         | 3196.29 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |

