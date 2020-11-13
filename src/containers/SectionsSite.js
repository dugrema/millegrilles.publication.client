import React from 'react'
import {Row, Col, Button, ButtonGroup, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'

import {ChampInputMultilingue} from './InfoSite'

export default class SectionsSite extends React.Component {

  state = {
    sections: '',

    collectionsPubliques: '',

    err: '',
    confirmation: '',
  }

  componentDidMount() {
    // Charger collections publiques
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteCollectionsPubliques().then(reponse=>{
      const collections = reponse.resultat
      console.debug("Collections publiques : %O", collections)
      this.setState({collectionsPubliques: collections})
    }).catch(err=>{this.setState({err: this.state.err + '\n' + err})})
  }

  ajouterSection = event => {
    var typeSection = event.currentTarget.value
    var sections = this.state.sections || this.props.site.sections || []
    sections = [...sections]  // Shallow copy

    const section = {type: typeSection}
    sections.push(section)
    this.setState({sections})
  }

  changerChampMultilingue = event => {
    const {name, value} = event.currentTarget
    const langue = event.currentTarget.dataset.langue
    const idxRow = event.currentTarget.dataset.row

    // console.debug("Changement champ %s, row:%s, langue:%s = %s", name, idxRow, langue, value)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    // Copier valeur multilingue, remplacer valeur dans langue appropriee
    var valeurMultilingue = {...row[name]}
    valeurMultilingue[langue] = value
    row[name] = valeurMultilingue

    this.setState({sections})
  }

  toggleCheckbox = event => {
    const name = event.currentTarget.name
    const idxRow = event.currentTarget.dataset.row
    // console.debug("Toggle checkbox %s, row:%s", name, idxRow)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    row[name] = row[name]?false:true  // Inverser value, null == false => true

    this.setState({sections}, _=>{console.debug("Status updated : %O", this.state)})
  }

  toggleListValue = event => {
    // Toggle le contenu d'un element dans une liste (ajoute ou retire l'element)
    const {name, value} = event.currentTarget
    const idxRow = event.currentTarget.dataset.row

    console.debug("Toggle checkbox %s, row:%s = %s", name, idxRow, value)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    var list = row[name] || []
    if(list.includes(value)) {
      // Retirer la valeur
      list = list.filter(item=>item!==value)
    } else {
      // Ajouter la valeur
      list.push(value)
    }

    row[name] = list

    this.setState({sections}, _=>{console.debug("Status updated : %O", this.state)})
  }

  sauvegarder = async event => {
    if(this.state.sections) {
      console.debug("Sauvegarder : %O", this.state.sections)

      // Conserver changements au formulaire
      const domaineAction = 'Publication.majSite',
            transaction = {
              site_id: this.props.siteId,
              sections: this.state.sections,
            }

      try {
        const signateurTransaction = this.props.rootProps.signateurTransaction
        await signateurTransaction.preparerTransaction(transaction, domaineAction)
        console.debug("Maj site %s, Transaction a soumettre : %O", this.props.siteId, transaction)

        const wsa = this.props.rootProps.websocketApp
        const reponse = await wsa.majSite(transaction)

        this.setState({sections: ''}, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: "Mise a jour du site reussie"})
        })
      } catch (err) {
        this.setState({err})
      }
    } else {
      console.debug("Rien a sauvegarder")
    }
  }

  clearErreur = _ => this.setState({err: ''})
  clearConfirmation = _ => this.setState({confirmation: ''})

  render() {

    var sections = this.state.sections || this.props.site.sections
    var sectionsRendered = null

    if(sections) {
      sectionsRendered = sections.map((section, idxRow)=>{
        if(section.type === 'fichiers') {
          return <SectionFichiers key={idxRow} idxRow={idxRow}
                                  configuration={section}
                                  changerChampMultilingue={this.changerChampMultilingue}
                                  toggleCheckbox={this.toggleCheckbox}
                                  toggleListValue={this.toggleListValue}
                                  collectionsPubliques={this.state.collectionsPubliques}
                                  {...this.props} />
        } else if(section.type === 'album') {
          return <SectionAlbum key={idxRow} idxRow={idxRow}
                               configuration={section}
                               changerChampMultilingue={this.changerChampMultilingue}
                               toggleCheckbox={this.toggleCheckbox}
                               toggleListValue={this.toggleListValue}
                               collectionsPubliques={this.state.collectionsPubliques}
                               {...this.props}  />
        } else if(section.type === 'blogposts') {
          return <SectionBlogPosts key={idxRow} idxRow={idxRow}
                                   configuration={section}
                                   changerChampMultilingue={this.changerChampMultilingue}
                                   {...this.props} />
        }
        return <p>Type inconnu : {section.type}</p>
      })
    }

    return (
      <>
        <p>Sections</p>

        <AlertErreur err={this.state.err} clearErreur={this.clearErreur} />
        <AlertConfirmation confirmation={this.state.confirmation} clearConfirmation={this.clearConfirmation} />

        <Row>
          <Col lg={1}>
            Ajouter
          </Col>
          <Col lg={11}>
            <ButtonGroup>
              <Button variant="secondary" onClick={this.ajouterSection} value="fichiers">Fichiers</Button>
              <Button variant="secondary" onClick={this.ajouterSection} value="album">Album</Button>
              <Button variant="secondary" onClick={this.ajouterSection} value="blogposts">Blog Posts</Button>
            </ButtonGroup>
          </Col>
        </Row>

        {sectionsRendered}

        <Row>
          <Col>
            <Button onClick={this.sauvegarder}
                    disabled={!this.props.rootProps.modeProtege}>Sauvegarder</Button>
          </Col>
        </Row>
      </>
    )
  }

}

function SectionFichiers(props) {

  const configuration = props.configuration,
        idxRow = props.idxRow

  var entete = configuration.entete
  if(!entete) {
    // Initialiser entete
    entete = {}
    props.languages.forEach(langue=>{
      entete[langue] = ''
    })
  }

  var toutesCollectionsInclues = configuration.toutes_collections?true:false
  var collectionsSelectionnees = configuration.collections || []

  var collectionsPubliques = ''
  if(!toutesCollectionsInclues && props.collectionsPubliques) {
    collectionsPubliques = props.collectionsPubliques.map(item=>{
      return (
        <Row key={item.uuid}>
          <Col lg={1}></Col>
          <Col>
            <Form.Check id={"collections-" + item.uuid} key={item.uuid}
                        type="checkbox"
                        label={item.nom_collection}
                        name="collections"
                        value={item.uuid}
                        checked={collectionsSelectionnees.includes(item.uuid)}
                        data-row={idxRow}
                        onChange={props.toggleListValue} />
          </Col>
        </Row>
      )
    })
    collectionsPubliques.unshift(
      <Row key="instructions">
        <Col>
          Choisir collections individuellement
        </Col>
      </Row>
    )
  }

  return (
    <>
      <h2>Fichiers</h2>

      <h3>Entete</h3>
      <ChampInputMultilingue languages={props.languages}
                             name="entete"
                             values={entete}
                             idxRow={idxRow}
                             changerChamp={props.changerChampMultilingue} />

      <h3>Collections inclues</h3>
      <Form.Check id={"collections-toutes-" + idxRow}
                  type="checkbox"
                  label="Toutes les collections publiques"
                  name="toutes_collections"
                  checked={toutesCollectionsInclues}
                  data-row={idxRow}
                  onChange={props.toggleCheckbox} />

      {collectionsPubliques}
    </>
  )

}

function SectionAlbum(props) {
  return (
    <p>Album</p>
  )
}

function SectionBlogPosts(props) {
  return (
    <p>Blog Posts</p>
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
