import React, { Component } from "react";
import SimpleStorageContract from "./contracts/DynamicCollateralLending.json";
import Web3 from "web3";
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form"
import Schema from "orbit/packages/@orbit/data";

import "./App.css";

class App extends Component {
  state = {accounts: null, contract: null, balance: null, requestedAmount: 0, repaymentsCount: 0, loanDescription: ''};
  web3;

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
        App.web3Provider = window.web3.currentProvider;
        this.web3 = new Web3(window.web3.currentProvider);
      } else {
        // If no injected web3 instance is detected, fallback to Ganache.
        App.web3Provider = new window.web3.providers.HttpProvider('http://127.0.0.1:9545');
        this.web3 = new Web3(App.web3Provider);
      }
      window.ethereum.enable();

      // Use web3 to get the user's accounts.
      const accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await this.web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new this.web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const balance = await this.web3.utils.fromWei(await this.web3.eth.getBalance(accounts[0]), 'ether');

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ accounts, contract: instance, balance }, this.runExample);
      console.log(instance);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
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
    this.setState({message:"Waiting on borrow transaction success..."});
    await this.state.contract.methods.applyForLoan(
        this.state.requestedAmount,
        this.state.repaymentsCount,
        2,
        this.web3.utils.asciiToHex(this.state.loanDescription))
        .send({from: this.state.accounts[0], gas: 50000});
  }

  handleGetAllRequestLoans = async (event) => {
    event.preventDefault();
    this.setState({message:"Fetching all loan requests.."});
    await this.state.contract.methods.users()
  }

  runExample = async () => {
    console.log(this.state.accounts[0]);
    console.log(this.state.balance + 'ETH');
  };

  render() {
    if (!this.web3) {
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
        {/*<Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Sell a Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form>
              <FormGroup controlId="formBasicText">
                <ControlLabel>Product name</ControlLabel>
                <FormControl
                    type="text"
                    value={this.state.productName}
                    placeholder="Enter the name of your product"
                    onChange={this.handleProductNameChange} />
                    <ControlLabel>Price in ETH</ControlLabel>
                <FormControl type="number" value={this.state.productPrice} placeholder="1" onChange={this.handleProductPriceChange} />
                <ControlLabel>Description</ControlLabel>
                <FormControl
                    type="text"
                    value={this.state.productDescription}
                    placeholder="Describe your article"
                    onChange={this.handleProductDescChange}/>
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleClose}>Close</Button>
            <Button onClick={this.handleSell}>Sell</Button>
          </Modal.Footer> </Modal> {this.renderProducts()}
*/}
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
          </Modal.Footer>
        </Modal.Dialog>

      </div>
    );
  }
}

export default App;
