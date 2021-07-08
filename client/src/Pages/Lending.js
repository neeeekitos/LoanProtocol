import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card, Nav, Navbar } from "react-bootstrap";
import dbManagement from "../Component/database";
import './Borrower.css';
import "../index.css"




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
      loanRequestsList: [1, 1, 1, 1, 1],
      orbitDb: null,
      showPopup: false,

    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);

  }
  componentDidMount = () => {

    this.setState({ loanRequestsList: [1, 1, 1, 1, 1] });

  };




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

  PresentRequestLoans = () => {
    let flexpos
    return (
      this.state.loanRequestsList.map((item, index) =>


        <div key={index} style={{padding:10}}  >

          <div class="grow shadow p-3 mb-5 bg-white rounded">
          <Card style={{ width: '18rem',borderStyle:"none", cursor:"pointer" }} key={index} >
            <Card.Body>
              <Card.Title>Name project</Card.Title>
              <Card.Text>
                Description of the project
              </Card.Text>
              <Button variant="primary">Lend</Button>
            </Card.Body>
          </Card>
        </div>
        </div>
      ))
  }





  render() {

    const five = [1, 1, 1, 1, 1];

    return (
      <div className="App" >
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

          <div  style={{display:"flex", flexWrap:"wrap" ,justifyContent:"left"}}>
          {this.PresentRequestLoans()}
          </div>
          

      </div>
    );
  }
}

export default Lending;
