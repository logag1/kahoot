import WebSocket from 'ws';
import axios, { AxiosResponse } from 'axios';
import { IApiConfig } from '../config';
import { IAccount } from '../types';
export class WebApiHandler {
  //private _session: WebSocket | null = null;
  public static isConnected = false;
  private _packetId: number;
  private _ackSequence: number;

  constructor(
    private _code: string,
    private _config: IApiConfig,
    private _account: IAccount
  ) {
    this._packetId = 0;
    this._ackSequence = 0;
  }

  get packetId(): number {
    this._packetId++
    return this._packetId;
  }

  get ackSequence(): number {
    if (this._ackSequence !== 0) this._ackSequence++
    return this._ackSequence;
  }

  private _getBaseHeader(BAYEUX_BROWSER?: string): Record<string, string> {
    let cookie: string;

    if (!BAYEUX_BROWSER) {
      cookie = `generated_uuid=${this._account.uuid}`;
    } else {
      cookie = `${BAYEUX_BROWSER} generated_uuid=${this._account.uuid}`;
    }

    return {
      Cookie: cookie,
      "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36`
    }
  }

  get baseUrl(): string {
    return `${this._config.kahootApiHost}/cometd/${this._code}/${this._account.sessionToken}`;
  }

  /**
   * 
   * websocket은 아직 지원하지 않습니다.
   * 
  async connect(): Promise<WebSocket> {
    if (this._session) {
      throw new Error('Socket already connected!');
    }

    const ws = new WebSocket(`wss://kahoot.it/cometd/${this._code}/${this._sessionToken}`);

    await new Promise((resolve) => {
      ws.on('open', resolve);
    })
    WebApiHandler.isConnected = true;
    this._session = ws;

    return ws;
  }

  async write(data: any): Promise<any> {
    if (!WebApiHandler.isConnected || !this._session) {
      throw new Error('Cannot find websocket session');
    }

    this._session!.send(data);
  }

  */

  private async _ping(clientId: string, BAYEUX_BROWSER: string) {
    const res = await axios.post(`${this.baseUrl}/connect`, [
      {
        id: `${this.packetId}`,
        channel: "/meta/connect",
        connectionType: "long-polling",
        clientId: `${clientId}`,
        ext: {
          ack: this.ackSequence,
          timesync: { "tc": Date.now(), "l": 1943, "o": 9131 }
        }
      }
    ], {
      headers: this._getBaseHeader(BAYEUX_BROWSER)
    });

    return res;
  }

  /**
   * 원래 30초지만 왜인지 끊겨서 15초로 사용
   */
  addPingHandler(clientId: string, BAYEUX_BROWSER: string) {
    const pingHandler = async () => {
      const res = await this._ping(clientId, BAYEUX_BROWSER);
      //console.log(`PING! - ${clientId}/${BAYEUX_BROWSER}`);
      setTimeout(pingHandler, 15000);
    };
    pingHandler();
  }

  async sendHandshake(): Promise<AxiosResponse> {
    const res = await axios.post(`${this.baseUrl}/handshake`, [
      {
        id: `${this.packetId}`,
        version: "1.0",
        minimumVersion: "1.0",
        channel: "/meta/handshake",
        supportedConnectionTypes: ["long - polling", "callback - polling"],
        advice: { "timeout": 60000, "interval": 0 },
        ext: { "ack": true, "timesync": { "tc": Date.now(), "l": 0, "o": 0 } }
      }
    ], {
      headers: this._getBaseHeader()
    });
    return res;
  }

  async login(clientId: string, BAYEUX_BROWSER: string) {
    const res = await axios.post(this.baseUrl, [
      {
        id: `${this.packetId}`,
        channel: "/service/controller",
        data: {
          type: "login",
          gameid: `${this._code}`,
          host: "kahoot.it",
          name: `${this._account.nickname}`,
          content: `{\"device\":{\"userAgent\":\"{${this._config.userAgent}}\",\"screen\":{\"width\":2560,\"height\":1440}}}`
        },
        clientId: `${clientId}`,
        ext: {}
      }
    ], {
      headers: this._getBaseHeader(BAYEUX_BROWSER)
    });
    return res.data;
  }

  async sendEvent(clientId: string, BAYEUX_BROWSER: string) {
    const res = await axios.post(this.baseUrl, [
      {
        "id": `${this.packetId}`,
        "channel": "/service/controller",
        "data": {
          "gameid": `${this._code}`,
          "type": "message",
          "host": "kahoot.it",
          "id": 16,
          "content": `{\"usingNamerator\":false}`
        },
        "clientId": `${clientId}`,
        "ext": {}
      }
    ], {
      headers: this._getBaseHeader(BAYEUX_BROWSER)
    });
    return res.data;
  }
}