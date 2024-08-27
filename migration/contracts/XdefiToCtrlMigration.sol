// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract XdefiToCtrlMigration is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public oldToken;
    IERC20 public newToken;
    IERC4626 public poolToken;
    uint256 public validUntil;

    event Migrated(address indexed user, uint256 amount);

    /**
        * @dev Throws if the migration is disabled.
        * The migration is disabled after the validUntil timestamp.
    */
    modifier timeLock() {
        require(block.timestamp < validUntil, "Migration is disabled");
        _;
    }

    /**
     * @dev Initializes the contract with the old token, new token, and pool token addresses.
     * @param _oldToken The address of the old token (XDEFI).
     * @param _newToken The address of the new token (CTRL).
     * @param _poolToken The address of the pool token (vXDEFI).
     */
    constructor(IERC20 _oldToken, IERC20 _newToken, IERC4626 _poolToken) Ownable(msg.sender) {
        require(address(_oldToken) != address(0), "Old token address cannot be zero");
        require(address(_newToken) != address(0), "New token address cannot be zero");
        require(address(_poolToken) != address(0), "Pool token address cannot be zero");
        
        oldToken = _oldToken;
        newToken = _newToken;
        poolToken = _poolToken;
    }

    /**
     * @dev Sets the validUntil timestamp for the migration.
     * function can only be called by the owner.
     * @param _validUntil The new validUntil timestamp.
     */
    function setTimeLock(uint256 _validUntil) external onlyOwner {
        validUntil = _validUntil;
    }

    /**
     * @dev Migrates old tokens (XDEFI) to new tokens (CTRL) for the caller.
     * @param amount The amount of old tokens to migrate.
     * @param deadline The permit deadline for the old token.
     * @param v The recovery byte of the old token's signature.
     * @param r The first 32 bytes of the old token's signature.
     * @param s The second 32 bytes of the old token's signature.
     */
    function migrate(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external timeLock {
        // Approve oldToken with EIP-2612
        try IERC20Permit(address(oldToken)).permit(msg.sender, address(this), amount, deadline, v, r, s) {} catch {};

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(msg.sender, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(msg.sender, amount);

        emit Migrated(msg.sender, amount);
    }

    /**
     * @dev Migrates old tokens (XDEFI) to new tokens (CTRL) on behalf of a user in a gasless manner.
     * @param user The address of the user on whose behalf the migration is performed.
     * @param amount The amount of old tokens to migrate.
     * @param deadline The permit deadline for the old token.
     * @param v The recovery byte of the old token's signature.
     * @param r The first 32 bytes of the old token's signature.
     * @param s The second 32 bytes of the old token's signature.
     */
    function migrateWithGaslessApproval(address user, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external timeLock {
        // Approve oldToken with EIP-2612 on behalf of the user
        try IERC20Permit(address(oldToken)).permit(user, address(this), amount, deadline, v, r, s) {} catch {};

        // Transfer old tokens from the user to this contract
        oldToken.safeTransferFrom(user, address(this), amount);

        // Transfer new tokens to the user
        newToken.safeTransfer(user, amount);

        emit Migrated(user, amount);
    }

    /**
     * @dev Migrates pool tokens (vXDEFI) to new tokens (CTRL) for the caller.
     * @param shares The amount of pool tokens to migrate.
     * @param deadline The permit deadline for the pool token.
     * @param v The recovery byte of the pool token's signature.
     * @param r The first 32 bytes of the pool token's signature.
     * @param s The second 32 bytes of the pool token's signature.
     */
    function migrateFromVXDEFI(uint256 shares, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external timeLock {
        // Approve vXDEFI with EIP-2612
        try IERC20Permit(address(poolToken)).permit(msg.sender, address(this), shares, deadline, v, r, s) {} catch {};

        // Transfer vXDEFI tokens from the user to this contract
        poolToken.transferFrom(msg.sender, address(this), shares);

        // Redeem vXDEFI for XDEFI
        uint256 xdefiAmount = poolToken.redeem(shares, address(this), address(this));

        // Transfer new tokens to the user
        newToken.safeTransfer(msg.sender, xdefiAmount);

        emit Migrated(msg.sender, xdefiAmount);
    }

    /**
     * @dev Migrates pool tokens (vXDEFI) to new tokens (CTRL) on behalf of a user in a gasless manner.
     * @param user The address of the user on whose behalf the migration is performed.
     * @param shares The amount of pool tokens to migrate.
     * @param deadline The permit deadline for the pool token.
     * @param v The recovery byte of the pool token's signature.
     * @param r The first 32 bytes of the pool token's signature.
     * @param s The second 32 bytes of the pool token's signature.
     */
    function migrateGaslessFromVXDEFI(address user, uint256 shares, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external timeLock {
        // Approve vXDEFI with EIP-2612 on behalf of the user
        try IERC20Permit(address(poolToken)).permit(user, address(this), shares, deadline, v, r, s) {} catch {};

        // Transfer vXDEFI tokens from the user to this contract
        poolToken.transferFrom(user, address(this), shares);

        // Redeem vXDEFI for XDEFI
        uint256 xdefiAmount = poolToken.redeem(shares, address(this), address(this));

        // Transfer new tokens to the user
        newToken.safeTransfer(user, xdefiAmount);

        emit Migrated(user, xdefiAmount);
    }

    /**
     * @dev Withdraws old tokens (XDEFI) from the contract.
     * @param amount The amount of old tokens to withdraw.
     */
    function withdrawOldTokens(uint256 amount) external onlyOwner {
        oldToken.safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Withdraws new tokens (CTRL) from the contract.
     * @param amount The amount of new tokens to withdraw.
     */
    function withdrawNewTokens(uint256 amount) external onlyOwner {
        newToken.safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Withdraws pool tokens (vXDEFI) from the contract.
     * @param amount The amount of pool tokens to withdraw.
     */
    function withdrawPoolTokens(uint256 amount) external onlyOwner {
        poolToken.transfer(msg.sender, amount);
    }
}
