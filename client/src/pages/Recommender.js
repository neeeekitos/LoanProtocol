import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import "../index.css"
import RecommenderPopup from "../component/RecommenderPopup";
import LoanContract from "../contracts/Loan.json";



class Recommender extends Component {

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
      recommendAmount : 0,
      recommendScore: 0,
      loanToRecommend: ""
    };

    this.GetAllRequestLoans = this.GetAllRequestLoans.bind(this);
    this.PresentRequestLoans = this.PresentRequestLoans.bind(this);
    this.handlePopUp=this.handlePopUp.bind(this);
    this.closePopup=this.closePopup.bind(this);
    this.handleRecommend=this.handleRecommend.bind(this);
  }

  componentWillMount = async () => {
    await this.GetAllRequestLoans();
    // this.setState({ loanRequestsList: [1, 1, 1, 1, 1] });
  };

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
      await this.state.contract.methods.recommend(this.state.loanToRecommend, recommendScore)
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
