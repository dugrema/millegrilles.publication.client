import {WebSocketClient} from 'millegrilles.common/lib/webSocketClient'

export class WebSocketPublication extends WebSocketClient {

  // Requetes

  async requeteSites(params) {
    return this.emitBlocking('publication/requeteSites', params)
  }

  async requeteSite(siteId) {
    return this.emitBlocking('publication/requeteSite', {site_id: siteId})
  }

  // Commandes

  async ajouterSite(transaction) {
    return this.emitBlocking('publication/ajouterSite', transaction)
  }

}
