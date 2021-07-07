import React, { useEffect, useState, Component } from "react";
import { Modal, Button, Card } from "react-bootstrap"
import getWeb3 from "./getWeb3";





class Dashboard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            accounts: null,
            web3: null,
            balance: null,
           
        };
    }


    componentDidMount = async () => {

            try {
                // Get network provider and web3 instance.
                const web3 = await getWeb3();
                const accounts = await web3.eth.getAccounts();

                this.state.balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');
                this.setState({ web3, accounts});

            }
            catch (error) {
                // Catch any errors for any of the above operations.
                alert(
                    `Failed to load web3, accounts, or contract. Check console for details.`,
                );
                console.error(error);
            }
    };

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }

        return (
            <>

                <Modal.Dialog>
                    <Modal.Header >
                        <Modal.Title>Your personal dashboard</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        <Card>
                            <Card.Header>Accout address</Card.Header>
                            <Card.Body>
                                <blockquote className="blockquote mb-0">
                                    <p>
                                        ${this.state.accounts[0]}
                                    </p>

                                </blockquote>
                            </Card.Body>
                        </Card>
                        <Card>
                            <Card.Header>TScore</Card.Header>
                            <Card.Body>
                                <blockquote className="blockquote mb-0">
                                    <p>
                                       Your TScore
                                    </p>

                                </blockquote>
                            </Card.Body>
                        </Card>
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
            </>);
    }
}

export default Dashboard;
