import {WebSocketClient} from 'millegrilles.common/lib/webSocketClient'

export class WebSocketPublication extends WebSocketClient {

  // Requetes

  async requeteSites(params) {
    return this.emitBlocking('publication/requeteSites', params)
  }

  async requeteSite(siteId) {
    return this.emitBlocking('publication/requeteSite', {site_id: siteId})
  }

  async requetePosts(post_ids) {
    return this.emitBlocking('publication/requetePosts', {post_ids})
  }

  async requeteNoeudsPublics() {
    return this.emitBlocking('publication/requeteNoeuds', {})
  }

  async requeteCollectionsPubliques() {
    return this.emitBlocking('publication/requeteCollectionsPubliques', {})
  }

  // Commandes

  async majSite(transaction) {
    return this.emitBlocking('publication/majSite', transaction)
  }

  async majPost(transaction) {
    return this.emitBlocking('publication/majPost', transaction)
  }

}
