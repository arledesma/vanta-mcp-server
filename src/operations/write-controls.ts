// 1. Imports
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  handleWriteApiResponse,
  CONTROL_ID_DESCRIPTION,
} from "./common/imports.js";

// Control domain options as defined by the Vanta API (CreateControlInput.domain).
const CONTROL_DOMAINS = [
  "ARTIFICIAL_&_AUTONOMOUS_TECHNOLOGY",
  "ASSET_MANAGEMENT",
  "BUSINESS_CONTINUITY_&_DISASTER_RECOVERY",
  "CAPACITY_&_PERFORMANCE_PLANNING",
  "CHANGE_MANAGEMENT",
  "CLOUD_SECURITY",
  "COMPLIANCE",
  "CONFIGURATION_MANAGEMENT",
  "CONTINUOUS_MONITORING",
  "CRYPTOGRAPHIC_PROTECTIONS",
  "DATA_CLASSIFICATION_&_HANDLING",
  "EMBEDDED_TECHNOLOGY",
  "ENDPOINT_SECURITY",
  "HUMAN_RESOURCES_SECURITY",
  "IDENTIFICATION_&_AUTHENTICATION",
  "INCIDENT_RESPONSE",
  "INFORMATION_ASSURANCE",
  "MAINTENANCE",
  "MOBILE_DEVICE_MANAGEMENT",
  "NETWORK SECURITY",
  "PHYSICAL_&_ENVIRONMENTAL_SECURITY",
  "PRIVACY",
  "PROJECT_&_RESOURCE MANAGEMENT",
  "RISK_MANAGEMENT",
  "SECURE_ENGINEERING_&_ARCHITECTURE",
  "SECURITY_AWARENESS_&_TRAINING",
  "SECURITY_OPERATIONS",
  "SECURITY_&_PRIVACY_GOVERNANCE",
  "TECHNOLOGY_DEVELOPMENT_&_ACQUISITION",
  "THIRD-PARTY_MANAGEMENT",
  "THREAT_MANAGEMENT",
  "VULNERABILITY_&_PATCH_MANAGEMENT",
  "WEB_SECURITY",
  "ADMINISTRATIVE",
  "PHYSICAL",
  "TECHNICAL",
  "BASIC",
  "DERIVED",
] as const;

const CustomFieldSchema = z.object({
  label: z.string().describe("Custom field name."),
  value: z
    .union([z.string(), z.array(z.string())])
    .describe(
      "Custom field value: a string for text/date/number fields, or an array of strings for picklist fields.",
    ),
});

const FrameworkSectionSchema = z.object({
  frameworkId: z.string().describe("Framework ID the control maps to."),
  sectionId: z.string().describe("Section ID within the framework."),
});

// 2. Input Schemas
const CreateCustomControlInput = z.object({
  externalId: z
    .string()
    .describe("Your external identifier for the control (must be unique)."),
  name: z.string().describe("Control name."),
  description: z.string().describe("Control description."),
  effectiveDate: z
    .string()
    .describe("Date the control became effective, as an ISO 8601 datetime."),
  domain: z
    .enum(CONTROL_DOMAINS)
    .describe("Control domain (category) the control belongs to."),
  sections: z
    .array(FrameworkSectionSchema)
    .describe("Framework sections the control maps to.")
    .optional(),
  role: z
    .enum(["BOTH", "CONTROLLER", "PROCESSOR"])
    .describe(
      "GDPR role of the control (whether data is collected or processed). Only set for controls mapped to GDPR.",
    )
    .optional(),
  customFields: z
    .array(CustomFieldSchema)
    .describe("The control's values for custom fields.")
    .optional(),
});

const AddControlFromLibraryInput = z.object({
  controlId: z
    .string()
    .describe("ID of the control in the Vanta control library to add."),
});

const UpdateControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  name: z.string().describe("Updated control name.").optional(),
  description: z.string().describe("Updated control description.").optional(),
  externalId: z.string().describe("Updated external identifier.").optional(),
  domain: z
    .enum(CONTROL_DOMAINS)
    .describe("Updated control domain (category).")
    .optional(),
  note: z.string().describe("Note about the control.").optional(),
  customFields: z
    .array(CustomFieldSchema)
    .describe("Updated values for custom fields.")
    .optional(),
});

const DeleteControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
});

const SetControlOwnerInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  userId: z.string().describe("ID of the Vanta user to set as control owner."),
});

const AddDocumentToControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  documentId: z.string().describe("ID of the document to map to the control."),
});

const RemoveDocumentFromControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  documentId: z
    .string()
    .describe("ID of the document to unmap from the control."),
});

const AddTestToControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  testId: z.string().describe("ID of the test to map to the control."),
});

const RemoveTestFromControlInput = z.object({
  controlId: z.string().describe(CONTROL_ID_DESCRIPTION),
  testId: z.string().describe("ID of the test to unmap from the control."),
});

// 3. Tool Definitions
export const CreateCustomControlTool: Tool<typeof CreateCustomControlInput> = {
  name: "create_custom_control",
  description:
    "Create a custom control in your Vanta account. Requires an external ID, name, description, effective date, and domain.",
  parameters: CreateCustomControlInput,
};

export const AddControlFromLibraryTool: Tool<
  typeof AddControlFromLibraryInput
> = {
  name: "add_control_from_library",
  description:
    "Add a control to your account from the Vanta control library by its library control ID.",
  parameters: AddControlFromLibraryInput,
};

export const UpdateControlTool: Tool<typeof UpdateControlInput> = {
  name: "update_control",
  description:
    "Update a control's metadata (name, description, external ID, domain, note, or custom fields). Provide only the fields you want to change.",
  parameters: UpdateControlInput,
};

export const DeleteControlTool: Tool<typeof DeleteControlInput> = {
  name: "delete_control",
  description:
    "Deactivate (delete) a control by ID. This removes the control from active monitoring.",
  parameters: DeleteControlInput,
};

export const SetControlOwnerTool: Tool<typeof SetControlOwnerInput> = {
  name: "set_control_owner",
  description: "Set the owner of a control to a given Vanta user.",
  parameters: SetControlOwnerInput,
};

export const AddDocumentToControlTool: Tool<typeof AddDocumentToControlInput> =
  {
    name: "add_document_to_control",
    description: "Map a document to a control.",
    parameters: AddDocumentToControlInput,
  };

export const RemoveDocumentFromControlTool: Tool<
  typeof RemoveDocumentFromControlInput
> = {
  name: "remove_document_from_control",
  description: "Remove a document mapping from a control.",
  parameters: RemoveDocumentFromControlInput,
};

export const AddTestToControlTool: Tool<typeof AddTestToControlInput> = {
  name: "add_test_to_control",
  description: "Map a test to a control.",
  parameters: AddTestToControlInput,
};

export const RemoveTestFromControlTool: Tool<
  typeof RemoveTestFromControlInput
> = {
  name: "remove_test_from_control",
  description: "Remove a test mapping from a control.",
  parameters: RemoveTestFromControlInput,
};

// 4. Implementation Functions
export async function createCustomControl(
  args: z.infer<typeof CreateCustomControlInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/controls");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function addControlFromLibrary(
  args: z.infer<typeof AddControlFromLibraryInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/controls/add-from-library");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function updateControl(
  args: z.infer<typeof UpdateControlInput>,
): Promise<CallToolResult> {
  const { controlId, ...body } = args;
  const url = buildUrl(`/v1/controls/${String(controlId)}`);
  const response = await makeAuthenticatedWriteRequest(url, "PATCH", body);
  return handleWriteApiResponse(response);
}

export async function deleteControl(
  args: z.infer<typeof DeleteControlInput>,
): Promise<CallToolResult> {
  const url = buildUrl(`/v1/controls/${String(args.controlId)}`);
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

export async function setControlOwner(
  args: z.infer<typeof SetControlOwnerInput>,
): Promise<CallToolResult> {
  const { controlId, ...body } = args;
  const url = buildUrl(`/v1/controls/${String(controlId)}/set-owner`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function addDocumentToControl(
  args: z.infer<typeof AddDocumentToControlInput>,
): Promise<CallToolResult> {
  const { controlId, ...body } = args;
  const url = buildUrl(
    `/v1/controls/${String(controlId)}/add-document-to-control`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function removeDocumentFromControl(
  args: z.infer<typeof RemoveDocumentFromControlInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/controls/${String(args.controlId)}/documents/${String(args.documentId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

export async function addTestToControl(
  args: z.infer<typeof AddTestToControlInput>,
): Promise<CallToolResult> {
  const { controlId, ...body } = args;
  const url = buildUrl(`/v1/controls/${String(controlId)}/add-test-to-control`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function removeTestFromControl(
  args: z.infer<typeof RemoveTestFromControlInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/controls/${String(args.controlId)}/tests/${String(args.testId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    {
      tool: CreateCustomControlTool,
      handler: createCustomControl,
      requiresWrites: true,
    },
    {
      tool: AddControlFromLibraryTool,
      handler: addControlFromLibrary,
      requiresWrites: true,
    },
    { tool: UpdateControlTool, handler: updateControl, requiresWrites: true },
    { tool: DeleteControlTool, handler: deleteControl, requiresWrites: true },
    {
      tool: SetControlOwnerTool,
      handler: setControlOwner,
      requiresWrites: true,
    },
    {
      tool: AddDocumentToControlTool,
      handler: addDocumentToControl,
      requiresWrites: true,
    },
    {
      tool: RemoveDocumentFromControlTool,
      handler: removeDocumentFromControl,
      requiresWrites: true,
    },
    {
      tool: AddTestToControlTool,
      handler: addTestToControl,
      requiresWrites: true,
    },
    {
      tool: RemoveTestFromControlTool,
      handler: removeTestFromControl,
      requiresWrites: true,
    },
  ],
};
