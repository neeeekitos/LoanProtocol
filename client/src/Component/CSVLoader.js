import React, {Component} from 'react';
import Papa from "papaparse";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { ethers } from 'ethers';
import SimpleStorageContract from "../contracts/DynamicCollateralLending.json";

class Popup extends Component {

    constructor(props) {
        super(props);

        this.state = {
            mnemonic: process.env.YOUR_MNEMONIC, //your memonic;
            wallet: null,
            closePopup: this.props.closePopup,
            selectedFile: null,
            isFilePicked: false
        }
    }

    changeHandler = (event) => {
        this.setState({selectedFile : event.target.files[0]});
        this.setState({isFilePicked : true});
    };

    uploadOnChain = (data) => {
        console.log("Uploading on the blockchain");

        let provider = ethers.getDefaultProvider();
        //const provider = new ethers.providers.WebSocketProvider(process.env.SOCKET_PROVIDER);

        let contractAddress = this.props.contract.options.address;
        let contract = new ethers.Contract(contractAddress, SimpleStorageContract.abi, provider);

        let overrides;
        let tx;
        let loanContract;
        let loanContracts = this.loanContracts || [];


        data.forEach(async function callback(row, index) {
            let wallet = new ethers.Wallet(row.mnemonic);
            let contractWithSigner = contract.connect(wallet);

            switch (row.typeOfTx) {
                case "Borrow":
                    tx = await contractWithSigner.applyForLoan(
                        row.requestedAmount,
                        row.repaymentsCount,
                        2);
                    console.log(tx);
                    loanContracts.push({loanAddr: tx.logs[0].args.loanAddr, projectId: row.projectId});

                    break;
                case "Lend":
                    overrides = {
                        value: ethers.utils.parseEther(row.value.toString()) // ether in this case MUST be a string
                    };

                    loanContract = loanContracts.find(x => x.projectId === row.projectId);
                    if (loanContract !== 'undefined')
                        tx = await contractWithSigner.invest(loanContract.loanAddr, overrides);
                    break;
                case "Recommend":
                    overrides = {
                        value: ethers.utils.parseEther(row.value.toString()) // ether in this case MUST be a string
                    };

                    loanContract = loanContracts.find(x => x.projectId === row.projectId);
                    if (loanContract !== 'undefined')
                        tx = await contractWithSigner.recommend(loanContract.loanAddr, overrides);
                    break;
            }
            console.log(tx.hash);
        });
    }

    handleSubmission = async () => {
        let data = this;
        console.log(this.state.selectedFile);
        Papa.parse(this.state.selectedFile, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log(results);
                data.uploadOnChain(results.data);
            }
        });
    };

    render() {
        return (
            <div className='popup'>
                <div className='popup_inner'>
                    <Modal.Dialog centered>
                        <Modal.Header>
                            <Modal.Title>Active loan requests</Modal.Title>
                        </Modal.Header>
                        <div className="mb-3">
                            <input className="form-control" type="file" id="formFile" onChange={this.changeHandler}/>
                        </div>
                        {this.state.isFilePicked ? (
                            <p>You can import your file now</p>
                        ) : (
                            <p>Select a file to show details</p>
                        )}
                        <div>
                            <Button variant="primary" style={{ margin: "10px" }} onClick={this.handleSubmission}>Submit</Button>
                            <Button variant="secondary"  style={{ margin: "10px" }} onClick={this.props.closePopup}>Close</Button>
                        </div>
                    </Modal.Dialog>
                </div>
            </div>
        );
    }
}
export default Popup;
