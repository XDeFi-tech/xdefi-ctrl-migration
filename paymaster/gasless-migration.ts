import * as ethers from "ethers";

const OLD_TOKEN_ADDRESS = "0xOldTokenAddress";
const NEW_TOKEN_ADDRESS = "0xNewTokenAddress";
const MIGRATION_CONTRACT_ADDRESS = "0xMigrationContractAddress";
const PRIVATE_KEY = "your-private-key"; // Clé privée de la tierce partie

const provider = new ethers.InfuraProvider(
  "homestead",
  "your-infura-project-id"
);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const oldToken = new ethers.Contract(
  OLD_TOKEN_ADDRESS,
  [
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  ],
  wallet
);

const migrationContract = new ethers.Contract(
  MIGRATION_CONTRACT_ADDRESS,
  [
    "function migrateWithGaslessApproval(address user, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  ],
  wallet
);

exports.handler = async (event) => {
  const { user, amount, deadline, v, r, s } = event;
  // TODO: amount should be higher than X OldToken
  try {
    // Call the migrate function on the migration contract
    const tx = await migrationContract.migrateWithGaslessApproval(
      user,
      amount,
      deadline,
      v,
      r,
      s
    );
    await tx.wait();

    // TODO: handle edge case such as gas price increase and congestion

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Migration successful",
        transactionHash: tx.hash,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Migration failed",
        error: error.message,
      }),
    };
  }
};
