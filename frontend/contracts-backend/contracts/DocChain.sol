// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DocChain {

    struct Document {
        string hash;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Document) public documents;

    event DocumentStored(string hash, address owner);

    function storeDocument(string memory _hash) public {
        require(documents[_hash].timestamp == 0, "Already exists");

        documents[_hash] = Document(
            _hash,
            msg.sender,
            block.timestamp
        );

        emit DocumentStored(_hash, msg.sender);
    }

    function verifyDocument(string memory _hash)
        public
        view
        returns (bool, address, uint256)
    {
        Document memory doc = documents[_hash];

        if (doc.timestamp == 0) {
            return (false, address(0), 0);
        }

        return (true, doc.owner, doc.timestamp);
    }
}
