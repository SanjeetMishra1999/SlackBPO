import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { salesforceUsername } from "./lease_termination_Constants.ts";
import { salesforceAuthEndpoint } from "./lease_termination_Constants.ts";
import { salesforceEndpointURLForCaseUpdate } from "./lease_termination_Constants.ts";
import { salesforcePassword } from "./lease_termination_Constants.ts";
import { salesforceSecurityToken } from "./lease_termination_Constants.ts";
import { salesforceGrantType } from "./lease_termination_Constants.ts";
import { salesforceClientId } from "./lease_termination_Constants.ts";
import { salesforceClientSecret } from "./lease_termination_Constants.ts";

export const UpdateCaseFunctionDefinition = DefineFunction({
  callback_id: "update_case_in_Salesforce",
  title: "Update Case In Salesforce",
  description: "Update Case In Salesforce",
  source_file: "functions/lease_termination_updateCaseInSalesforce.ts",
  input_parameters: {
    properties: {
      Id: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
      comments: {
        type: Schema.types.string,
        description: "Comment for the Case",
      },
      status: {
        type: Schema.types.string,
      },
      quoteId: {
        type: Schema.types.string,
      },
      contractNumber: {
        type: Schema.types.string,
      },
    },
    required: ["Id"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "Update result",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  UpdateCaseFunctionDefinition,
  async ({ inputs }) => {
    const updateEndpoint = `${salesforceEndpointURLForCaseUpdate}${inputs.Id}`;
    let result = "Failed to update Case Comments.";
    const authPayload = {
      grant_type: salesforceGrantType,
      client_id: salesforceClientId,
      client_secret: salesforceClientSecret,
      username: `${salesforceUsername}`,
      password: `${salesforcePassword}${salesforceSecurityToken}`,
    };

    try {
      // Authenticate and get the access token
      const authResponse = await fetch(salesforceAuthEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(authPayload).toString(),
      });

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Update the Case Comments
      const updateResponse = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Case_Comments__c: inputs.comments,
          Status: inputs.status,
          Case_Approval__c: true,
          Case_Approval_Status__c: inputs.status,
          Case_Approval_Notes__c: inputs.comments,
          Termination_Quote_Id__c: inputs.quoteId,
          Contract_Number__c: inputs.contractNumber,
        }),
      });

      if (updateResponse.ok) {
        result = ":tada: Case updated successfully.";
      }
    } catch (error) {
      console.error("Error:", error.message || error);
    }

    return {
      outputs: {
        result,
      },
    };
  },
);
