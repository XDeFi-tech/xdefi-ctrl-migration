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
|        *transfer*                   |       - |       - |  52,200 |    24 |    0.34 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    0.31 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    0.34 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 136,311 |     5 |    0.89 |
|        *migrateFromVXDEFI*          |       - |       - | 168,260 |     5 |    1.10 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 168,828 |     5 |    1.10 |
|        *migrateWithGaslessApproval* |       - |       - | 136,858 |     5 |    0.89 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    0.29 |
|        *withdrawOldTokens*          |       - |       - |  44,665 |     1 |    0.29 |
|        *withdrawPoolTokens*         |       - |       - |  55,244 |     1 |    0.36 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    0.74 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    0.34 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   11.38 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   16.22 |
| **XdefiToCtrlMigration** |   - |    - | 1,467,477 |     0 % |    9.57 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   22.15 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 2 gwei                |
| Token Price         | 3261.68 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



