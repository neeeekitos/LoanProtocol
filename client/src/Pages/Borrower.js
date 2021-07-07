import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Form, Modal, Nav, Navbar } from "react-bootstrap";

import loadRing from "./../assets/ring.gif";
import './Borrower.css';
import dbManagement from "../Component/database";


class Borrower extends Component {

  constructor(props) {
    super(props);

    this.state = {
      accounts: this.props.accounts,
      web3: null,
      contract: this.props.contract,
      balance: null,
      orbitDb: null,
      requestedAmount: 0,
      repaymentsCount: 0,
      loanDescription: '',
      pendingTransaction: false,
      loanRequestsList: '',
      orbitDb: null,
      message : "",
      isMining: false,
      txHash : null,


    };

    this.handleRequestedAmount = this.handleRequestedAmount.bind(this);
    this.handleRepaymentsCount = this.handleRepaymentsCount.bind(this);
    this.handleLoanDescription = this.handleLoanDescription.bind(this);
    this.handleUpdateDatabase = this.handleUpdateDatabase.bind(this);
    this.handleBorrow = this.handleBorrow.bind(this);
  }

  componentDidMount = () => {
    const { web3,accounts,contract,balance,orbitDb} = this.props
    this.setState({ web3 , accounts, contract, balance, orbitDb });

    console.log("props contract",this.state.contract);
    console.log("props accounts",this.state.accounts);
  };

  handleRequestedAmount(e) {
    this.setState({ requestedAmount: e.target.value });
  }

  handleRepaymentsCount(e) {
    this.setState({ repaymentsCount: e.target.value });
  }

  handleLoanDescription(e) {
    this.setState({ loanDescription: e.target.value });
  }


  handleBorrow = async (event) => {
    event.preventDefault();
    console.log("Waiting on borrow transaction success...");
    this.setState({ pendingTransaction: true });

    await this.state.contract.methods.applyForLoan(
      this.state.requestedAmount,
      this.state.repaymentsCount,
      2)
      .send({ from: this.state.accounts[0], gas: 800000 },
        (err, txHash) => this.setState({ isMining: true, txHash }));

    // mining is finished, display the gas used for the transaction
    await this.props.web3.eth.getTransactionReceipt(this.state.txHash,
      (err, txReceipt) => {
        console.log(txReceipt);
        if (txReceipt.status) alert("Your loan request is created!!");
        this.setState({ pendingTransaction: false });
      });
  }
  handleUpdateDatabase = async (event) => {
    event.preventDefault();
    this.setState({message:"Updating a database..."});
    var loan = {
      'requestedAmount': this.state.requestedAmount,
      'repaymentsCount': this.state.repaymentsCount,
      'loanDescription': this.state.loanDescription
    };
    await dbManagement.updateDb(this.props.orbitDb, this.props.accounts[0], loan);
    const existingLoans = await dbManagement.getLoanRequestsDb(this.props.orbitDb, this.props.accounts[0]);
    console.log("Existing loans : ");
    existingLoans.forEach((loan, index) => {
      console.log("Loan "+ index +'\n' +
          'Description: ' + loan.payload.value.loanDescription + '\n' +
          'Amount: ' + loan.payload.value.requestedAmount + '\n\n');
    });

    const dataList = existingLoans.map((loan, index) => <li key={index}>
      <p>Description: {loan.payload.value.loanDescription}</p>
      <p>Amount: {loan.payload.value.requestedAmount}</p>
    </li>);
    this.setState({loanRequestsList: dataList});
  }


  render() {
    return (<div className="App">
      <Navbar bg="light" variant="light">
        <Navbar.Brand href="#home">Dynamic Collateral Borrowing Platform</Navbar.Brand>

        <Nav className="mr-auto">
          <Nav.Link href="#home"> Singed in as: {this.props.account}</Nav.Link>
        </Nav>

        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            Balance: {this.props.balance} ETH
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
              <Form.Control type="number" value={this.state.requestedAmount} placeholder="1" onChange={this.handleRequestedAmount} />

              <Form.Label>Repayments count estimation</Form.Label>
              <Form.Control type="number" value={this.state.repaymentsCount} placeholder="2" onChange={this.handleRepaymentsCount} />

              <Form.Label>Loan description</Form.Label>
              <Form.Control
                type="text"
                value={this.state.loanDescription}
                placeholder="Describe your purpose of loan"
                onChange={this.handleLoanDescription} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="Supply">Supply</Button>
          <Button onClick={this.handleBorrow} variant="Borrow">Borrow</Button>
          <Button onClick={this.handleUpdateDatabase} variant="Update">Update database</Button>
        </Modal.Footer>
        <img id="loader" src={loadRing} hidden={!this.state.pendingTransaction} />
      </Modal.Dialog>

      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Active loan requests</Modal.Title>
        </Modal.Header>
        <ul>
          {this.state.loanRequestsList}
        </ul>
      </Modal.Dialog>
      



    </div>)
  }


}

export default Borrower;
