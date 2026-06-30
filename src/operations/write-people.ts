// 1. Imports
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  handleWriteApiResponse,
  PERSON_ID_DESCRIPTION,
} from "./common/imports.js";

// 2. Input Schemas
const UpdatePersonInput = z.object({
  personId: z.string().describe(PERSON_ID_DESCRIPTION),
  name: z
    .object({
      first: z.string().describe("Person's first name."),
      last: z.string().describe("Person's last name."),
    })
    .describe("Updated name for the person.")
    .optional(),
  employment: z
    .object({
      startDate: z
        .string()
        .describe("Employment start date as an ISO 8601 datetime."),
    })
    .describe("Updated employment metadata for the person.")
    .optional(),
});

const SetPersonLeaveInput = z.object({
  personId: z.string().describe(PERSON_ID_DESCRIPTION),
  startDate: z
    .string()
    .describe("Leave start date as an ISO 8601 datetime, e.g. '2025-01-01'."),
  endDate: z
    .string()
    .describe("Leave end date as an ISO 8601 datetime, e.g. '2025-02-01'."),
});

const ClearPersonLeaveInput = z.object({
  personId: z.string().describe(PERSON_ID_DESCRIPTION),
});

const MarkAsPeopleInput = z.object({
  updates: z
    .array(z.object({ id: z.string().describe("ID of the person to change.") }))
    .min(1)
    .describe("People to mark as people (in-scope humans)."),
});

const MarkAsNotPeopleInput = z.object({
  updates: z
    .array(z.object({ id: z.string().describe("ID of the person to change.") }))
    .min(1)
    .describe(
      "People to mark as not people (e.g. service or shared accounts).",
    ),
});

const OffboardPeopleInput = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().describe("ID of the person to offboard."),
        acknowledgerId: z
          .string()
          .describe(
            "ID of the person recorded as completing the offboarding for this person.",
          ),
      }),
    )
    .min(1)
    .describe("People to offboard."),
});

// 3. Tool Definitions
export const UpdatePersonTool: Tool<typeof UpdatePersonInput> = {
  name: "update_person",
  description:
    "Update a person's metadata (name and/or employment start date). Provide only the fields you want to change.",
  parameters: UpdatePersonInput,
};

export const SetPersonLeaveTool: Tool<typeof SetPersonLeaveInput> = {
  name: "set_person_leave",
  description:
    "Set leave information for a person, marking them as on leave between the given start and end dates.",
  parameters: SetPersonLeaveInput,
};

export const ClearPersonLeaveTool: Tool<typeof ClearPersonLeaveInput> = {
  name: "clear_person_leave",
  description: "Remove leave information for a person.",
  parameters: ClearPersonLeaveInput,
};

export const MarkAsPeopleTool: Tool<typeof MarkAsPeopleInput> = {
  name: "mark_as_people",
  description:
    "Mark one or more accounts as people (in-scope humans) for compliance monitoring.",
  parameters: MarkAsPeopleInput,
};

export const MarkAsNotPeopleTool: Tool<typeof MarkAsNotPeopleInput> = {
  name: "mark_as_not_people",
  description:
    "Mark one or more accounts as not people (e.g. service or shared accounts), excluding them from people monitoring.",
  parameters: MarkAsNotPeopleInput,
};

export const OffboardPeopleTool: Tool<typeof OffboardPeopleInput> = {
  name: "offboard_people",
  description:
    "Offboard one or more people. Each entry records the person to offboard and the acknowledger who completed the offboarding.",
  parameters: OffboardPeopleInput,
};

// 4. Implementation Functions
export async function updatePerson(
  args: z.infer<typeof UpdatePersonInput>,
): Promise<CallToolResult> {
  const { personId, ...body } = args;
  const url = buildUrl(`/v1/people/${String(personId)}`);
  const response = await makeAuthenticatedWriteRequest(url, "PATCH", body);
  return handleWriteApiResponse(response);
}

export async function setPersonLeave(
  args: z.infer<typeof SetPersonLeaveInput>,
): Promise<CallToolResult> {
  const { personId, ...body } = args;
  const url = buildUrl(`/v1/people/${String(personId)}/set-leave`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function clearPersonLeave(
  args: z.infer<typeof ClearPersonLeaveInput>,
): Promise<CallToolResult> {
  const url = buildUrl(`/v1/people/${String(args.personId)}/clear-leave`);
  const response = await makeAuthenticatedWriteRequest(url, "POST");
  return handleWriteApiResponse(response);
}

export async function markAsPeople(
  args: z.infer<typeof MarkAsPeopleInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/people/mark-as-people");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function markAsNotPeople(
  args: z.infer<typeof MarkAsNotPeopleInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/people/mark-as-not-people");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function offboardPeople(
  args: z.infer<typeof OffboardPeopleInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/people/offboard");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    { tool: UpdatePersonTool, handler: updatePerson, requiresWrites: true },
    { tool: SetPersonLeaveTool, handler: setPersonLeave, requiresWrites: true },
    {
      tool: ClearPersonLeaveTool,
      handler: clearPersonLeave,
      requiresWrites: true,
    },
    { tool: MarkAsPeopleTool, handler: markAsPeople, requiresWrites: true },
    {
      tool: MarkAsNotPeopleTool,
      handler: markAsNotPeople,
      requiresWrites: true,
    },
    { tool: OffboardPeopleTool, handler: offboardPeople, requiresWrites: true },
  ],
};
