import React, { useState } from 'react';
import { ReactComponent as Logo } from '../logo.svg';
import {Nav, Navbar} from "react-bootstrap";
import { BrowserRouter as Router, Link} from "react-router-dom";
import {useMetaMask} from "metamask-react";
import MetamaskButton from "./MetamaskButton";
import Routes from "../Routes";


export default function CustomNavbar(props) {

    const { status, account } = useMetaMask();
    const [balance, setBalance] = useState(0);


    if (status === "connected" && props.web3) {

        props.web3.eth.getBalance(account).then(value => {
            setBalance(props.web3.utils.fromWei(value, 'ether'));
        });
    }

    return (
        <div>
            <Router>
                <Navbar
                    styled
                    style={{position: "relative", top: 0, width: "100vw", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgb(234 234 234)"}}
                >

                    <Navbar.Brand href="/">
                        <Logo fill='radial-gradient(circle, rgba(238,174,202,1) 0%, rgba(148,187,233,1) 100%)' style={{ height: '40px', width: '40px', paddingRight: '10px'}}/>
                        Lending Platform
                    </Navbar.Brand>

                    <Nav>
                        <Link to="/" className="navbar-light navbar-nav nav-link">Home</Link>
                        <Link to="/borrower" className="navbar-light navbar-nav nav-link">Borrower</Link>
                        <Link to="/lender" className="navbar-light navbar-nav nav-link">Lender</Link>
                        <Link to="/recommender" className="navbar-light navbar-nav nav-link">Recommender</Link>
                        <Link to="/admin" className="navbar-light navbar-nav nav-link">AdminBoard</Link>
                    </Nav>

                    <MetamaskButton/>

                    <Navbar.Text hidden={status !== 'connected'}>Balance: {balance} ETH</Navbar.Text>
                </Navbar>
                <Routes
                    status={status}
                    account={account}
                    contract={props.contract}
                    orbitDb={props.orbitDb}
                    web3={props.web3}
                />
            </Router>
        </div>
    );
}
