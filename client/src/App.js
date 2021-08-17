import React, { Component } from "react";
import dbManagement from "./component/database";
import getWeb3 from "./component/getWeb3";
import DynamicCollateralLending from "./contracts/DynamicCollateralLending.json";
import {MetaMaskProvider} from "metamask-react";
import CustomNavbar from "./component/Navbar";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      accounts: null,
      web3: null,
      orbitDb: null,
      contract: null,
      txLogs: []
    };
    this.addTxLog = this.addTxLog.bind(this);

  }

  componentDidMount = async () => {
    if (!this.state.web3) {
      try {
        // Get network provider and web3 instance.
        console.log("RENDING");
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        console.log(DynamicCollateralLending.networks);
        const deployedNetwork = DynamicCollateralLending.networks[networkId];
        console.log("deployedNetwork", deployedNetwork);

        const instance = new web3.eth.Contract(
            DynamicCollateralLending.abi,
            deployedNetwork && deployedNetwork.address,
        );

        this.state.contract = instance;
        console.log(instance);
        this.setState({web3, accounts, contract: instance});
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    }

    const dbInstance = await dbManagement.createDb(); // database creation
    this.setState({ orbitDb: dbInstance });

  };

  addTxLog = (tx) => {
    const txLogs = this.state.txLogs.slice();
    txLogs.push(tx);
    this.setState({txLogs: txLogs}, () => {
      console.log(this.state.txLogs);
    });
  }


  render() {
      return (
        <MetaMaskProvider>
          <div className="App" style={{ width: '100vw', background: "radial-gradient(50% 50% at 50% 50%,#fc077d10 0,rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
            <CustomNavbar web3={this.state.web3} contract={this.state.contract}/>
          </div>
        </MetaMaskProvider>
      );
  }
}
export default App;
