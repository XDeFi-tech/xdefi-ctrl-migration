import hre from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";


const types = {
    Permit: [
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
    ],
};


describe("XdefiToCtrlMigration", function () {
    async function deployXdefiToCtrlMigrationFixture() {
        // Contracts are deployed using the first signer/account by default
        const [creator, addressOne, addressTwo] = await hre.ethers.getSigners();

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

            // Sign the message
            const domain = {
                chainId: 31337,
                verifyingContract: await xdefi.getAddress() as `0x${string}`,
            }

            console.log(`Domain: ${JSON.stringify(domain)}`);

            const message = {
                owner: await addressOne.getAddress(),
                spender: await creator.getAddress(),
                value: BigInt(10 * 1e18),
                nonce: await creator.getNonce(),
                deadline: Math.floor(Date.now() / 1000) + 60 * 10,
            }

            console.log(`Message: ${JSON.stringify(message, (key, value) => typeof value === 'bigint' ? value.toString() : value)}`);


            const sig = await addressOne.signTypedData(domain, types, message);

            console.log(`Signature: ${sig}`);

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