// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AgentLedger {
    struct Decision {
        address actor;
        string agentId;
        bytes32 storageRoot;
        string storageTxHash;
        string vendor;
        uint256 amountCents;
        bool approved;
        string memo;
        uint256 createdAt;
    }

    mapping(address => string) public agentIds;
    Decision[] private decisions;

    event AgentRegistered(
        address indexed owner,
        string agentId,
        bytes32 profileRoot,
        string profileTxHash,
        uint256 createdAt
    );

    event DecisionRecorded(
        uint256 indexed id,
        address indexed actor,
        string agentId,
        bytes32 storageRoot,
        string storageTxHash,
        string vendor,
        uint256 amountCents,
        bool approved,
        string memo,
        uint256 createdAt
    );

    function registerAgent(
        string calldata agentId,
        bytes32 profileRoot,
        string calldata profileTxHash
    ) external {
        require(bytes(agentId).length > 0, "agent id required");
        agentIds[msg.sender] = agentId;

        emit AgentRegistered(
            msg.sender,
            agentId,
            profileRoot,
            profileTxHash,
            block.timestamp
        );
    }

    function recordDecision(
        string calldata agentId,
        bytes32 storageRoot,
        string calldata storageTxHash,
        string calldata vendor,
        uint256 amountCents,
        bool approved,
        string calldata memo
    ) external returns (uint256 id) {
        require(bytes(agentId).length > 0, "agent id required");
        require(storageRoot != bytes32(0), "storage root required");
        require(bytes(storageTxHash).length > 0, "storage tx required");

        id = decisions.length;
        decisions.push(
            Decision({
                actor: msg.sender,
                agentId: agentId,
                storageRoot: storageRoot,
                storageTxHash: storageTxHash,
                vendor: vendor,
                amountCents: amountCents,
                approved: approved,
                memo: memo,
                createdAt: block.timestamp
            })
        );

        emit DecisionRecorded(
            id,
            msg.sender,
            agentId,
            storageRoot,
            storageTxHash,
            vendor,
            amountCents,
            approved,
            memo,
            block.timestamp
        );
    }

    function decisionCount() external view returns (uint256) {
        return decisions.length;
    }

    function getDecision(uint256 id) external view returns (Decision memory) {
        require(id < decisions.length, "decision not found");
        return decisions[id];
    }
}
