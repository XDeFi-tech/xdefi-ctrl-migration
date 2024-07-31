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
|        *transfer*                   |       - |       - |  52,200 |    24 |    2.26 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    2.03 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    2.25 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,323 |     5 |    5.91 |
|        *migrateFromVXDEFI*          |       - |       - | 168,284 |     5 |    7.29 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,852 |     5 |    7.32 |
|        *migrateWithGaslessApproval* |       - |       - | 136,858 |     5 |    5.93 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    1.91 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    1.94 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    2.39 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    4.90 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    2.26 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   75.61 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |  107.80 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |   63.61 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |  147.17 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 13 gwei               |
| Token Price         | 3334.43 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



