import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card, Nav, Navbar } from "react-bootstrap";
import dbManagement from "../Component/database";
import './Borrower.css';
import "../index.css"
import RecommenderPopup from "../Component/RecommenderPopup";



class Recommender extends Component {

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
      recommendAmount : 0,
      

    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handlepopUp=this.handlepopUp.bind(this)
    this.closePopup=this.closePopup.bind(this)
    this.handdleRecommend=this.handdleRecommend.bind(this)

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

  
  handdleRecommend = () => {
    this.setState({
        showPopup: !this.state.showPopup
    });
}

  PresentRequestLoans = () => {
    return (
      this.state.loanRequestsList.map((item, index) =>
        <div key={index} style={{ padding: 10 }}  >
          <div class="grow shadow p-3 mb-5 bg-white rounded">
            <Card style={{ width: '18rem', borderStyle: "none", cursor: "pointer" }} key={index} >
              <Card.Body>
                <Card.Title>Name project</Card.Title>
                <Card.Text>
                  Description of the project
                </Card.Text>
                <Button  onClick={this.handdleRecommend } variant="primary">Recommend</Button>
              
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
          <Navbar.Brand href="#home">Dynamic Collateral Recommender Platform</Navbar.Brand>

          <Nav className="mr-auto">
            <Nav.Link href="#home"> Singed in as: {this.props.account}</Nav.Link>
          </Nav>

          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              Balance: {this.props.balance} ETH
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "left" }}>
          {this.PresentRequestLoans()}
          {this.state.showPopup ?
                    <RecommenderPopup
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

export default Recommender;
