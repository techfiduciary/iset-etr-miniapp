// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ETRAnchor
/// @notice On-chain notarisation of ISET electronic transferable records (eTR).
///         Stores ONLY a commitment (record hash + audit id) — never the record
///         contents and never the ML-DSA-65 legal signature. The ISET registry
///         remains the authoritative point of control (MLETR §10); this contract
///         is a timestamped, tamper-evident mirror for cross-border verifiability.
contract ETRAnchor {
    struct Anchor {
        bytes32 recordHash;   // sha-256 of the canonical record (commitment only)
        string auditId;       // ISET audit ledger id
        address anchoredBy;
        uint64 anchoredAt;
    }

    mapping(bytes32 => Anchor) private _anchors; // key = keccak256(etrId)

    event RecordAnchored(
        bytes32 indexed idHash,
        string etrId,
        bytes32 recordHash,
        string auditId,
        address indexed anchoredBy,
        uint64 anchoredAt
    );

    error ConflictingAnchor(bytes32 idHash);

    /// @notice Anchor an eTR commitment. Idempotent for an identical hash;
    ///         a conflicting re-anchor (different hash for the same id) reverts.
    function anchor(string calldata etrId, bytes32 recordHash, string calldata auditId) external {
        bytes32 k = keccak256(bytes(etrId));
        Anchor storage a = _anchors[k];
        if (a.anchoredAt != 0) {
            if (a.recordHash != recordHash) revert ConflictingAnchor(k);
            return; // already anchored with the same hash — no-op
        }
        _anchors[k] = Anchor(recordHash, auditId, msg.sender, uint64(block.timestamp));
        emit RecordAnchored(k, etrId, recordHash, auditId, msg.sender, uint64(block.timestamp));
    }

    function getAnchor(string calldata etrId)
        external
        view
        returns (bytes32 recordHash, string memory auditId, address anchoredBy, uint64 anchoredAt)
    {
        Anchor storage a = _anchors[keccak256(bytes(etrId))];
        return (a.recordHash, a.auditId, a.anchoredBy, a.anchoredAt);
    }
}
