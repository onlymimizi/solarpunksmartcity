// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SolarpunkPublicData
 * @notice Minimal public data registry for civic transparency.
 * Key is a string, stored under keccak256(key) to save gas on mapping.
 */
contract SolarpunkPublicData {
    event RecordUpdated(bytes32 keyHash, string key, string value);

    mapping(bytes32 => string) private records;

    function setRecord(string calldata key, string calldata value) external {
        bytes32 h = keccak256(bytes(key));
        records[h] = value;
        emit RecordUpdated(h, key, value);
    }

    function getRecord(string calldata key) external view returns (string memory) {
        bytes32 h = keccak256(bytes(key));
        return records[h];
    }

    function getRecordByHash(bytes32 keyHash) external view returns (string memory) {
        return records[keyHash];
    }
}