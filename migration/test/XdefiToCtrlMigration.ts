import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { Permit } from "./utls/helpers";

describe("XdefiToCtrlMigration", function () {
  async function deployXdefiToCtrlMigrationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [creator, bob, alice] = await hre.ethers.getSigners();
    console.log(
      `Creator: ${await creator.getAddress()}\nBob: ${await bob.getAddress()}\nAlice: ${await alice.getAddress()}\n`
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

    // Deploy the vXDEFI ERC4626 token contract
    const XDEFIVault = await hre.ethers.getContractFactory(
      "XDEFIVault",
      creator
    );
    const vXdefi = await XDEFIVault.deploy(await xdefi.getAddress());

    // Deploy the XdefiToCtrlMigration contract
    const XdefiToCtrlMigration = await hre.ethers.getContractFactory(
      "XdefiToCtrlMigration"
    );
    const tokenMigration = await XdefiToCtrlMigration.deploy(
      xdefi,
      ctrl,
      vXdefi
    );

    console.log(
      `Xdefi: ${await xdefi.getAddress()}\nCtrl: ${await ctrl.getAddress()}\nvXdefi: ${await vXdefi.getAddress()}\nTokenMigration: ${await tokenMigration.getAddress()}\n`
    );

    return {
      tokenMigration,
      xdefi,
      ctrl,
      vXdefi,
      creator,
      bob,
      alice,
    };
  }

  describe("Deployment", function () {
    it("Should deploy the XdefiToCtrlMigration contract", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, creator } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      const owner = await creator.getAddress();

      // Check the contract owner
      expect(await tokenMigration.owner()).to.equal(owner);

      // Check initial token balances
      expect(await xdefi.balanceOf(owner)).to.equal(BigInt(500 * 1e18));
      expect(await ctrl.balanceOf(owner)).to.equal(BigInt(500 * 1e18));

      // Check the contract addresses for xdefi, ctrl, and vXdefi
      expect(await tokenMigration.oldToken()).to.equal(
        await xdefi.getAddress()
      );
      expect(await tokenMigration.newToken()).to.equal(await ctrl.getAddress());
      expect(await tokenMigration.poolToken()).to.equal(
        await vXdefi.getAddress()
      );
    });
  });

  describe("Migrate With Gas-less Approval", function () {
    it("Should migrate xdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, creator, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();

      // Move 10 xdefi to addressOne
      await expect(
        xdefi.transfer(bob.address, BigInt(10 * 1e18))
      ).to.changeTokenBalances(
        xdefi,
        [creator, bob],
        [-BigInt(10 * 1e18), BigInt(10 * 1e18)]
      );

      // Move 250 Ctrl to tokenMigration
      await expect(
        ctrl.transfer(spender, BigInt(250 * 1e18))
      ).to.changeTokenBalances(
        ctrl,
        [creator, tokenMigration],
        [-BigInt(250 * 1e18), BigInt(250 * 1e18)]
      );

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
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

      // Migrate xdefi to ctrl
      const migration = tokenMigration.migrateWithGaslessApproval(
        message.owner,
        message.value,
        message.deadline,
        v,
        r,
        s
      );

      await expect(migration).to.changeTokenBalances(
        xdefi,
        [bob, tokenMigration],
        [BigInt(-10 * 1e18), BigInt(10 * 1e18)]
      );
      await expect(migration).to.changeTokenBalances(
        ctrl,
        [bob, tokenMigration],
        [BigInt(10 * 1e18), BigInt(-10 * 1e18)]
      );
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, bob, alice } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await alice.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
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
      const { tokenMigration, xdefi, ctrl, creator, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      // Move 10 xdefi to addressOne
      await expect(
        xdefi.transfer(bob.address, BigInt(10 * 1e18))
      ).to.changeTokenBalances(
        xdefi,
        [creator, bob],
        [-BigInt(10 * 1e18), BigInt(10 * 1e18)]
      );

      // Move 250 Ctrl to tokenMigration
      await expect(
        ctrl.transfer(await tokenMigration.getAddress(), BigInt(250 * 1e18))
      ).to.changeTokenBalances(
        ctrl,
        [creator, tokenMigration],
        [-BigInt(250 * 1e18), BigInt(250 * 1e18)]
      );

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender: await tokenMigration.getAddress(),
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      const migration = tokenMigration
        .connect(bob)
        .migrate(message.value, message.deadline, v, r, s);

      await expect(migration).to.changeTokenBalances(
        xdefi,
        [bob, tokenMigration],
        [BigInt(-10 * 1e18), BigInt(10 * 1e18)]
      );
      await expect(migration).to.changeTokenBalances(
        ctrl,
        [bob, tokenMigration],
        [BigInt(10 * 1e18), BigInt(-10 * 1e18)]
      );
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: Expired");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if nonce is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: Invalid Signature");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if signature is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration.connect(bob).migrate(
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
      const { tokenMigration, xdefi, ctrl, bob, alice } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await alice.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: Invalid Signature");
    });

    it("Should not migrate xdefi to ctrl if owner [xdefi] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if spender [ctrl] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const owner = await bob.getAddress();
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
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate xdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWithCustomError(ctrl, "ERC20InsufficientBalance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(owner)).to.equal(0);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });
  });

  async function initaialStateForVXdefiToCtrlMigrationFixture() {
    const { tokenMigration, xdefi, ctrl, vXdefi, creator, bob, alice } =
      await loadFixture(deployXdefiToCtrlMigrationFixture);

    // Get 30 XDEFI approval for vXdefi
    await xdefi.approve(await vXdefi.getAddress(), BigInt(30 * 1e18));
    // Deposit 30 XDEFI to get 30 vXDEFI for bob address
    const deposit = vXdefi.deposit(BigInt(30 * 1e18), bob.address);
    await expect(deposit).to.changeTokenBalances(
      xdefi,
      [creator, vXdefi],
      [BigInt(-30 * 1e18), BigInt(30 * 1e18)]
    );
    await expect(deposit).to.changeTokenBalance(vXdefi, bob, BigInt(30 * 1e18));

    // Move 250 Ctrl to tokenMigration
    await expect(
      ctrl.transfer(await tokenMigration.getAddress(), BigInt(250 * 1e18))
    ).to.changeTokenBalances(
      ctrl,
      [creator, tokenMigration],
      [BigInt(-250 * 1e18), BigInt(250 * 1e18)]
    );

    return { tokenMigration, xdefi, ctrl, vXdefi, creator, bob, alice };
  }

  describe("Migrate vXdefi to ctrl With Gas-less Approval", function () {
    it("Should migrate vXdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender: await tokenMigration.getAddress(),
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl, spender will get XDEFI and owner will get CTRL
      const migrate = tokenMigration.migrateGaslessFromVXDEFI(
        message.owner,
        message.value,
        message.deadline,
        v,
        r,
        s
      );

      await expect(migrate).to.changeTokenBalance(
        vXdefi,
        bob,
        BigInt(-10 * 1e18)
      );

      await expect(migrate).to.changeTokenBalance(
        xdefi,
        tokenMigration,
        BigInt(10 * 1e18)
      );

      await expect(migrate).to.changeTokenBalances(
        ctrl,
        [bob, tokenMigration],
        [BigInt(10 * 1e18), BigInt(-10 * 1e18)]
      );
    });

    it("Should not migrate vXdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) - 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20Permit: expired deadline");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if nonce is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce) + 1, // Enter an invalid nonce
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20Permit: invalid signature");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if signature is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl with invalid signature
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          BigInt(5 * 1e18), // Enter a different value to make the signature invalid
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20Permit: invalid signature");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if owner is not the signer", async function () {
      const { tokenMigration, vXdefi, creator, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await creator.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });

    it("Should not migrate vXdefi to ctrl if owner [vXdefi] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(0);

      const spender = await tokenMigration.getAddress();
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);
      expect(initialXdefiBalanceOfSpender).to.equal(0);

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if spender [ctrl] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, creator, bob } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      // Get 30 XDEFI approval for vXdefi
      await xdefi.approve(await vXdefi.getAddress(), BigInt(30 * 1e18));
      // Deposit 30 XDEFI to get 30 vXDEFI for bob address
      await vXdefi.deposit(BigInt(30 * 1e18), bob.address);
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(creator.address)).to.equal(
        BigInt(470 * 1e18)
      );

      const spender = await tokenMigration.getAddress();
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);
      expect(initialXdefiBalanceOfSpender).to.equal(0);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration.migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(ctrl, "ERC20InsufficientBalance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });
  });

  describe("Migrate vXdefi to ctrl With Approval", function () {
    it("Should migrate vXdefi to ctrl", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender: await tokenMigration.getAddress(),
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl, spender will get XDEFI and owner will get CTRL
      const migrate = tokenMigration
        .connect(bob)
        .migrateFromVXDEFI(message.value, message.deadline, v, r, s);

      await expect(migrate).to.changeTokenBalance(
        vXdefi,
        bob,
        BigInt(-10 * 1e18)
      );

      await expect(migrate).to.changeTokenBalance(
        xdefi,
        tokenMigration,
        BigInt(10 * 1e18)
      );

      await expect(migrate).to.changeTokenBalances(
        ctrl,
        [bob, tokenMigration],
        [BigInt(10 * 1e18), BigInt(-10 * 1e18)]
      );
    });

    it("Should not migrate vXdefi to ctrl if deadline is expired", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) - 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: expired deadline");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if nonce is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce) + 1, // Enter an invalid nonce
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: invalid signature");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if signature is invalid", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl with invalid signature
      await expect(
        tokenMigration.connect(bob).migrateFromVXDEFI(
          BigInt(5 * 1e18), // Enter a different value to make the signature invalid
          message.deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWith("ERC20Permit: invalid signature");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if owner is not the signer", async function () {
      const { tokenMigration, vXdefi, creator, bob } = await loadFixture(
        initaialStateForVXdefiToCtrlMigrationFixture
      );

      const spender = await tokenMigration.getAddress();

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };

      // Sign the message
      const sig = await creator.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });

    it("Should not migrate vXdefi to ctrl if owner [vXdefi] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(0);

      const spender = await tokenMigration.getAddress();
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);
      expect(initialXdefiBalanceOfSpender).to.equal(0);

      // Move 250 Ctrl to tokenMigration
      await ctrl.transfer(spender, BigInt(250 * 1e18));
      expect(await ctrl.balanceOf(spender)).to.equal(BigInt(250 * 1e18));

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if spender [ctrl] balance is insufficient", async function () {
      const { tokenMigration, xdefi, ctrl, vXdefi, creator, bob } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      // Get 30 XDEFI approval for vXdefi
      await xdefi.approve(await vXdefi.getAddress(), BigInt(30 * 1e18));
      // Deposit 30 XDEFI to get 30 vXDEFI for bob address
      await vXdefi.deposit(BigInt(30 * 1e18), bob.address);
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(creator.address)).to.equal(
        BigInt(470 * 1e18)
      );

      const spender = await tokenMigration.getAddress();
      const initialXdefiBalanceOfSpender = await xdefi.balanceOf(spender);
      expect(initialXdefiBalanceOfSpender).to.equal(0);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(bob)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWithCustomError(ctrl, "ERC20InsufficientBalance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(bob.address)).to.equal(0);
      expect(await xdefi.balanceOf(spender)).to.equal(
        initialXdefiBalanceOfSpender
      );
    });
  });

  describe("Withdraw [xdefi] ERC20 Tokens", function () {
    it("Should withdraw xdefi tokens", async function () {
      const { tokenMigration, xdefi, creator } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

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
      const { tokenMigration, xdefi, creator, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

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
        tokenMigration.connect(bob).withdrawOldTokens(BigInt(10 * 1e18))
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
      const { tokenMigration, ctrl, creator } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

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
      const { tokenMigration, ctrl, creator, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

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
        tokenMigration.connect(bob).withdrawNewTokens(BigInt(10 * 1e18))
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

  describe("Withdraw [vXdefi] ERC4626 Tokens", function () {
    it("Should withdraw vXdefi tokens", async function () {
      const { tokenMigration, xdefi, vXdefi, creator, bob } = await loadFixture(
        deployXdefiToCtrlMigrationFixture
      );

      expect(await vXdefi.balanceOf(creator.address)).to.equal(BigInt(0));
      expect(await xdefi.balanceOf(creator.address)).to.equal(
        BigInt(500 * 1e18)
      );
      expect(await xdefi.balanceOf(bob.address)).to.equal(BigInt(0));

      // Get 30 XDEFI approval for vXdefi
      await xdefi.approve(await vXdefi.getAddress(), BigInt(30 * 1e18));
      // Deposit 30 XDEFI to get 30 vXDEFI for bob address
      await vXdefi.deposit(BigInt(30 * 1e18), bob.address);
      expect(await vXdefi.balanceOf(bob.address)).to.equal(BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(creator.address)).to.equal(
        BigInt(470 * 1e18)
      );

      // Direct transfer 6 vXdefi to vXdefi contract
      await xdefi.transfer(await vXdefi.getAddress(), BigInt(6 * 1e18));
      expect(await vXdefi.previewRedeem(BigInt(30 * 1e18))).to.equal(
        BigInt(36 * 1e18)
      );
      // It should have 36 XDEFI in the contract
      expect(await xdefi.balanceOf(await vXdefi.getAddress())).to.equal(
        BigInt(36 * 1e18)
      );

      const migrationContract = await tokenMigration.getAddress();

      // Move 10 vXdefi to tokenMigration from bob
      await vXdefi.connect(bob).transfer(migrationContract, BigInt(10 * 1e18));
      const vXdefiBalanceOfMigrationContract = await vXdefi.balanceOf(
        migrationContract
      );
      expect(vXdefiBalanceOfMigrationContract).to.equal(BigInt(10 * 1e18));
      expect(await vXdefi.balanceOf(bob.address)).to.equal(BigInt(20 * 1e18));

      const vXdefiBalanceOfOwner = await vXdefi.balanceOf(creator.address);
      expect(vXdefiBalanceOfOwner).to.equal(BigInt(0));

      // Withdraw vXdefi tokens from tokenMigration to owner address
      await tokenMigration.withdrawPoolTokens(BigInt(10 * 1e18));

      expect(await vXdefi.balanceOf(creator.address)).to.equal(
        vXdefiBalanceOfOwner + BigInt(10 * 1e18)
      );
      expect(await vXdefi.balanceOf(migrationContract)).to.equal(
        vXdefiBalanceOfMigrationContract - BigInt(10 * 1e18)
      );
    });

    it("Should not withdraw vXdefi tokens if caller is not the owner", async function () {
      const { tokenMigration, xdefi, vXdefi, creator, alice } =
        await loadFixture(deployXdefiToCtrlMigrationFixture);

      // Get 30 XDEFI approval for vXdefi
      await xdefi.approve(await vXdefi.getAddress(), BigInt(30 * 1e18));
      // Deposit 30 XDEFI from creator address to get 30 vXDEFI for alice address
      await vXdefi.deposit(BigInt(30 * 1e18), alice.address);
      expect(await vXdefi.balanceOf(alice.address)).to.equal(BigInt(30 * 1e18));
      expect(await xdefi.balanceOf(creator.address)).to.equal(
        BigInt(470 * 1e18)
      );

      const migrationContract = await tokenMigration.getAddress();

      // Move 10 vXdefi to tokenMigration from alice
      await vXdefi
        .connect(alice)
        .transfer(migrationContract, BigInt(10 * 1e18));
      const vXdefiBalanceOfMigrationContract = await vXdefi.balanceOf(
        migrationContract
      );
      expect(vXdefiBalanceOfMigrationContract).to.equal(BigInt(10 * 1e18));

      const vXdefiBalanceOfAlice = await vXdefi.balanceOf(alice.address);
      expect(vXdefiBalanceOfAlice).to.equal(BigInt(20 * 1e18));

      const vXdefiBalanceOfCreator = await vXdefi.balanceOf(creator.address);
      expect(vXdefiBalanceOfCreator).to.equal(BigInt(0));

      // Withdraw ctrl tokens
      await expect(
        tokenMigration.connect(alice).withdrawPoolTokens(BigInt(10 * 1e18))
      ).to.be.revertedWithCustomError(
        tokenMigration,
        "OwnableUnauthorizedAccount"
      );
      expect(await vXdefi.balanceOf(alice.address)).to.equal(
        vXdefiBalanceOfAlice
      );
      expect(await vXdefi.balanceOf(creator.address)).to.equal(
        vXdefiBalanceOfCreator
      );
      expect(await vXdefi.balanceOf(migrationContract)).to.equal(
        vXdefiBalanceOfMigrationContract
      );
    });
  });
});
