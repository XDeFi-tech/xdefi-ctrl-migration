const allowedAddresses: string[] = [
  "0x1b9700859ad250bfe97bc6c93ff8f99b10be7f3a",
];

// set of addresses that we allow to migrate gasless bypassing holdders snapshot check
export const migrationWhitelist = new Set(allowedAddresses);
