const allowedAddresses: string[] = [];

// set of addresses that we allow to migrate gasless bypassing holdders snapshot check
export const migrationWhitelist = new Set(allowedAddresses);
