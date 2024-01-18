import { Manifest } from "deno-slack-sdk/mod.ts";
import { SendCaseDetailsFunctionDefinition } from "./functions/lease_termination_sendCaseDetails.ts";
import { GetCaseDetailsFunctionDefinition } from "./functions/lease_termination_getCaseDetails.ts";
import GoogleProvider from "./external_auth/google_provider.ts";
import { GetSAPAddressFunctionDefinition } from "./functions/lease_termination_getSAPDetails.ts";
import { UpdateCaseFunctionDefinition } from "./functions/lease_termination_updateCaseInSalesforce.ts";
import { InsertRecordFunctionDefinition } from "./functions/lease_termination_createQuote.ts";
import { CheckBalanceFunctionDefinition } from "./functions/lease_termination_checkRemainingBalance.ts";
import { GetQuoteIdFunctionDefinition } from "./functions/lease_termination_getQuoteId.ts";
import { GetCaseDetailFunctionDefinition } from "./functions./address_update_getCaseDetails.ts";
/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "slack-bpo-lease-termination",
  description:
    "A sample that demonstrates using a function, workflow and trigger to send a greeting",
  icon: "assets/default_new_app_icon.png",
  functions: [
    SendCaseDetailsFunctionDefinition,
    GetCaseDetailsFunctionDefinition,
    GetSAPAddressFunctionDefinition,
    UpdateCaseFunctionDefinition,
    InsertRecordFunctionDefinition,
    CheckBalanceFunctionDefinition,
    GetQuoteIdFunctionDefinition,
    GetCaseDetailFunctionDefinition,
  ],
  outgoingDomains: [
    "servcloud--rtxpoc.sandbox.my.salesforce.com",
    "sheets.googleapis.com",
  ],
  externalAuthProviders: [GoogleProvider],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "users.profile:read",
  ],
});
