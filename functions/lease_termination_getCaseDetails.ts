import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { salesforceEndpointURL } from "./lease_termination_Constants.ts";
import { salesforceAuthEndpoint } from "./lease_termination_Constants.ts";
import { salesforceGrantType } from "./lease_termination_Constants.ts";
import { salesforceClientId } from "./lease_termination_Constants.ts";
import { salesforceUsername } from "./lease_termination_Constants.ts";
import { salesforcePassword } from "./lease_termination_Constants.ts";
import { salesforceSecurityToken } from "./lease_termination_Constants.ts";
import { salesforceClientSecret } from "./lease_termination_Constants.ts";

export const GetCaseDetailsFunctionDefinition = DefineFunction({
  callback_id: "get_case_details",
  title: "Get Case Details From Salesforce",
  description: "Get Case Details From Salesforce",
  source_file: "functions/lease_termination_getCaseDetails.ts",
  input_parameters: {
    properties: {
      Id: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
    },
    required: ["Id"],
  },
  output_parameters: {
    properties: {
      recordId: {
        type: Schema.types.string,
        description: "Salesforce Case Id",
      },
      caseNumber: {
        type: Schema.types.string,
        description: "Salesforce Case Number",
      },
      accountName: {
        type: Schema.types.string,
        description: "Salesforce Case Account Name",
      },
      billingAddress: {
        type: Schema.types.string,
        description: "Salesforce Case Billing Address",
      },
      installAddress: {
        type: Schema.types.string,
        description: "Salesforce Case Install Address",
      },
      caseComments: {
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
      accountNumber: {
        type: Schema.types.string,
        description: "Salesforce Case Account Number",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  GetCaseDetailsFunctionDefinition,
  async ({ inputs }) => {
    let recordId = "";
    let caseNumber = "";
    let accountName = "";
    let billingAddress = "";
    let installAddress = "";
    let caseComments = "";
    let approvalStatus = "";
    let approvalNotes = "";
    let accountNumber = "";
    const query =
      `Select Id, CaseNumber, Account.Name, Account.AccountNumber, Case_Comments__c, Case_Approval_Status__c, Case_Approval_Notes__c, Billing_Street_2__c, Install_Street_2__c, Billing_Street_House_Number__c, Install_Street_House_Number__c, Billing_Postal_Code_City__c, Install_Postal_Code_City__c, Billing_Country__c, Install_Country__c, Billing_Region__c, Install_Region__c, Billing_Time_Zone__c, Install_Time_Zone__c, Billing_Tax_Jurisdiction__c, Install_Tax_Jurisdiction__c From Case WHERE ID = '${inputs.Id}' LIMIT 1`;

    const authPayload = {
      grant_type: salesforceGrantType,
      client_id: salesforceClientId,
      client_secret: salesforceClientSecret,
      username: `${salesforceUsername}`,
      password: `${salesforcePassword}${salesforceSecurityToken}`,
    };

    try {
      const authResponse = await fetch(salesforceAuthEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(authPayload).toString(),
      });

      const authData = await authResponse.json();
      console.log(`AUTH DATA: `, authData);

      const accessToken = authData.access_token;
      const apiUrl = `${salesforceEndpointURL}q=${encodeURIComponent(query)}`;

      const apiResponse = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const apiData = await apiResponse.json();
      console.log(`API DATA: `, apiData);

      const caseDetails = apiData.records;
      console.log(`CASE DETAILS: `, caseDetails);
      recordId = caseDetails[0].Id !== null ? caseDetails[0].Id.toString() : "";
      console.log("Record Id:", recordId);
      caseNumber = caseDetails[0].CaseNumber !== null
        ? caseDetails[0].CaseNumber.toString()
        : "";
      console.log("Case Number:", caseNumber);
      accountName = caseDetails[0].Account.Name !== null
        ? caseDetails[0].Account.Name.toString()
        : "";
      console.log("Account Name:", accountName);
      caseComments = caseDetails[0].Case_Comments__c !== null
        ? caseDetails[0].Case_Comments__c.toString()
        : "";
      console.log("Comments:", caseComments);
      approvalStatus = caseDetails[0].Case_Approval_Status__c !== null
        ? caseDetails[0].Case_Approval_Status__c.toString()
        : "";
      console.log("Approval Status:", approvalStatus);
      approvalNotes = caseDetails[0].Case_Approval_Notes__c !== null
        ? caseDetails[0].Case_Approval_Notes__c.toString()
        : "";
      console.log("Approval Notes:", approvalNotes);
      accountNumber = caseDetails[0].Account.AccountNumber !== null
        ? caseDetails[0].Account.AccountNumber.toString()
        : "";
      console.log("Account Number:", accountNumber);
      billingAddress = (caseDetails[0].Billing_Street_2__c + ", " +
        caseDetails[0].Billing_Street_House_Number__c + ", " +
        caseDetails[0].Billing_Postal_Code_City__c + ", " +
        caseDetails[0].Billing_Country__c + ", " +
        caseDetails[0].Billing_Region__c + ", " +
        caseDetails[0].Billing_Time_Zone__c + ", " +
        caseDetails[0].Billing_Tax_Jurisdiction__c).toString();
      console.log("Billing Address:", billingAddress);
      installAddress = (caseDetails[0].Install_Street_2__c + ", " +
        caseDetails[0].Install_Street_House_Number__c + ", " +
        caseDetails[0].Install_Postal_Code_City__c + ", " +
        caseDetails[0].Install_Country__c + ", " +
        caseDetails[0].Install_Region__c + ", " +
        caseDetails[0].Install_Time_Zone__c + ", " +
        caseDetails[0].Install_Tax_Jurisdiction__c).toString();
      console.log("Installation Address:", installAddress);
    } catch (error) {
      console.error("We hit a snag. Error: ", error.message || error);
    }
    return {
      outputs: {
        recordId,
        caseNumber,
        accountName,
        billingAddress,
        installAddress,
        caseComments,
        approvalStatus,
        approvalNotes,
        accountNumber,
      },
    };
  },
);
