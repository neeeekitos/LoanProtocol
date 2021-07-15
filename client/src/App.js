
import React, { Component } from "react";
import "./App.css";
import Dashboard from "./Component/DashBoard";
import dbManagement from "./Component/database";
import getWeb3 from "./Component/getWeb3";
import DynamicCollateralLending from "./contracts/DynamicCollateralLending.json";
import MainPage from "./Pages/MaisPage";


class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      accounts: null,
      web3: null,
      balance: null,
      orbitDb: null,
      contract: null,
    };
  }

  componentDidMount = async () => {
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
      console.log("deployedNetwork",deployedNetwork);

      const instance = new web3.eth.Contract(
        DynamicCollateralLending.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.state.contract = instance;

      this.state.balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');

      console.log(instance);
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }

    const dbInstance = await dbManagement.createDb(); // database creation
    this.setState({ orbitDb: dbInstance });

  };


  render() {
    console.log("coucou");

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    else{
      return (

        <div style={{ display: "flex", flexDirection: "row", width: '100vw' }}>
          <div style={{ flex: 8 }}>
            <MainPage accounts={this.state.accounts} web3={this.state.web3} balance={this.state.balance} orbitDb={this.state.orbitDb} contract={this.state.contract} />
          </div>
          <div style={{ flex: 4 }}>
            <Dashboard accounts={this.state.accounts} web3={this.state.web3} balance={this.state.balance} orbitDb={this.state.orbitDb} contract={this.state.contract} />
          </div>
          {console.log(this.state.contract)}
        </div>
        
  
  
      );

    }

   
  }
}

export default App;
