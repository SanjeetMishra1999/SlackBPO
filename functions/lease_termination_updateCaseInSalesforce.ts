import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const UpdateCaseFunctionDefinition = DefineFunction({
  callback_id: "update_case_in_Salesforce",
  title: "Update Case In Salesforce",
  description: "Update Salesforce Case",
  source_file: "functions/lease_termination_updateCaseInSalesforce.ts",
  input_parameters: {
    properties: {
      Id: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
      comments: {
        type: Schema.types.string,
        description: "New comments for the Case",
      },
    },
    required: ["Id", "comments"],
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
    const { Id, comments } = inputs;

    const salesforceEndpoint =
      "https://servcloud--rtxpoc.sandbox.my.salesforce.com/services/data/v58.0/sobjects/Case/";
    const caseId = inputs.Id;
    const updateEndpoint = `${salesforceEndpoint}${caseId}`;
    let result = "Failed to update Case Comments.";

    const salesforceUsername = "peterparker@slackpoc.com.fraudteam.rtxpoc";
    const salesforcePassword = "Accenture@12";
    const salesforceSecurityToken = "ED2a16SzrZcKwr4ht0LRTBRW";

    const authEndpoint =
      "https://servcloud--rtxpoc.sandbox.my.salesforce.com/services/oauth2/token";

    const authPayload = {
      grant_type: "password",
      client_id:
        "3MVG9eQyYZ1h89Hdsszwpgu_2PL32EX4LJhifNN27jPEBg0wcXfDjwmE6K3wRquzKjJWcT4x8mbEaWYNdKIyq",
      client_secret:
        "77949EA34C3ED4DE6EF21A5585CA628B62CD63C2A37039FCABB4910D192A7509",
      username: `${salesforceUsername}`,
      password: `${salesforcePassword}${salesforceSecurityToken}`,
    };

    try {
      // Authenticate and get the access token
      const authResponse = await fetch(authEndpoint, {
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
          Case_Comments__c: comments,
        }),
      });

      if (updateResponse.ok) {
        result = "Case Comments updated successfully.";
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
