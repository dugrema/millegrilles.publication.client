import React from 'react'
import { WebSocketPublication as WebSocketManager } from '../components/webSocketManager'
import { VerificationInfoServeur } from './Authentification'
import { MenuItems } from './Menu'

import {getCertificats, getClesPrivees} from '../components/pkiHelper'
import {SignateurTransactionSubtle} from 'millegrilles.common/lib/cryptoSubtle'
import {splitPEMCerts} from 'millegrilles.common/lib/forgecommon'

import './App.css'

// import manifest from '../../../manifest.build.js'
var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}
// try {
//   manifestImport = require('../../../manifest.build.js')
// } catch(err) {
//   // Ok
// }
const manifest = manifestImport

export class ApplicationPublication extends React.Component {

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    idmg: null,                 // IDMG actif
    hebergement: false,

    signateurTransaction: '',

    page: 'Accueil',
  }

  componentDidMount() {

    const webSocketManager = new WebSocketManager(this.props.rootProps.connexionSocketIo)
    this.props.rootProps.connexionSocketIo.emit('changerApplication', 'publication', reponse=>{
      if(reponse && reponse.err) {
        console.error("Erreur enregistrements publication socket.io :\n%O", reponse)
        return
      }
      this.setState({websocketApp: webSocketManager})
    })

    this.props.setSousMenuApplication(
      <MenuItems
        changerPage={this.changerPage}
        websocketApp={webSocketManager}
        />
    )

    new Promise(async (resolve, reject) => {
      const certInfo = await getCertificats('proprietaire')
      // console.debug("Cert info : %O", certInfo)
      const fullchain = splitPEMCerts(certInfo.fullchain)
      const clesPrivees = await getClesPrivees('proprietaire')
      // console.debug("Certificat chargement signateur transaction\ncerts: %O\ncles: %O", fullchain, clesPrivees)
      const signateurTransaction = new SignateurTransactionSubtle(fullchain, clesPrivees.signer)
      this.setState({signateurTransaction})
    })

  }

  setInfoServeur = (info) => {
    this.setState(info)
  }

  changerPage = eventPage => {
    // Verifier si event ou page
    let page
    var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      page = target.value
      var dataset = target.dataset
      if(dataset) {
        paramsPage = {...dataset}
      }
    } else {
      page = eventPage
    }

    if(page === this.state.page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      this.setState({page: '', paramsPage}, ()=>{this.setState({page})})
    } else {
      // console.debug("Page : %s", page)
      this.setState({page, paramsPage})
    }
  }

  render() {

    const rootProps = {...this.props, ...this.props.rootProps, ...this.state, manifest, changerPage: this.changerPage}

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else {
      // 3. Afficher application
      page = (<p>Pret</p>)
    }

    return page
  }

}
