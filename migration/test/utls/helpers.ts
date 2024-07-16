import {keccak256, toUtf8Bytes} from "ethers";


// const PERMIT_SIGNATURE_HASH = "0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9";
export const PERMIT_SIGNATURE_HASH = keccak256(
    toUtf8Bytes(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)",
    ),
);

export const EIP712Domain = [
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

export const Permit = [
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