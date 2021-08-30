import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Form, Modal, Card, ListGroup, ListGroupItem } from "react-bootstrap";
import { trackPromise } from 'react-promise-tracker';
import LoadingSpiner from '../component/LoadingSpiner';
import { toGatewayURL } from 'nft.storage';
import Countdown from "react-countdown";
import LoanContract from "../contracts/Loan.json";


class Borrower extends Component {

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
      loanRequestsList: '',
      message: "",
      isMining: false,
      txHash: null,
      repayAmount: 0,
      hasBorrow: false,
      borrowerInfos: {},
      addTxLog:this.props.addTxLog,
      componentNeedsUpdate: true,
    };

    this.handleRequestedAmount = this.handleRequestedAmount.bind(this);
    this.handleRepaymentsCount = this.handleRepaymentsCount.bind(this);
    this.handleLoanDescription = this.handleLoanDescription.bind(this);
    this.handleBorrow = this.handleBorrow.bind(this);
    this.handlePayCollateral = this.handlePayCollateral.bind(this);
    this.handleRepay = this.handleRepay.bind(this);
    this.handleWithdraw = this.handleWithdraw.bind(this);
    this.PresentBorrowerLoan = this.PresentBorrowerLoan.bind(this);
    this.handleActiveLoanFound = this.handleActiveLoanFound.bind(this);
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {

    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }

    if (prevProps.contract == null && this.props.contract != null) {
      this.handleActiveLoanFound();
      this.setState({ componentNeedsUpdate: false });
    }
  }

  async componentDidMount() {
    this._isMounted = true;
    if (this.props.web3 == null && this.props.status === "connected") {
      await trackPromise(this.props.initWeb3());
    }
    if (this.props.contract != null && this.state.componentNeedsUpdate) {
      this.handleActiveLoanFound();
      this.setState({componentNeedsUpdate: false});
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  handleActiveLoanFound = () => {
    this.props.contract.methods.hasBorrow().call({ from: this.props.account}).then(result => {
      if (result) {
        this.setState({hasBorrow: true});
        this.props.contract.methods.getBorrowerInfos().call({ from: this.props.account}).then(result => {
          console.log('result' + JSON.stringify(result));

          this.setState({borrowerInfos: {
              requestedAmount: this.props.web3.utils.fromWei(result[0].toString()),
              interest: result[1],
              repaymentsCount: result[2],
              investorsNumber: result[3],
              recommendersNumber: result[4],
              tScore: result[5],
              collateral: result[6],
              investedAmount: result[7],
              loanCreationDate: result[9],
              loanAddress: result[10]
          }});
        });
        console.log('Active loan found');
      } else {
        console.log('No active loan in progress');
      }
    });
  }


  handleRequestedAmount = (e) => {
    this.setState({ requestedAmount: e.target.value });
  }

  handleRepaymentsCount = (e) => {
    this.setState({ repaymentsCount: e.target.value });
  }

  handleLoanDescription = (e) => {
    this.setState({ loanDescription: e.target.value });
  }
  handleRepaydAmount = (e) => {
    this.setState({ repayAmount: e.target.value });
  }

  handleBorrow = async (event) => {
    event.preventDefault();
    console.log("Waiting on borrow transaction success...");
    console.log(      (this.state.requestedAmount*10**18).toString()
    );
    this.setState({ pendingTransaction: true });

    // get random image
    let imageFile;
    try {
      const imagePromise = fetch('https://picsum.photos/250/300?random=1');
      const response = await trackPromise(imagePromise);
      console.log(response)

      const blob = await response.blob();
      imageFile = new File([blob], 'nft.jpg', { type: "image/jpeg" });

    } catch (error) {
      console.log("error", error);
    }

    // upload token URI to IPFS (NFT Storage)
    const metadataPromise = this.props.nftStorageClient.store({
      name: 'Loan',
      description: this.state.loanDescription,
      image: imageFile
    })
    await trackPromise(metadataPromise);
    const metadata = await metadataPromise;

    console.log(metadata)
    console.log(toGatewayURL(metadata.url))

    let requestedAmountInt = this.props.web3.utils.toWei(this.state.requestedAmount.toString(), 'ether')
    let loanPromise = this.props.contract.methods.applyForLoan(
        requestedAmountInt,
        this.state.repaymentsCount,
        2,
        metadata.url)
      .send({ from: this.props.account, gas: 6000000 })
      .then(txReceipt => {
        console.log(txReceipt);
        if (txReceipt.status) {
          alert("Your loan request is created!!");
          this.handleActiveLoanFound();
          /*
                    this.props.addTxLog(txReceipt);
          */

          this.setState({requestedAmount: "", repaymentsCount: "", loanDescription: "" });
        }
        this.setState({ pendingTransaction: false });
      });
    await trackPromise(loanPromise);
  }

  handlePayCollateral = async () => {

    return
  };
  handleRepay = async () => {

    let contract;
    contract = new this.props.web3.eth.Contract(LoanContract.abi, this.state.borrowerInfos.loanAddress);

    const repaymentAmount = this.state.borrowerInfos.requestedAmount/this.state.borrowerInfos.repaymentsCount;
    contract.methods.repay()
        .send({ from: this.props.account, value: repaymentAmount*10**18})
        .then(result => {
          console.log(result);
        });
  };

  handleWithdraw = async () => {
    let contract;
    contract = new this.props.web3.eth.Contract(LoanContract.abi, this.state.borrowerInfos.loanAddress);

    contract.methods.withdraw()
      .send({ from: this.props.account })
      .then(result => {
        console.log(result);
      });
  };

  PresentBorrowerLoan = () => {

    const loanCreationDate = this.state.borrowerInfos.loanCreationDate;

    const canPayCollateral = Date.now() > loanCreationDate*1000
        + process.env.REACT_APP_LOAN_EXPIRATION_INTERVAL*1000;

    // TODO check withdraw before repayment
    let countdown = (!canPayCollateral && loanCreationDate>0) ?
        <b>
          <Countdown
              onComplete={() => this.handleActiveLoanFound()}
              daysInHours={true}
              date={loanCreationDate*1000 + process.env.REACT_APP_LOAN_EXPIRATION_INTERVAL*1000} />
        </b> : <b>finished</b>

    if (this.state.hasBorrow) {
      return (
          <div>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Title>Your loan request</Modal.Title>
              </Modal.Header>
              <Card >
                <Card.Body>
                  <Card.Title>Requested amount : {this.state.borrowerInfos.requestedAmount} ETH</Card.Title>
                  <ListGroup className="list-group-flush">
                    <ListGroupItem>Lending ends in : {countdown}</ListGroupItem>
                    <ListGroupItem>Investors number : {this.state.borrowerInfos.investorsNumber}</ListGroupItem>
                    <ListGroupItem>Recommenders number : {this.state.borrowerInfos.recommendersNumber}</ListGroupItem>
                    <ListGroupItem>Your TScore : {this.state.borrowerInfos.tScore}</ListGroupItem>
                    <ListGroupItem>Total lent amount : {this.state.borrowerInfos.investedAmount/(10**18)} ETH</ListGroupItem>
                    <ListGroupItem>Collateral : {this.state.borrowerInfos.collateral/(10**18)} ETH</ListGroupItem>
                    <ListGroupItem>Interest : {this.state.borrowerInfos.interest} %</ListGroupItem>
                    <ListGroupItem>Repayment Count : {this.state.borrowerInfos.repaymentsCount} times</ListGroupItem>
                  </ListGroup>
                </Card.Body>
              </Card>
              <Modal.Footer style={{display:"flex", flexDirection:"column"}}>
                <Form>
                  <Form.Group controlId="formBasicText">
                    <Form.Label>How much do you want to repay</Form.Label>
                    <Form.Control type="number" value={this.state.repayAmount} placeholder="1" onChange={this.handleRepaydAmount} />
                  </Form.Group>
                </Form>
                <Button disabled={!canPayCollateral} onClick={this.handlePayCollateral} variant="primary">Pay Collateral</Button>
                <Button onClick={() => this.handleWithdraw()} variant="light">Withdraw</Button>
                <Button onClick={() => this.handleRepay()} variant="light">Repay</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </div>
      )
    }
  }


  render() {

    let loanRequest = '';
    if (!this.state.hasBorrow) {
      loanRequest = <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Apply for a loan</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group controlId="formBasicText">

              <Form.Label>Requested Amount in ETH</Form.Label>
              <Form.Control type="number" value={this.state.requestedAmount} placeholder="1" onChange={this.handleRequestedAmount} />

              <Form.Label>Repayments count estimation</Form.Label>
              <Form.Control type="number" value={this.state.repaymentsCount} placeholder="2" onChange={this.handleRepaymentsCount} />

              <Form.Label>Loan description</Form.Label>
              <Form.Control
                  type="text"
                  value={this.state.loanDescription}
                  placeholder="Describe your purpose of loan"
                  onChange={this.handleLoanDescription} />
              <div className="mb-3">
                <Form.Label>Image</Form.Label>
                <input className="form-control" type="file" id="formFile" onChange={this.changeHandler}/>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{display:"flex", flexDirection:"column"}}>
          <Button onClick={this.handleBorrow} variant="primary">Borrow</Button>
        </Modal.Footer>
      </Modal.Dialog>
    }
    return (
        <div className="App">
          <LoadingSpiner/>
          {loanRequest}
          {this.PresentBorrowerLoan()}

        </div>
    )
  }


}

export default Borrower;
