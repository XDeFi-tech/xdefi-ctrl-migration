# XDEFI CTRL Token Migration

This repository contains the smart contracts, AWS Lambda functions, and the frontend for the XDEFI to CTRL token migration.

## Overview

The project consists of 3 main parts:

1. **Smart Contracts**
2. **AWS Lambda Functions**
3. **Frontend (Mini React App)**

## Smart Contracts

The smart contracts are written in Solidity and are used to handle the token migration process. The main contract is `XdefiToCtrlMigration.sol`, which manages the migration. The contract is deployed on the Ethereum mainnet.

**Audit Information:**

The migration contract has been audited, including the Paymaster contract. You can find the detailed audit report by Code4rena here: [XDEFI ProLeague Audit Report - August 2024](https://code4rena.com/reports/2024-08-xdefi-proleague). 

The hash of the fixed commit for the migration contract and the Paymaster is: [76ac3e80d8a7ef31f7063ee87487e79ebe587dd2](https://github.com/XDeFi-tech/xdefi-ctrl-migration/tree/76ac3e80d8a7ef31f7063ee87487e79ebe587dd2).

## AWS Lambda Functions

The AWS Lambda functions handle the backend of the migration process. These functions are written in Node.js and interact with the smart contracts. They are deployed on AWS Lambda.

## Frontend

The frontend is a mini React app that interacts with the AWS Lambda functions to provide the user interface for the migration process.

## Setup

To set up the project, follow these steps:

1. Clone the repository.
2. Install the dependencies for each part of the project (smart contracts, Lambda functions, frontend) by running `npm install` in each directory.

## Running the Project

To run the project, follow these steps:

1. Deploy the smart contracts to the Ethereum mainnet (or testnet), if necessary.
2. Deploy the AWS Lambda functions to AWS Lambda, if necessary.
3. Run the frontend by running `npm start` in the frontend directory.
