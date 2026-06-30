// 1. Imports
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  handleWriteApiResponse,
} from "./common/imports.js";

// 2. Input Schemas
const DeactivateVulnerabilityUpdateSchema = z.object({
  id: z.string().describe("ID of the vulnerability to deactivate."),
  deactivateReason: z
    .string()
    .min(1)
    .describe("Justification for deactivating this vulnerability."),
  shouldReactivateWhenFixable: z
    .boolean()
    .describe(
      "Whether the vulnerability should automatically reactivate when a fix becomes available.",
    ),
  deactivateUntilDate: z
    .string()
    .describe(
      "Optional ISO 8601 datetime after which the vulnerability will reactivate, e.g. '2025-12-31T00:00:00Z'.",
    )
    .optional(),
});

const DeactivateVulnerabilitiesInput = z.object({
  updates: z
    .array(DeactivateVulnerabilityUpdateSchema)
    .min(1)
    .max(50)
    .describe("List of vulnerabilities to deactivate (1–50 items)."),
});

const ReactivateVulnerabilityUpdateSchema = z.object({
  id: z.string().describe("ID of the vulnerability to reactivate."),
});

const ReactivateVulnerabilitiesInput = z.object({
  updates: z
    .array(ReactivateVulnerabilityUpdateSchema)
    .min(1)
    .max(50)
    .describe("List of vulnerabilities to reactivate (1–50 items)."),
});

// 3. Tool Definitions
export const DeactivateVulnerabilitiesTool: Tool<
  typeof DeactivateVulnerabilitiesInput
> = {
  name: "deactivate_vulnerabilities",
  description:
    "Deactivate monitoring for one or more vulnerabilities. Each entry requires a reason and a flag controlling whether it auto-reactivates when a fix is available. Optionally set an expiry date after which monitoring resumes. Accepts 1–50 vulnerabilities per call.",
  parameters: DeactivateVulnerabilitiesInput,
};

export const ReactivateVulnerabilitiesTool: Tool<
  typeof ReactivateVulnerabilitiesInput
> = {
  name: "reactivate_vulnerabilities",
  description:
    "Reactivate monitoring for one or more previously deactivated vulnerabilities. Accepts 1–50 vulnerabilities per call.",
  parameters: ReactivateVulnerabilitiesInput,
};

// 4. Implementation Functions
export async function deactivateVulnerabilities(
  args: z.infer<typeof DeactivateVulnerabilitiesInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/vulnerabilities/deactivate");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function reactivateVulnerabilities(
  args: z.infer<typeof ReactivateVulnerabilitiesInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/vulnerabilities/reactivate");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    {
      tool: DeactivateVulnerabilitiesTool,
      handler: deactivateVulnerabilities,
      requiresWrites: true,
    },
    {
      tool: ReactivateVulnerabilitiesTool,
      handler: reactivateVulnerabilities,
      requiresWrites: true,
    },
  ],
};
