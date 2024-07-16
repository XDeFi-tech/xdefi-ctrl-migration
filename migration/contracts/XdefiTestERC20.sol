// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./xdefi/FixedToken.sol";

// This is a XDEFI test token contract based on the FixedToken contract from xdefi project, used for testing the XDEFI token to CTRL
// FixedToken was taken from the etherscan of the xdefi project https://etherscan.io/address/0x72b886d09c117654ab7da13a14d603001de0b777#code
contract XdefiTestERC20 is FixedToken {

    //Feel free to change the initial supply of 50 token
    //Keep the (10**18) unchanged as it multiplies the number we want as our supply to have 18 decimal
    uint constant _initial_supply = 500 * (10**18);

    constructor(string memory name_, string memory symbol_, address owner_) {
        _initERC20(name_, symbol_);
        _mint(owner_, _initial_supply);
    }
}