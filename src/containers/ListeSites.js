import React from 'react'
import {Row, Col, Button} from 'react-bootstrap'

export default class ListeNoeuds extends React.Component {

  state = {
    sites: '',
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSites({}).then(sites=>{
      console.debug("Sites charges : %O", sites)
      this.setState({sites})
    })
  }

  render() {
    return (
      <>
        <h1>Sites</h1>

        <AfficherListeSites sites={this.state.sites}
                            setSiteId={this.props.setSiteId} />

        <Row>
          <Col>
            <Button variant="secondary">Nouveau site</Button>
          </Col>
        </Row>
      </>
    )
  }

}

function AfficherListeSites(props) {

  var sitesTries = [...props.sites]
  sitesTries = sitesTries.sort((a, b)=>{
    const nomA = a.nom_site || a.site_id,
          nomB = b.nom_site || b.site_id
    return nomA.localeCompare(nomB)
  })

  const mapSite = sitesTries.map(item=>{
    const nomSite = item.nom_site || item.site_id
    return (
      <Row key={item.site_id}>
        <Col>
          <Button variant="link" onClick={props.setSiteId} value={item.site_id}>
            {nomSite}
          </Button>
        </Col>
      </Row>
    )
  })

  return mapSite
}
