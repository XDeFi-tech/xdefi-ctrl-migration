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

  describe("Deployment", function () {
    it("Should deploy the XdefiToCtrlMigration contract", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();

      expect(await tokenMigration.owner()).to.equal(owner);
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(500 * 1e18));
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(500 * 1e18));
    });
  });

  describe("Migrate With Gas-less Approval", function () {
    it("Should migrate xdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const initialBalanceOfSpender = await xdefi.balanceOf(spender);
      const initialBalanceOfOwner = await xdefi.balanceOf(owner);

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
      await tokenMigration.migrateWithGaslessApproval(
        message.owner,
        message.value,
        message.deadline,
        v,
        r,
        s
      );

      expect(await xdefi.balanceOf(owner)).to.equal(
        initialBalanceOfOwner - BigInt(10 * 1e18)
      );
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialBalanceOfSpender + BigInt(10 * 1e18)
      );
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

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
          message.deadline,
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
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await ctrl.balanceOf(spender);
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
        value: BigInt(5 * 1e18),
        nonce: Number(nonce) + 1, // Enter an invalid nonce
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await addressOne.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl with invalid nonce
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if signature is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await ctrl.balanceOf(spender);
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

      // Migrate xdefi to ctrl with invalid signature
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          BigInt(5 * 1e18), // Enter a different value to make the signature invalid
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if owner is not the signer", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

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
      const sig = await addressTwo.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl with invalid signature
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Invalid Signature");
    });

    it("Should not migrate xdefi to ctrl if owner [xdefi] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

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

      // Migrate xdefi to ctrl with insufficient balance
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if spender [ctrl] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();
      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      const balanceOfSpender = await ctrl.balanceOf(spender);
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

      // Migrate xdefi to ctrl with insufficient balance
      await expect(
        tokenMigration.migrateWithGaslessApproval(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(ctrl, "ERC20InsufficientBalance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });
  });

  describe("Migrate With Approval", function () {
    it("should migrate xdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

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
      await tokenMigration
        .connect(addressOne)
        .migrate(message.value, message.deadline, v, r, s);

      expect(await xdefi.balanceOf(owner)).to.equal(
        balanceOfOwner - BigInt(10 * 1e18)
      );
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(spender)).to.equal(
        balanceOfSpender + BigInt(10 * 1e18)
      );
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(240 * 1e18));
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

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
        tokenMigration
          .connect(addressOne)
          .migrate(message.value, message.deadline, v, r, s)
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
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await ctrl.balanceOf(spender);
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
        nonce: Number(nonce) + 1, // Enter an invalid nonce
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await addressOne.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(addressOne)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if signature is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfSpender = await ctrl.balanceOf(spender);
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
      await expect(
        tokenMigration.connect(addressOne).migrate(
          BigInt(5 * 1e18), // Enter a different value to make the signature invalid
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if owner is not the signer", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

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
      const sig = await addressTwo.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(addressOne)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: Invalid Signature");
    });

    it("Should not migrate xdefi to ctrl if owner [xdefi] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

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
      await expect(
        tokenMigration
          .connect(addressOne)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if spender [ctrl] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await addressOne.getAddress();
      const spender = await tokenMigration.getAddress();
      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      // Move 10 xdefi to addressOne
      await xdefi.transfer(owner, BigInt(10 * 1e18));
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(10 * 1e18));

      const balanceOfSpender = await ctrl.balanceOf(spender);
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
      await expect(
        tokenMigration
          .connect(addressOne)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWithCustomError(ctrl, "ERC20InsufficientBalance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });
  });

  describe("Withdraw [xdefi] ERC20 Tokens", function () {
    it("Should withdraw xdefi tokens", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      // Move 30 Xdefi to tokenMigration
      await xdefi.transfer(migrationContract, BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(migrationContract)).to.equal(
        BigInt(30 * 1e18)
      );

      const balanceOfCreator = await xdefi.balanceOf(owner);
      const balanceOfMigrationContract = await xdefi.balanceOf(
        migrationContract
      );

      // Withdraw xdefi tokens
      await tokenMigration.withdrawOldTokens(BigInt(10 * 1e18));

      expect(await xdefi.balanceOf(owner)).to.equal(
        balanceOfCreator + BigInt(10 * 1e18)
      );
      expect(await xdefi.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract - BigInt(10 * 1e18)
      );
    });

    it("Should not withdraw xdefi tokens if caller is not the owner", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      // Move 30 Xdefi to tokenMigration
      await xdefi.transfer(migrationContract, BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(migrationContract)).to.equal(
        BigInt(30 * 1e18)
      );

      const balanceOfOwner = await xdefi.balanceOf(owner);
      const balanceOfMigrationContract = await xdefi.balanceOf(
        migrationContract
      );

      // Withdraw xdefi tokens
      await expect(
        tokenMigration.connect(addressOne).withdrawOldTokens(BigInt(10 * 1e18))
      ).to.be.revertedWithCustomError(
        tokenMigration,
        "OwnableUnauthorizedAccount"
      );
      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await xdefi.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract
      );
    });
  });

  describe("Withdraw [ctrl] ERC20 Tokens", function () {
    it("Should withdraw ctrl tokens", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      // Move 30 Ctrl to tokenMigration
      await ctrl.transfer(migrationContract, BigInt(30 * 1e18));
      expect(await ctrl.balanceOf(migrationContract)).to.equal(
        BigInt(30 * 1e18)
      );

      const balanceOfCreator = await ctrl.balanceOf(owner);
      const balanceOfMigrationContract = await ctrl.balanceOf(
        migrationContract
      );

      // Withdraw ctrl tokens
      await tokenMigration.withdrawNewTokens(BigInt(10 * 1e18));

      expect(await ctrl.balanceOf(owner)).to.equal(
        balanceOfCreator + BigInt(10 * 1e18)
      );
      expect(await ctrl.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract - BigInt(10 * 1e18)
      );
    });

    it("Should not withdraw ctrl tokens if caller is not the owner", async function () {
      const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      // Move 30 Ctrl to tokenMigration
      await ctrl.transfer(migrationContract, BigInt(30 * 1e18));
      expect(await ctrl.balanceOf(migrationContract)).to.equal(
        BigInt(30 * 1e18)
      );

      const balanceOfOwner = await ctrl.balanceOf(owner);
      const balanceOfMigrationContract = await ctrl.balanceOf(
        migrationContract
      );

      // Withdraw ctrl tokens
      await expect(
        tokenMigration.connect(addressOne).withdrawNewTokens(BigInt(10 * 1e18))
      ).to.be.revertedWithCustomError(
        tokenMigration,
        "OwnableUnauthorizedAccount"
      );
      expect(await ctrl.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract
      );
    });
  });
});
