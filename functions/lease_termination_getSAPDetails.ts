// functions/sample_function.ts
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetSAPAddressFunctionDefinition = DefineFunction({
  callback_id: "get_update_sap_details",
  title: "Get/Update SAP Address",
  description: "Get/Update SAP Address",
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
    required: [],
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
    // Need To Fix This
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
      `https://sheets.googleapis.com/v4/spreadsheets/1d9s8xrheV0qfkIM4zPmi11zfm_kDj0J8uXCx5NeL9UU/values/A2:D100`;
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
    console.log(values[0]);
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
      const contractNumberInRow = rowData[rowData.length - 1];
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
    const rowData = sheetsData.values[foundIndex];
    const sapAddress = rowData[2];
    console.log(sapAddress);

    if (sapAddress === inputs.billingAddress) {
      const addressMatched = ":tada: Address Match Successful.";
      return { outputs: { addressMatched } };
    }

    // Calculate the range dynamically based on the found index
    const startRow = foundIndex + 2; // Adding 2 to convert to 1-based indexing
    const sheetRange = `A${startRow}:D${startRow}`;

    // Perform the update
    const originalSheetName = "SAP - Account";
    //const encodedSheetName = encodeURIComponent(originalSheetName);
    //let encodedSheetName = originalSheetName.replace(/ /g, "%20");
    const encodedSheetName = encodeURI(originalSheetName);
    //const sheetRange = `A2:D2`;
    const updateRequest = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1d9s8xrheV0qfkIM4zPmi11zfm_kDj0J8uXCx5NeL9UU/values/${encodedSheetName}!${sheetRange}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${externalToken}`,
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
    const sapUpdateResult = `:tada: SAP System has been updated.`;

    return { outputs: { sapUpdateResult } };
  },
);
