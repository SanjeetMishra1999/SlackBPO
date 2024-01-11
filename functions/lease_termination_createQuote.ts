import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const InsertRecordFunctionDefinition = DefineFunction({
  callback_id: "insert_quote_record",
  title: "Insert Quote Record",
  description: "Insert Quote Record into the Google Sheet",
  source_file: "functions/lease_termination_createQuote.ts",
  input_parameters: {
    properties: {
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google-slack-bpo",
      },
      accountName: {
        type: Schema.types.string,
        description: "New Account Name",
      },
      accountNumber: {
        type: Schema.types.string,
        description: "New Account Number",
      },
      address: {
        type: Schema.types.string,
        description: "New Address",
      },
      contractNumber: {
        type: Schema.types.string,
        description: "New Contract Number",
      },
      operatingUnit: {
        type: Schema.types.string,
      },
      effectiveFrom: {
        type: Schema.types.string,
      },
      quoteType: {
        type: Schema.types.string,
      },
      quoteReason: {
        type: Schema.types.string,
      },
      comments: {
        type: Schema.types.string,
      },
    },
    required: [
      "googleAccessTokenId",
      "accountName",
      "accountNumber",
      "address",
      "contractNumber",
    ],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "Insert result",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  InsertRecordFunctionDefinition,
  async ({ inputs, client }) => {
    // Collect Google access token
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.googleAccessTokenId,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }
    const externalToken = auth.external_token;
    // Calculate the range for the new row
    const sheetRange = `A2:I2`;

    // Perform the insert
    const originalSheetName = "OLFM - TQ Creation";
    const encodedSheetName = encodeURI(originalSheetName);

    const insertRequest = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1voRjJSMymavuPnxCp5t5Atx5BHDBlLNH3KCTw4HHOI0/values/${encodedSheetName}!${sheetRange}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${externalToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[
            inputs.accountNumber,
            inputs.operatingUnit,
            inputs.contractNumber,
            inputs.quoteType,
            inputs.quoteReason,
            inputs.comments,
            inputs.effectiveFrom,
            "Accepted",
          ]],
        }),
      },
    );

    const insertResponse = await insertRequest.json();

    console.log("Row inserted successfully:", insertResponse);
    const result = `:tada: Quote Created Successfully.`;
    console.log("...");
    return { outputs: { result } };
  },
);
