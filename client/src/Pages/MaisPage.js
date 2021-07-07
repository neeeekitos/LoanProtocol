import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button, Card, Form, Modal, Nav, Navbar } from "react-bootstrap";
import Popup from "../Component/CSVLoader";
import dbManagement from "../Component/database";
import getWeb3 from "../Component/getWeb3";
import SimpleStorageContract from "../contracts/DynamicCollateralLending.json";
import loadRing from "./../assets/ring.gif";
import Borrower from './Borrower';
import Lending from './Lending';
import Recomender from './Recomender'
import './Borrower.css';





class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            accounts: null,
            web3: null,
            contract: null,
            balance: null,
            lending: false,
            borrowing: false,
            recommender: false,
        };
        this.handleBorrow = this.handleBorrow.bind(this);

    }



    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = SimpleStorageContract.networks[networkId];

            const instance = new web3.eth.Contract(
                SimpleStorageContract.abi,
                deployedNetwork && deployedNetwork.address,
            );
            this.state.contract = instance;

            this.state.balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');

            console.log(instance);
            this.setState({ web3, accounts, contract: instance }, this.runExample);
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }

    };

    handleBorrow = async (event) => {
        event.preventDefault();
        console.log("Waiting on borrow transaction success...");
        this.setState({ pendingTransaction: true });
    
        await this.state.contract.methods.applyForLoan(
          this.state.requestedAmount,
          this.state.repaymentsCount,
          2)
          .send({ from: this.state.accounts[0], gas: 800000 },
            (err, txHash) => this.setState({ isMining: true, txHash }));
    
        // mining is finished, display the gas used for the transaction
        await this.state.web3.eth.getTransactionReceipt(this.state.txHash,
          (err, txReceipt) => {
            console.log(txReceipt);
            if (txReceipt.status) alert("Your loan request is created!!");
            this.setState({ pendingTransaction: false });
          });
        }


    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <div>
                <Button variant="Borrowing" onClick={() => { this.setState({ lending: false, borrowing: true, recommender: false }) }}  >Borrowing</Button>
                <Button variant="Lending" onClick={() => { this.setState({ lending: true, borrowing: false, recommender: false }) }}>Lending</Button>
                <Button variant="Recommender" onClick={() => { this.setState({ lending: false, borrowing: false, recommender: true }) }}>Recommender</Button>

                {this.state.borrowing ? (<Borrower account={this.state.accounts[0]} balance={this.state.balance } handleBorrow={this.handleBorrow}  />) : this.state.lending? (<Lending account={this.state.accounts[0]} balance={this.state.balance }  handleBorrow={this.handleBorrow}/>): this.state.recommender ?(<Recomender/>) : null }

            </div>
        );
    }
}

export default MainPage;
