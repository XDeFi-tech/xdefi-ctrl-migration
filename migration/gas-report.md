## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlTestERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    0.86 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    0.78 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    0.86 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 138,423 |     5 |    2.29 |
|        *migrateFromVXDEFI*          |       - |       - | 170,406 |     5 |    2.82 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 170,952 |     5 |    2.83 |
|        *migrateWithGaslessApproval* |       - |       - | 139,015 |     5 |    2.30 |
|        *setTimeLock*                |  28,934 |  46,070 |  37,502 |     2 |    0.62 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    0.73 |
|        *withdrawOldTokens*          |       - |       - |  44,643 |     1 |    0.74 |
|        *withdrawPoolTokens*         |       - |       - |  55,222 |     1 |    0.91 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    1.87 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    0.86 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   28.87 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   41.16 |
| **XdefiToCtrlMigration** |   - |    - | 1,577,850 |     0 % |   26.12 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   56.20 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 5 gwei                |
| Token Price         | 3310.40 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |

