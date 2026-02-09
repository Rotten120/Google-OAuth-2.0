import { google } from "googleapis"
import crypto from "crypto"

class GoogleOAuth2Client {
  #oauth2Client
  #scopes
  #state

  constructor() {
    this.#oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_AUTH_URI
    );

    this.#scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ];

    this.#state = crypto.randomBytes(32).toString("hex");
  }

  verifyState(state) {
    return (this.#state === state);
  } 

  generateAuthUrl() {
    return this.#oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.#scopes,
      include_granted_scopes: true,
      state: this.#state,
      response_type: "code"
    });
  }

  async getToken(authCode) {
    const { tokens } = await this.#oauth2Client.getToken(authCode);
    this.#oauth2Client.setCredentials(tokens);

    return {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };  
  }

  async getPayload(idToken) {
    const ticket = await this.#oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
  } 
}

export const googleAuthService = new GoogleOAuth2Client();
