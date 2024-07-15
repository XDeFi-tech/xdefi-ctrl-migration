import hre from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import * as path from "node:path";
import {AbiCoder, ethers, getBytes, keccak256, recoverAddress, solidityPacked, toUtf8Bytes} from "ethers";


const EIP712Domain = [
        {
            "name": "name",
            "type": "string"
        },
        {
            "name": "version",
            "type": "string"
        },
        {
            "name": "chainId",
            "type": "uint256"
        },
        {
            "name": "verifyingContract",
            "type": "address"
        }
    ];
const Permit = [
        {
            name: "owner",
            type: "address",
        },
        {
            name: "spender",
            type: "address",
        },
        {
            name: "value",
            type: "uint256",
        },
        {
            name: "nonce",
            type: "uint256",
        },
        {
            name: "deadline",
            type: "uint256",
        },
    ];

// const PERMIT_SIGNATURE_HASH =
//   "0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9";
const PERMIT_SIGNATURE_HASH = keccak256(
  toUtf8Bytes(
    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)",
  ),
);
// Approval digest generation function, it uses the keccak256 hash function
export async function getApprovalDigest(
  DOMAIN_SEPARATOR: string,
  approve: {
    owner: string;
    spender: string;
    value: bigint;
  },
  deadline: bigint,
  nonce: bigint,
): Promise<string> {
  return keccak256(
    solidityPacked(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      [
        "0x19",
        "0x01",
        DOMAIN_SEPARATOR,
        keccak256(
          AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [
              PERMIT_SIGNATURE_HASH,
              approve.owner,
              approve.spender,
              approve.value,
              nonce,
              deadline,
            ],
          ),
        ),
      ],
    ),
  );
}


async function verifyPermit({ data, sig }, DOMAIN_SEPARATOR) {

  const digest = await getApprovalDigest(
    DOMAIN_SEPARATOR,
    { owner: data.owner, spender: data.spender, value: data.value },
    data.deadline,
    BigInt(data.nonce),
  );

  const recoveredAddress = recoverAddress(getBytes(digest), sig);
    console.log({ recoveredAddress, owner: data.owner });
    return recoveredAddress === data.owner;
}



describe("XdefiToCtrlMigration", function () {
    async function deployXdefiToCtrlMigrationFixture() {
        // Contracts are deployed using the first signer/account by default
        const [creator, addressOne, addressTwo] = await hre.ethers.getSigners();

        console.log(`Creator: ${await creator.getAddress()}\nAddressOne: ${await addressOne.getAddress()}\nAddressTwo: ${await addressTwo.getAddress()}`);

        const XdefiTestERC20 = await hre.ethers.getContractFactory("XdefiTestERC20", creator);
        const xdefi = await XdefiTestERC20.deploy(
            "Xdefi",
            "XDEFI",
        );


        const CtrlTestERC20 =  await hre.ethers.getContractFactory("CtrlTestERC20", creator);
        const ctrl = await CtrlTestERC20.deploy(
            "Ctrl",
            "CTRL",
        );



        const XdefiToCtrlMigration = await hre.ethers.getContractFactory("XdefiToCtrlMigration");

        const tokenMigration = await XdefiToCtrlMigration.deploy(
            xdefi,
            ctrl
        );

        console.log(`Xdefi: ${await xdefi.getAddress()}\nCtrl: ${await ctrl.getAddress()}\nTokenMigration: ${await tokenMigration.getAddress()}`);

        return { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo };
    }

    describe("Migrate", function () {
        it("Should migrate xdefi to ctrl", async function () {

            const { tokenMigration, xdefi, ctrl, creator, addressOne, addressTwo } = await loadFixture(deployXdefiToCtrlMigrationFixture);

            // Move 10 xdefi to addressOne
            const amount = BigInt(10 * 1e18);
            const resTransfer = await xdefi.transfer(await addressOne.getAddress(), amount);
            console.log(`Transfer xdefi to addressOne: ${await addressOne.getAddress()} amount: ${amount} txHash: ${resTransfer.hash}`);


            const balanceOfCreator = await xdefi.balanceOf(await creator.getAddress());
            const balanceOfAddressOne = await xdefi.balanceOf(await addressOne.getAddress());

            const owner = await addressOne.getAddress();
            const spender = await creator.getAddress();
            const tokenAddress = await xdefi.getAddress();
            const name = await xdefi.name();
            const nonce = await xdefi.nonces(owner);


            // Sign the message
            const domain = {
                name: name,
                version: "1",
                chainId: 31337, // parseInt(await hre.ethers.provider.send("eth_chainId")),
                verifyingContract: tokenAddress as `0x${string}`,
            } as const;

            console.log({domain});

            const message = {
                owner,
                spender,
                value: 500,
                nonce: Number(nonce) + 1,
                deadline: Math.floor(Date.now() / 1000) + 60 * 10,
            }

            console.log({message});


            // const sig = await hre.ethers.provider.send("eth_signTypedData_v4", [
            //     owner,
            //     JSON.stringify({
            //         types,
            //         primaryType: "Permit",
            //         domain,
            //         message,
            //     }),
            // ]);
            const sig = await addressOne.signTypedData(domain, { Permit }, message);

            console.log(`Signature: ${sig}`);


            if (await verifyPermit({
                data: message,
                sig,
            }, await xdefi.DOMAIN_SEPARATOR())) {
                console.log("Signature is valid");
            }

            const { v, r, s } = hre.ethers.Signature.from(sig);

            console.log(`v: ${v}, r: ${r}, s: ${s}`);

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


            expect(await xdefi.balanceOf(await addressOne.getAddress())).to.equal(balanceOfAddressOne - BigInt(10 * 1e18));
            expect(await ctrl.balanceOf(await addressOne.getAddress())).to.equal(BigInt(10 * 1e18));
            expect(await xdefi.balanceOf(await creator.getAddress())).to.equal(balanceOfCreator + BigInt(10 * 1e18));
        });
    });


});