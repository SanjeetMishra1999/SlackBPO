import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";

const GoogleProvider = DefineOAuth2Provider({
  provider_key: "google-slack-bpo",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    "provider_name": "Google",
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "client_id":
      "164328133269-81d2hu0avu90jji63db1pgeluvhsh2m2.apps.googleusercontent.com",
    "scope": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    "authorization_url_extras": {
      "prompt": "consent",
      "access_type": "offline",
    },
    "identity_config": {
      "url": "https://www.googleapis.com/oauth2/v1/userinfo",
      "account_identifier": "$.email",
    },
  },
});

export default GoogleProvider;
