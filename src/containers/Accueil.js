import React from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';

export class Accueil extends React.Component {

  render() {
    return (
      <div>
        <h1>Publication</h1>
      </div>
    )
  }

}

function AfficherSommaireNoeuds(props) {
  // props:
  //  - noeuds

  const mappingNoeuds = props.noeuds.map((noeud, idx)=>{
    return <SommaireNoeud key={idx} noeud={noeud} rootProps={props.rootProps}/>
  })

  return (
    <div>
      <h2>
        Noeuds
        <Button variant="light"
                onClick={props.rootProps.changerPage}
                value="ConfigurationNoeuds"
                disabled={!props.rootProps.modeProtege}>
          <i className="fa fa-plus-circle"/>
        </Button>
      </h2>
      {mappingNoeuds}
    </div>
  )
}

function SommaireNoeud(props) {
  const noeud = props.noeud

  var etat = noeud.actif?'Actif':'Inactif'

  return (
    <Row>
      <Col>
        <Button variant="link"
                onClick={props.rootProps.changerPage}
                value="SommaireNoeud"
                data-noeudid={noeud.noeud_id}>
          {noeud.descriptif}
        </Button>
      </Col>
      <Col>{etat}</Col>
      <Col>{noeud.securite}</Col>
    </Row>
  )
}

class AfficherSommaireDomaines extends React.Component {
  // props:
  //  - domaines

  state = {
    domaineInstaller: '',
    domainesDynamiques: [],
  }

  componentDidMount() {
    const wsa = this.props.rootProps.websocketApp
    chargerListeDomaines(wsa, valeurs=>{this.setState(valeurs)})
  }

  setInstallerDomaine = event => {
    const {value} = event.currentTarget
    this.setState({domaineInstaller: value})
  }

  installerDomaine = _ => {
    const wsa = this.props.rootProps.websocketApp
    const configDomaineList = this.state.domainesDynamiques.filter(dom=>{
      return dom.nom === this.state.domaineInstaller
    })
    installerDomaine(wsa, this.state.domaineInstaller, configDomaineList[0])
  }

  desinstallerDomaine = event => {
    const {value} = event.currentTarget

    const configDomaineList = this.state.domainesDynamiques.filter(dom=>{
      return dom.nom === value
    })

    const wsa = this.props.rootProps.websocketApp
    desinstallerDomaine(wsa, value, configDomaineList[0])
  }

  render() {
    const mappingDomaines = this.props.domaines.map((domaine, idx)=>{
      return <SommaireDomaine key={idx}
                              domaine={domaine}
                              rootProps={this.props.rootProps}
                              desinstallerDomaine={this.desinstallerDomaine} />
    })

    var domainesDynamiques = this.state.domainesDynamiques.map(domaine=>{
      return (
        <option key={domaine.nom} value={domaine.nom}>{domaine.nom}</option>
      )
    })

    return (
      <div>
        <h2>Domaines</h2>

        <Row>
          <Col md={10}>
            <Form.Group controlId="installer_domaine">
              <Form.Control as="select" onChange={this.setInstallerDomaine}>
                <option>Choisir un nouveau domaine a installer</option>
                {domainesDynamiques}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col>
            <Button onClick={this.installerDomaine}
                    variant="secondary"
                    disabled={!this.props.rootProps.modeProtege}>Installer</Button>
          </Col>
        </Row>

        {mappingDomaines}
      </div>
    )
  }

}

function SommaireDomaine(props) {
  const domaine = props.domaine

  var etat = domaine.actif?'Actif':'Inactif'

  var nomDomaine = (
    <Button variant="link"
            onClick={props.rootProps.changerPage}
            value={domaine.descriptif}>
      {domaine.descriptif}
    </Button>
  )

  return (
    <Row>
      <Col>
        {nomDomaine}
      </Col>
      <Col>{etat}</Col>
      <Col>
        <Button onClick={props.desinstallerDomaine}
                value={domaine.descriptif}
                variant="light"
                disabled={!props.rootProps.modeProtege}>
          <i className="fa fa-times-circle"/>
        </Button>
      </Col>
    </Row>
  )
}

async function chargerListeDomaines(wsa, setState) {
  // console.debug("Charger liste domaines")
  var domaines = await wsa.requeteCatalogueDomaines()
  // console.debug("Domaines dynamiques disponibles :\n%O", domaines)

  if(!domaines) domaines = []

  domaines = domaines.sort((a,b)=>{a.nom.localeCompare(b.nom)})
  setState({domainesDynamiques: domaines})
}

async function installerDomaine(wsa, domaine, params) {

  // const params = {
  //   "nom": "SenseursPassifs",
  //   "module": "millegrilles.domaines.SenseursPassifs",
  //   "classe": "GestionnaireSenseursPassifs"
  // }
  const domaineAction = 'domaines.demarrer'

  console.debug("Installer domaine %s\n%O", domaineAction, params)

  //wsa.transmettreCommande(domaineAction, params)
  const reponse = await wsa.installerDomaine(params)
  console.debug("Reponse installation domaine : %O", reponse)
}

function desinstallerDomaine(wsa, domaine, params) {

  // const params = {
  //   "nom": "SenseursPassifs",
  //   "module": "millegrilles.domaines.SenseursPassifs",
  //   "classe": "GestionnaireSenseursPassifs"
  // }
  const domaineAction = 'domaines.arreter'

  console.debug("Desinstaller domaine %s\n%O", domaineAction, params)

  wsa.transmettreCommande(domaineAction, params)

}
