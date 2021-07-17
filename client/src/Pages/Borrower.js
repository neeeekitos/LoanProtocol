import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Form, Modal, Nav, Navbar, Card, ListGroup, ListGroupItem } from "react-bootstrap";

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
      message: "",
      isMining: false,
      txHash: null,
      repayAmount: 0,
      hasBorrow: false,
      borrowerInfos: {}
    };

    this.handleRequestedAmount = this.handleRequestedAmount.bind(this);
    this.handleRepaymentsCount = this.handleRepaymentsCount.bind(this);
    this.handleLoanDescription = this.handleLoanDescription.bind(this);
    this.handleUpdateDatabase = this.handleUpdateDatabase.bind(this);
    this.handleBorrow = this.handleBorrow.bind(this);
    this.handlePayCollateral = this.handlePayCollateral.bind(this);
    this.handleRepay = this.handleRepay.bind(this);
    this.handleWithdraw = this.handleWithdraw.bind(this);
    this.PresentBorrowerLoan = this.PresentBorrowerLoan.bind(this);
    this.handleActiveLoanFound = this.handleActiveLoanFound.bind(this);

    this.handleActiveLoanFound();
  }

  componentDidMount = () => {
    const { web3, accounts, contract, balance, orbitDb } = this.props
    this.setState({ web3, accounts, contract, balance, orbitDb });

    console.log("props contract", this.state.contract);
    console.log("props accounts", this.state.accounts);
  };

  handleActiveLoanFound = () => {
    this.state.contract.methods.hasBorrow().call({ from: this.props.accounts[0]}).then(result => {
      if (result) {
        this.setState({hasBorrow: true});
        this.state.contract.methods.getBorrowerInfos().call({ from: this.props.accounts[0]}).then(result => {
          console.log('result' + JSON.stringify(result));

          this.setState({borrowerInfos: {
              requestedAmount: result[0],
              interest: result[1],
              repaymentsCount: result[2],
              investorsAndRecommendersNumber: result[3],
              collateral: result[4]
            }});
        });
        console.log('Active loan found');
      } else {
        console.log('No active loan in progress');
      }
    });
  }


  handleRequestedAmount(e) {
    this.setState({ requestedAmount: e.target.value });
  }

  handleRepaymentsCount(e) {
    this.setState({ repaymentsCount: e.target.value });
  }

  handleLoanDescription(e) {
    this.setState({ loanDescription: e.target.value });
  }
  handleRepaydAmount(e) {
    this.setState({ repayAmount: e.target.value });
  }


  handleBorrow = async (event) => {
    event.preventDefault();
    console.log("Waiting on borrow transaction success...");
    this.setState({ pendingTransaction: true });

    await this.state.contract.methods.applyForLoan(
      this.state.requestedAmount,
      this.state.repaymentsCount,
      2)
      .send({ from: this.props.accounts[0], gas: 3000000 },
        (err, txHash) => this.setState({ isMining: true, txHash }));

    // mining is finished, display the gas used for the transaction
    await this.props.web3.eth.getTransactionReceipt(this.state.txHash,
      (err, txReceipt) => {
        console.log(txReceipt);
        if (txReceipt.status) {
          alert("Your loan request is created!!");
          this.handleActiveLoanFound();

          this.setState({requestedAmount: "", repaymentsCount: "", loanDescription: "" });
        }
        this.setState({ pendingTransaction: false });
      });
  }
  handleUpdateDatabase = async (event) => {
    event.preventDefault();
    this.setState({ message: "Updating a database..." });
    var loan = {
      'requestedAmount': this.state.requestedAmount,
      'repaymentsCount': this.state.repaymentsCount,
      'loanDescription': this.state.loanDescription
    };
    await dbManagement.updateDb(this.props.orbitDb, this.props.accounts[0], loan);
    const existingLoans = await dbManagement.getLoanRequestsDb(this.props.orbitDb, this.props.accounts[0]);
    console.log("Existing loans : ");
    existingLoans.forEach((loan, index) => {
      console.log("Loan " + index + '\n' +
        'Description: ' + loan.payload.value.loanDescription + '\n' +
        'Amount: ' + loan.payload.value.requestedAmount + '\n\n');
    });


    const dataList = existingLoans.map((loan, index) => <li key={index}>
      <p>Description: {loan.payload.value.loanDescription}</p>
      <p>Amount: {loan.payload.value.requestedAmount}</p>
    </li>);
    this.setState({ loanRequestsList: dataList });
  }

  handlePayCollateral = async () => {

    return
  };
  handleRepay = async () => {

    return
  };
  handleWithdraw = async () => {

    return
  };

  PresentBorrowerLoan = () => {
    if (this.state.hasBorrow)
      return (
          <div>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Title>Your loan request</Modal.Title>
              </Modal.Header>
              <Card >
                <Card.Body>
                  <Card.Title>Requested amount : {this.state.borrowerInfos.requestedAmount} ETH</Card.Title>
                  <ListGroup className="list-group-flush">
                    <ListGroupItem>Investors / Recommenders : {this.state.borrowerInfos.investorsAndRecommendersNumber}</ListGroupItem>
                    <ListGroupItem>Collateral : {this.state.borrowerInfos.collateral} ETH</ListGroupItem>
                    <ListGroupItem>Interest : {this.state.borrowerInfos.interest} %</ListGroupItem>
                    <ListGroupItem>Repayment Count : {this.state.borrowerInfos.repaymentsCount} times</ListGroupItem>
                  </ListGroup>
                </Card.Body>
              </Card>
              <Modal.Footer style={{display:"flex", flexDirection:"column"}}>
                <Form>
                  <Form.Group controlId="formBasicText">
                    <Form.Label>How much do you want to repay</Form.Label>
                    <Form.Control type="number" value={this.state.repayAmount} placeholder="1" onChange={this.handleRepaydAmount} />
                  </Form.Group>
                </Form>
                <Button onClick={this.handlePayCollateral} variant="primary">Pay Collateral</Button>
                <Button onClick={this.handleWithdraw} variant="light">Withdraw</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </div>
      )
  }


  render() {
    return (
        <div className="App">
      <Modal.Dialog>
        <Modal.Header>
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
        <Modal.Footer style={{display:"flex", flexDirection:"column"}}>
          <Button onClick={this.handleBorrow} variant="primary">Borrow</Button>
          <Button onClick={this.handleUpdateDatabase} variant="dark">Update database</Button>
        </Modal.Footer>
        <img id="loader" src={loadRing} hidden={!this.state.pendingTransaction} />
      </Modal.Dialog>

      {this.PresentBorrowerLoan()}

    </div >)
  }


}

export default Borrower;
