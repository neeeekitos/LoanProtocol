import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import LoanContract from "../contracts/Loan.json";
import LenderPopup from "../component/LenderPopup";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../index.css";
import { trackPromise } from 'react-promise-tracker';
import LoadingSpiner from '../component/LoadingSpiner';

class Lender extends Component {

  constructor(props) {
    super(props);

    this.state = {
      account: this.props.account,
      orbitDb: this.props.orbitDb,
      requestedAmount: 0,
      repaymentsCount: 0,
      loanDescription: '',
      pendingTransaction: false,
      loanRequestsList: [],
      showPopup: false,
      lendingAmount: 0,
      loanToLend: "",
      componentNeedsUpdate: true
    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handlePopUp= this.handlePopUp.bind(this)
    this.handleLend=this.handleLend.bind(this)
    this.closePopup=this.closePopup.bind(this)
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {

    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }

    if (prevProps.contract == null && this.props.contract != null && this.state.componentNeedsUpdate) {
      this.setState({ componentNeedsUpdate: false });
      await this.GetAllRequestLoans();
    }
  }

  async componentDidMount() {
    this._isMounted = true;
    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }
    if (this.props.contract != null && this.state.componentNeedsUpdate) {
      this.setState({componentNeedsUpdate: false});
      await this.GetAllRequestLoans();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

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
      let promise =  this.props.contract.methods.invest(this.state.loanToLend)
          .send({ from: this.state.accounts[0], value: this.state.lendingAmount*10**18})
          .then(res => {
            console.log('Success', res);
            alert(`You have successfully lent ${this.state.lendingAmount} ETH!`)
          })
          .catch(err => console.log(err))
      await trackPromise(promise);
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
    const loanHashesPromise = this.props.contract.methods.getHashesOfLoanRequests().call();
    const loanHashes = await trackPromise(loanHashesPromise);
    console.log("hashes : " + loanHashes);

    loanHashes.forEach((hash) => {
      let contract;
      contract = new this.props.web3.eth.Contract(LoanContract.abi, hash);

      contract.methods.getProjectInfos().call().then(result => {
        console.log('result' + JSON.stringify(result));

        const loanInfos = {
          address: contract._address,
          interest: result[0],
          requestedAmount: this.props.web3.utils.fromWei(result[1].toString())
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
          <div className="card-rounded grow shadow p-3 mb-5 bg-white">
          <Card style={{ width: '18rem',borderStyle:"none", cursor:"pointer" }} key={index} >
            <Card.Body>
              <Card.Title>Name project</Card.Title>
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
        <LoadingSpiner/>
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
