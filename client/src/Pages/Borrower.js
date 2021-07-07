import 'bootstrap/dist/css/bootstrap.min.css';
import React,{ Component} from "react";
import { Button, Form, Modal, Nav, Navbar } from "react-bootstrap";
import Popup from "../Component/CSVLoader";
import loadRing from "./../assets/ring.gif";
import './Borrower.css';
import dbManagement from "../Component/database";


  class Borrower extends Component {

    constructor(props) {
      super(props);
  
      this.state = {
        requestedAmount: 0,
        repaymentsCount: 0,
        loanDescription: '',
        pendingTransaction: false,
        loanRequestsList: '',
        orbitDb: null,
       
      };
  
      this.handleRequestedAmount = this.handleRequestedAmount.bind(this);
      this.handleRepaymentsCount = this.handleRepaymentsCount.bind(this);
      this.handleLoanDescription = this.handleLoanDescription.bind(this);
      this.handleUpdateDatabase = this.handleUpdateDatabase.bind(this);
      this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
      this.togglePopup = this.togglePopup.bind(this);
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
  
    togglePopup = () => {
      this.setState({
        showPopup: !this.state.showPopup
      });
    }
  
    
  
    GetAllRequestLoans = async () => {
      this.setState({ message: "Fetching all loan requests.." });
  
      //fetch from database
      const existingLoans = await dbManagement.getLoanRequestsDb(this.state.orbitDb, this.state.accounts[0]);
      console.log("Existing loans : ");
      existingLoans.forEach((loan, index) => {
        console.log("Loan " + index + '\n' +
          'Description: ' + loan.payload.value.loanDescription + '\n' +
          'Amount: ' + loan.payload.value.requestedAmount + '\n\n');
      });
  
  
      const dataList = existingLoans.map((loan) => <li key={loan.index}>
        <p>Description: {loan.payload.value.loanDescription}</p>
        <p>Amount: {loan.payload.value.requestedAmount}</p>
      </li>);
      this.setState({ loanRequestsList: dataList });
  
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
      this.setState({ message: "Updating a database..." });
      var loan = {
        'requestedAmount': this.state.requestedAmount,
        'repaymentsCount': this.state.repaymentsCount,
        'loanDescription': this.state.loanDescription
      };
      await dbManagement.updateDb(this.state.orbitDb, this.state.accounts[0], loan);
      const existingLoans = await dbManagement.getLoanRequestsDb(this.state.orbitDb, this.state.accounts[0]);
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
  
    createDatabase = async (event) => {
      this.setState({ message: "Updating a database..." });
      await dbManagement.createDb();
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
        <Button onClick={this.props.handleBorrow} variant="Borrow">Borrow</Button>
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
    <button onClick={this.togglePopup}>show popup</button>
    {this.state.showPopup ?
      <Popup
        text='Active loan requests'
        closePopup={this.togglePopup}
      />
      : null
    }



  </div>)
  }

  
}

export default Borrower;
