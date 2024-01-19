import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import * as CONST_VALUE from "./lease_termination_Constants.ts";

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
      caseNumber: {
        type: Schema.types.string,
      },
    },
    required: [
      "operatingUnit",
      "effectiveFrom",
      "quoteType",
      "quoteReason",
      "comments",
    ],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "Insert result",
      },
      quoteId: {
        type: Schema.types.string,
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
      return {
        error:
          `We hit a snag. Failed to collect Google auth token: ${auth.error}`,
      };
    }
    const externalToken = auth.external_token;
    // Calculate the range for the new row
    // Perform the insert
    const encodedSheetName = encodeURI(CONST_VALUE.googleSheetOLFMTQCreation);
    const url =
      `${CONST_VALUE.googleSheetGeneralURL}${CONST_VALUE.googleSheetInvoiceID}/values/${encodedSheetName}!${CONST_VALUE.googleSheetBalanceRange}`;
    const sheets = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${externalToken}`,
      },
    });
    if (!sheets.ok) {
      return {
        error:
          `We hit a snag. Failed to retrieve sheet data: ${sheets.statusText}`,
      };
    }
    const sheetsData = await sheets.json();
    console.log(`Sheet Data: `, sheetsData);
    // Extract the relevant values from the response
    const values = sheetsData.values;
    console.log("values: ", values);
    let firstEmptyRow = 2;
    if (!values || values.length === 0) {
      firstEmptyRow = 2;
    } else {
      console.log("values.length: ", values.length);
      firstEmptyRow = values.length + 2;
    }
    const sheetRange = `A${firstEmptyRow}:I${firstEmptyRow}`;
    const quoteId = Number(inputs.caseNumber) + 1;
    const insertRequest = await fetch(
      `${CONST_VALUE.googleSheetGeneralURL}${CONST_VALUE.googleSheetInvoiceID}/values/${encodedSheetName}!${sheetRange}?valueInputOption=RAW`,
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
            Number(inputs.caseNumber) + 1,
          ]],
        }),
      },
    );
    console.log(`insertRequest: `, insertRequest);
    if (!insertRequest.ok) {
      return {
        error: `We hit a snag. Error: ${insertRequest.statusText}`,
      };
    }
    const insertResponse = await insertRequest.json();

    console.log("Row inserted successfully:", insertResponse);
    const result =
      `:tada: Termination Quote Created Successfully with Termination Quote Id: ${
        Number(inputs.caseNumber) + 1
      }.`;
    const returnStringQuoteId = quoteId.toString();
    return { outputs: { result, returnStringQuoteId } };
  },
);
