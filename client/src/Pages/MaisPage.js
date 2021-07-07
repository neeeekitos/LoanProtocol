import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Borrower from './Borrower';
import './Borrower.css';
import Lending from './Lending';
import Recomender from './Recomender';







class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            accounts: null,
            web3: null,
            contract: null,
            balance: null,
            orbitDb: null,
            lending: false,
            borrowing: false,
            recommender: false,
        };
    }

    componentDidMount = () => {
        this.setState({ web3: this.props.web3, accounts: this.props.accounts, contract: this.props.contract, balance: this.props.balance, orbitDb: this.props.orbitDb });
    };




    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <div>
                <Button variant="Borrowing" onClick={() => { this.setState({ lending: false, borrowing: true, recommender: false }) }}  >Borrowing</Button>
                <Button variant="Lending" onClick={() => { this.setState({ lending: true, borrowing: false, recommender: false }) }}>Lending</Button>
                <Button variant="Recommender" onClick={() => { this.setState({ lending: false, borrowing: false, recommender: true }) }}>Recommender</Button>

                {this.state.borrowing ? (<Borrower  accounts={this.state.accounts} web3={this.state.web3} balance={this.state.balance} orbitDb={this.state.orbitDb} contract={this.state.contract}/>) : this.state.lending ? (<Lending account={this.state.accounts[0]} balance={this.state.balance} />) : this.state.recommender ? (<Recomender />) : null}

            </div>
        );
    }
}

export default MainPage;
