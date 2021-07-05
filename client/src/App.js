import React, { Component } from "react";
import SimpleStorageContract from "./contracts/DynamicCollateralLending.json";
import Web3 from "web3";
import getWeb3 from "./getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import dbManagement from "./database";

import loadRing from "./assets/ring.gif";


import "./App.css";

class App extends Component {


  state = {
    accounts: null,
    web3: null,
    contract: null,
    balance: null,
    requestedAmount: 0,
    repaymentsCount: 0,
    loanDescription: '',
    pendingTransaction: false,
    loanRequestsList: '',
    orbitDb: null
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];

      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
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
    await this.GetAllRequestLoans();
  };

  handleRequestedAmount(e) {
    this.setState({requestedAmount: e.target.value});
  }

  handleRepaymentsCount(e) {
    this.setState({repaymentsCount: e.target.value});
  }

  handleLoanDescription(e) {
    this.setState({loanDescription: e.target.value});
  }

  handleBorrow = async (event) => {
    event.preventDefault();
    console.log("Waiting on borrow transaction success...");
    this.setState({pendingTransaction : true});

    await this.state.contract.methods.applyForLoan(
        this.state.requestedAmount,
        this.state.repaymentsCount,
        2)
        .send({from: this.state.accounts[0], gas: 800000},
            (err, txHash) => this.setState({isMining: true, txHash}));

    // mining is finished, display the gas used for the transaction
    await this.state.web3.eth.getTransactionReceipt(this.state.txHash,
        (err, txReceipt) => {
          console.log(txReceipt);
          if (txReceipt.status) alert("Your loan request is created!!");
          this.setState({pendingTransaction : false});
        });


    // Other ways to catch events
    /*await this.state.web3.eth.getTransactionReceipt(this.state.txHash,
        (err, txReceipt) => this.setState({
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed,
          isMining: false
        })
    );*/
    /*const filter = web3.eth.filter({
      fromBlock: 0,
      toBlock: 'latest',
      address: contractAddress,
      topics: [web3.sha3('newtest(string,uint256,string,string,uint256)')]
    })

    filter.watch((error, result) => {
      //
    })*/

    /*await this.state.contract.methods.test()
        .send({from: this.state.accounts[0], gas: 50000});*/

        // await this.handleUpdateDatabase();
  }

  GetAllRequestLoans = async () => {
    this.setState({message:"Fetching all loan requests.."});

    //fetch from database
    const existingLoans = await dbManagement.getLoanRequestsDb(this.state.orbitDb, this.state.accounts[0]);
    console.log("Existing loans : ");
    existingLoans.forEach((loan, index) => {
      console.log("Loan "+ index +'\n' +
          'Description: ' + loan.payload.value.loanDescription + '\n' +
          'Amount: ' + loan.payload.value.requestedAmount + '\n\n');
    });


    const dataList = existingLoans.map((loan) => <li key={loan.index}>
      <p>Description: {loan.payload.value.loanDescription}</p>
      <p>Amount: {loan.payload.value.requestedAmount}</p>
    </li>);
    this.setState({loanRequestsList: dataList});

    // fetch from contract
    /*const loanHashes = await this.state.contract.methods.getHashesOfLoanRequests().call();
    console.log("hashes : " + loanHashes);

    // const reptiles = ["alligator", "snake", "lizard"];
    if (loanHashes !== null) {
      const dataList = loanHashes.map((hash) => <li key={hash}>{hash}</li>);
      this.setState({loanRequestsList: dataList});
    }*/
  }

  handleUpdateDatabase = async (event) => {
    event.preventDefault();
    this.setState({message:"Updating a database..."});
    var loan = {
      'requestedAmount': this.state.requestedAmount,
      'repaymentsCount': this.state.repaymentsCount,
      'loanDescription': this.state.loanDescription
    };
    await dbManagement.updateDb(this.state.orbitDb, this.state.accounts[0], loan);
    const existingLoans = await dbManagement.getLoanRequestsDb(this.state.orbitDb, this.state.accounts[0]);
    console.log("Existing loans : ");
    existingLoans.forEach((loan, index) => {
      console.log("Loan "+ index +'\n' +
          'Description: ' + loan.payload.value.loanDescription + '\n' +
          'Amount: ' + loan.payload.value.requestedAmount + '\n\n');
    });
  }

  createDatabase = async (event) => {
    this.setState({message:"Updating a database..."});
    await dbManagement.createDb();
  }

  runExample = async () => {
    console.log(this.state.accounts[0]);
    console.log(this.state.balance + 'ETH');
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <Navbar bg="light" variant="light">
          <Navbar.Brand href="#home">Dynamic Collateral Lending Platform</Navbar.Brand>

          <Nav className="mr-auto">
            <Nav.Link href="#home"> Singed in as: {this.state.accounts[0]}</Nav.Link>
          </Nav>

          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              Balance: {this.state.balance} ETH
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>

        <Modal.Dialog>
          <Modal.Header closeButton>
            <Modal.Title>Apply for a loan</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form>
              <Form.Group controlId="formBasicText">

                <Form.Label>Requested Amount in ETH</Form.Label>
                <Form.Control type="number" value={this.state.requestedAmount} placeholder="1" onChange={this.handleRequestedAmount.bind(this)} />

                <Form.Label>Repayments count estimation</Form.Label>
                <Form.Control type="number" value={this.state.repaymentsCount} placeholder="2" onChange={this.handleRepaymentsCount.bind(this)} />

                <Form.Label>Loan description</Form.Label>
                <Form.Control
                    type="text"
                    value={this.state.loanDescription}
                    placeholder="Describe your purpose of loan"
                    onChange={this.handleLoanDescription.bind(this)}/>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="Supply">Supply</Button>
            <Button onClick={this.handleBorrow} variant="Borrow">Borrow</Button>
            <Button onClick={this.handleUpdateDatabase} variant="Update">Update database</Button>
          </Modal.Footer>
          <img id="loader" src={loadRing} hidden={!this.state.pendingTransaction}/>
        </Modal.Dialog>

        <Modal.Dialog>
          <Modal.Header>
            <Modal.Title>Active loan requests</Modal.Title>
          </Modal.Header>
          <ul>
            { this.state.loanRequestsList }
          </ul>
        </Modal.Dialog>
      </div>
    );
  }
}

export default App;
