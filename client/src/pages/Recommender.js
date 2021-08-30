import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import "../index.css"
import RecommenderPopup from "../component/RecommenderPopup";
import LoanContract from "../contracts/Loan.json";
import LoadingSpiner from "../component/LoadingSpiner";
import {trackPromise} from "react-promise-tracker";
import axios from 'axios';
import styles from "./card.module.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Countdown from 'react-countdown';

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

    // fetch from contract
    const loanHashes = await this.props.contract.methods.getHashesOfLoanRequests().call();
    console.log("hashes : " + loanHashes);

    for (const hash of loanHashes) {
      let contract;
      contract = new this.props.web3.eth.Contract(LoanContract.abi, hash);

      contract.methods.getInfosForRecommender().call().then(async result => {
        console.log('result' + JSON.stringify(result));

        // convert IPFS link to the gateway url
        const tokenURI = result[3];
        const gatewayURL = process.env.REACT_APP_IPFS_GATEWAY + tokenURI.replace("ipfs://", "");

        let projectName;
        let projectDescription;
        let projectImage;
        try {
          console.log(gatewayURL)
          const metadataPromise = axios.get(gatewayURL);
          const metadata = await trackPromise(metadataPromise);

          projectName = metadata.data.name;
          projectDescription = metadata.data.description;
          projectImage = process.env.REACT_APP_IPFS_GATEWAY + metadata.data.image.replace("ipfs://", "");

        } catch (error) {
          console.log("error", error);
          if (error.response && error.response.status === 503)
            alert('Ouups... It seems that IPFS gateway is down... We can\'t fetch project description & image for instance')
        }

        const loanInfos = {
          address: contract._address,
          interest: result[0],
          requestedAmount: this.props.web3.utils.fromWei(result[1].toString()),
          tScore: result[2],
          loanCreationDate: result[4],
          canInvest: Date.now() < (result[4]*1000
              + process.env.REACT_APP_LOAN_EXPIRATION_INTERVAL*1000),
          projectName,
          projectDescription,
          projectImage
        };

        const dataListLoans = this.state.loanRequestsList.slice();
        dataListLoans.push(loanInfos);
        this.setState({loanRequestsList: dataListLoans});
        console.log(dataListLoans);
      });
    }
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
          .send({ from: this.props.account, value: recommendAmount*10**18})
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
            <div key={index} style={{padding:10}}>
              <Card  className={`${styles.Card} grow shadow bg-white`} key={index} >
                <Card.Img src={loanInfo.projectImage} alt="Card image" className={styles.ImgTeaser} />
                <Card.Body>
                  <Card.Title><b>{loanInfo.projectName}</b></Card.Title>
                  <p style={{margin:"20px"}}>
                    Description : <b>{loanInfo.projectDescription}</b>
                  </p>
                  <p>
                    Lending ends in : &nbsp;
                    <b>
                      <Countdown onComplete={() => {
                        const loans = this.state.loanRequestsList.slice();
                        loans[index].canInvest = false;
                        this.setState({loanRequestsList: loans});
                      }}
                                 daysInHours={true}
                                 date={loanInfo.loanCreationDate*1000 + process.env.REACT_APP_LOAN_EXPIRATION_INTERVAL*1000} />
                    </b>
                  </p>
                  <p>
                    Requested amount : <b>{loanInfo.requestedAmount} ETH</b>
                  </p>
                  <p>
                    APY : <b>{loanInfo.interest}%</b>
                  </p>
                  <p>
                    Trustworthiness score: <b>{loanInfo.tScore}</b>
                  </p>
                  <p style={{fontSize: "0.55rem", listStyleType: "none"}}>
                    {loanInfo.address}
                  </p>
                  <Button disabled={!loanInfo.canInvest} onClick={() => this.handlePopUp(loanInfo.address)} variant="primary">
                    <span role="img" aria-label="cash">💰</span>
                    Recommend
                    <span role="img" aria-label="cash">💰</span>
                  </Button>
                </Card.Body>
              </Card>
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
