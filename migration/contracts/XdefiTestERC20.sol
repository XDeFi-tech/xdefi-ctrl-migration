// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

//This function instantiates the contract and
//classifies ERC20 for storage schema
contract XdefiTestERC20 is ERC20, ERC20Permit {

    //Feel free to change the initial supply of 50 token
    //Keep the (10**18) unchanged as it multiplies the number we want as our supply to have 18 decimal
    uint constant _initial_supply = 500 * (10**18);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(msg.sender, _initial_supply);
    }
}