// functions/sample_function.ts
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetQuoteIdFunctionDefinition = DefineFunction({
  callback_id: "get_quote_id",
  title: "Get Quote Id",
  description: "Get Quote Id",
  source_file: "functions/lease_termination_getQuoteId.ts",
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
      caseNumber: {
        type: Schema.types.string,
      },
    },
    required: [],
  },
  output_parameters: {
    properties: {
      quoteId: {
        type: Schema.types.string,
      },
    },
    required: ["quoteId"],
  },
});

export default SlackFunction(
  GetQuoteIdFunctionDefinition,
  async ({ inputs, client }) => {
    // Collect employee information
    const user = await client.users.profile.get({ user: inputs.user });
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
    const sheetName = "OLFM - TQ Creation";
    const encodedSheetName = encodeURI(sheetName);

    const externalToken = auth.external_token;
    // Retrieve values from the spreadsheet
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/1voRjJSMymavuPnxCp5t5Atx5BHDBlLNH3KCTw4HHOI0/values/${encodedSheetName}!A2:Q100`;
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
    console.log("values.length: ", values.length);
    if (!values || values.length === 0) {
      return { error: `No data found in the spreadsheet` };
    }
    //Update Google Sheet
    const rows = sheetsData.values || [];
    console.log(rows);
    // Find the index of the row with the specified contract number
    const contractNumberToFind = inputs.contractNumber;
    console.log(contractNumberToFind);
    console.log("---------");
    // Iterate through the data array to find the index
    let foundIndex = -1;
    for (let i = 0; i < sheetsData.values.length; i++) {
      const rowData = sheetsData.values[i];
      console.log("rowData: ", rowData);

      // Assuming contract number is in the first column (index 0), adjust as needed
      const contractNumberInRow = rowData[2];
      console.log("contractNumberInRow: ", contractNumberInRow);
      console.log("i: ", i);
      if (contractNumberInRow === contractNumberToFind) {
        foundIndex = i;
        break; // Exit the loop once a match is found
      }
    }

    // Now foundIndex contains the index where the contract number matches
    console.log("Index: " + foundIndex);
    if (foundIndex === -1) {
      return {
        error: `Contract number ${contractNumberToFind} not found in the sheet`,
      };
    }
    // Get the values of the row at the found index
    const rowData = sheetsData.values[foundIndex];
    // Log the values to the console
    console.log("Values at the found index:", rowData);
    const quoteId = rowData[8];
    //Need To Fix This
    console.log("QuoteId:", quoteId);

    return { outputs: { quoteId } };
  },
);
