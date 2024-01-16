import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { googleSheetURLToGetSAPData } from "./lease_termination_Constants.ts";
import { googleSheetSAPAccount } from "./lease_termination_Constants.ts";
import { rowDataIndexForSAPAddress } from "./lease_termination_Constants.ts";

export const GetSAPAddressFunctionDefinition = DefineFunction({
  callback_id: "get_update_sap_details",
  title: "Get/Update SAP Address",
  description: "Get/Update SAP Address",
  source_file: "functions/lease_termination_getSAPDetails.ts",
  input_parameters: {
    properties: {
      contractNumber: {
        type: Schema.types.number,
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
      billingAddress: {
        type: Schema.types.string,
      },
    },
    required: ["contractNumber"],
  },
  output_parameters: {
    properties: {
      sapUpdateResult: {
        type: Schema.types.string,
        description: "SAP Update Result",
      },
    },
    required: ["sapUpdateResult"],
  },
});

export default SlackFunction(
  GetSAPAddressFunctionDefinition,
  async ({ inputs, client }) => {
    const user = await client.users.profile.get({ user: inputs.user });
    if (!user.ok) {
      return {
        error: `We hit a snag. Failed to gather user profile: ${user.error}`,
      };
    }
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.googleAccessTokenId,
    });

    if (!auth.ok) {
      return {
        error:
          `We hit a sag. Failed to collect Google auth token: ${auth.error}`,
      };
    }
    const sheets = await fetch(googleSheetURLToGetSAPData, {
      headers: {
        "Authorization": `Bearer ${auth.external_token}`,
      },
    });
    if (!sheets.ok) {
      return {
        error:
          `We hit a snag. Failed to retrieve sheet data: ${sheets.statusText}`,
      };
    }
    const sheetsData = await sheets.json();
    console.log(`SHEET DATA: `, sheetsData);
    // Extract the relevant values from the response
    console.log("Values.Length: ", sheetsData.values.length);
    if (!sheetsData.values || sheetsData.values.length === 0) {
      return { error: `We hit a snag. No data found in the spreadsheet` };
    }
    //Update Google Sheet
    const rows = sheetsData.values || [];
    console.log(`ROWS: `, rows);
    // Find the index of the row with the specified contract number
    // Iterate through the data array to find the index
    let foundIndex = -1;
    for (let i = 0; i < sheetsData.values.length; i++) {
      const rowData = sheetsData.values[i];
      console.log("RowData: ", rowData);
      // Contract number is in the first column (index 0)
      if (rowData[rowData.length - 1] === inputs.contractNumber.toString()) {
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
    const rowData = sheetsData.values[foundIndex];
    const sapAddress = rowData[rowDataIndexForSAPAddress];
    console.log(`SAP Address in Google Sheet: `, sapAddress);

    if (sapAddress === inputs.billingAddress) {
      const sapUpdateResult =
        ":tada: Address Matched Successfully. Please Continue. :slightly_smiling_face:";
      return { outputs: { sapUpdateResult } };
    }

    // Calculate the range dynamically based on the found index
    const startRow = foundIndex + 2; // Adding 2 to convert to 1-based indexing
    const sheetRange = `A${startRow}:D${startRow}`;

    // Perform the update
    const encodedSheetName = encodeURI(googleSheetSAPAccount);
    const updateRequest = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1d9s8xrheV0qfkIM4zPmi11zfm_kDj0J8uXCx5NeL9UU/values/${encodedSheetName}!${sheetRange}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${auth.external_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[
            inputs.accountName,
            inputs.accountNumber,
            inputs.billingAddress,
            inputs.contractNumber,
          ]],
        }),
      },
    );

    const updateResponse = await updateRequest.json();

    console.log("Sheet updated successfully:", updateResponse);
    const sapUpdateResult =
      `:tada: SAP System has been updated. Please Continue. :slightly_smiling_face:`;
    return { outputs: { sapUpdateResult } };
  },
);
