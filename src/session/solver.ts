import axios from 'axios';

export interface SessionInfo {
  twoFactorAuth: boolean;
  namerator: boolean;
  participantId: boolean;
  smartPractice: boolean;
  collaborations: boolean;
  loginRequired: boolean;
  gameType: string;
  liveGameId: string;
  challenge: string;
}

interface ReturnType {
  token: string;
  info: SessionInfo;
}

export class KahootSessionSolver {
  constructor(
    private _code: string,
    private _uuid: string
  ) { }

  private async _getSessionInfo(): Promise<ReturnType> {
    const res = await axios.get(`https://kahoot.it/reserve/session/${this._code}/?${Date.now()}`, {
      headers: {
        Cookie: `generated_uuid=${this._uuid}`
      }
    });

    return {
      token: res.headers['x-kahoot-session-token'],
      info: res.data
    }
  }

  private _concat(headerToken: string, challengeToken: string): string {
    for (var token = "", i = 0; i < headerToken.length; i++) {
      let char = headerToken.charCodeAt(i);
      let mod = challengeToken.charCodeAt(i % challengeToken.length);
      let decodedChar = char ^ mod;
      token += String.fromCharCode(decodedChar);
    }
    return token;
  }

  public async solve() {
    const info = await this._getSessionInfo();
    let challenge: any = info.info.challenge; // any...
    challenge = challenge.replace(/\t/g, '').replace(/[^\x00-\x7F]/g, '');
    challenge = challenge.split(/[{};]/);

    const replaceFunction = "return message.replace(/./g, function(char, position) {";

    const rebuilt = [
      challenge[1] + "{",
      challenge[2] + ";",
      replaceFunction,
      challenge[7] + ";})};",
      challenge[0]
    ];
    const rebuiltText = rebuilt.join('');

    const challengeToken = eval(rebuiltText);
    const xSessionToken = Buffer.from(info.token, "base64").toString("ascii");

    return this._concat(xSessionToken, challengeToken);
  }
}