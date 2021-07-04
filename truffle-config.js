const path = require("path");

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
    }
  },
  compilers: {
    solc: {
      version: "0.8.0"
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
