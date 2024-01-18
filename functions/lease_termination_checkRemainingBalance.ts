import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import * as CONST_VALUE from "./lease_termination_Constants.ts";

export const CheckBalanceFunctionDefinition = DefineFunction({
  callback_id: "check_remaining_balance",
  title: "Check Remaining Balance",
  description: "Check Remaining Balance",
  source_file: "functions/lease_termination_checkRemainingBalance.ts",
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
      accountName: {
        type: Schema.types.string,
      },
      accountNumber: {
        type: Schema.types.string,
      },
    },
    required: ["contractNumber"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "Result",
      },
    },
    required: ["result"],
  },
});

export default SlackFunction(
  CheckBalanceFunctionDefinition,
  async ({ inputs, client }) => {
    // Collect employee information
    const user = await client.users.profile.get({ user: inputs.user });
    if (!user.ok) {
      return {
        error: `We hit a snag. Failed to gather user profile: ${user.error}`,
      };
    }
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
    const encodedSheetName = encodeURI(CONST_VALUE.googleSheetOLFMAccount);
    const externalToken = auth.external_token;
    // Retrieve values from the spreadsheet
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
    console.log("values.length: ", values.length);
    if (!values || values.length === 0) {
      return { error: `We hit a snag. No data found in the spreadsheet` };
    }
    //Update Google Sheet
    const rows = sheetsData.values || [];
    console.log(`Rows: `, rows);
    // Find the index of the row with the specified contract number
    // Iterate through the data array to find the index
    let foundIndex = -1;
    for (let i = 0; i < sheetsData.values.length; i++) {
      const rowData = sheetsData.values[i];
      console.log("rowData: ", rowData);
      console.log("rowData.length: ", rowData.length);
      // Contract number is in the first column (index 0)
      const contractNumberInRow = rowData[9];
      console.log("contractNumberInRow: ", contractNumberInRow);
      console.log(
        "inputs.contractNumber.toString(): ",
        inputs.contractNumber.toString(),
      );
      if (contractNumberInRow === inputs.contractNumber.toString()) {
        foundIndex = i;
        break; // Exit the loop once a match is found
      }
    }

    // Now foundIndex contains the index where the contract number matches
    console.log("Found Index: " + foundIndex);
    if (foundIndex === -1) {
      return {
        error:
          `We hit a snag. Contract number ${inputs.contractNumber} not found in the sheet`,
      };
    }
    // Get the values of the row at the found index
    const rowData = sheetsData.values[foundIndex];
    // Log the values to the console
    console.log("Values at the found index:", rowData);
    const balance = rowData[CONST_VALUE.rowDataIndexForBalance];
    console.log("Balance: ", balance);

    if (balance !== "0") {
      return {
        error:
          `We hit a snag. Case not eligible for Lease Termination due to ${balance} outstanding invoices.`,
      };
    }

    const result =
      `:tada: Selected account (Contract Number: ${inputs.contractNumber}) has no outstanding invoices. Please continue with creating Lease Termination Quote. :slightly_smiling_face:`;
    return { outputs: { result } };
  },
);
