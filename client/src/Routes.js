import React from 'react';
import { Switch, Route } from "react-router-dom";
import { Borrower, Lender, Recommender, MainPage, AdminBoard } from "./pages/pages";

function Routes(props) {
    return (
        <Switch>
            <Route exact path="/" children={<MainPage {...props}/>}/>
                <Route path="/borrower" children={<Borrower {...props}/>} />
                <Route path="/lender" children={<Lender {...props}/>} />
                <Route path="/recommender" children={<Recommender {...props}/>} />
                <Route path="/admin" children={<AdminBoard {...props}/>} />
        </Switch>
    );
}
export default Routes;
