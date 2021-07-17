import React, { Component } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import Popup from "./CSVLoader";


class Dashboard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            accounts: null,
            web3: null,
            contract: null,
            balance: null,
            orbitDb: null,
            showPopup: false,
        };
        this.togglePopup = this.togglePopup.bind(this);
        this.handleBorrow = this.handleBorrow.bind(this)
    }

    componentDidMount = () => {
        this.setState({ web3: this.props.web3, accounts: this.props.accounts, contract: this.props.contract, balance: this.props.balance, orbitDb: this.props.orbitDb });
    };

    togglePopup = () => {
        this.setState({
            showPopup: !this.state.showPopup
        });
    }

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
            <>

                <Modal.Dialog>
                    <Modal.Header >
                        <Modal.Title>Dashboard of the project</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        
                       
                        <Card>
                            <Card.Header>Logs</Card.Header>
                            <Card.Body>
                                <blockquote className="blockquote mb-0">
                                    <p>
                                        Logs from blockchain (events)
                                    </p>

                                </blockquote>
                            </Card.Body>
                        </Card>
                        <Card>
                            <Card.Header>Current Loan</Card.Header>
                            <Card.Body>
                                <blockquote className="blockquote mb-0">
                                    <p>
                                        List of your current loan/ advancement
                                    </p>

                                </blockquote>
                            </Card.Body>
                        </Card>

                    </Modal.Body>
                    <Modal.Footer>

                    </Modal.Footer>
                </Modal.Dialog>
                <Button onClick={this.togglePopup} variant="dark">show popup</Button>
                {this.state.showPopup ?
                    <Popup
                        text='Active loan requests'
                        closePopup={this.togglePopup}
                        contract = {this.state.contract}
                    />
                    : null
                }
            </>);
    }
}

export default Dashboard;
