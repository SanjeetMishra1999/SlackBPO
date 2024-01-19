import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import * as CONST_VALUE from "./lease_termination_Constants.ts";

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
    const updateEndpoint =
      `${CONST_VALUE.salesforceEndpointURLForCaseUpdate}${inputs.Id}`;
    let result = "Failed to update Case.";
    const authPayload = {
      grant_type: CONST_VALUE.salesforceGrantType,
      client_id: CONST_VALUE.salesforceClientId,
      client_secret: CONST_VALUE.salesforceClientSecret,
      username: `${CONST_VALUE.salesforceUsername}`,
      password:
        `${CONST_VALUE.salesforcePassword}${CONST_VALUE.salesforceSecurityToken}`,
    };

    try {
      // Authenticate and get the access token
      const authResponse = await fetch(CONST_VALUE.salesforceAuthEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(authPayload).toString(),
      });

      const authData = await authResponse.json();
      const accessToken = authData.access_token;
      console.log("accessToken: ", accessToken);

      console.log("updateEndpoint: ", updateEndpoint);
      const updatePayload = {
        Case_Comments__c: inputs.comments,
        Status: inputs.status,
        Case_Approval__c: true,
        Case_Approval_Status__c: "Approved",
        Case_Approval_Notes__c: inputs.comments,
        Termination_Quote_Id__c: inputs.quoteId,
        Contract_Number__c: inputs.contractNumber,
      };
      console.log("updatepayLoad: ", updatePayload);

      // Update the Case
      try {
        const updateResponse = await fetch(updateEndpoint, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });
        console.log("updateResponse: ", updateResponse);
        if (updateResponse.ok) {
          result = CONST_VALUE.salesforceCaseUpdated;
        }
      } catch (error) {
        console.log("Error: : : ", error);
      }
    } catch (error) {
      console.error("Error:::", error.message || error);
    }

    return {
      outputs: {
        result,
      },
    };
  },
);
