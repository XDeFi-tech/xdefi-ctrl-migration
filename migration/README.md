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
|        *transfer*                   |       - |       - |  52,200 |    24 |    2.45 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    2.21 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    2.44 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,311 |     5 |    6.40 |
|        *migrateFromVXDEFI*          |       - |       - | 168,272 |     5 |    7.91 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,852 |     5 |    7.93 |
|        *migrateWithGaslessApproval* |       - |       - | 136,858 |     5 |    6.43 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    2.07 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    2.10 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    2.60 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    5.31 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    2.45 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   81.96 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |  116.86 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |   68.95 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |  159.53 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 15 gwei               |
| Token Price         | 3132.51 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



