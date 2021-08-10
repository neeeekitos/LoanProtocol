import React, { Component } from 'react';
import { Button, Form, Modal } from "react-bootstrap";  

class RecommenderPopup extends Component {

    constructor(props) {
        super(props);

        this.state = {
            recommendAmount:0,
            recommendScore:0
        }

        this.handleSubmission=this.handleSubmission.bind(this);
        this.handleRecommendAmount=this.handleRecommendAmount.bind(this)
        this.handleRecommendScore=this.handleRecommendScore.bind(this)
    }



    handleSubmission =  (e) => {
        this.setState({amountToRecommend: e.target.value})
        console.log(this.state.amountToRecommend);
        this.props.handleRecommend(this.state.amountToRecommend, this.state.recommendationScore)
    };

    handleRecommendAmount = (e) => {
        this.setState({amountToRecommend: e.target.value})
    }

    handleRecommendScore = (e) => {
        this.setState({recommendationScore: e.target.value})
    }

    render() {
        return (
            <div className='popup'>
                <div className='popup_inner'>
                    <Modal.Dialog centered>
                        <Modal.Header>
                            <Modal.Title>How much do you want to Recommend ?</Modal.Title>
                        </Modal.Header>
                        <Form>
                            <Form.Group controlId="formBasicText">

                                <Form.Label>Recommend Amount in ETH</Form.Label>
                                <Form.Control type="number" value={this.state.amountToRecommend} placeholder="1" onChange={this.handleRecommendAmount} />

                                <Form.Label>Recommendation score (0 to 100)</Form.Label>
                                <Form.Control type="number" value={this.state.recommendationScore} placeholder="1" onChange={this.handleRecommendScore} />
                            </Form.Group>
                        </Form>
                        <div>
                            <Button variant="primary" style={{ margin: "10px" }} onClick={this.handleSubmission}>Recommend</Button>
                            <Button variant="secondary" style={{ margin: "10px" }} onClick={this.props.closePopup}>Close</Button>
                        </div>
                    </Modal.Dialog>
                </div>
            </div>
        );
    }
}
export default RecommenderPopup;
