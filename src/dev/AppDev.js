import React from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import openSocket from 'socket.io-client'

import {wrap as comlinkWrap, releaseProxy} from 'comlink'
import {getCertificats, getClesPrivees} from '../components/pkiHelper'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

// import { WebSocketManager } from 'millegrilles.common/lib/webSocketManager'
import { Trans } from 'react-i18next';

/* eslint-disable import/no-webpack-loader-syntax */
import WebWorker from 'worker-loader!@dugrema/millegrilles.common/lib/browser/chiffrage.worker'

// import {ConnexionWebsocket} from '../containers/Authentification'
import {ApplicationPublication} from '../containers/App'

import '../containers/App.css'
import '../containers/Layout.css'

import manifest from '../manifest.build.js'
// const manifest = {
//   date: "DUMMY",
//   version: "DUMMY",
// }

const NOM_USAGER_PROPRIETAIRE = 'proprietaire'

async function initWorker() {
  const worker = new WebWorker()
  const proxy = comlinkWrap(worker)

  const certInfo = await getCertificats(NOM_USAGER_PROPRIETAIRE)
  if(certInfo && certInfo.fullchain) {
    const fullchain = splitPEMCerts(certInfo.fullchain)
    const clesPrivees = await getClesPrivees(NOM_USAGER_PROPRIETAIRE)

    // Initialiser le CertificateStore
    await proxy.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
    console.debug("Certificat : %O, Cles privees : %O", certInfo.fullchain, clesPrivees)

    // Initialiser web worker
    await proxy.initialiserFormatteurMessage({
      certificatPem: certInfo.fullchain,
      clePriveeSign: clesPrivees.signer,
      clePriveeDecrypt: clesPrivees.dechiffrer,
      DEBUG: false
    })

  } else {
    throw new Error("Pas de cert charge")
  }

  return {worker, proxy}
}

export class AppDev extends React.Component {

  state = {
    //websocketApp: null,         // Connexion socket.io
    modeProtege: false,         // Mode par defaut est lecture seule (prive)
    sousMenuApplication: null,
    connexionSocketIo: null,

    webWorker: '',
    webWorkerInstance: '',
  }

  componentDidMount() {
    initWorker()
      .then(({worker, proxy}) => {
        this.setState({webWorkerInstance: worker, webWorker: proxy})
      })
  }

  componentWillUnmount() {
    if(this.state.webWorker) {
      console.debug("Nettoyage worker, release proxy")
      this.state.webWorker[releaseProxy]()
      this.state.webWorkerInstance.terminate()
    }
  }

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  // setWebsocketApp = websocketApp => {
  //   // Set la connexion Socket.IO. Par defaut, le mode est prive (lecture seule)
  //   this.setState({websocketApp, modeProtege: false})
  // }

  setConnexionSocketIo = connexionSocketIo => {
    this.setState({connexionSocketIo})
  }

  toggleProtege = async event => {
    const modeToggle = ! this.state.modeProtege
    if(modeToggle) {
      console.debug("Activer mode protege")
      this.state.connexionSocketIo.emit('upgradeProtege', reponse=>{
        if(reponse && reponse.err) {
          console.error("Erreur activation mode protege")
        }
        this.setState({modeProtege: reponse})
      })
    } else {
      this.desactiverProtege()
    }

  }

  desactiverProtege = () => {
    console.debug("Revenir a mode prive")
    if(this.state.connexionSocketIo) {

      this.state.connexionSocketIo.emit('downgradePrive', reponse=>{
        if(reponse && reponse.err) {
          console.error("Erreur downgrade vers mode prive")
        }
        this.setState({modeProtege: false})
      })

    } else {
      this.setState({modeProtege: false})
    }
  }

  render() {

    const rootProps = {...this.state, manifest, toggleProtege: this.toggleProtege}

    let page;
    if(!this.state.connexionSocketIo) {
      // Connecter avec Socket.IO
      page = <ConnexionWebsocket setConnexionSocketIo={this.setConnexionSocketIo} desactiverProtege={this.desactiverProtege} />
    } else {
      // 3. Afficher application
      page = <ApplicationPublication setSousMenuApplication={this.setSousMenuApplication} rootProps={{...this.state}} />
    }

    return <Layout
              changerPage={this.changerPage}
              page={page}
              rootProps={rootProps}
              sousMenuApplication={this.state.sousMenuApplication}
              appProps={this.props} />
  }

}

export class ConnexionWebsocket extends React.Component {

  state = {
    erreur: false,
    erreurMessage: '',
  }

  componentDidMount() {
    this.authentifier()
  }

  async authentifier() {
    const connexionSocketIo = openSocketHelper()
    this.props.setConnexionSocketIo(connexionSocketIo)
  }

  render() {
    let page;
    if(this.state.erreur) {
      page = <p>Erreur : {this.state.erreurMessage}</p>
    } else {
      page = <p>Connexion a Socket.IO de Publication en cours ...</p>
    }

    return page
  }
}

export class Layout extends React.Component {

  render() {
    // Application independante (probablement pour DEV)
    return (
      <div className="flex-wrapper">
        <div>
          <Entete changerPage={this.props.changerPage}
                  sousMenuApplication={this.props.sousMenuApplication}
                  rootProps={this.props.rootProps} />
          <Contenu page={this.props.page}/>
        </div>
        <Footer rootProps={this.props.rootProps}/>
      </div>
    )
  }
}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} sousMenuApplication={props.sousMenuApplication} rootProps={props.rootProps}/>
    </Container>
  )
}

function Contenu(props) {
  return (
    <Container className="main-body">
      {props.page}
    </Container>
  )
}

function Footer(props) {

  const idmg = props.rootProps.idmg
  var qrCode = 'QR'

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>application.publicationAdvert</Trans>{' '}
              <span title={props.rootProps.manifest.date}>
                <Trans values={{version: props.rootProps.manifest.version}}>application.publicationVersion</Trans>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}

function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  var menuItems = props.sousMenuApplication

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        {menuItems}
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

function openSocketHelper() {
  let socket = openSocket('/', {
    path: '/publication/socket.io',
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 500,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5
  })

  return socket;
}
