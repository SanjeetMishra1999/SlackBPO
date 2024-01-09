import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetCaseDetailsFunctionDefinition = DefineFunction({
  callback_id: "get_case_details",
  title: "Get Case Details",
  description: "get Case Details",
  source_file: "functions/lease_termination_getCaseDetails.ts",
  input_parameters: {
    properties: {
      Id: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["Id", "channel"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
      caseNum: {
        type: Schema.types.string,
        description: "Salesforce Case Number",
      },
      accountName: {
        type: Schema.types.string,
        description: "Salesforce Case Account Name",
      },
      billAddress: {
        type: Schema.types.string,
        description: "Salesforce Case Billing Address",
      },
      installAddress: {
        type: Schema.types.string,
        description: "Salesforce Case Install Address",
      },
      contractNum: {
        type: Schema.types.string,
        description: "Salesforce Case Contract Number",
      },
      comments: {
        type: Schema.types.string,
        description: "Salesforce Case Comments",
      },
      approvalStatus: {
        type: Schema.types.string,
        description: "Salesforce Case Approval Status",
      },
      approvalNotes: {
        type: Schema.types.string,
        description: "Salesforce Case Approval Notes",
      },
      accountNum: {
        type: Schema.types.string,
        description: "Salesforce Case's Account Number",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  GetCaseDetailsFunctionDefinition,
  async ({ inputs }) => {
    const { Id, channel } = inputs;

    const salesforceEndpoint =
      "https://servcloud--rtxpoc.sandbox.my.salesforce.com/services/data/v58.0/query?";
    const caseId = inputs.Id;
    let result = "We hit a snag.";
    let caseNum = "";
    let accountName = "";
    let billAddress = "";
    let installAddress = "";
    let contractNum = "";
    let comments = "";
    let approvalStatus = "";
    let approvalNotes = "";
    let accountNum = "";
    const query =
      `Select Id, CaseNumber, Account.Name, Account.AccountNumber, Billing_Address__c, Install_Address__c, Contract_Number__c, Case_Comments__c, Case_Approval_Status__c, Case_Approval_Notes__c From Case WHERE ID = '${caseId}' LIMIT 1`;

    const salesforceUsername = "peterparker@slackpoc.com.fraudteam.rtxpoc";
    const salesforcePassword = "Accenture@12";
    const salesforceSecurityToken = "ED2a16SzrZcKwr4ht0LRTBRW";
    const apiUrl = `${salesforceEndpoint}q=${encodeURIComponent(query)}`;
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
      const authResponse = await fetch(authEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(authPayload).toString(),
      });

      const authData = await authResponse.json();
      console.log(`AUTH DATA: `, authData);

      const accessToken = authData.access_token;

      const apiResponse = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const apiData = await apiResponse.json();
      console.log(`API DATA: `, apiData);

      const caseDetails = apiData.records;

      result = caseDetails[0].Id !== null ? caseDetails[0].Id.toString() : "";
      console.log("Result:", result);

      caseNum = caseDetails[0].CaseNumber !== null
        ? caseDetails[0].CaseNumber.toString()
        : "";
      console.log("Case Number:", caseNum);

      accountName = caseDetails[0].Account.Name !== null
        ? caseDetails[0].Account.Name.toString()
        : "";
      console.log("Account Name:", accountName);

      billAddress = caseDetails[0].Billing_Address__c !== null
        ? formatAddress(caseDetails[0].Billing_Address__c).toString()
        : "";
      console.log("Billing Address:", billAddress);

      installAddress = caseDetails[0].Install_Address__c !== null
        ? formatAddress(caseDetails[0].Install_Address__c).toString()
        : "";
      console.log("Installation Address:", installAddress);

      contractNum = caseDetails[0].Contract_Number__c !== null
        ? caseDetails[0].Contract_Number__c.toString()
        : "";
      console.log("Contract Number:", contractNum);

      comments = caseDetails[0].Case_Comments__c !== null
        ? caseDetails[0].Case_Comments__c.toString()
        : "";
      console.log("Comments:", comments);

      approvalStatus = caseDetails[0].Case_Approval_Status__c !== null
        ? caseDetails[0].Case_Approval_Status__c.toString()
        : "";
      console.log("Approval Status:", approvalStatus);

      approvalNotes = caseDetails[0].Case_Approval_Notes__c !== null
        ? caseDetails[0].Case_Approval_Notes__c.toString()
        : "";
      console.log("Approval Notes:", approvalNotes);

      accountNum = caseDetails[0].Account.AccountNumber !== null
        ? caseDetails[0].Account.AccountNumber.toString()
        : "";
      console.log("Account Number:", accountNum);
    } catch (error) {
      console.error("Error:", error.message || error);
    }

    return {
      outputs: {
        result,
        caseNum,
        accountName,
        billAddress,
        installAddress,
        contractNum,
        comments,
        approvalStatus,
        approvalNotes,
        accountNum,
      },
    };
  },
);

interface Address {
  city: string;
  country: string;
  state: string;
  street: string | null;
}

function formatAddress(address: Address) {
  return `${address.street ?? ""}${
    address.street ? ", " : ""
  }${address.city}, ${address.state}, ${address.country}`;
}
