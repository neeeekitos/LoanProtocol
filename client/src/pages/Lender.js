import React, { Component } from "react";
import { Button, Card } from "react-bootstrap";
import LoanContract from "../contracts/Loan.json";
import LenderPopup from "../component/LenderPopup";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../index.css";
import { trackPromise } from 'react-promise-tracker';
import LoadingSpiner from '../component/LoadingSpiner';
import axios from "axios";
import styles from "./card.module.css";
import Countdown from "react-countdown";

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
          .send({ from: this.state.account, value: this.state.lendingAmount*10**18})
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

    // fetch from contract
    const loanHashesPromise = this.props.contract.methods.getHashesOfLoanRequests().call();
    const loanHashes = await trackPromise(loanHashesPromise);

    for (const hash of loanHashes) {
      let contract;
      contract = new this.props.web3.eth.Contract(LoanContract.abi, hash);

      contract.methods.getInfosForLender().call().then(async result => {
        console.log('result' + JSON.stringify(result));

        // convert IPFS link to the gateway url
        const tokenURI = result[2];
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
          loanCreationDate: result[3],
          canInvest: Date.now() < (result[3]*1000
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
          <Card className={`${styles.Card} grow shadow bg-white`} key={index}>
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
              <p style={{fontSize: "0.55rem", listStyleType: "none"}}>
                {loanInfo.address}
              </p>
              <Button disabled={!loanInfo.canInvest} onClick={() => this.handlePopUp(loanInfo.address)} variant="primary">
                <span role="img" aria-label="cash">💰</span>
                Lend money
                <span role="img" aria-label="cash">💰</span>
              </Button>
            </Card.Body>
          </Card>
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
