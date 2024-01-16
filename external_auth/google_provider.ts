import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";
import * as CONST_VALUE from "../functions/lease_termination_Constants.ts";

const GoogleProvider = DefineOAuth2Provider({
  provider_key: "google-slack-bpo",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    "provider_name": "Google",
    "authorization_url": CONST_VALUE.googleAccountAuth,
    "token_url": CONST_VALUE.googleAccountToken,
    "client_id": CONST_VALUE.googleClientId,
    "scope": [
      CONST_VALUE.spreadsheetScope1,
      CONST_VALUE.spreadsheetScope2,
      CONST_VALUE.spreadsheetScope3,
      CONST_VALUE.spreadsheetScope4,
    ],
    "authorization_url_extras": {
      "prompt": "consent",
      "access_type": "offline",
    },
    "identity_config": {
      "url": CONST_VALUE.googleInfoURL,
      "account_identifier": "$.email",
    },
  },
});

export default GoogleProvider;
