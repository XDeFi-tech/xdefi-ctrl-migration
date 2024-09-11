import { expect } from "chai";
import hre from "hardhat";
import { Permit } from "../test/utls/helpers";

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
      "CtrlERC20",
      "0x3A1ccBF76c9649DD3C57A0f641658678B30af1E5"
    );
    return ctrl;
  }

  async function loadXdefiToCtrlMigrationContract() {
    const xdefiToCtrlMigration = await hre.ethers.getContractAt(
      "XdefiToCtrlMigration",
      "0x83df4Dc89402230b7B6ef7E8a0283CfEd80cDbC0"
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

  // it("Should withdraw tokens from old version of token to new", async function () {
  //   const tokenMigrationOld = await loadXdefiToCtrlMigrationContractOld();
  //   const tokenMigrationNew = await loadXdefiToCtrlMigrationContract();
  //   const ctrl = await loadCtrlContract();
  //   const [creator] = await hre.ethers.getSigners();
  //   const owner = await creator.getAddress();
  //
  //   // transfer ctrl tokens from old contract to new contract
  //   const migrationContractOld = await tokenMigrationOld.getAddress();
  //
  //   const balanceOfCreator = await ctrl.balanceOf(owner);
  //   const balanceOfMigrationContract = await ctrl.balanceOf(
  //     migrationContractOld
  //   );
  //
  //   // Withdraw ctrl tokens
  //   const withdraw = await tokenMigrationOld.withdrawNewTokens(
  //     balanceOfMigrationContract
  //   );
  //   await withdraw.wait();
  //   expect(await ctrl.balanceOf(migrationContractOld)).to.equal(0);
  //
  //   // make deposit to new contract
  //   const migrationContractNew = await tokenMigrationNew.getAddress();
  //   const balanceOfCreatorAfterWithdraw = await ctrl.balanceOf(owner);
  //   const balanceOfMigrationContractAfterWithdraw = await ctrl.balanceOf(
  //     migrationContractNew
  //   );
  //
  //   // transfer ctrl tokens to new contract
  //   const transfer = await ctrl
  //     .connect(creator)
  //     .transfer(migrationContractNew, balanceOfMigrationContract);
  //   await transfer.wait();
  //
  //   expect(await ctrl.balanceOf(owner)).to.equal(
  //     balanceOfCreatorAfterWithdraw - balanceOfMigrationContract
  //   );
  //   expect(await ctrl.balanceOf(migrationContractNew)).to.equal(
  //     balanceOfMigrationContract
  //   );
  //
  //   // withdraw xdefi tokens from old contract
  //   const xdefi = await loadXdefiContract();
  //   const balanceOfMigrationContractXdefi = await xdefi.balanceOf(
  //     migrationContractOld
  //   );
  //   const withdrawXdefi = await tokenMigrationOld.withdrawOldTokens(
  //     balanceOfMigrationContractXdefi
  //   );
  //   await withdrawXdefi.wait();
  //   expect(await xdefi.balanceOf(migrationContractOld)).to.equal(0);
  // });

  describe("Migrate With Gas-less Approval", function () {
    it("Should migrate xdefi to ctrl with permit", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob] = await hre.ethers.getSigners();

      // Set the timelock to 1 year
      // const lockTime = Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 365); // 1 year
      // const res = await tokenMigration.connect(creator).setTimeLock(lockTime);
      // await res.wait();

      const spender = await tokenMigration.getAddress();

      // Collect the balances before the migration
      const xdefiBalanceBefore = await xdefi.balanceOf(bob.address);
      const ctrlBalanceBefore = await ctrl.balanceOf(bob.address);
      console.log(
        `BOB ${bob.address} Balance Before Migration:\nXDEFI - ${xdefiBalanceBefore}\nCTRL - ${ctrlBalanceBefore}`
      );

      const xdefiBalanceOfMigrationContractBefore = await xdefi.balanceOf(
        spender
      );
      const ctrlBalanceOfMigrationContractBefore = await ctrl.balanceOf(
        spender
      );
      console.log(
        `Migration Contract ${spender} Balance Before Migration:\nXDEFI - ${xdefiBalanceOfMigrationContractBefore}\nCTRL - ${ctrlBalanceOfMigrationContractBefore}`
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
        value: BigInt(1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      console.log(`Signature: ${sig} For Message:`, message);
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

    it("Should not migrate xdefi to ctrl if owner is not the signer", async function () {
      const xdefi = await loadXdefiContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await bob.getAddress();
      const spender = await tokenMigration.getAddress();

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
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await bob.getAddress();
      const spender = await tokenMigration.getAddress();

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfOwner = await xdefi.balanceOf(owner);
      const balanceOfSpender = await ctrl.balanceOf(spender);

      // domain separator for xdefi token
      const domain = {
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner,
        spender,
        value: BigInt(1e18),
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
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if owner [xdefi] balance is insufficient", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await alice.getAddress();
      const spender = await tokenMigration.getAddress();

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfOwner = await xdefi.balanceOf(owner);
      expect(balanceOfOwner).to.equal(0);
      const balanceOfSpender = await ctrl.balanceOf(spender);

      // domain separator for xdefi token
      const domain = {
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
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
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should migrate vXdefi to ctrl with permit", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const vXdefi = await loadXdefiVaultContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();
      const tokenAddress = await vXdefi.getAddress();

      // Collect the balances before the migration
      const vXdefiBalanceBefore = await vXdefi.balanceOf(bob.address);
      const ctrlBalanceBefore = await ctrl.balanceOf(bob.address);
      console.log(
        `BOB ${bob.address} Balance Before Migration:\nvXDEFI - ${vXdefiBalanceBefore}\nCTRL - ${ctrlBalanceBefore}`
      );

      const xdefiBalanceOfMigrationContractBefore = await xdefi.balanceOf(
        spender
      );
      const ctrlBalanceOfMigrationContractBefore = await ctrl.balanceOf(
        spender
      );
      console.log(
        `Migration Contract ${spender} Balance Before Migration:\nXDEFI - ${xdefiBalanceOfMigrationContractBefore}\nCTRL - ${ctrlBalanceOfMigrationContractBefore}`
      );

      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl, spender will get XDEFI and owner will get CTRL
      const migrate = await tokenMigration
        .connect(creator)
        .migrateGaslessFromVXDEFI(
          message.owner,
          message.value,
          message.deadline,
          v,
          r,
          s
        );

      await migrate.wait();

      console.log(
        `Migration successful. ${bob.address} migrated ${message.value} vXdefi to ctrl, here is the transaction hash: ${migrate.hash}`
      );

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        vXdefiBalanceBefore - message.value
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

    it("Should not migrate vXdefi to ctrl if owner is not the signer", async function () {
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

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
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not migrate vXdefi to ctrl if deadline is expired", async function () {
      const ctrl = await loadCtrlContract();
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialCtrlBalanceOfSpender = await ctrl.balanceOf(spender);

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
        value: BigInt(1e18),
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
      ).to.be.revertedWith("ERC20: insufficient allowance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(spender)).to.equal(
        initialCtrlBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if owner [vXdefi] balance is insufficient", async function () {
      const ctrl = await loadCtrlContract();
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(alice.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(0);

      const spender = await tokenMigration.getAddress();
      const initialCtrlBalanceOfSpender = await ctrl.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(alice.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: alice.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await alice.signTypedData(domain, { Permit }, message);
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

      expect(await vXdefi.balanceOf(alice.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(spender)).to.equal(
        initialCtrlBalanceOfSpender
      );
    });
  });

  describe("Migrate With Approval", function () {
    it("Should migrate xdefi to ctrl", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();

      // Collect the balances before the migration
      const xdefiBalanceBefore = await xdefi.balanceOf(bob.address);
      const ctrlBalanceBefore = await ctrl.balanceOf(bob.address);
      console.log(
        `BOB ${bob.address} Balance Before Migration:\nXDEFI - ${xdefiBalanceBefore}\nCTRL - ${ctrlBalanceBefore}`
      );

      const xdefiBalanceOfMigrationContractBefore = await xdefi.balanceOf(
        spender
      );
      const ctrlBalanceOfMigrationContractBefore = await ctrl.balanceOf(
        spender
      );
      console.log(
        `Migration Contract ${spender} Balance Before Migration:\nXDEFI - ${xdefiBalanceOfMigrationContractBefore}\nCTRL - ${ctrlBalanceOfMigrationContractBefore}`
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
        value: BigInt(1e18),
        nonce: Number(nonce),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      console.log(`Signature: ${sig} For Message:`, message);
      // Migrate xdefi to ctrl
      const migration = await tokenMigration
        .connect(bob)
        .migrate(message.value, message.deadline, v, r, s);
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

    it("Should not migrate xdefi to ctrl if owner is not the signer", async function () {
      const xdefi = await loadXdefiContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await bob.getAddress();
      const spender = await tokenMigration.getAddress();

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
        tokenMigration
          .connect(bob)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not migrate xdefi to ctrl if deadline is expired", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await bob.getAddress();
      const spender = await tokenMigration.getAddress();

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfOwner = await xdefi.balanceOf(owner);
      const balanceOfSpender = await ctrl.balanceOf(spender);

      // domain separator for xdefi token
      const domain = {
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;
      // prepare the message for the permit
      const message = {
        owner,
        spender,
        value: BigInt(1e18),
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
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should not migrate xdefi to ctrl if owner [xdefi] balance is insufficient", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const owner = await alice.getAddress();
      const spender = await tokenMigration.getAddress();

      const tokenAddress = await xdefi.getAddress();
      const nonce = await xdefi.nonces(owner);

      const balanceOfOwner = await xdefi.balanceOf(owner);
      expect(balanceOfOwner).to.equal(0);
      const balanceOfSpender = await ctrl.balanceOf(spender);

      // domain separator for xdefi token
      const domain = {
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
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

      // Migrate xdefi to ctrl with insufficient balance
      await expect(
        tokenMigration
          .connect(alice)
          .migrate(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await xdefi.balanceOf(owner)).to.equal(balanceOfOwner);
      expect(await ctrl.balanceOf(spender)).to.equal(balanceOfSpender);
    });

    it("Should migrate vXdefi to ctrl", async function () {
      const xdefi = await loadXdefiContract();
      const ctrl = await loadCtrlContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const vXdefi = await loadXdefiVaultContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();
      const tokenAddress = await vXdefi.getAddress();

      // Collect the balances before the migration
      const vXdefiBalanceBefore = await vXdefi.balanceOf(bob.address);
      const ctrlBalanceBefore = await ctrl.balanceOf(bob.address);
      console.log(
        `BOB ${bob.address} Balance Before Migration:\nvXDEFI - ${vXdefiBalanceBefore}\nCTRL - ${ctrlBalanceBefore}`
      );

      const xdefiBalanceOfMigrationContractBefore = await xdefi.balanceOf(
        spender
      );
      const ctrlBalanceOfMigrationContractBefore = await ctrl.balanceOf(
        spender
      );
      console.log(
        `Migration Contract ${spender} Balance Before Migration:\nXDEFI - ${xdefiBalanceOfMigrationContractBefore}\nCTRL - ${ctrlBalanceOfMigrationContractBefore}`
      );

      const nonce = await vXdefi.nonces(bob.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: bob.address,
        spender,
        value: BigInt(1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await bob.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl, spender will get XDEFI and owner will get CTRL
      const migrate = await tokenMigration
        .connect(bob)
        .migrateFromVXDEFI(message.value, message.deadline, v, r, s);
      await migrate.wait();

      console.log(
        `Migration successful. ${bob.address} migrated ${message.value} vXdefi to ctrl, here is the transaction hash: ${migrate.hash}`
      );

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        vXdefiBalanceBefore - message.value
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

    it("Should not migrate vXdefi to ctrl if owner is not the signer", async function () {
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

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
      const sig = await alice.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(alice)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not migrate vXdefi to ctrl if deadline is expired", async function () {
      const ctrl = await loadCtrlContract();
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const spender = await tokenMigration.getAddress();
      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(bob.address);
      const initialCtrlBalanceOfSpender = await ctrl.balanceOf(spender);

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
        value: BigInt(1e18),
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
      ).to.be.revertedWith("ERC20: insufficient allowance");

      expect(await vXdefi.balanceOf(bob.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(spender)).to.equal(
        initialCtrlBalanceOfSpender
      );
    });

    it("Should not migrate vXdefi to ctrl if owner [vXdefi] balance is insufficient", async function () {
      const ctrl = await loadCtrlContract();
      const vXdefi = await loadXdefiVaultContract();
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const [creator, bob, alice] = await hre.ethers.getSigners();

      const initialVXdefiBalanceOfOwner = await vXdefi.balanceOf(alice.address);
      expect(initialVXdefiBalanceOfOwner).to.equal(0);

      const spender = await tokenMigration.getAddress();
      const initialCtrlBalanceOfSpender = await ctrl.balanceOf(spender);

      const tokenAddress = await vXdefi.getAddress();
      const nonce = await vXdefi.nonces(alice.address);

      // domain separator for xdefi token
      const domain = {
        name: "vXDEFI",
        version: "1",
        chainId: parseInt(await hre.ethers.provider.send("eth_chainId")),
        verifyingContract: tokenAddress as `0x${string}`,
      } as const;

      // prepare the message for the permit
      const message = {
        owner: alice.address,
        spender,
        value: BigInt(10 * 1e18),
        nonce: Number(nonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
      };
      // Sign the message
      const sig = await alice.signTypedData(domain, { Permit }, message);
      const { v, r, s } = hre.ethers.Signature.from(sig);

      // Migrate vXdefi to ctrl
      await expect(
        tokenMigration
          .connect(alice)
          .migrateFromVXDEFI(message.value, message.deadline, v, r, s)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await vXdefi.balanceOf(alice.address)).to.equal(
        initialVXdefiBalanceOfOwner
      );
      expect(await ctrl.balanceOf(spender)).to.equal(
        initialCtrlBalanceOfSpender
      );
    });
  });

  describe("Withdraw [xdefi] ERC20 Tokens", function () {
    it("Should withdraw xdefi tokens", async function () {
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const xdefi = await loadXdefiContract();
      const [creator] = await hre.ethers.getSigners();

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      const withdrawalAmount = BigInt(1e18);
      const balanceOfCreator = await xdefi.balanceOf(owner);
      const balanceOfMigrationContract = await xdefi.balanceOf(
        migrationContract
      );

      // Withdraw xdefi tokens
      const withdraw = await tokenMigration.withdrawOldTokens(withdrawalAmount);
      await withdraw.wait();

      expect(await xdefi.balanceOf(owner)).to.equal(
        balanceOfCreator + withdrawalAmount
      );
      expect(await xdefi.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract - withdrawalAmount
      );
    });

    it("Should not withdraw xdefi tokens if caller is not the owner", async function () {
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const xdefi = await loadXdefiContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      const withdrawalAmount = BigInt(1e18);
      const balanceOfOwner = await xdefi.balanceOf(owner);
      const balanceOfMigrationContract = await xdefi.balanceOf(
        migrationContract
      );

      // Withdraw xdefi tokens
      await expect(
        tokenMigration.connect(bob).withdrawOldTokens(withdrawalAmount)
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
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const ctrl = await loadCtrlContract();
      const [creator] = await hre.ethers.getSigners();

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      const withdrawalAmount = BigInt(1e18);

      const balanceOfCreator = await ctrl.balanceOf(owner);
      const balanceOfMigrationContract = await ctrl.balanceOf(
        migrationContract
      );

      // Withdraw ctrl tokens
      const withdraw = await tokenMigration.withdrawNewTokens(withdrawalAmount);
      await withdraw.wait();

      expect(await ctrl.balanceOf(owner)).to.equal(
        balanceOfCreator + withdrawalAmount
      );
      expect(await ctrl.balanceOf(migrationContract)).to.equal(
        balanceOfMigrationContract - withdrawalAmount
      );
    });

    it("Should not withdraw ctrl tokens if caller is not the owner", async function () {
      const tokenMigration = await loadXdefiToCtrlMigrationContract();
      const ctrl = await loadCtrlContract();
      const [creator, bob] = await hre.ethers.getSigners();

      const owner = await creator.getAddress();
      const migrationContract = await tokenMigration.getAddress();

      const withdrawalAmount = BigInt(1e18);

      const balanceOfOwner = await ctrl.balanceOf(owner);
      const balanceOfMigrationContract = await ctrl.balanceOf(
        migrationContract
      );

      // Withdraw ctrl tokens
      await expect(
        tokenMigration.connect(bob).withdrawNewTokens(withdrawalAmount)
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
