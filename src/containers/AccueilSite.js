import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'
import {v4 as uuid4} from 'uuid'
import EditeurSummernote from './EditeurSummernote'
import parse from 'html-react-parser'

export default class SectionAccueil extends React.Component {

  state = {
    posts: {},         // Collection de posts utilises sur cette page
                       // key=post_id
                       // value=entree post (read-only)

    accueilRows: '',   // Contenu des pages d'accueil en cours de modification
    postsModifies: '', // Nouveaux posts generes sur la page mais pas encore sauvegardes
                       // key=post_id
                       // value=entree post par langue {fr: 'aaa', en:'bbb'}

    err: '',
    confirmation: '',
  }

  componentDidMount() {
    this.extraireListePosts()  // Charger posts pour l'accueil du site
  }

  async extraireListePosts() {
    const accueilInfo = this.props.site.accueil
    if( accueilInfo ) {
      const listePostIds = []
      accueilInfo.forEach(item=>{
        if(item.post_id) listePostIds.push(item.post_id)
        if(item.post_ids) listePostIds = [...listePostIds, ...item.post_ids]
      })

      if(listePostIds.length > 0) {
        const wsa = this.props.rootProps.websocketApp
        const listePosts = await wsa.requetePosts(listePostIds)

        const posts = {}
        listePosts.map(item=>{
          posts[item.post_id] = item
        })
        this.setState({posts}, _=>{console.debug("Post initiales chargees : %O", this.state)})
      }
    }
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

  modifierContenuPost = (post_id, langue, contenu) => {
    // console.debug("Modifier contenu post %s, %s = %s", post_id, langue, contenu)
    var post = this.state.postsModifies[post_id] || this.state.posts[post_id]
    if(!post.html) post.html = {}
    post.html[langue] = contenu

    var postsModifies = null
    if( this.state.postsModifies ) postsModifies = {...this.state.postsModifies}
    else postsModifies = {}

    postsModifies[post_id] = post
    this.setState({postsModifies})
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
        console.error("Erreur : %O", err)
        this.setState({err: this.state.err + '\n' + err})
      }
    }

    if(this.state.accueilRows) {

      const domaineAction = 'Publication.majSite',
            transaction = {
              site_id: this.props.siteId,
              accueil: this.state.accueilRows,
            }

      try {
        await signateurTransaction.preparerTransaction(transaction, domaineAction)
        console.debug("Maj site %s, Transaction a soumettre : %O", this.props.siteId, transaction)

        const reponse = await wsa.majSite(transaction)
        console.debug("Reponse maj site : %O", reponse)

        this.setState({accueilRows: ''}, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: this.state.confirmation + "\nMise a jour du site reussie"})
        })
      } catch (err) {
        console.error("Erreur : %O", err)
        this.setState({err: this.state.err + '\n' + err})
      }

    }
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  clearConfirmation = _ => {
    this.setState({confirmation: ''})
  }

  editerPost = post_id => {
    console.debug("Editer post_id %s", post_id)
    const postExistant = this.state.posts[post_id]

    // Copier valeurs pour la nouvelle transaction, dupliquer post.html
    var post = {
      post_id: postExistant.post_id,
      html: {...postExistant.html}
    }

    var postsModifies = {}
    if( this.state.postsModifies ) {
      postsModifies = {...this.state.postsModifies}
    }

    postsModifies[post_id] = post  // Note : post a deja ete duplique (post.html)
    this.setState({postsModifies})
  }

  annulerEditerPost = post_id => {
    var postsModifies = {}
    if( this.state.postsModifies ) {
      for(const key in this.state.postsModifies) {
        if(key !== post_id) postsModifies[key] = this.state.postsModifies[key]
      }
    }
    this.setState({postsModifies})
  }

  render() {
    var rows = this.state.accueilRows || this.props.site.accueil
    var languages = this.props.languages

    var rowsRendered = null
    if(rows) {
      rowsRendered = rows.map((item, idx)=>{
        const post_id = item.post_id
        if(post_id) {
          var post = this.state.postsModifies[post_id],
              modifiee = true
          if(!post) {
             post = this.state.posts[post_id]
             modifiee = false
          }
          return (
            <RowAccueilPost key={item.post_id}
                            post={post}
                            modifiee={modifiee}
                            languages={languages}
                            modifierContenuPost={this.modifierContenuPost}
                            editer={this.editerPost}
                            annuler={this.annulerEditerPost} />
          )
        }
        return <p key={idx}>Erreur - entree type inconnu</p>
      })
    }

    return (
      <>
        <p>Accueil</p>

        <AlertErreur message={this.state.err} close={this.clearErreur}/>
        <AlertConfirmation message={this.state.confirmation} close={this.clearConfirmation} />

        <Button onClick={this.sauvegarder} disabled={!this.props.rootProps.modeProtege}>
          Sauvegarder structure
        </Button>
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

  editer = _ => {
    this.props.editer(this.props.post.post_id)
  }

  annuler = _ => {
    this.props.annuler(this.props.post.post_id)
  }

  render() {
    if(!this.props.post) {
      console.debug("Post pas charge : %O", this.props)
      return <p>!!! pas charge !!!</p>
    }

    var bouton = ''
    if(this.props.modifiee) {
      bouton = (
        <Button variant="secondary" onClick={this.annuler}>Annuler</Button>
      )
    } else {
      bouton = <Button variant="secondary" onClick={this.editer}>Editer</Button>
    }

    return (
      <>
        <h3>Post {this.props.post.post_id}</h3>
        <Row>
          <Col>{bouton}</Col>
        </Row>
        <HtmlMultilingue post={this.props.post}
                         modifiee={this.props.modifiee}
                         languages={this.props.languages}
                         modifierContenuPost={this.props.modifierContenuPost}
                         editer={this.props.editerPost}
                         annuler={this.props.annulerEditerPost} />
      </>
    )
  }
}

function HtmlMultilingue(props) {

  const editer = _ => {
    props.editer(props.post.post_id)
  }
  const annuler = _ => {
    props.annuler(props.post.post_id)
  }

  return props.languages.map(langue=>{
    var contenu = props.post.html[langue]

    var renderingContenu = ''
    if(props.modifiee) {
      renderingContenu = (
        <EditeurSummernote value={contenu}
                           langue={langue}
                           post_id={props.post.post_id}
                           onChange={props.modifierContenuPost} />
      )
    } else {
      renderingContenu = parse(contenu)
    }

    return (
      <div key={langue}>
        <Row>
          <Col>{langue}</Col>
        </Row>
        <Row><Col>{renderingContenu}</Col></Row>
      </div>
    )
  })
}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.message !== ''} onClose={props.close} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{props.message}</pre>
    </Alert>
  )
}

function AlertConfirmation(props) {
  return (
    <Alert variant="success" show={props.message !== ''} onClose={props.close} dismissible>
      <Alert.Heading>Succes</Alert.Heading>
      <pre>{props.message}</pre>
    </Alert>
  )
}
