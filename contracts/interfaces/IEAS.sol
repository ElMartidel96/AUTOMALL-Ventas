// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEAS Interface
 * @notice Interface for Ethereum Attestation Service
 * @dev Minimal interface for attestation verification
 */
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }
    
    /**
     * @dev Returns an attestation by its unique identifier
     * @param uid The unique identifier of the attestation
     * @return The attestation data
     */
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
    
    /**
     * @dev Check if an attestation is valid and not revoked
     * @param uid The unique identifier of the attestation
     * @return True if the attestation is valid
     */
    function isAttestationValid(bytes32 uid) external view returns (bool);
    
    /**
     * @dev Attest to a schema
     * @param request The attestation request
     * @return The unique identifier of the new attestation
     */
    function attest(AttestationRequest calldata request) external payable returns (bytes32);
    
    /**
     * @dev Revoke an attestation
     * @param request The revocation request
     */
    function revoke(RevocationRequest calldata request) external payable;
}

struct AttestationRequest {
    bytes32 schema;
    AttestationRequestData data;
}

struct AttestationRequestData {
    address recipient;
    uint64 expirationTime;
    bool revocable;
    bytes32 refUID;
    bytes data;
    uint256 value;
}

struct RevocationRequest {
    bytes32 schema;
    RevocationRequestData data;
}

struct RevocationRequestData {
    bytes32 uid;
    uint256 value;
}