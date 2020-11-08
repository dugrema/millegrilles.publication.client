import React from 'react'
import {Row, Col, Button} from 'react-bootstrap'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class ListeNoeuds extends React.Component {

  state = {
    sites: '',
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSites({}).then(sites=>{
      // console.debug("Sites charges : %O", sites)
      this.setState({sites}, _=>{
        // Enregistrer evenements
        wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
      })
    })
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    wsa.unsubscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
  }

  messageRecu = event => {
    console.debug("Message MQ recu : %O", event)

    const message = event.message,
          routingKey = event.routingKey
    const action = routingKey.split('.').pop()

    // Mapping de l'action
    if(action === 'majSite') {
      const sites = majListeSites(message, this.state.sites)
      this.setState({sites})
    }
  }

  render() {
    return (
      <>
        <h1>Sites</h1>

        <AfficherListeSites sites={this.state.sites}
                            setSiteId={this.props.setSiteId} />

        <Row>
          <Col>
            <Button variant="secondary"
                    onClick={this.props.creerSite}
                    disabled={!this.props.rootProps.modeProtege}>Nouveau site</Button>
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

function majListeSites(message, sites) {

  const derniereModification = message['en-tete'].estampille
  const mappingMessage = {
    site_id: message.site_id || message['en-tete']['uuid_transaction'],
    nom_site: message.nom_site,
    '_mg-derniere-modification': derniereModification,
  }

  if( ! message.site_id ) {
    // Nouveau site, on l'ajoute a la liste
    return [...sites, mappingMessage]
  }

  // Remplacer site en memoire
  return sites.map(item=>{
    if(item.site_id === message.site_id) return mappingMessage  // Remplacer
    return item  // Aucun changement
  })

}
