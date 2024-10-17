import { KahootSessionSolver } from '../session';
import { WebApiHandler } from '../api';
import { ApiConfig } from '../config';
import { IAccount } from '../types';

export class Kahoot {
  private _uuid: string;
  private _solver: KahootSessionSolver;

  constructor(
    private _code: string
  ) {
    this._uuid = require('uuid').v4();
    this._solver = new KahootSessionSolver(_code, this._uuid);
  }

  async addBot(nickname: string): Promise<{ success: boolean; account: IAccount; }> {
    const sessionToken = await this._solver.solve();
    const account = {
      sessionToken,
      nickname,
      uuid: this._uuid
    };
    const apiHandler = new WebApiHandler(this._code, ApiConfig, account);

    const handshakeRes = await apiHandler.sendHandshake();
    const clientId = handshakeRes.data[0].clientId;

    const sessionCookie = handshakeRes.headers['set-cookie'] as any;
    const session = sessionCookie[0].split(' Path')[0];

    if (!session) {
      throw new Error('Cannot find set-cookie header');
    } else {
      apiHandler.addPingHandler(clientId, session);

      const loginRes = await apiHandler.login(clientId, session);
      const sendEventRes = await apiHandler.sendEvent(clientId, session);

      return { success: loginRes[0].successful && sendEventRes[0].successful, account }
    }
  }
} 