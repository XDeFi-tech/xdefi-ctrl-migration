# XDEFI CTRL Token migration

This repository contains the smart contracts, aws lambda functions and the frontend for the XDEFI to CTRL token migration.

## Overview
Project consists of 3 main parts:
1. Smart contracts
2. AWS Lambda functions
3. Frontend (Mini React app)

## Smart contracts
The smart contracts are written in Solidity and are used to handle the token migration process. The main contract is `XdefiToCtrlMigration.sol` which is used to handle the migration process. The contract is deployed on the Ethereum mainnet.

## AWS Lambda functions
The AWS Lambda functions are used to handle the backend of the migration process. The functions are written in Node.js and are used to interact with the smart contracts. The functions are deployed on AWS Lambda.

## Frontend
The frontend is a mini React app that is used to interact with the AWS Lambda functions. The frontend is used to handle the user interface of the migration process.

## Setup
To setup the project, follow the steps below:

1. Clone the repository
2. Install the dependencies for each part of the project (smart contracts, lambda functions, frontend) by running `npm install` in each directory

## Running the project
To run the project, follow the steps below:

1. Deploy the smart contracts to the Ethereum mainnet (or testnet), (probably you will skip this step)
2. Deploy the AWS Lambda functions to AWS Lambda, (probably you will skip this step)
3. Run the frontend by running `npm start` in the frontend directory


