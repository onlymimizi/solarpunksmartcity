window.CONFIG = {
  API_BASE: "http://localhost:8000",
  CONTRACT_ADDRESS: "", // Fill after deploy
  CONTRACT_ABI: [
    {
      "inputs": [
        { "internalType": "string", "name": "key", "type": "string" },
        { "internalType": "string", "name": "value", "type": "string" }
      ],
      "name": "setRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "string", "name": "key", "type": "string" }],
      "name": "getRecord",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "bytes32", "name": "keyHash", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "key", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "value", "type": "string" }
      ],
      "name": "RecordUpdated",
      "type": "event"
    }
  ]
};