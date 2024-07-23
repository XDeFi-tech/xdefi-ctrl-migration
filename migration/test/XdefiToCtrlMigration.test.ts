import { expect } from "chai";
import hre from "hardhat";
import { Permit } from "./utls/helpers";

describe("XdefiToCtrlMigration", () => {
  async function loadXdefiContract() {
    const xdefi = await hre.ethers.getContractAt(
      "XdefiTestERC20",
      "0x0D6118C80cb2F954cf791EC5736FC218Ba644d05"
    );
    return xdefi;
  }

  async function loadCtrlContract() {
    const ctrl = await hre.ethers.getContractAt(
      "CtrlTestERC20",
      "0x3A1ccBF76c9649DD3C57A0f641658678B30af1E5"
    );
    return ctrl;
  }

  async function loadXdefiToCtrlMigrationContract() {
    const xdefiToCtrlMigration = await hre.ethers.getContractAt(
      "XdefiToCtrlMigration",
      "0xAe8E0350151009f79dcb5F2313773C5A04Ce0453"
    );
    return xdefiToCtrlMigration;
  }

  async function loadXdefiVaultContract() {
    const xdefiVault = await hre.ethers.getContractAt(
      "XDEFIVault",
      "0x97890070f6144012b2F8aEd70a8818E3972156af"
    );
    return xdefiVault;
  }
  describe("Migrate With Gas-less Approval", function () {
    it("Should migrate xdefi to ctrl", async function () {
      // Test implementation
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();

      // Collect the balances before the migration
      const xdefiBalanceBefore = await xdefi.balanceOf(bob.address);
      const ctrlBalanceBefore = await ctrl.balanceOf(bob.address);
      console.log(
        `BOB: xdefi balance before migration: ${xdefiBalanceBefore}\nctrl balance before migration: ${ctrlBalanceBefore}`
      );

      const xdefiBalanceOfMigrationContractBefore = await xdefi.balanceOf(
        spender
      );
      const ctrlBalanceOfMigrationContractBefore = await ctrl.balanceOf(
        spender
      );
      console.log(
        `MIGRATION CONTRACT: xdefi balance before migration: ${xdefiBalanceOfMigrationContractBefore}\nctrl balance before migration: ${ctrlBalanceOfMigrationContractBefore}`
      );

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      console.log(`Token Migration, ${message}, Signature: ${sig}`);
      // Migrate xdefi to ctrl
      const migration = await tokenMigration
        .connect(creator)
        .migrateWithGaslessApproval(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        );
      await migration.wait();

      console.log(
        `Migration successful. ${bob.address} migrated ${message.value} xdefi to ctrl, here is the transaction hash: ${migration.hash}`
      );

      expect(await xdefi.balanceOf(bob.address)).to.equal(
        xdefiBalanceBefore - message.value
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(
        ctrlBalanceBefore + message.value
      );

      expect(await xdefi.balanceOf(spender)).to.equal(
        xdefiBalanceOfMigrationContractBefore + message.value
      );
      expect(await ctrl.balanceOf(spender)).to.equal(
        ctrlBalanceOfMigrationContractBefore - message.value
      );
    });
  });
});
