import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { Permit } from "./utls/helpers";

describe("XdefiToCtrlMigration", function () {
  async function deployXdefiToCtrlMigrationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [creator, addressOne, addressTwo] = await hre.ethers.getSigners();
    console.log(
      `Creator: ${await creator.getAddress()}\nAddressOne: ${await addressOne.getAddress()}\nAddressTwo: ${await addressTwo.getAddress()}\n`
    );

    // Deploy the Xdefi ERC20 token contract
    const XdefiTestERC20 = await hre.ethers.getContractFactory(
      "XdefiTestERC20",
      creator
    );
    const xdefi = await XdefiTestERC20.deploy(
      "Xdefi",
      "XDEFI",
      await creator.getAddress()
    );

    // Deploy the Ctrl ERC20 token contract
    const CtrlTestERC20 = await hre.ethers.getContractFactory(
      "CtrlTestERC20",
      creator
    );
    const ctrl = await CtrlTestERC20.deploy("Ctrl", "CTRL");

    // Deploy the XdefiToCtrlMigration contract
    const XdefiToCtrlMigration = await hre.ethers.getContractFactory(
      "XdefiToCtrlMigration"
    );
    const tokenMigration = await XdefiToCtrlMigration.deploy(xdefi, ctrl);

    console.log(
      `Xdefi: ${await xdefi.getAddress()}\nCtrl: ${await ctrl.getAddress()}\nTokenMigration: ${await tokenMigration.getAddress()}\n`
    );

    return { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo };
  }

  describe("Migrate", function () {
    it("Should migrate xdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      // Move 10 xdefi to addressOne
      const amount = BigInt(10 * 1e18);
      const resTransfer = await xdefi.transfer(
        await addressOne.getAddress(),
        amount
      );
      console.log(
        `Transfer xdefi to addressOne: ${await addressOne.getAddress()} amount: ${amount} txHash: ${
          resTransfer.hash
        }`
      );

      // Move 250 Ctrl to tokenMigration
      const amountCtrl = BigInt(250 * 1e18);
      const resTransferCtrl = await ctrl.transfer(
        await tokenMigration.getAddress(),
        amountCtrl
      );
      console.log(
        `Transfer Ctrl to tokenMigration: ${await tokenMigration.getAddress()} amount: ${amountCtrl} txHash: ${
          resTransferCtrl.hash
        }`
      );

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();
      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await xdefi.balanceOf(spender);
      const balanceOfOwner = await xdefi.balanceOf(owner);

      // domain separator for xdefi token
      const domain = {
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await addressOne.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      const resMigration = await tokenMigration.migrateWithGaslessApproval(
        message.owner,
        message.value,
        BigInt(message.deadline),
        v,
        r,
        s
      );

      console.log(`Migrate xdefi to ctrl txHash: ${resMigration.hash}`);

      expect(await xdefi.balanceOf(owner)).to.equal(
        balanceOfOwner - BigInt(10 * 1e18)
      );
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(spender)).to.equal(
        balanceOfSpender + BigInt(10 * 1e18)
      );
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      // Move 10 xdefi to addressOne
      const amount = BigInt(10 * 1e18);
      const resTransfer = await xdefi.transfer(
        await addressOne.getAddress(),
        amount
      );
      console.log(
        `Transfer xdefi to addressOne: ${await addressOne.getAddress()} amount: ${amount} txHash: ${
          resTransfer.hash
        }`
      );

      // Move 250 Ctrl to tokenMigration
      const amountCtrl = BigInt(250 * 1e18);
      const resTransferCtrl = await ctrl.transfer(
        await tokenMigration.getAddress(),
        amountCtrl
      );
      console.log(
        `Transfer Ctrl to tokenMigration: ${await tokenMigration.getAddress()} amount: ${amountCtrl} txHash: ${
          resTransferCtrl.hash
        }`
      );

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();
      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await xdefi.balanceOf(spender);
      const balanceOfOwner = await xdefi.balanceOf(owner);

      // domain separator for xdefi token
      const domain = {
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) - 60 * 10,
      };

      // Sign the message
      const sig = await addressOne.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          BigInt(message.deadline),
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Expired");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if nonce is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      const resTransfer = await xdefi.transfer(owner, BigInt(10 * 1e18));
      console.log(
        `Transfer xdefi to addressOne: ${owner} amount: ${BigInt(
          10 * 1e18
        )} txHash: ${resTransfer.hash}`
      );

      // Move 250 Ctrl to tokenMigration
      const resTransferCtrl = await ctrl.transfer(spender, BigInt(250 * 1e18));
      console.log(
        `Transfer Ctrl to tokenMigration: ${spender} amount: ${BigInt(
          250 * 1e18
        )} txHash: ${resTransferCtrl.hash}`
      );

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await xdefi.balanceOf(spender);
      const balanceOfOwner = await xdefi.balanceOf(owner);

      // domain separator for xdefi token
      const domain = {
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await addressOne.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      const transfer = await tokenMigration.migrateWithGaslessApproval(
        message.owner,
        message.value,
        BigInt(message.deadline),
        v,
        r,
        s
      );
      console.log(`Migrate xdefi to ctrl txHash: ${transfer.hash}`);

      // Migrate xdefi to ctrl with invalid nonce
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          BigInt(message.deadline),
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(0));
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(spender)).to.equal(BigInt(10 * 1e18));
    });
  });
});
