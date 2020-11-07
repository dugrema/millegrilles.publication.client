import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert} from 'react-bootstrap'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class EditerSite extends React.Component {

  state = {
    site: '',
    noeudsDisponibles: '',

    // Champs d'edition a l'ecran
    nom_site: '',
    languages: '',
    noeuds_urls: '',

    err: '',
    confirmation: '',
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSite(this.props.siteId).then(site=>{
      console.debug("Site charge : %O", site)
      this.setState({site}, _ =>{
        // Enregistrer evenements
        wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
      })
    })

    wsa.requeteNoeudsPublics().then(noeudsDisponibles=>{
      console.debug("Noeuds disponibles : %O", noeudsDisponibles)
      this.setState({noeudsDisponibles}, _ =>{
        // Enregistrer evenements
        //wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
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
      this.setState({site: siteModifie}, _=>{console.debug("MAJ apres update : %O", this.state)})
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

  ajouterLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.state.site.languages || []
    }
    const dictLanguages = {[language]: true}  // Ajout nouveau language

    // Dedupe
    languages.forEach(item=>{
      dictLanguages[item] = true
    })

    languages = Object.keys(dictLanguages)
    console.debug("Nouvelle liste languages : %O", languages)
    this.setState({languages})
  }

  supprimerLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    console.debug("Supprimer language : %s", language)
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.state.site.languages || []
    }

    // Supprimer (filtrer) entree
    languages = languages.filter(item=>item !== language)
    this.setState({languages})
  }

  sauvegarder = async event => {
    console.debug("Sauvegarder changements formulaire site")

    // Conserver changements au formulaire
    const domaineAction = 'Publication.majSite',
          transaction = {}

    const champsFormulaire = ['nom_site', 'languages']

    champsFormulaire.forEach(item=>{
      if(this.state[item]) transaction[item] = this.state[item]
    })

    if(Object.keys(transaction).length === 0) {
      console.debug("Aucun changement au formulaire")
      return
    }

    transaction['site_id'] = this.props.siteId

    try {
      const signateurTransaction = this.props.rootProps.signateurTransaction
      await signateurTransaction.preparerTransaction(transaction, domaineAction)
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
    const nomSite = this.state.site.nom_site || this.props.siteId

    var sectionDonnees = <ChargementEnCours />
    if(this.state.site) {
      sectionDonnees = (
        <SectionDonnees changerChamp={this.changerChamp}
                        ajouterLanguage={this.ajouterLanguage}
                        supprimerLanguage={this.supprimerLanguage}
                        {...this.state} />
      )
    }

    return (
      <>
        <h1>Editer site {nomSite}</h1>

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

  return (
    <Form>

      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>Nom site</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name="nom_site" value={props.nom_site || props.site.nom_site} onChange={props.changerChamp}/>
      </InputGroup>

      <Languages {...props} />

      <Noeuds noeuds_urls={props.noeuds_urls} noeudsDisponibles={props.noeudsDisponibles} />

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
    </>
  )
}

class Noeuds extends React.Component {

  state = {
    noeuds_urls: '',
    noeud_id: '',
  }

  selectionnerNoeud = event => {
    const noeud_id = event.currentTarget.value
    console.debug("Selectionner noeud %s", noeud_id)
    this.setState({noeud_id})
  }

  ajouterNoeud = event => {
    var nouveauNoeud = this.state.noeud_id
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

  render() {
    const noeuds_urls = this.state.noeuds_urls || this.props.noeuds_urls

    const listeNoeuds = []
    for(const noeudId in noeuds_urls) {
      const listeUrls = noeuds_urls[noeudId]
      listeNoeuds.push(
        <Noeud key={noeudId}
               noeudId={noeudId}
               listeUrls={listeUrls}
               ajouterUrl={this.ajouterUrl}
               supprimerUrl={this.supprimerUrl} />
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

    return (
      <>
        <Row key={this.props.noeudId}>
          <Col>Noeud {this.props.noeudId}</Col>
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
