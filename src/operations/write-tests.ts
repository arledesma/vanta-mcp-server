// 1. Imports
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  handleWriteApiResponse,
  TEST_ID_DESCRIPTION,
} from "./common/imports.js";

const ENTITY_ID_DESCRIPTION =
  "Test entity ID to operate on, e.g. the specific failing resource/entity identifier within the test.";

// 2. Input Schemas
const DeactivateTestEntityInput = z.object({
  testId: z.string().describe(TEST_ID_DESCRIPTION),
  entityId: z.string().describe(ENTITY_ID_DESCRIPTION),
  deactivateReason: z
    .string()
    .min(1)
    .describe("Justification for deactivating this test entity."),
  deactivateUntilDate: z
    .string()
    .describe(
      "Optional ISO 8601 datetime after which the test entity will reactivate, e.g. '2025-12-31T00:00:00Z'.",
    )
    .optional(),
});

const ReactivateTestEntityInput = z.object({
  testId: z.string().describe(TEST_ID_DESCRIPTION),
  entityId: z.string().describe(ENTITY_ID_DESCRIPTION),
});

// 3. Tool Definitions
export const DeactivateTestEntityTool: Tool<typeof DeactivateTestEntityInput> =
  {
    name: "deactivate_test_entity",
    description:
      "Deactivate monitoring for a specific entity within a test. Requires a reason; optionally set an expiry date after which monitoring resumes.",
    parameters: DeactivateTestEntityInput,
  };

export const ReactivateTestEntityTool: Tool<typeof ReactivateTestEntityInput> =
  {
    name: "reactivate_test_entity",
    description:
      "Reactivate monitoring for a previously deactivated entity within a test.",
    parameters: ReactivateTestEntityInput,
  };

// 4. Implementation Functions
export async function deactivateTestEntity(
  args: z.infer<typeof DeactivateTestEntityInput>,
): Promise<CallToolResult> {
  const { testId, entityId, ...body } = args;
  const url = buildUrl(
    `/v1/tests/${String(testId)}/entities/${String(entityId)}/deactivate`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function reactivateTestEntity(
  args: z.infer<typeof ReactivateTestEntityInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/tests/${String(args.testId)}/entities/${String(args.entityId)}/reactivate`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "POST");
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    {
      tool: DeactivateTestEntityTool,
      handler: deactivateTestEntity,
      requiresWrites: true,
    },
    {
      tool: ReactivateTestEntityTool,
      handler: reactivateTestEntity,
      requiresWrites: true,
    },
  ],
};
