import {WebSocketClient} from 'millegrilles.common/lib/webSocketClient'

export class WebSocketPublication extends WebSocketClient {

  // Requetes

  async requeteSites(params) {
    return this.emitBlocking('publication/requeteSites', params)
  }

  // Commandes

  // async restaurationChargerCles(params) {
  //   return emitBlocking('coupdoeil/restaurationChargerCles', params)
  // }

}
