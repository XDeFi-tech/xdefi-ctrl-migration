// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XdefiToCtrlMigration is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public oldToken;
    IERC20 public newToken;

    constructor(IERC20 _oldToken, IERC20 _newToken) Ownable(msg.sender) {
        oldToken = _oldToken;
        newToken = _newToken;
    }

    function migrate(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve oldToken with EIP-2612
        IERC20Permit(address(oldToken)).permit(msg.sender, address(this), amount, deadline, v, r, s);

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(msg.sender, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(msg.sender, amount);
    }

    function migrateWithGaslessApproval(address user, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve oldToken with EIP-2612 on behalf of the user
        IERC20Permit(address(oldToken)).permit(user, address(this), amount, deadline, v, r, s);

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(user, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(user, amount);
    }

    function withdrawOldTokens(uint256 amount) external onlyOwner {
        oldToken.safeTransfer(msg.sender, amount);
    }

    function withdrawNewTokens(uint256 amount) external onlyOwner {
        newToken.safeTransfer(msg.sender, amount);
    }
}