import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert} from 'react-bootstrap'

export default class InfoSite extends React.Component {

  state = {
    // Champs d'edition a l'ecran
    nom_site: '',
    languages: '',
    noeuds_urls: '',
    titre: '',

    err: '',
    confirmation: '',
  }

  messageRecu = event => {
    console.debug("Message MQ recu : %O", event)

    const message = event.message,
          routingKey = event.routingKey
    const action = routingKey.split('.').pop()

    if(action === 'majSite' && this.props.siteId === message.site_id) {
      console.debug("Modifier site avec transaction : %O", message)
      const siteModifie = {...this.state.site, ...message}
      this.setState({site: siteModifie}, _=>{console.debug("MAJ apres update : %O", this.state)})
    }
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  changerChampMultilingue = event => {
    const {name, value} = event.currentTarget
    var langue = event.currentTarget.dataset.langue
    // console.debug("Changer champ multilingue %s, langue:%s = %s", name, langue, value)

    var valeur = this.state[name] || this.props.site[name]
    this.setState({[name]: {...valeur, [langue]: value}})
  }

  resetChamps = _ => {
    this.setState({
      nom: '',
    })
  }

  ajouterLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.props.site.languages || []
    }

    // Dedupe
    const dictLanguages = {}
    languages = [...languages, language].filter(item=>{
      if(dictLanguages[item]) return false
      dictLanguages[item] = true
      return true
    })

    console.debug("Nouvelle liste languages : %O", languages)

    // Initialiser les champs multilingues au besoin
    const valeursMultilingues = {}

    const listeChamps = ['titre']

    listeChamps.forEach(item=>{
      var coll = {}
      languages.forEach(lang=>{coll[lang]=''})
      const valeursExistantes = this.state[item] || this.props.site[item]
      coll = {...coll, ...valeursExistantes}
      valeursMultilingues[item] = coll
    })

    this.setState({languages, ...valeursMultilingues}, _=>{console.debug("State : %O", this.state)})
  }

  supprimerLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    console.debug("Supprimer language : %s", language)
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.props.site.languages || []
    }

    // Supprimer (filtrer) entree
    languages = languages.filter(item=>item !== language)
    this.setState({languages})
  }

  ajouterNoeud = noeudId => {
    var nouveauNoeud = noeudId
    console.debug("Ajouter noeud %s", nouveauNoeud)

    var noeuds = this.state.noeuds_urls
    if( ! noeuds ) {
      noeuds = this.props.noeuds_urls || {}
    }

    noeuds[nouveauNoeud] = []
    this.setState({noeuds_urls: noeuds, noeud_id: ''}, _=>{console.debug("Ajout noeud, state : %O", this.state)})
  }

  ajouterUrl = (noeudId, url) => {
    console.debug("Ajouter url %s a noeudId %s", url, noeudId)
    var noeuds_urls = this.state.noeuds_urls || this.props.site.noeuds_urls

    var urls = noeuds_urls[noeudId] || []
    urls.push(url)
    noeuds_urls[noeudId] = urls

    this.setState({noeuds_urls})
  }

  supprimerUrl = (noeudId, url) => {
    console.debug("Ajouter url %s a noeudId %s", url, noeudId)
    var noeuds_urls = this.state.noeuds_urls || this.props.site.noeuds_urls

    var urls = noeuds_urls[noeudId] || []
    urls = urls.filter(item=>item!==url)
    noeuds_urls[noeudId] = urls

    this.setState({noeuds_urls})
  }

  sauvegarder = async event => {
    console.debug("Sauvegarder changements formulaire site")

    // Conserver changements au formulaire
    const domaineAction = 'Publication.majSite'
    var transaction = {}

    const champsFormulaire = ['nom_site', 'languages', 'noeuds_urls', 'titre']

    champsFormulaire.forEach(item=>{
      if(this.state[item]) transaction[item] = this.state[item]
    })

    if(Object.keys(transaction).length === 0) {
      console.debug("Aucun changement au formulaire")
      return
    }

    transaction['site_id'] = this.props.siteId

    try {
      // const signateurTransaction = this.props.rootProps.signateurTransaction
      // await signateurTransaction.preparerTransaction(transaction, domaineAction)
      const webWorker = this.props.rootProps.webWorker
      transaction = await webWorker.formatterMessage(transaction, domaineAction)
      const siteId = transaction['en-tete']['uuid_transaction']
      console.debug("Maj site %s, Transaction a soumettre : %O", siteId, transaction)

      const wsa = this.props.rootProps.websocketApp
      const reponse = await wsa.majSite(transaction)
      const valeursReset = {}
      champsFormulaire.forEach(item=>{
        valeursReset[item] = ''
      })

      this.setState(valeursReset, _=>{
        console.debug("MAJ apres update : %O", this.state)
        this.setState({confirmation: "Mise a jour du site reussie"})
      })
    } catch (err) {
      this.setState({err})
    }
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  clearConfirmation = _ => {
    this.setState({confirmation: ''})
  }

  render() {
    var sectionDonnees = <ChargementEnCours />
    if(this.props.site) {
      sectionDonnees = (
        <SectionDonnees changerChamp={this.changerChamp}
                        changerChampMultilingue={this.changerChampMultilingue}
                        ajouterLanguage={this.ajouterLanguage}
                        supprimerLanguage={this.supprimerLanguage}
                        ajouterNoeud={this.ajouterNoeud}
                        ajouterUrl={this.ajouterUrl}
                        supprimerUrl={this.supprimerUrl}
                        {...this.props}
                        {...this.state} />
      )
    }

    return (
      <>
        <h2>Identification</h2>

        <AlertErreur err={this.state.err} clearErreur={this.clearErreur} />
        <AlertConfirmation confirmation={this.state.confirmation} clearConfirmation={this.clearConfirmation} />

        <Row>
          <Col md={3}>Identificateur unique</Col>
          <Col md={9}>{this.props.siteId}</Col>
        </Row>

        {sectionDonnees}

        <Row>
          <Col>
            <Button onClick={this.sauvegarder}
                    disabled={!this.props.rootProps.modeProtege}>
              Sauvegarder
            </Button>
            <Button variant="secondary"
                    onClick={this.props.retour}>
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

  var nomSite = props.nom_site
  if(!nomSite && props.site.nom_site) {
    nomSite = props.site.nom_site
  }

  return (
    <Form>

      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>Nom site</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name="nom_site" value={nomSite} onChange={props.changerChamp}/>
      </InputGroup>

      <Languages {...props} />

      <TitreSite languages={props.languages || props.site.languages}
                 titre={props.titre || props.site.titre}
                 changerChampMultilingue={props.changerChampMultilingue} />

      <Noeuds noeuds_urls={props.noeuds_urls || props.site.noeuds_urls}
              noeudsDisponibles={props.noeudsDisponibles}
              ajouterNoeud={props.ajouterNoeud}
              ajouterUrl={props.ajouterUrl}
              supprimerUrl={props.supprimerUrl} />

    </Form>
  )
}

class Languages extends React.Component {

  state = {
    nouveauLanguage: '',
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  ajouterLanguage = event => {
    this.props.ajouterLanguage(event.currentTarget.value)
    this.setState({nouveauLanguage: ''})
  }

  render() {

    const languages = this.props.languages || this.props.site.languages
    var renderedLanguages = ''
    if(languages) {
      renderedLanguages = languages.map(item=>{
        return <Button key={item} variant="secondary" onClick={this.props.supprimerLanguage} value={item}>{item} <i className="fa fa-close"/></Button>
      })
    }

    return (
      <>
        <h2>Languages</h2>

        <p>Ajouter les languages sous format ISO 639-1 (fr=francais, en=anglais, es=espagnol)</p>

        <p>La premiere langue dans la liste est celle par defaut pour le site.</p>

        <Row>
          <Col md={4}>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>Language</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl name="nouveauLanguage" value={this.state.nouveauLanguage} onChange={this.changerChamp}/>
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={this.ajouterLanguage} value={this.state.nouveauLanguage}>Ajouter</Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
          <Col md={8}>
            {renderedLanguages}
          </Col>
        </Row>
      </>
    )
  }

}

function TitreSite(props) {
  return (
    <>
      <h2>Titre</h2>

      <p>Titre affiche sur le site.</p>

      <ChampInputMultilingue languages={props.languages}
                             name="titre"
                             values={props.titre}
                             changerChamp={props.changerChampMultilingue} />
    </>
  )
}

export function ChampInputMultilingue(props) {

  if( ! props.languages || ! props.values ) return ''

  const renderedInput = props.languages.map(langue=>{
    const nomChamp = props.name  // + '_' + langue

    return (
      <InputGroup key={langue}>
        <InputGroup.Prepend>
          <InputGroup.Text>{langue}</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name={nomChamp}
                     value={props.values[langue]}
                     data-row={props.idxRow}
                     data-langue={langue}
                     onChange={props.changerChamp} />
      </InputGroup>
    )
  })

  return renderedInput
}

class Noeuds extends React.Component {

  state = {
    noeud_id: '',
  }

  selectionnerNoeud = event => {
    const noeud_id = event.currentTarget.value
    console.debug("Selectionner noeud %s", noeud_id)
    this.setState({noeud_id})
  }

  ajouterNoeud = event => {
    var noeudId = this.state.noeud_id
    console.debug("Ajouter noeud %s", noeudId)
    this.props.ajouterNoeud(noeudId)
    this.setState({noeud_id: ''}, _=>{console.debug("Ajout noeud, state : %O", this.state)})
  }

  render() {
    const noeuds_urls = this.state.noeuds_urls || this.props.noeuds_urls

    const listeNoeuds = []
    for(const noeudId in noeuds_urls) {
      const listeUrls = noeuds_urls[noeudId]
      var noeudInfo = null
      if(this.props.site) {
        noeudInfo = this.props.site[noeudId]
      }
      listeNoeuds.push(
        <Noeud key={noeudId}
               noeudId={noeudId}
               noeudInfo={noeudInfo}
               noeudsDisponibles={this.props.noeudsDisponibles}
               listeUrls={listeUrls}
               ajouterUrl={this.props.ajouterUrl}
               supprimerUrl={this.props.supprimerUrl} />
      )
    }

    return (
      <>
        <h2>Noeuds pour deploiement</h2>

        <NoeudsDisponibles noeuds={this.props.noeudsDisponibles}
                           selectionnerNoeud={this.selectionnerNoeud}
                           ajouterNoeud={this.ajouterNoeud}/>

        {listeNoeuds}
      </>
    )
  }

}

class Noeud extends React.Component {

  state = {
    nouveauUrl: '',
  }

  ajouterUrl = event => {
    this.props.ajouterUrl(this.props.noeudId, this.state.nouveauUrl)
    this.setState({nouveauUrl: ''})
  }

  supprimerUrl = event => {
    this.props.supprimerUrl(this.props.noeudId, event.currentTarget.value)
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  render() {

    const listeUrls = this.props.listeUrls
    var renderedUrls = ''
    if(listeUrls) {
      renderedUrls = listeUrls.map(item=>{
        return <Button key={item}
                       variant="secondary"
                       onClick={this.supprimerUrl}
                       value={item}>
                  {item} <i className="fa fa-close"/>
               </Button>
      })
    }

    var nomNoeud = this.props.noeudId
    try {
      if(this.props.noeudsDisponibles) {
        var noeudInfo = null
        noeudInfo = this.props.noeudsDisponibles.filter(item=>item.noeud_id===this.props.noeudId)[0]
        if(noeudInfo && noeudInfo.fqdn_detecte) {
          nomNoeud = noeudInfo.fqdn_detecte + " (" + this.props.noeudId + ")"
        }
      }
    } catch(err) {
      console.error("Erreur chargement nom noeud : %O", err)
    }

    return (
      <>
        <Row key={this.props.noeudId}>
          <Col>Noeud {nomNoeud}</Col>
        </Row>
        <Row>
          <Col md={6}>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>URL</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl name="nouveauUrl" value={this.state.nouveauUrl} onChange={this.changerChamp}/>
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={this.ajouterUrl}>
                  <i className="fa fa-arrow-right" />
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
          <Col md={6}>
            {renderedUrls}
          </Col>
        </Row>
      </>
    )
  }
}

function NoeudsDisponibles(props) {

  if( ! props.noeuds ) return ''

  var options = props.noeuds.map(item=>{
    var label = ''
    if(item.fqdn_detecte) {
      label = item.fqdn_detecte + ' (' + item.noeud_id + ')'
    } else {
      label = item.noeud_id
    }
    return <option key={item.noeud_id} value={item.noeud_id}>{label}</option>
  })

  return (
    <>
      <label htmlFor="noeuds-disponibles">Ajouter noeud pour deployer le site</label>
      <InputGroup>

        <Form.Control as="select" id="noeuds-disponibles"
                      onChange={props.selectionnerNoeud}>
          <option key='selectionner' value=''>Selectionner un nouveau noeud</option>
          {options}
        </Form.Control>

        <InputGroup.Append>
          <Button variant="outline-secondary"
                  onClick={props.ajouterNoeud}>Ajouter</Button>
        </InputGroup.Append>

      </InputGroup>
    </>
  )

}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err !== ''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{'' + props.err}</pre>
    </Alert>
  )
}

function AlertConfirmation(props) {
  return (
    <Alert variant="success" show={props.confirmation !== ''} onClose={props.clearConfirmation} dismissible>
      <Alert.Heading>Operation completee</Alert.Heading>
      <pre>{'' + props.confirmation}</pre>
    </Alert>
  )
}
