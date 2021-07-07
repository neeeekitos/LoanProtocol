
import "./App.css";
import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import Recomender from "./Pages/Recomender";
import Borrower from "./Pages/Borrower";
import Lending from "./Pages/Lending";
import Dashboard from "./Component/DashBoard";
import MainPage from "./Pages/MaisPage";

function App() {
  return (

    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 8 }}>
        <MainPage />
      </div>
      <div style={{ flex: 4 }}>
        <Dashboard />
      </div>
    </div>


  );
}

export default App;