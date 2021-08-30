import React, { Component } from "react";
// import dbManagement from "./component/database";
import getWeb3 from "./component/getWeb3";
import DynamicCollateralLending from "./contracts/LoanController.json";
import {MetaMaskProvider} from "metamask-react";
import CustomNavbar from "./component/Navbar";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      orbitDb: null,
      contract: null,
      txLogs: []
    };
    this.addTxLog = this.addTxLog.bind(this);
    this.initWeb3 = this.initWeb3.bind(this);
  }

  initWeb3 = async () => {
    try {
      // Get network provider and web3 instance.
      console.log("RENDING");
      const web3 = getWeb3();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      console.log(networkId);
      const deployedNetwork = DynamicCollateralLending.networks[networkId];
      console.log("deployedNetwork", deployedNetwork);

      const instance = new web3.eth.Contract(
          DynamicCollateralLending.abi,
          deployedNetwork && deployedNetwork.address,
      );

      console.log(instance);
      this.setState({web3, contract: instance});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

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
            <CustomNavbar initWeb3={this.initWeb3} web3={this.state.web3} contract={this.state.contract}/>
          </div>
        </MetaMaskProvider>
      );
  }
}
export default App;
