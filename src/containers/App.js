import React from 'react'
import {Alert} from 'react-bootstrap'

import { WebSocketPublication as WebSocketManager } from '../components/webSocketManager'
import { VerificationInfoServeur } from './Authentification'
import { MenuItems } from './Menu'

import {getCertificats, getClesPrivees} from '../components/pkiHelper'
import {SignateurTransactionSubtle} from '@dugrema/millegrilles.common/lib/cryptoSubtle'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

import ListeSites from './ListeSites'
import EditerSite from './EditerSite'

import './App.css'
import $ from 'jquery'
window.jQuery = $

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

    websocketApp: '',
    signateurTransaction: '',

    siteId: '',  // Site en cours de modification
    err: '',
  }

  componentDidMount() {

    const wsa = new WebSocketManager(this.props.rootProps.connexionSocketIo)
    this.props.rootProps.connexionSocketIo.emit('changerApplication', 'publication', reponse=>{
      if(reponse && reponse.err) {
        console.error("Erreur enregistrements publication socket.io :\n%O", reponse)
        return
      }
      this.setState({websocketApp: wsa})
    })

    this.props.setSousMenuApplication(
      <MenuItems
        changerPage={this.changerPage}
        websocketApp={wsa}
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

  setSiteId = siteId => {
    if(siteId.currentTarget) siteId = siteId.currentTarget.value  // Mapper value bouton
    // console.debug("Set site id : %O", siteId)
    this.setState({siteId})
  }

  changerPage = event => {
    // Retour page accueil
    this.setState({siteId: ''})
  }

  creerSite = async _ => {
    console.debug("Creer nouveau site")
    const domaineAction = 'Publication.majSite',
          transaction = {}

    // Signer transaction, soumettre
    const signateurTransaction = this.state.signateurTransaction
    await signateurTransaction.preparerTransaction(transaction, domaineAction)
    const siteId = transaction['en-tete']['uuid_transaction']
    console.debug("Nouveau site %s, Transaction a soumettre : %O", siteId, transaction)

    const wsa = this.state.websocketApp
    try {
      const reponse = await wsa.majSite(transaction)
      this.setState({siteId})
    } catch (err) {
      this.setState({err})
    }
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  render() {

    const rootProps = {
      ...this.props, ...this.props.rootProps, ...this.state,
      manifest,
      changerPage: this.changerPage,
      setSiteId: this.setSiteId,
    }

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else if(this.state.siteId) {
      // Editer un site selectionne
      page = <EditerSite rootProps={rootProps}
                         siteId={this.state.siteId}
                         retour={this.setSiteId} />
    } else {
      // Afficher la liste des sites
      page = <ListeSites rootProps={rootProps}
                         setSiteId={this.setSiteId}
                         creerSite={this.creerSite} />
    }

    return (
      <>
        <AlertErreur err={this.state.err} clearErreur={this.clearErreur}/>
        {page}
      </>
    )
  }

}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err!==''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{''+props.err}</pre>
    </Alert>
  )
}
