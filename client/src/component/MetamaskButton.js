import React from "react";
import {useMetaMask} from "metamask-react";
import {Button, Navbar} from "react-bootstrap";


export default function MetamaskButton(props) {

    const { status, connect, account } = useMetaMask();

    let ethStatus;

    if (status === "initializing") ethStatus = <div><Navbar.Text>Synchronisation with MetaMask ongoing...</Navbar.Text></div>

    if (status === "unavailable") ethStatus = <div><Navbar.Text>Please, install the MetaMask wallet</Navbar.Text></div>

    if (status === "notConnected") ethStatus = <Button onClick={async () => {await connect(); await props.initWeb3()}}>Connect to MetaMask</Button>

    if (status === "connecting") ethStatus = <div><Navbar.Text>Connecting...</Navbar.Text></div>

    if (status === "connected") {
        ethStatus = <div><Navbar.Text>Signed as: {account.replace(account.substring(6,38), "...")}</Navbar.Text></div>
    }

    return ethStatus;
}
