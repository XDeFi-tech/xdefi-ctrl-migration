Command line utility code to generate holders list for XDEFI on ethereum and arbitrum and vXDEFI on ethereum.
Requires postgresql database connection.

This code allows to perform 3 actions:

- Pull `transfer` event log for XDEFI|vXDEFI contract from ethereum and arbitrum (database table)
- Build balances from scrapped event log
- Build holders list in form of json file

json holders list is an end product supposed to be used in `paymaster` aws lambda function

For more usage details check `src/main.ts`
