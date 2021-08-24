import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import "../index.css"
import RecommenderPopup from "../component/RecommenderPopup";
import LoanContract from "../contracts/Loan.json";
import LoadingSpiner from "../component/LoadingSpiner";
import {trackPromise} from "react-promise-tracker";



class Recommender extends Component {

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
      recommendAmount : 0,
      recommendScore: 0,
      loanToRecommend: "",
      componentNeedsUpdate: true
    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handlePopUp=this.handlePopUp.bind(this);
    this.closePopup=this.closePopup.bind(this);
    this.handleRecommend=this.handleRecommend.bind(this);
  }


  async componentDidUpdate(prevProps, prevState, snapshot) {

    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }

    if (prevProps.contract == null && this.props.contract != null && this.state.componentNeedsUpdate) {
      this.setState({ componentNeedsUpdate: false });
      await trackPromise(this.GetAllRequestLoans());
    }
  }

  async componentDidMount() {
    this._isMounted = true;
    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }
    if (this.props.contract != null && this.state.componentNeedsUpdate) {
      this.setState({componentNeedsUpdate: false});
      await trackPromise(this.GetAllRequestLoans());
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
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
    const loanHashes = await this.props.contract.methods.getHashesOfLoanRequests().call();
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
  }

  closePopup=()=> {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }

  handlePopUp = (loanAddress) => {
    this.setState({loanToRecommend: loanAddress}, function() {
      this.setState({showPopup: !this.state.showPopup});
    });
  }

  handleRecommend = async (recommendAmount, recommendScore)=>{
    this.setState({
      recommendAmount: recommendAmount,
      recommendScore: recommendScore,
      showPopup: !this.state.showPopup
    }, async function() {
      console.log(`Log: recommender send : ${recommendAmount}ETH with a score : ${recommendScore} to the loan ${this.state.loanToRecommend}`);
      await this.props.contract.methods.recommend(this.state.loanToRecommend, recommendScore)
          .send({ from: this.state.accounts[0], value: recommendAmount*10**18})
          .then(res => {
            console.log('Success', res);
            alert(`You have successfully recommended a score of ${recommendScore} with an amount : ${recommendAmount} ETH!`)
          })
          .catch(err => console.log(err))
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
                      Recommend
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
      <div className="App">
        <LoadingSpiner/>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "left",  width:"64rem", margin:"auto"}}>
          {this.PresentRequestLoans()}
          {this.state.showPopup ?
                    <RecommenderPopup
                    handleRecommend={this.handleRecommend}
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
