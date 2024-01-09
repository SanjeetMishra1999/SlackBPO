import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
export const SendCaseDetailsFunctionDefinition = DefineFunction({
  callback_id: "send_case_details",
  title: "Send Case Details",
  description: "Send Case Details",
  source_file: "functions/lease_termination_sendCaseDetails.ts",
  input_parameters: {
    properties: {
      Id: {
        type: Schema.types.string,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      caseNum: {
        type: Schema.types.string,
      },
      accountName: {
        type: Schema.types.string,
      },
      billAddress: {
        type: Schema.types.string,
      },
      installAddress: {
        type: Schema.types.string,
      },
      contractNum: {
        type: Schema.types.string,
      },
      comments: {
        type: Schema.types.string,
      },
      approvalStatus: {
        type: Schema.types.string,
      },
      approvalNotes: {
        type: Schema.types.string,
      },
    },
    required: ["Id", "channel", "caseNum"],
  },
  output_parameters: {
    properties: {
      contractNum: {
        type: Schema.types.string,
        description: "Contract Number",
      },
    },
    required: ["contractNum"],
  },
});

export default SlackFunction(
  SendCaseDetailsFunctionDefinition,
  async ({ inputs, client }) => {
    const text =
      `*Hey* <@${inputs.channel}>!\n\n> :wave:,\nA new Salesforce Case has been logged in without a _*CAM Owner*_. Is _Lease Termination_ required?:thinking_face:\nBelow are the case details:\n\`Case Id: ${inputs.Id}\`\n\`Case Number: ${inputs.caseNum}\`\n\`Account Name: ${inputs.accountName}\`\n\`Billing Address: ${inputs.billAddress}\`\n\`Install Address: ${inputs.installAddress}\`\n\`Contract Number: ${inputs.contractNum}\`\n\`Case Comments: ${inputs.comments}\`\n\`Approval Status: ${inputs.approvalStatus}\`\n\`Approval Notes: ${inputs.approvalNotes}\`\nClick on *Continue* to start Lease Termination Flow.\n*NOTE:* _Flow once started, needs to be completed till the end. Once clicked on continue, the flow can't be terminated in between & can't start over_`;
    // Block Kit elements (https://api.slack.com/block-kit)
    const blocks = [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
      {
        type: "actions",
        block_id: "lease-termination-buttons",
        elements: [
          {
            type: "button",
            action_id: "lease_termination",
            text: { type: "plain_text", text: "Continue" },
            style: "primary",
          },
        ],
      },
    ];
    const response = await client.chat.postMessage({
      channel: inputs.channel,
      text,
      blocks,
    });
    if (response.error) {
      console.log(JSON.stringify(response, null, 2));
      const error = `Failed to post a message due to ${response.error}`;
      return { error };
    }
    // To continue with this interaction, return false for the completion
    return { completed: false };
  },
)
  .addBlockActionsHandler(
    "lease_termination",
    async ({ body, client, inputs }) => {
      const text = "Let's begin the lease termination flow!!!";
      const response = await client.chat.update({
        channel: inputs.channel,
        ts: body.container.message_ts,
        text,
        blocks: [{ type: "section", text: { type: "mrkdwn", text } }],
      });
      if (response.error) {
        const error = `Failed to update the message due to ${response.error}`;
        return { error };
      }
      const modalResponse = await client.views.open({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view: buildNewModalView(),
      });
      if (modalResponse.error) {
        const error = `Failed to open a modal due to ${modalResponse.error}`;
        return { error };
      }
      return { completed: false };
    },
  )
  // Handle the data submission from the modal
  .addViewSubmissionHandler(
    ["lease-termination-contract-no"],
    ({ view }) => {
      const values = view.state.values;
      const contractNum = String(
        Object.values(values)[0]["lease-termination-contract-no-action"].value,
      );
      if (contractNum.length <= 5) {
        console.log(contractNum);
        const errors: Record<string, string> = {};
        const blockId = Object.keys(values)[0];
        errors[blockId] =
          "The entered contract number does not match the original contract number";
        return { response_action: "errors", errors };
      } else {
        console.log(contractNum);
        return {};
      }
    },
  );

function buildNewModalView() {
  return {
    "type": "modal",
    "callback_id": "lease-termination-contract-no",
    "title": { "type": "plain_text", "text": "Lease Termination" },
    "notify_on_close": false,
    "submit": { "type": "plain_text", "text": "Continue" },
    "blocks": [
      {
        "type": "input",
        // If you reuse block_id when refreshing an existing modal view,
        // the old block may remain. To avoid this, always set a random value.
        "block_id": crypto.randomUUID(),
        "label": { "type": "plain_text", "text": "Enter Contract Number" },
        "element": {
          "type": "plain_text_input",
          "action_id": "lease-termination-contract-no-action",
          "multiline": false,
          "placeholder": {
            "type": "plain_text",
            "text": "Contract Number",
          },
        },
      },
    ],
  };
}
