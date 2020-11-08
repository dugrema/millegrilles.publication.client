import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'
import {v4 as uuid4} from 'uuid'
import EditeurSummernote from './EditeurSummernote'

export default class SectionAccueil extends React.Component {

  state = {
    posts: {},         // Collection de posts utilises sur cette page
                       // key=post_id
                       // value=entree post (read-only)

    accueilRows: '',   // Contenu des pages d'accueil en cours de modification
    postsModifies: '', // Nouveaux posts generes sur la page mais pas encore sauvegardes
                       // key=post_id
                       // value=entree post par langue {fr: 'aaa', en:'bbb'}
  }

  ajouterRow = event => {
    var position = event.currentTarget.value

    var post_id = this.initialiserPost()

    // Type row = post
    var row = {post_id}

    var rows = this.state.accueilRows || this.props.site.accueil
    if(!rows) rows = []
    if(position) {
      rows = rows.splice(position, 0, row)  // Inserer post dans l'array
    } else if( ! position ) {
      rows.push(row)
    }

    this.setState({accueilRows: rows})
  }

  initialiserPost = _ => {
    // Creer placeholders pour toutes les langues
    const post_id = uuid4()
    const post = {post_id, html: {}}
    this.props.site.languages.forEach(langue=>{post.html[langue] = ''})

    var posts = {}
    if( this.state.postsModifies ) posts = {...this.state.postsModifies}

    posts[post_id] = post

    this.setState({postsModifies: posts}, _=>{console.debug("Nouveau post : %O", this.state)})

    return post_id
  }

  sauvegarder = async event => {

    const signateurTransaction = this.props.rootProps.signateurTransaction
    const wsa = this.props.rootProps.websocketApp

    // Sauvegarder les nouveaux posts
    if(this.state.postsModifies) {
      try {
        for(const post_id in this.state.postsModifies) {
          const post = this.state.postsModifies[post_id]

          const domaineAction = 'Publication.majPost',
                transaction = {...post}

          await signateurTransaction.preparerTransaction(transaction, domaineAction)
          console.debug("Nouveau post %s, Transaction a soumettre : %O", post_id, transaction)
          const reponse = await wsa.majPost(transaction)
          console.debug("Reponse maj post : %O", reponse)
        }

        this.setState({
          postsModifies: '',
          posts: {...this.state.posts, ...this.state.postsModifies},  // Mettre a jour posts en memoire
        }, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: this.state.confirmation + "\nAjout nouveaux posts avec succes"})
        })
      } catch (err) {
        this.setState({err})
      }
    }

    if(this.state.accueilRows) {

      const domaineAction = 'Publication.majSite',
            transaction = {
              accueil: this.state.accueilRows,
            }

      try {
        await signateurTransaction.preparerTransaction(transaction, domaineAction)
        const siteId = transaction['en-tete']['uuid_transaction']
        console.debug("Maj site %s, Transaction a soumettre : %O", siteId, transaction)

        const reponse = await wsa.majSite(transaction)
        console.debug("Reponse maj site : %O", reponse)

        this.setState({accueilRows: ''}, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: this.state.confirmation + "\nMise a jour du site reussie"})
        })
      } catch (err) {
        this.setState({err})
      }

    }
  }

  render() {

    var rows = this.state.accueilRows || this.props.site.accueil
    var languages = this.props.languages

    var rowsRendered = null
    if(rows) {
      rowsRendered = rows.map((item, idx)=>{
        if(item.post_id) {
          return (
            <RowAccueilPost key={idx}
                            post={item}
                            languages={languages}/>
          )
        }
        return <p key={idx}>Erreur - entree type inconnu</p>
      })
    }

    return (
      <>
        <p>Accueil</p>
        {rowsRendered}
        <Row>
          <Col>
            <Button variant="secondary" onClick={this.ajouterRow}>
              Ajouter ligne
            </Button>
          </Col>
        </Row>
      </>
    )
  }

}

function RowAccueilPost(props) {
  return <PostItem {...props} />
}

class PostItem extends React.Component {

  render() {
    return (
      <>
        <p>Post {this.props.post.post_id}</p>
        <HtmlMultilingue html={this.props.post.html} />
      </>
    )
  }
}

function HtmlMultilingue(props) {
  return (
    <>
      <p>Html entree</p>
      <EditeurSummernote />
    </>
  )
}
