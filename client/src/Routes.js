import React from 'react';
import { Switch, Route } from "react-router-dom";
import { Borrower, Lender, Recommender, MainPage, AdminBoard } from "./pages/pages";
import { NFTStorage } from 'nft.storage';

function Routes(props) {

    const nftStorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE });

    return (
        <Switch>
            <Route exact path="/" children={<MainPage {...props}/>}/>
            <Route path="/borrower" children={<Borrower nftStorageClient={nftStorage} {...props}/>} />
            <Route path="/lender" children={<Lender nftStorageClient={nftStorage} {...props}/>} />
            <Route path="/recommender" children={<Recommender nftStorageClient={nftStorage} {...props}/>} />
            <Route path="/admin" children={<AdminBoard {...props}/>} />
        </Switch>
    );
}
export default Routes;
