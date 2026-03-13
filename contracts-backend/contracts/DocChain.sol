pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DocChain is AccessControl {

    bytes32 public constant INSTITUTE_ROLE = keccak256("INSTITUTE_ROLE");
    bytes32 public constant STUDENT_ROLE   = keccak256("STUDENT_ROLE");

    enum CertStatus { NotExists, Active, Revoked }

    struct Document {
        string     hash;
        string     ipfsCID;
        string     docType;
        address    issuedBy;
        uint256    issuedAt;
        uint256    revokedAt;
        CertStatus status;
        uint256    verifyCount;
    }

    address public admin;
    mapping(address => bool)     public issuers;
    mapping(string  => Document) private documents;

    mapping(address => string[]) public studentDocuments;
    mapping(address => string)   public instituteName;

    event IssuerGranted(address indexed issuer, address indexed grantedBy);
    event IssuerRevoked(address indexed issuer, address indexed revokedBy);
    event DocumentStored(string indexed hashKey, address indexed issuedBy, string ipfsCID, string docType, uint256 issuedAt);
    event DocumentRevoked(string indexed hashKey, address indexed revokedBy, uint256 revokedAt);
    event DocumentVerified(string indexed hashKey, address indexed verifiedBy, uint8 status, uint256 verifiedAt);

    modifier onlyAdmin() {
        require(msg.sender == admin, "DocChain: caller is not admin");
        _;
    }

    modifier onlyIssuer() {
        require(issuers[msg.sender], "DocChain: caller is not an authorised issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
        issuers[msg.sender] = true;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INSTITUTE_ROLE, msg.sender);

        emit IssuerGranted(msg.sender, msg.sender);
    }

    function grantIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "DocChain: zero address");
        require(!issuers[_issuer], "DocChain: already an issuer");
        issuers[_issuer] = true;
        emit IssuerGranted(_issuer, msg.sender);
    }

    function revokeIssuer(address _issuer) external onlyAdmin {
        require(issuers[_issuer], "DocChain: not an issuer");
        require(_issuer != admin, "DocChain: cannot remove admin issuer");
        issuers[_issuer] = false;
        emit IssuerRevoked(_issuer, msg.sender);
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "DocChain: zero address");
        admin = _newAdmin;
    }

    function storeDocument(string memory _hash, string memory _ipfsCID, string memory _docType) external onlyIssuer {
        require(bytes(_hash).length > 0, "DocChain: empty hash");
        require(bytes(_ipfsCID).length > 0, "DocChain: empty CID");
        require(bytes(_docType).length > 0, "DocChain: empty docType");
        require(documents[_hash].status == CertStatus.NotExists, "DocChain: document already exists");

        documents[_hash] = Document({
            hash:       _hash,
            ipfsCID:    _ipfsCID,
            docType:    _docType,
            issuedBy:   msg.sender,
            issuedAt:   block.timestamp,
            revokedAt:  0,
            status:     CertStatus.Active,
            verifyCount: 0
        });

        emit DocumentStored(_hash, msg.sender, _ipfsCID, _docType, block.timestamp);
    }

    function revokeDocument(string memory _hash) external {
        Document storage doc = documents[_hash];
        require(doc.status == CertStatus.Active, "DocChain: document not active");
        require(msg.sender == doc.issuedBy || msg.sender == admin, "DocChain: not authorised to revoke");
        doc.status    = CertStatus.Revoked;
        doc.revokedAt = block.timestamp;
        emit DocumentRevoked(_hash, msg.sender, block.timestamp);
    }

    function verifyDocument(string memory _hash) external returns (CertStatus status, address issuedBy, uint256 issuedAt, uint256 revokedAt, string memory ipfsCID, string memory docType, uint256 verifyCount) {
        Document storage doc = documents[_hash];
        if (doc.status != CertStatus.NotExists) {
            doc.verifyCount += 1;
            emit DocumentVerified(_hash, msg.sender, uint8(doc.status), block.timestamp);
        }
        return (doc.status, doc.issuedBy, doc.issuedAt, doc.revokedAt, doc.ipfsCID, doc.docType, doc.verifyCount);
    }

    function verifyDocumentView(string memory _hash) external view returns (CertStatus status, address issuedBy, uint256 issuedAt, uint256 revokedAt, string memory ipfsCID, string memory docType, uint256 verifyCount) {
        Document memory doc = documents[_hash];
        return (doc.status, doc.issuedBy, doc.issuedAt, doc.revokedAt, doc.ipfsCID, doc.docType, doc.verifyCount);
    }

    function getCertStatus(string memory _hash) external view returns (CertStatus) {
        return documents[_hash].status;
    }

    function getVerifyCount(string memory _hash) external view returns (uint256) {
        return documents[_hash].verifyCount;
    }

    function registerInstitute(address _institute, string calldata _name) external onlyAdmin {
        require(_institute != address(0), "DocChain: zero address");
        require(bytes(_name).length > 0, "DocChain: empty name");
        issuers[_institute] = true;
        _grantRole(INSTITUTE_ROLE, _institute);
        instituteName[_institute] = _name;
        emit IssuerGranted(_institute, msg.sender);
    }

    function assignStudentRole(address _student) external onlyAdmin {
        require(_student != address(0), "DocChain: zero address");
        _grantRole(STUDENT_ROLE, _student);
    }

    function issueToStudent(
        string  memory _hash,
        string  memory _ipfsCID,
        string  memory _docType,
        address        _student
    ) external onlyRole(INSTITUTE_ROLE) {
        require(bytes(_hash).length > 0,    "DocChain: empty hash");
        require(bytes(_ipfsCID).length > 0, "DocChain: empty CID");
        require(bytes(_docType).length > 0, "DocChain: empty docType");
        require(documents[_hash].status == CertStatus.NotExists, "DocChain: document already exists");
        require(_student != address(0), "DocChain: zero student address");

        documents[_hash] = Document({
            hash:        _hash,
            ipfsCID:     _ipfsCID,
            docType:     _docType,
            issuedBy:    msg.sender,
            issuedAt:    block.timestamp,
            revokedAt:   0,
            status:      CertStatus.Active,
            verifyCount: 0
        });

        studentDocuments[_student].push(_hash);

        emit DocumentStored(_hash, msg.sender, _ipfsCID, _docType, block.timestamp);
    }

    function getStudentDocuments(address _student) external view returns (string[] memory) {
        return studentDocuments[_student];
    }

    function getUserRole(address _user) external view returns (string memory) {
        if (_user == admin)                         return "admin";
        if (hasRole(INSTITUTE_ROLE, _user))         return "institute";
        if (hasRole(STUDENT_ROLE, _user))           return "student";
        return "none";
    }
}