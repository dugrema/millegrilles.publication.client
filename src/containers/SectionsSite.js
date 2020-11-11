import React from 'react'
import {Row, Col, Button, ButtonGroup, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'

import {ChampInputMultilingue} from './InfoSite'

export default class SectionsSite extends React.Component {

  state = {
    sections: '',
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

    // Copier valeur multilingue, remplacer valeur dans langue appropriee
    row[name] = row[name]?false:true  // Inverser value, null == false => true

    this.setState({sections})
  }

  sauvegarder = event => {
    if(this.state.sections) {
      console.debug("Sauvegarder : %O", this.state.sections)

    } else {
      console.debug("Rien a sauvegarder")
    }
  }

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
                                  {...this.props} />
        } else if(section.type === 'album') {
          return <SectionAlbum key={idxRow} idxRow={idxRow}
                               configuration={section}
                               changerChampMultilingue={this.changerChampMultilingue}
                               toggleCheckbox={this.toggleCheckbox}
                               {...this.props}  />
        } else if(section.type === 'blogposts') {
          return <SectionBlogPosts key={idxRow} idxRow={idxRow}
                                   configuration={section}
                                   changerChampMultilingue={this.changerChampMultilingue}
                                   toggleCheckbox={this.toggleCheckbox}
                                   {...this.props} />
        }
        return <p>Type inconnu : {section.type}</p>
      })
    }

    return (
      <>
        <p>Sections</p>

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
            <Button onClick={this.sauvegarder}>Sauvegarder</Button>
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
      <Form.Check id="collections-toutes"
                  type="checkbox"
                  label="Toutes les collections publiques"
                  name="toutes_collections"
                  checked={toutesCollectionsInclues}
                  data-row={idxRow}
                  onChange={props.toggleCheckbox} />
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
