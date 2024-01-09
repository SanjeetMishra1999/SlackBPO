// functions/sample_function.ts
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetSAPAddressFunctionDefinition = DefineFunction({
  callback_id: "get_sap_details",
  title: "Get SAP Address",
  description: "Get SAP Address",
  source_file: "functions/lease_termination_getSAPDetails.ts",
  input_parameters: {
    properties: {
      contractNumber: {
        type: Schema.types.string,
        description: "Contract Number",
      },
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google-slack-bpo",
      },
      user: {
        type: Schema.slack.types.user_id,
        description: "The user invoking the workflow",
      },
    },
    required: [],
  },
  output_parameters: {
    properties: {
      sapAddress: {
        type: Schema.types.string,
        description: "SAP Address From Sheet",
      },
    },
    required: ["sapAddress"],
  },
});

export default SlackFunction(
  GetSAPAddressFunctionDefinition,
  async ({ inputs, client }) => {
    console.log(inputs.user);
    // Collect employee information
    const user = await client.users.profile.get({ user: "U06CEEC3ZNG" });
    if (!user.ok) {
      return { error: `Failed to gather user profile: ${user.error}` };
    }
    // Collect Google access token
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.googleAccessTokenId,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }
    const externalToken = auth.external_token;
    // Retrieve values from the spreadsheet
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/1AfJKRG2BoBktbwzmgycZ4yYthuL7qgoUR3CjPBO6azw/values/A2:F2`;
    const sheets = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${externalToken}`,
      },
    });
    if (!sheets.ok) {
      return {
        error: `Failed to retrieve sheet data: ${sheets.statusText}`,
      };
    }
    const sheetsData = await sheets.json();
    console.log(sheetsData);
    // Extract the relevant values from the response
    const values = sheetsData.values;
    console.log(values);
    if (!values || values.length === 0) {
      return { error: `No data found in the spreadsheet` };
    }
    console.log(values[0]);
    const [text1, text2, text3] = values[0];
    console.log(text1, "---", text2, "---", text3);
    const sapAddress =
      `:newspaper: Message for <@${inputs.user}>!\n\n>${sheetsData}`;

    return { outputs: { sapAddress } };
  },
);
