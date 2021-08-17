import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import LoanContract from "../contracts/Loan.json";
import LenderPopup from "../component/LenderPopup";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../index.css";

class Lender extends Component {

  constructor(props) {
    super(props);

    this.state = {
      account: this.props.account,
      web3: this.props.web3,
      contract: this.props.contract,
      orbitDb: this.props.orbitDb,
      requestedAmount: 0,
      repaymentsCount: 0,
      loanDescription: '',
      pendingTransaction: false,
      loanRequestsList: [],
      showPopup: false,
      lendingAmount: 0,
      loanToLend: ""
    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handlePopUp= this.handlePopUp.bind(this)
    this.handleLend=this.handleLend.bind(this)
    this.closePopup=this.closePopup.bind(this)
  }

  componentWillMount = async () => {
    await this.GetAllRequestLoans();
    //this.setState({ loanRequestsList: [1, 1, 1, 1, 1] });
  };

  closePopup=() => {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }

  handleLend = async (value)=>{
    console.log("value on popup",value);
    this.setState({
      lendingAmount: value,
      showPopup: !this.state.showPopup
    }, async function() {
      console.log(`Lending ${this.state.lendingAmount} ETH to the loan ${this.state.loanToLend}`);
      await this.state.contract.methods.invest(this.state.loanToLend)
          .send({ from: this.state.accounts[0], value: this.state.lendingAmount*10**18})
          .then(res => {
            console.log('Success', res);
            alert(`You have successfully lent ${this.state.lendingAmount} ETH!`)
          })
          .catch(err => console.log(err))
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

    loanHashes.forEach((hash) => {
      let contract;
      contract = new this.state.web3.eth.Contract(LoanContract.abi, hash);

      contract.methods.getProjectInfos().call().then(result => {
        console.log('result' + JSON.stringify(result));

        const loanInfos = {
          address: contract._address,
          interest: result[0],
          requestedAmount: this.state.web3.utils.fromWei(result[1].toString())
        };
        const dataListLoans = this.state.loanRequestsList.slice();
        dataListLoans.push(loanInfos);
        this.setState({loanRequestsList: dataListLoans});
        console.log(dataListLoans);
      });
    });

    console.log(this.state.loanRequestsList);
    //this.setState({ loanRequestsList: dataList });
  }

  handlePopUp = (loanAddress) => {
    this.setState({loanToLend: loanAddress}, function() {
      this.setState({showPopup: !this.state.showPopup});
    });
  }

  PresentRequestLoans = () => {
    return (
      this.state.loanRequestsList.map((loanInfo, index) =>
        <div key={index} style={{padding:10}}  >
          <div class="card-rounded grow shadow p-3 mb-5 bg-white">
          <Card style={{ width: '18rem',borderStyle:"none", cursor:"pointer" }} key={index} >
            <Card.Body>
              <Card.Title>Name project</Card.Title>
              <Card.Text>
                <p style={{margin:"20px"}}>
                  Description of the project
                </p>
                <p>
                  Requested amount : {loanInfo.requestedAmount} ETH
                </p>
                <p>
                  {loanInfo.interest}% APY
                </p>

                <div style={{marginTop:"5px", fontSize: "0.55rem", listStyleType: "none"}}>{loanInfo.address}</div>
              </Card.Text>
              <Button onClick={() => this.handlePopUp(loanInfo.address)} variant="primary">
                <span role="img" aria-label="cash">💰</span>
                Lend money
                <span role="img" aria-label="cash">💰</span>
              </Button>
            </Card.Body>
          </Card>
        </div>
        </div>
      ))
  }





  render() {
    return (
      <div>
          <div style={{display:"flex", flexWrap:"wrap", justifyContent:"flex-start", width:"64rem", margin:"auto"}}>
          {this.PresentRequestLoans()}
          {this.state.showPopup ?
                    <LenderPopup
                    handleLend={this.handleLend}
                    closePopup={this.closePopup}
                    />
                    : null
                }
          </div>
          

      </div>
    );
  }
}

export default Lender;
