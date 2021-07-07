import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card, Modal, Nav, Navbar } from "react-bootstrap";
import Popup from "../Component/CSVLoader";
import dbManagement from "../Component/database";
import loadRing from "./../assets/ring.gif";
import './Borrower.css';




class Lending extends Component {

  constructor(props) {
    super(props);

    this.state = {
      accounts: null,
      web3: null,
      contract: null,
      balance: null,
      requestedAmount: 0,
      repaymentsCount: 0,
      loanDescription: '',
      pendingTransaction: false,
      loanRequestsList: '',
      orbitDb: null,
      showPopup: false
    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);

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

  }






  render() {

    return (
      <div className="App">
        <Navbar bg="light" variant="light">
          <Navbar.Brand href="#home">Dynamic Collateral Lending Platform</Navbar.Brand>

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
            <Modal.Title>Pay for a loan</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Card>
              <Card.Header>List of loan that you can land</Card.Header>
              <Card.Body>
                <blockquote className="blockquote mb-0">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>

                </blockquote>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="Supply">Supply</Button>
            <Button onClick={this.props.handleBorrow} variant="Borrow">Borrow</Button>
            <Button onClick={this.handleUpdateDatabase} variant="Update">Update database</Button>
          </Modal.Footer>
          <img id="loader" src={loadRing} hidden={!this.state.pendingTransaction} />
        </Modal.Dialog>


        <button onClick={this.togglePopup}>show popup</button>
        {this.state.showPopup ?
          <Popup
            text='Active loan requests'
            closePopup={this.togglePopup}
          />
          : null
        }



      </div>
    );
  }
}

export default Lending;
