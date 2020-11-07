import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup} from 'react-bootstrap'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class EditerSite extends React.Component {

  state = {
    site: '',

    // Champs d'edition a l'ecran
    nom_site: '',
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSite(this.props.siteId).then(site=>{
      console.debug("Site charge : %O", site)
      this.setState({site}, _=>{
        // Enregistrer evenements
        wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
      })
    })
  }

  messageRecu = event => {
    console.debug("Message MQ recu : %O", event)

    const message = event.message,
          routingKey = event.routingKey
    const action = routingKey.split('.').pop()

    if(action === 'majSite' && this.props.siteId === message.site_id) {
      console.debug("Modifier site avec transaction : %O", message)
      const siteModifie = {...this.state.site, ...message}
      this.setState({site: siteModifie})
    }
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  resetChamps = _ => {
    this.setState({
      nom: '',
    })
  }

  sauvegarder = event => {
    console.debug("Sauvegarder changements formulaire site")
  }

  render() {
    const nomSite = this.state.site.nom_site || this.props.siteId

    var sectionDonnees = <ChargementEnCours />
    if(this.state.site) {
      sectionDonnees = <SectionDonnees changerChamp={this.changerChamp} {...this.state} />
    }

    return (
      <>
        <h1>Editer site {nomSite}</h1>

        <Row>
          <Col md={3}>Identificateur unique</Col>
          <Col md={9}>{this.props.siteId}</Col>
        </Row>

        {sectionDonnees}

        <Row>
          <Col>
            <Button onClick={this.sauvegarder}>
              Sauvegarder
            </Button>
            <Button variant="secondary" onClick={this.props.retour}>
              Retour
            </Button>
          </Col>
        </Row>
      </>
    )
  }

}

function ChargementEnCours(props) {
  return <p>Chargement en cours</p>
}

function SectionDonnees(props) {
  return (
    <FormInfoSite {...props}/>
  )
}

function FormInfoSite(props) {

  return (
    <Form>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>Nom site</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name="nom_site" value={props.nom_site || props.site.nom_site} onChange={props.changerChamp}/>
      </InputGroup>
    </Form>
  )
}
