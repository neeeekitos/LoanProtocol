import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card, Nav, Navbar } from "react-bootstrap";
import dbManagement from "../Component/database";
import './Borrower.css';
import "../index.css"
import LendingPopup from "../Component/LendingPopup";




class Lending extends Component {

  constructor(props) {
    super(props);

    this.state = {
      accounts: null,
      web3: null,
      contract: this.props.contract,
      balance: null,
      requestedAmount: 0,
      repaymentsCount: 0,
      loanDescription: '',
      pendingTransaction: false,
      loanRequestsList: [1, 1, 1, 1, 1],
      orbitDb: null,
      showPopup: false,
      lendingAmount: 0,

    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handdleLend= this.handdleLend.bind(this)
    this.handlepopUp=this.handlepopUp.bind(this)
    this.closePopup=this.closePopup.bind(this)
  }
  componentDidMount = async () => {
    await this.GetAllRequestLoans();
    //this.setState({ loanRequestsList: [1, 1, 1, 1, 1] });
  };
  closePopup=()=>{
    this.setState({
      showPopup: !this.state.showPopup
  });
  }
  handlepopUp=(value)=>{
    console.log("value on popup",value);
    this.setState({
      showPopup: !this.state.showPopup
  });
  }



  GetAllRequestLoans = async () => {
    this.setState({ message: "Fetching all loan requests.." });

    //fetch from database
    /*const existingLoans = await dbManagement.getLoanRequestsDb(this.state.orbitDb, this.state.accounts[0]);
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
*/
    // fetch from contract
    const loanHashes = await this.state.contract.methods.getHashesOfLoanRequests().call();
    console.log("hashes : " + loanHashes);

    // const reptiles = ["alligator", "snake", "lizard"];
    if (loanHashes !== null) {
      const dataList = loanHashes.map((hash) => <li key={hash}>{hash}</li>);
      this.setState({loanRequestsList: dataList});
    }
    console.log(this.state.loanRequestsList);
    //this.setState({ loanRequestsList: dataList });
  }
  handdleLend = () => {
    this.setState({
        showPopup: !this.state.showPopup
    });
  }

  PresentRequestLoans = () => {
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
              <Button  onClick={this.handdleLend} variant="primary">Lend monney</Button>
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
          {this.state.showPopup ?
                    <LendingPopup
                    handlepopUp={this.handlepopUp}
                    closePopup={this.closePopup}
                    />
                    : null
                }
          </div>
          

      </div>
    );
  }
}

export default Lending;
