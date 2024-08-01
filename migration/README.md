# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```


## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                     |     Min |     Max |     Avg | Calls | usd avg |
| :---------------------------------- | ------: | ------: | ------: | ----: | ------: |
| **CtrlTestERC20**                   |         |         |         |       |         |
|        *transfer*                   |       - |       - |  52,200 |    24 |    2.16 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    1.95 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    2.15 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 138,411 |     5 |    5.74 |
|        *migrateFromVXDEFI*          |       - |       - | 170,406 |     5 |    7.06 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 170,952 |     5 |    7.09 |
|        *migrateWithGaslessApproval* |       - |       - | 139,015 |     5 |    5.76 |
|        *setTimeLock*                |  28,934 |  46,070 |  37,502 |     2 |    1.55 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    1.83 |
|        *withdrawOldTokens*          |       - |       - |  44,643 |     1 |    1.85 |
|        *withdrawPoolTokens*         |       - |       - |  55,222 |     1 |    2.29 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    4.68 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    2.16 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   72.29 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |  103.07 |
| **XdefiToCtrlMigration** |   - |    - | 1,577,850 |     0 % |   65.39 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |  140.71 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 13 gwei               |
| Token Price         | 3188.05 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



