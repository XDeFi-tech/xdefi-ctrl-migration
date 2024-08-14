# dApp to test XDEFI and vXDEFI to CTRL migration

in order to run on localhost you will need aws command line unility called `sam`

## run on localhost

### run aws lambda first

```
cd /path/to/repo/root
cd paymaster
sam build
sam local start-api
```

you will need docker installed and running for sam.

### launch FE

copy `.env.sample` and rename copy to `.env`
you will need to enter mnemonic for VITE_CLIENT_WALLET_MNEMONIC env var.
That mnemonic represents client wallet who is going to perform migration. That is required because wallet owner must sign Permit
The rest of values are pre-defined and should work (might change though).

Then,

```
cd /path/to/repo/root
cd migration-test-dapp
yarn install
yarn dev
```

Enjoy.
