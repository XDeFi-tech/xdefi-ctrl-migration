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
|        *transfer*                   |       - |       - |  52,200 |    24 |    0.41 |
| **XdefiTestERC20**                  |         |         |         |       |         |
|        *approve*                    |       - |       - |  46,932 |     6 |    0.37 |
|        *transfer*                   |  35,675 |  52,787 |  51,876 |    19 |    0.41 |
| **XdefiToCtrlMigration**            |         |         |         |       |         |
|        *migrate*                    |       - |       - | 138,423 |     5 |    1.09 |
|        *migrateFromVXDEFI*          |       - |       - | 170,406 |     5 |    1.34 |
|        *migrateGaslessFromVXDEFI*   |       - |       - | 170,952 |     5 |    1.35 |
|        *migrateWithGaslessApproval* |       - |       - | 139,015 |     5 |    1.10 |
|        *setTimeLock*                |  28,934 |  46,070 |  37,502 |     2 |    0.30 |
|        *withdrawNewTokens*          |       - |       - |  44,077 |     1 |    0.35 |
|        *withdrawOldTokens*          |       - |       - |  44,643 |     1 |    0.35 |
|        *withdrawPoolTokens*         |       - |       - |  55,222 |     1 |    0.44 |
| **XDEFIVault**                      |         |         |         |       |         |
|        *deposit*                    | 112,919 | 112,931 | 112,930 |    12 |    0.89 |
|        *transfer*                   |       - |       - |  52,178 |     2 |    0.41 |

## Deployments
|                          | Min | Max  |       Avg | Block % | usd avg |
| :----------------------- | --: | ---: | --------: | ------: | ------: |
| **CtrlTestERC20**        |   - |    - | 1,744,339 |     0 % |   13.75 |
| **XdefiTestERC20**       |   - |    - | 2,486,975 |     0 % |   19.61 |
| **XdefiToCtrlMigration** |   - |    - | 1,577,850 |     0 % |   12.44 |
| **XDEFIVault**           |   - |    - | 3,395,066 |     0 % |   26.76 |

## Solidity and Network Config
| **Settings**        | **Value**             |
| ------------------- | --------------------- |
| Solidity: version   | 0.8.24                |
| Solidity: optimized | false                 |
| Solidity: runs      | 200                   |
| Solidity: viaIR     | false                 |
| Block Limit         | 9,007,199,254,740,991 |
| L1 Gas Price        | 3 gwei                |
| Token Price         | 2627.77 usd/eth       |
| Network             | ETHEREUM              |
| Toolchain           | hardhat               |



