// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract XdefiToCtrlMigration is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public oldToken;
    IERC20 public newToken;
    IERC4626 public poolToken;

    event Migrated(address indexed user, uint256 amount);

    constructor(IERC20 _oldToken, IERC20 _newToken, IERC4626 _poolToken) Ownable() {
        require(address(_oldToken) != address(0), "Old token address cannot be zero");
        require(address(_newToken) != address(0), "New token address cannot be zero");
        require(address(_poolToken) != address(0), "Pool token address cannot be zero");
        
        oldToken = _oldToken;
        newToken = _newToken;
        poolToken = _poolToken;
    }

    function migrate(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve oldToken with EIP-2612
        IERC20Permit(address(oldToken)).permit(msg.sender, address(this), amount, deadline, v, r, s);

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(msg.sender, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(msg.sender, amount);

        emit Migrated(msg.sender, amount);
    }

    function migrateWithGaslessApproval(address user, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve oldToken with EIP-2612 on behalf of the user
        IERC20Permit(address(oldToken)).permit(user, address(this), amount, deadline, v, r, s);

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(user, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(user, amount);

        emit Migrated(user, amount);
    }

    function migrateFromVXDEFI(uint256 shares, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve vXDEFI with EIP-2612
        IERC20Permit(address(poolToken)).permit(msg.sender, address(this), shares, deadline, v, r, s);

        // Transfer vXDEFI tokens from the user to this contract
        poolToken.transferFrom(msg.sender, address(this), shares);

        // Redeem vXDEFI for XDEFI
        uint256 xdefiAmount = poolToken.redeem(shares, address(this), address(this));

        // Transfer new tokens to the user
        newToken.safeTransfer(msg.sender, xdefiAmount);

        emit Migrated(msg.sender, xdefiAmount);
    }

    function migrateGaslessFromVXDEFI(address user, uint256 shares, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        // Approve vXDEFI with EIP-2612 on behalf of the user
        IERC20Permit(address(poolToken)).permit(user, address(this), shares, deadline, v, r, s);

        // Transfer vXDEFI tokens from the user to this contract
        poolToken.transferFrom(user, address(this), shares);

        // Redeem vXDEFI for XDEFI
        uint256 xdefiAmount = poolToken.redeem(shares, address(this), address(this));

        // Transfer new tokens to the user
        newToken.safeTransfer(user, xdefiAmount);

        emit Migrated(user, xdefiAmount);
    }

    function withdrawOldTokens(uint256 amount) external onlyOwner {
        oldToken.safeTransfer(msg.sender, amount);
    }

    function withdrawNewTokens(uint256 amount) external onlyOwner {
        newToken.safeTransfer(msg.sender, amount);
    }

    function withdrawPoolTokens(uint256 amount) external onlyOwner {
        poolToken.transfer(msg.sender, amount);
    }
}
