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


  render() {

    var sections = this.state.sections || this.props.site.sections
    var sectionsRendered = null

    if(sections) {
      sectionsRendered = sections.map((section, idxRow)=>{
        if(section.type === 'fichiers') {
          return <SectionFichiers key={idxRow} idxRow={idxRow}
                                  configuration={section}
                                  changerChampMultilingue={this.changerChampMultilingue}
                                  {...this.props} />
        } else if(section.type === 'album') {
          return <SectionAlbum key={idxRow} idxRow={idxRow}
                               configuration={section}
                               changerChampMultilingue={this.changerChampMultilingue}
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

  return (
    <>
      <h2>Fichiers</h2>

      <h3>Entete</h3>
      <ChampInputMultilingue languages={props.languages}
                             name="entete"
                             values={entete}
                             idxRow={idxRow}
                             changerChamp={props.changerChampMultilingue} />

      <h3>Description</h3>

      <h3>Collections inclues</h3>
      <p>
        Choisir : O Toutes les collections publiques, X Collections selectionnees
      </p>
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
