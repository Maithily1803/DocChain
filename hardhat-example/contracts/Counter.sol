// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DocumentVerification
 * @dev Decentralized document attestation and verification system
 * @notice This contract allows issuers to attest documents and anyone to verify them
 */
contract DocumentVerification {
    
    // ============ State Variables ============
    
    /// @dev Role constants
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    /// @dev Owner address
    address public owner;
    
    /// @dev Struct to store document attestation details
    struct DocumentAttestation {
        bytes32 documentHash;      // SHA-256 hash of the document
        address issuer;            // Address of the issuer
        uint256 timestamp;         // Block timestamp of attestation
        string metadata;           // Optional metadata (IPFS CID, document type, etc.)
        bool isRevoked;           // Revocation status
        uint256 expiryDate;       // Expiry timestamp (0 = no expiry)
    }
    
    /// @dev Mapping from document hash to attestation
    mapping(bytes32 => DocumentAttestation) public attestations;
    
    /// @dev Mapping to track issued documents by issuer
    mapping(address => bytes32[]) public issuerDocuments;
    
    /// @dev Role management
    mapping(address => mapping(bytes32 => bool)) public roles;
    
    /// @dev Counter for total attestations
    uint256 public totalAttestations;
    
    // ============ Events ============
    
    event DocumentAttested(
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 timestamp,
        string metadata
    );
    
    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed revoker,
        uint256 timestamp
    );
    
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyIssuer() {
        require(
            roles[msg.sender][ISSUER_ROLE] || msg.sender == owner,
            "Only issuer can call this"
        );
        _;
    }
    
    modifier onlyVerifier() {
        require(
            roles[msg.sender][VERIFIER_ROLE] || msg.sender == owner,
            "Only verifier can call this"
        );
        _;
    }
    
    modifier documentExists(bytes32 _documentHash) {
        require(
            attestations[_documentHash].timestamp != 0,
            "Document not attested"
        );
        _;
    }
    
    modifier documentNotRevoked(bytes32 _documentHash) {
        require(
            !attestations[_documentHash].isRevoked,
            "Document is revoked"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        // Grant owner all roles by default
        roles[msg.sender][ISSUER_ROLE] = true;
        roles[msg.sender][VERIFIER_ROLE] = true;
        
        emit RoleGranted(ISSUER_ROLE, msg.sender, msg.sender);
        emit RoleGranted(VERIFIER_ROLE, msg.sender, msg.sender);
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Attest a document by storing its hash on-chain
     * @param _documentHash SHA-256 hash of the document
     * @param _metadata Optional metadata (IPFS CID, description, etc.)
     * @param _expiryDate Expiry timestamp (0 for no expiry)
     */
    function attestDocument(
        bytes32 _documentHash,
        string calldata _metadata,
        uint256 _expiryDate
    ) external onlyIssuer {
        require(_documentHash != bytes32(0), "Invalid document hash");
        require(
            attestations[_documentHash].timestamp == 0,
            "Document already attested"
        );
        
        if (_expiryDate > 0) {
            require(_expiryDate > block.timestamp, "Expiry must be in future");
        }
        
        attestations[_documentHash] = DocumentAttestation({
            documentHash: _documentHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            metadata: _metadata,
            isRevoked: false,
            expiryDate: _expiryDate
        });
        
        issuerDocuments[msg.sender].push(_documentHash);
        totalAttestations++;
        
        emit DocumentAttested(_documentHash, msg.sender, block.timestamp, _metadata);
    }
    
    /**
     * @dev Verify if a document is attested and valid
     * @param _documentHash Hash to verify
     * @return isValid Whether document is attested and not revoked
     * @return issuer Address of the issuer
     * @return timestamp Attestation timestamp
     * @return metadata Document metadata
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (
            bool isValid,
            address issuer,
            uint256 timestamp,
            string memory metadata
        )

    // Batch operations for efficiency
    function attestMultipleDocuments(
      bytes32[] calldata _documentHashes,
      string[] calldata _metadata,
      uint256[] calldata _expiryDates
    ) external onlyIssuer

// Document sharing/delegation
    function shareDocument(
      bytes32 _documentHash,
      address _recipient
    ) external

// Document categories/types
    enum DocumentType { 
      CERTIFICATE, 
      LICENSE, 
      TRANSCRIPT, 
      ID_DOCUMENT, 
      OTHER 
    }

    {
        DocumentAttestation memory doc = attestations[_documentHash];
        
        if (doc.timestamp == 0) {
            return (false, address(0), 0, "");
        }
        
        // Check if expired
        bool isExpired = doc.expiryDate > 0 && block.timestamp > doc.expiryDate;
        
        isValid = !doc.isRevoked && !isExpired;
        issuer = doc.issuer;
        timestamp = doc.timestamp;
        metadata = doc.metadata;
    }
    
    /**
     * @dev Revoke a document attestation
     * @param _documentHash Hash of document to revoke
     */
    function revokeDocument(bytes32 _documentHash)
        external
        documentExists(_documentHash)
        documentNotRevoked(_documentHash)
    {
        DocumentAttestation storage doc = attestations[_documentHash];
        require(
            doc.issuer == msg.sender || msg.sender == owner,
            "Only issuer or owner can revoke"
        );
        
        doc.isRevoked = true;
        
        emit DocumentRevoked(_documentHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get detailed information about an attestation
     * @param _documentHash Document hash to query
     */
    function getAttestation(bytes32 _documentHash)
        external
        view
        returns (DocumentAttestation memory)
    {
        return attestations[_documentHash];
    }
    
    /**
     * @dev Get all documents attested by an issuer
     * @param _issuer Issuer address
     */
    function getIssuerDocuments(address _issuer)
        external
        view
        returns (bytes32[] memory)
    {
        return issuerDocuments[_issuer];
    }
    
    // ============ Role Management ============
    
    /**
     * @dev Grant a role to an account
     * @param _role Role identifier
     * @param _account Address to grant role to
     */
    function grantRole(bytes32 _role, address _account) external onlyOwner {
        require(!roles[_account][_role], "Role already granted");
        roles[_account][_role] = true;
        emit RoleGranted(_role, _account, msg.sender);
    }
    
    /**
     * @dev Revoke a role from an account
     * @param _role Role identifier
     * @param _account Address to revoke role from
     */
    function revokeRole(bytes32 _role, address _account) external onlyOwner {
        require(roles[_account][_role], "Role not granted");
        roles[_account][_role] = false;
        emit RoleRevoked(_role, _account, msg.sender);
    }
    
    /**
     * @dev Check if account has a specific role
     * @param _account Address to check
     * @param _role Role identifier
     */
    function hasRole(address _account, bytes32 _role)
        external
        view
        returns (bool)
    {
        return roles[_account][_role];
    }
    
    // ============ Ownership ============
    
    /**
     * @dev Transfer ownership to a new address
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = _newOwner;
        
        // Transfer roles
        roles[_newOwner][ISSUER_ROLE] = true;
        roles[_newOwner][VERIFIER_ROLE] = true;
        
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
}