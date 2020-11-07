import React from 'react'
import {Row, Col, Button} from 'react-bootstrap'

export default class EditerSite extends React.Component {

  render() {
    return (
      <>
        <h1>Editer site {this.props.siteId}</h1>

        <Row>
          <Col>
            <Button variant="secondary" onClick={this.props.retour}>
              Retour
            </Button>
          </Col>
        </Row>
      </>
    )
  }

}
