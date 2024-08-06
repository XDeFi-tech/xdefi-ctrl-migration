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
|        *transfer*                   |       - |       - |  52,200 |    24 |    5.77 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    5.19 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    5.74 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,323 |     5 |   15.08 |
|        *migrateFromVXDEFI*          |       - |       - | 168,272 |     5 |   18.61 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,840 |     5 |   18.67 |
|        *migrateWithGaslessApproval* |       - |       - | 136,870 |     5 |   15.14 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    4.87 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    4.94 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    6.11 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |   12.49 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    5.77 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |  192.91 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |  275.03 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |  162.29 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |  375.46 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 37 gwei               |
| Token Price         | 2988.92 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



