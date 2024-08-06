## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlTestERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    1.33 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    1.19 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    1.32 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,323 |     5 |    3.46 |
|        *migrateFromVXDEFI*          |       - |       - | 168,284 |     5 |    4.28 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,852 |     5 |    4.29 |
|        *migrateWithGaslessApproval* |       - |       - | 136,870 |     5 |    3.48 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    1.12 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    1.13 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    1.40 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    2.87 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    1.33 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   44.31 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   63.18 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |   37.28 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   86.25 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 10 gwei               |
| Token Price         | 2540.46 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |

