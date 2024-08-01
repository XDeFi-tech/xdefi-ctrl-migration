## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     | Min | Max |     Avg | Calls | usd avg |
| :---------------------------------- | --: | --: | ------: | ----: | ------: |
| **XdefiToCtrlMigration**            |     |     |         |       |         |
|        *migrate*                    |   - |   - |  91,923 |     1 |    2.05 |
|        *migrateFromVXDEFI*          |   - |   - | 127,125 |     1 |    2.84 |
|        *migrateGaslessFromVXDEFI*   |   - |   - | 127,562 |     1 |    2.85 |
|        *migrateWithGaslessApproval* |   - |   - | 109,615 |     1 |    2.45 |
|        *withdrawNewTokens*          |   - |   - |  44,077 |     1 |    0.98 |
|        *withdrawOldTokens*          |   - |   - |  44,643 |     1 |    1.00 |

## Deployments
|    | Min | Max  | Avg | Block % | usd avg |
| :- | --: | ---: | --: | ------: | ------: |

## Solidity and Network Config
| **Settings**        | **Value**       |
| ------------------- | --------------- |
| Solidity: version   | 0.8.24          |
| Solidity: optimized | false           |
| Solidity: runs      | 200             |
| Solidity: viaIR     | false           |
| Block Limit         | 30,000,000      |
| L1 Gas Price        | 7 gwei          |
| Token Price         | 3189.92 usd/eth |
| Network             | ETHEREUM        |
| Toolchain           | hardhat         |

