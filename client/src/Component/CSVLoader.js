import React, {Component,useState} from 'react';
import Papa from "papaparse";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

class Popup extends Component {

    constructor(props) {
        super(props);

        this.state = {
            closePopup: this.props.closePopup,
            selectedFile: null,
            isFilePicked: false
        }
    }

    changeHandler = (event) => {
        this.setState({selectedFile : event.target.files[0]});
        this.setState({isFilePicked : true});
    };

    handleSubmission = () => {
        console.log(this.state.selectedFile);
        Papa.parse(this.state.selectedFile, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log(results);
                return results.data;
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
