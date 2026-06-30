// 1. Imports
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  handleWriteApiResponse,
  CONTROL_ID_DESCRIPTION,
  RISK_SCENARIO_ID_DESCRIPTION,
} from "./common/imports.js";

const CustomAttributeSchema = z.object({
  label: z.string().describe("Custom attribute name."),
  value: z
    .union([z.string(), z.array(z.string())])
    .describe(
      "Custom attribute value: a string for text/date/number/currency fields, or an array of strings for picklist fields.",
    ),
});

// Optional risk scenario fields shared by create and update.
const riskScenarioOptionalFields = {
  detailedDescription: z
    .string()
    .describe("Detailed description of the risk scenario.")
    .optional(),
  isSensitive: z
    .boolean()
    .describe("Whether the risk scenario contains sensitive information.")
    .optional(),
  likelihood: z
    .number()
    .int()
    .describe("Likelihood score for the inherent risk.")
    .optional(),
  impact: z
    .number()
    .int()
    .describe("Impact score for the inherent risk.")
    .optional(),
  residualLikelihood: z
    .number()
    .int()
    .describe("Likelihood score for the residual risk.")
    .optional(),
  residualImpact: z
    .number()
    .int()
    .describe("Impact score for the residual risk.")
    .optional(),
  categories: z
    .array(z.string())
    .describe(
      "Categories this risk scenario belongs to. New values create new custom categories.",
    )
    .optional(),
  ciaCategories: z
    .array(z.enum(["Confidentiality", "Integrity", "Availability"]))
    .describe("CIA categories (Confidentiality, Integrity, Availability).")
    .optional(),
  treatment: z
    .enum(["Mitigate", "Transfer", "Avoid", "Accept"])
    .describe("Risk treatment decision.")
    .optional(),
  owner: z
    .string()
    .describe(
      "Email address of the Vanta user responsible for tracking and mitigating this risk.",
    )
    .optional(),
  note: z.string().describe("Note about the risk scenario.").optional(),
  riskRegister: z
    .string()
    .describe(
      "Name of the risk register to associate. Required if the organization has multiple registers.",
    )
    .optional(),
  customFields: z
    .array(CustomAttributeSchema)
    .describe("Custom attributes for the risk scenario.")
    .optional(),
  type: z
    .enum(["Risk Scenario", "Enterprise Risk"])
    .describe("Type of risk.")
    .optional(),
  identificationDate: z
    .string()
    .describe("Date the risk was identified, as an ISO 8601 datetime.")
    .optional(),
};

// 2. Input Schemas
const CreateRiskScenarioInput = z.object({
  description: z.string().describe("Description of the risk scenario."),
  riskId: z
    .string()
    .describe("Your external identifier for the risk scenario.")
    .optional(),
  ...riskScenarioOptionalFields,
});

const UpdateRiskScenarioInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
  description: z
    .string()
    .describe("Updated description of the risk scenario.")
    .optional(),
  ...riskScenarioOptionalFields,
});

const SubmitRiskForApprovalInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
  comment: z
    .string()
    .describe("Optional comment to include with the approval request.")
    .optional(),
});

const CancelRiskApprovalRequestInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
});

const AddRiskScenarioControlInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
  controlId: z
    .string()
    .describe("ID of the control to add to the risk scenario."),
  controlType: z
    .enum(["EXISTING", "TREATMENT_PLAN"])
    .describe(
      "Whether the control is an existing control or part of the treatment plan.",
    )
    .optional(),
});

const UpdateRiskScenarioControlInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  controlType: z
    .enum(["EXISTING", "TREATMENT_PLAN"])
    .describe(
      "Updated control type: existing control or part of the treatment plan.",
    ),
});

const RemoveRiskScenarioControlInput = z.object({
  riskScenarioId: z.string().describe(RISK_SCENARIO_ID_DESCRIPTION),
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
});

// 3. Tool Definitions
export const CreateRiskScenarioTool: Tool<typeof CreateRiskScenarioInput> = {
  name: "create_risk_scenario",
  description:
    "Create a risk scenario in your Vanta account. Only a description is required; all other fields (scoring, treatment, owner, categories, etc.) are optional.",
  parameters: CreateRiskScenarioInput,
};

export const UpdateRiskScenarioTool: Tool<typeof UpdateRiskScenarioInput> = {
  name: "update_risk_scenario",
  description:
    "Update a risk scenario's fields. Provide only the fields you want to change.",
  parameters: UpdateRiskScenarioInput,
};

export const SubmitRiskForApprovalTool: Tool<
  typeof SubmitRiskForApprovalInput
> = {
  name: "submit_risk_for_approval",
  description:
    "Submit a risk scenario for approval, optionally including a comment.",
  parameters: SubmitRiskForApprovalInput,
};

export const CancelRiskApprovalRequestTool: Tool<
  typeof CancelRiskApprovalRequestInput
> = {
  name: "cancel_risk_approval_request",
  description: "Cancel a pending approval request for a risk scenario.",
  parameters: CancelRiskApprovalRequestInput,
};

export const AddRiskScenarioControlTool: Tool<
  typeof AddRiskScenarioControlInput
> = {
  name: "add_risk_scenario_control",
  description:
    "Add a control to a risk scenario, optionally specifying whether it is an existing control or part of the treatment plan.",
  parameters: AddRiskScenarioControlInput,
};

export const UpdateRiskScenarioControlTool: Tool<
  typeof UpdateRiskScenarioControlInput
> = {
  name: "update_risk_scenario_control",
  description: "Change the control type of a control on a risk scenario.",
  parameters: UpdateRiskScenarioControlInput,
};

export const RemoveRiskScenarioControlTool: Tool<
  typeof RemoveRiskScenarioControlInput
> = {
  name: "remove_risk_scenario_control",
  description: "Remove a control from a risk scenario.",
  parameters: RemoveRiskScenarioControlInput,
};

// 4. Implementation Functions
export async function createRiskScenario(
  args: z.infer<typeof CreateRiskScenarioInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/risk-scenarios");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function updateRiskScenario(
  args: z.infer<typeof UpdateRiskScenarioInput>,
): Promise<CallToolResult> {
  const { riskScenarioId, ...body } = args;
  const url = buildUrl(`/v1/risk-scenarios/${String(riskScenarioId)}`);
  const response = await makeAuthenticatedWriteRequest(url, "PATCH", body);
  return handleWriteApiResponse(response);
}

export async function submitRiskForApproval(
  args: z.infer<typeof SubmitRiskForApprovalInput>,
): Promise<CallToolResult> {
  const { riskScenarioId, ...body } = args;
  const url = buildUrl(
    `/v1/risk-scenarios/${String(riskScenarioId)}/submit-for-approval`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function cancelRiskApprovalRequest(
  args: z.infer<typeof CancelRiskApprovalRequestInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/risk-scenarios/${String(args.riskScenarioId)}/cancel-approval-request`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "POST");
  return handleWriteApiResponse(response);
}

export async function addRiskScenarioControl(
  args: z.infer<typeof AddRiskScenarioControlInput>,
): Promise<CallToolResult> {
  const { riskScenarioId, ...body } = args;
  const url = buildUrl(`/v1/risk-scenarios/${String(riskScenarioId)}/controls`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function updateRiskScenarioControl(
  args: z.infer<typeof UpdateRiskScenarioControlInput>,
): Promise<CallToolResult> {
  const { riskScenarioId, controlId, ...body } = args;
  const url = buildUrl(
    `/v1/risk-scenarios/${String(riskScenarioId)}/controls/${String(controlId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "PATCH", body);
  return handleWriteApiResponse(response);
}

export async function removeRiskScenarioControl(
  args: z.infer<typeof RemoveRiskScenarioControlInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/risk-scenarios/${String(args.riskScenarioId)}/controls/${String(args.controlId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    {
      tool: CreateRiskScenarioTool,
      handler: createRiskScenario,
      requiresWrites: true,
    },
    {
      tool: UpdateRiskScenarioTool,
      handler: updateRiskScenario,
      requiresWrites: true,
    },
    {
      tool: SubmitRiskForApprovalTool,
      handler: submitRiskForApproval,
      requiresWrites: true,
    },
    {
      tool: CancelRiskApprovalRequestTool,
      handler: cancelRiskApprovalRequest,
      requiresWrites: true,
    },
    {
      tool: AddRiskScenarioControlTool,
      handler: addRiskScenarioControl,
      requiresWrites: true,
    },
    {
      tool: UpdateRiskScenarioControlTool,
      handler: updateRiskScenarioControl,
      requiresWrites: true,
    },
    {
      tool: RemoveRiskScenarioControlTool,
      handler: removeRiskScenarioControl,
      requiresWrites: true,
    },
  ],
};
