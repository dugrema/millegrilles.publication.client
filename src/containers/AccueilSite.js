import React from 'react'
import {Row, Col, Button, Form, FormControl, InputGroup, Alert, Nav, Card, CardDeck} from 'react-bootstrap'
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

    idxRowADeplacer: '',  // Index de la ligne a deplacer (couper)

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
        console.debug("Chargement row : %O", item)
        if(item.post_id) listePostIds.push(item.post_id)
        if(item.post_ids) listePostIds = [...listePostIds, ...item.post_ids]
        if(item.cards) {
          item.cards.map(card=>{
            listePostIds.push(card.post_id)
          })
        }
      })
      console.debug("Post ids charges : %O", listePostIds)

      if(listePostIds.length > 0) {
        const wsa = this.props.rootProps.websocketApp
        const listePosts = await wsa.requetePosts(listePostIds)
        console.debug("Reponse chargement posts : %O", listePosts)

        const posts = {}
        listePosts.liste_posts.map(item=>{
          posts[item.post_id] = item
        })
        this.setState({posts}, _=>{console.debug("Posts charges : %O", posts)})
      }
    }
  }

  ajouterRow = event => {
    var typeRow = event.currentTarget.value

    var post_id = this.initialiserPost(),
        position = event.currentTarget.dataset.row || ''

    // Type row = post
    var row = null
    if(typeRow === "Post") {
      row = {post_id}
    } else if(typeRow === "CardDeck") {
      row = {layout: "CardDeck", cards: [{post_id}]}
    } else {
      throw new Error("Type layout inconnu : " + typeRow)
    }

    var rows = this.state.accueilRows || this.props.site.accueil
    if(!rows) rows = []
    if(position) {
      rows.splice(Number(position), 0, row)  // Inserer post dans l'array
    } else {
      rows.push(row)
    }

    this.setState({accueilRows: rows, idxRowADeplacer: ''})
  }

  ajouterColonne = event => {
    const idxRow = event.currentTarget.value
    console.debug("Ajouter colonne sur row %s", idxRow)
    var post_id = this.initialiserPost()
    var accueilRows = this.state.accueilRows || this.props.site.accueil
    accueilRows = [...accueilRows]  // Shallow copy

    var copieRow = {...accueilRows[idxRow]}
    copieRow.cards.push({post_id: post_id})
    accueilRows[idxRow] = copieRow

    this.setState({accueilRows})
  }

  supprimerRow = event => {
    const idx = event.currentTarget.value
    var accueilRows = this.state.accueilRows || this.props.site.accueil
    accueilRows = [...accueilRows]  // Shallow copy
    accueilRows = accueilRows.filter((_, idxItem)=>''+idxItem!==idx)
    this.setState({accueilRows, idxRowADeplacer: ''})
  }

  supprimerColonne = event => {
    const idxRow = event.currentTarget.value,
          idxCol = event.currentTarget.dataset.col
    console.debug("Supprimer row %s / colonne %s", idxRow, idxCol)

    var accueilRows = this.state.accueilRows || this.props.site.accueil
    accueilRows = [...accueilRows]  // Shallow copy
    console.debug("Accueil courant : %O", accueilRows)

    var copieRow = {...accueilRows[idxRow]}
    console.debug("Copie row %O", copieRow)
    copieRow.cards = copieRow.cards.filter((_, idx)=>''+idx!==idxCol)
    accueilRows[idxRow] = copieRow

    console.debug("Accueil maj : %O", accueilRows)

    this.setState({accueilRows})
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

  setIdxRowADeplacer = event => {
    const idxRowADeplacer = event.currentTarget.value
    this.setState({idxRowADeplacer})
  }

  deplacerRow = event => {
    const idxRowDestination = event.currentTarget.value,
          idxRowADeplacer = this.state.idxRowADeplacer

    var rowsSource = this.state.accueilRows || this.props.site.accueil
    var rowCouper = rowsSource[idxRowADeplacer]

    var rowsDestination = []
    rowsSource.forEach((item,idx) => {
      if(''+idx === idxRowDestination) {
        rowsDestination.push(rowCouper)  // Inserer row
        rowsDestination.push(item)
      } else if(''+idx !== idxRowADeplacer) {
        rowsDestination.push(item)  // Conserver row
      }
    })

    this.setState({accueilRows: rowsDestination, idxRowADeplacer: ''})
  }

  render() {
    var rows = this.state.accueilRows || this.props.site.accueil
    var languages = this.props.languages

    var rowsRendered = null
    if(rows) {
      rowsRendered = rows.map((item, idx)=>{
        const post_id = item.post_id, layout = item.layout
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
                            rowIdx={idx}
                            modifiee={modifiee}
                            languages={languages}
                            modifierContenuPost={this.modifierContenuPost}
                            ajouterRow={this.ajouterRow}
                            editer={this.editerPost}
                            annuler={this.annulerEditerPost}
                            supprimerRow={this.supprimerRow}
                            setIdxRowADeplacer={this.setIdxRowADeplacer}
                            deplacerRow={this.deplacerRow}
                            idxRowADeplacer={this.state.idxRowADeplacer} />
          )
        } else if(layout) {
          if(layout === 'CardDeck') {
            return <CardDeckLayout key={idx}
                                   posts={this.state.posts}
                                   postsModifies={this.state.postsModifies}
                                   languages={languages}
                                   modifierContenuPost={this.modifierContenuPost}
                                   editerPost={this.editerPost}
                                   annulerEditerPost={this.annulerEditerPost}
                                   supprimerRow={this.supprimerRow}
                                   ajouterColonne={this.ajouterColonne}
                                   supprimerColonne={this.supprimerColonne}
                                   rowIdx={idx}
                                   ajouterRow={this.ajouterRow}
                                   setIdxRowADeplacer={this.setIdxRowADeplacer}
                                   deplacerRow={this.deplacerRow}
                                   idxRowADeplacer={this.state.idxRowADeplacer}
                                   {...item} />
          }
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
            <Button variant="secondary" onClick={this.ajouterRow} value="Post">
              Ajouter ligne
            </Button>
            <Button variant="secondary" onClick={this.ajouterRow} value="CardDeck">
              Ajouter CarDeck
            </Button>
          </Col>
        </Row>
      </>
    )
  }

}

function RowAccueilPost(props) {
  var nomPost = ''
  if(props.post) nomPost = props.post.post_id
  return (
    <>
      <h3>Post {nomPost}</h3>
      <Row>
        <Col>
          <Button variant="secondary" onClick={props.ajouterRow} value='Post' data-row={props.rowIdx}>Inserer ligne</Button>
          <Button variant="secondary" onClick={props.setIdxRowADeplacer} value={props.rowIdx}>Selectionner ligne</Button>
          <Button variant="secondary" onClick={props.deplacerRow} value={props.rowIdx} disabled={!props.idxRowADeplacer}>Coller ligne</Button>
          <Button variant="secondary" onClick={props.supprimerRow} value={props.rowIdx}>Supprimer ligne</Button>
        </Col>
      </Row>
      <PostItem {...props} />
    </>
  )
}

function CardDeckLayout(props) {
  var cards = props.cards,
      renderedCards = ''
  if(cards) renderedCards = cards.map((card, colIdx)=>{

    var cardImage = '', cardTitle = ''
    if(card.image_url) {
      cardImage = <Card.Img variant="top" src={card.image_url} />
    }
    if(card.titre) {
      cardTitle = <Card.Title>{card.titre}</Card.Title>
    }
    if(card.sous_titre) {
      cardTitle = <Card.Title>{card.sous_titre}</Card.Title>
    }

    var renderedPost = '', post = '', modifiee = false
    var post = props.postsModifies[card.post_id],
        modifiee = true
    if(!post) {
       post = props.posts[card.post_id]
       modifiee = false
    }
    renderedPost = <PostItem {...post} />

    return (
      <Card key={colIdx} style={{ width: '18rem' }}>
        {cardImage}
        <Card.Body>
          <Card.Header>
            <Button variant="secondary" onClick={props.supprimerColonne} value={props.rowIdx} data-col={colIdx}>X</Button>
          </Card.Header>
          {cardTitle}
          <PostItem key={card.post_id}
                    post={post}
                    modifiee={modifiee}
                    languages={props.languages}
                    modifierContenuPost={props.modifierContenuPost}
                    editer={props.editerPost}
                    annuler={props.annulerEditerPost} />

        </Card.Body>
      </Card>
    )
  })

  return (
    <>
      <Row>
        <Col>
          <Button variant="secondary" onClick={props.ajouterRow} value='Post' data-row={props.rowIdx}>Inserer ligne</Button>
          <Button variant="secondary" onClick={props.setIdxRowADeplacer} value={props.rowIdx}>Selectionner ligne</Button>
          <Button variant="secondary" onClick={props.deplacerRow} value={props.rowIdx} disabled={!props.idxRowADeplacer}>Coller ligne</Button>
          <Button variant="secondary" onClick={props.ajouterColonne} value={props.rowIdx}>Ajouter colonne</Button>
          <Button variant="secondary" onClick={props.supprimerRow} value={props.rowIdx}>Supprimer ligne</Button>
        </Col>
      </Row>
      <CardDeck>
        {renderedCards}
      </CardDeck>
    </>
  )
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
      // console.debug("Post pas charge : %O", this.props)
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
      if(contenu) {
        renderingContenu = parse(contenu)
      }
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
