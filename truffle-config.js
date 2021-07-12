const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const mn = "9f73f68c36577e6a9458d5ac7cb144bcbab00100de738e6f4ea11f25daaab805";
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    local: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    develop: {
      port: 9545
    },
    ropsten: {
        provider: new HDWalletProvider(mn, "https://ropsten.infura.io/v3/26e5da38a7184c53accf80581906d738"),
        network_id: 3
    }
  },
  compilers: {
    solc: {
      version: "0.8.6"
    }
  }
};
/*
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};*/
