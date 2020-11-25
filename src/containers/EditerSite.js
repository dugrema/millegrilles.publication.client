import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'

import InfoSite from './InfoSite'
import AccueilSite from './AccueilSite'
import SectionsSite from './SectionsSite'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class EditerSite extends React.Component {

  state = {
    site: '',
    noeudsDisponibles: '',
    sectionCourante: sections.InfoSite,
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSite(this.props.siteId).then(site=>{
      // console.debug("Site charge : %O", site)
      this.setState({site}, _ =>{
        // Enregistrer evenements
        wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
      })
    })

    wsa.requeteNoeudsPublics().then(noeudsDisponibles=>{
      // console.debug("Noeuds disponibles : %O", noeudsDisponibles)
      this.setState({noeudsDisponibles}, _ =>{
        // Enregistrer evenements
        //wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
      })
    })
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    wsa.unsubscribe(routingKeysSite, this.messageRecu, {exchange: '3.protege'})
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

  changerSection = section => {
    this.setState({sectionCourante: sections[section]})
  }

  render() {
    const nomSite = this.state.site.nom_site || this.props.siteId

    const SectionCourante = this.state.sectionCourante

    return (
      <>
        <h1>Editer {nomSite}</h1>
        <NavSections changerSection={this.changerSection} site={this.state.site}/>
        <SectionCourante changerSection={this.changerSection}
                         languages={this.state.site.languages}
                         {...this.state} {...this.props} />
      </>
    )
  }

}

function NavSections(props) {

  var sectionsBlogs = ''
  if(props.site && props.site.sections) {
    sectionsBlogs = props.site.sections.filter(item=>item.type === 'blogposts')
  }

  return (
    <Nav variant="pills" defaultActiveKey="InfoSite" onSelect={props.changerSection}>
      <Nav.Item>
        <Nav.Link eventKey="InfoSite">
          Information
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="AccueilSite">
          Accueil
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="SectionsSite">
          Sections additionnelles
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link disabled={sectionsBlogs.length === 0} eventKey="SectionsBlogs">
          Sections blogs
        </Nav.Link>
      </Nav.Item>
    </Nav>
  )
}

class SectionsBlogs extends React.Component {

  state = {
    idxSection: '',
  }

  setIdxSection = event => {
    const idxSection = event.currentTarget.value
    console.debug("Idx section : %s", idxSection)
    this.setState({idxSection})
  }

  render() {
    const site = this.props.site,
          sections = site.sections

    const sectionsBlogs = sections.map((item, idx)=>{return {...item, idxSection: idx}}).
                                   filter(item=>item.type === 'blogposts')

    const mapping = sectionsBlogs.map(item=>{
      return (
        <option value={item.idxSection}>{item.entete.fr}</option>
      )
    })

    const selectionSections = (
      <Form.Group controlId="section">
        <Form.Label>Section de blog</Form.Label>
        <Form.Control as="select" onChange={this.setIdxSection}>
          <option value="">Choisir section / Choose section</option>
          {mapping}
        </Form.Control>
      </Form.Group>
    )
    console.debug("SectionsBlogs : %O", sectionsBlogs)

    var sectionBlog = ''
    if(this.state.idxSection) {
      const section = this.props.site.sections[this.state.idxSection]
      sectionBlog = <AccueilSite {...this.props}
                                 sections={this.props.site.sections}
                                 idxSection={this.state.idxSection} />
    }

    return (
      <>
        {selectionSections}
        {sectionBlog}
      </>
    )
  }

}

const sections = {InfoSite, AccueilSite, SectionsSite, SectionsBlogs}
