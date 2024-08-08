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
|        *transfer*                   |       - |       - |  52,200 |    24 |    2.35 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    2.11 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    2.34 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,323 |     5 |    6.14 |
|        *migrateFromVXDEFI*          |       - |       - | 168,272 |     5 |    7.58 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,840 |     5 |    7.60 |
|        *migrateWithGaslessApproval* |       - |       - | 136,870 |     5 |    6.16 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    1.98 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    2.01 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    2.49 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    5.08 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    2.35 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   78.53 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |  111.96 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |   66.06 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |  152.84 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 18 gwei               |
| Token Price         | 2501.07 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



