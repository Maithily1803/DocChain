// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DocChain {

    struct Document {
        string hash;
        string ipfsCID;
        string docType;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Document) public documents;

    event DocumentStored(string hash, address owner, string ipfsCID, string docType);

    function storeDocument(
        string memory _hash,
        string memory _ipfsCID,
        string memory _docType
    ) public {
        require(documents[_hash].timestamp == 0, "Document already exists on blockchain");

        documents[_hash] = Document(
            _hash,
            _ipfsCID,
            _docType,
            msg.sender,
            block.timestamp
        );

        emit DocumentStored(_hash, msg.sender, _ipfsCID, _docType);
    }

    function verifyDocument(string memory _hash)
        public
        view
        returns (bool, address, uint256, string memory, string memory)
    {
        Document memory doc = documents[_hash];

        if (doc.timestamp == 0) {
            return (false, address(0), 0, "", "");
        }

        return (true, doc.owner, doc.timestamp, doc.ipfsCID, doc.docType);
    }
}
