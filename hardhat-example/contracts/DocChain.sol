// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocChain {

    struct Document {
        address owner;
        string ipfsHash;
        uint256 timestamp;
    }

    mapping(bytes32 => Document) public documents;

    event DocumentAdded(bytes32 docHash, address owner, string ipfsHash);

    function addDocument(bytes32 docHash, string memory ipfsHash) public {
        require(documents[docHash].timestamp == 0, "Already exists");

        documents[docHash] = Document(
            msg.sender,
            ipfsHash,
            block.timestamp
        );

        emit DocumentAdded(docHash, msg.sender, ipfsHash);
    }

    function verifyDocument(bytes32 docHash)
        public
        view
        returns (address, string memory, uint256)
    {
        Document memory d = documents[docHash];
        require(d.timestamp != 0, "Not found");
        return (d.owner, d.ipfsHash, d.timestamp);
    }
}
