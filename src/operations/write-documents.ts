// 1. Imports
import fs from "node:fs";
import { basename } from "node:path";
import {
  CallToolResult,
  Tool,
  z,
  buildUrl,
  makeAuthenticatedWriteRequest,
  makeAuthenticatedMultipartRequest,
  handleWriteApiResponse,
  createErrorResponse,
  DOCUMENT_ID_DESCRIPTION,
} from "./common/imports.js";

// 2. Input Schemas
const CreateDocumentInput = z.object({
  title: z.string().describe("Document title."),
  description: z.string().describe("Document description."),
  timeSensitivity: z
    .enum(["MOST_RECENT", "DURING_AUDIT_WINDOW"])
    .describe(
      "Whether the most recent upload is required ('MOST_RECENT') or an upload from during the audit window is acceptable ('DURING_AUDIT_WINDOW').",
    ),
  cadence: z
    .enum(["P0D", "P1D", "P1W", "P1M", "P3M", "P6M", "P1Y", "P2Y"])
    .describe(
      "How often the document must be re-collected, as an ISO 8601 duration (e.g. 'P1Y' = yearly, 'P0D' = never).",
    ),
  reminderWindow: z
    .enum(["P0D", "P1D", "P1W", "P1M", "P3M"])
    .describe(
      "How far in advance to remind the owner before the document is due, as an ISO 8601 duration.",
    ),
  isSensitive: z
    .boolean()
    .describe("Whether the document contains sensitive information."),
});

const DeleteDocumentInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
});

const CreateDocumentLinkInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
  url: z.string().describe("URL of the external link."),
  title: z.string().describe("Title for the link."),
  description: z
    .string()
    .describe("Optional description for the link.")
    .optional(),
  effectiveDate: z
    .string()
    .describe("Optional effective date for the link, as an ISO 8601 datetime.")
    .optional(),
});

const DeleteDocumentLinkInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
  linkId: z.string().describe("ID of the link to remove from the document."),
});

const SetDocumentOwnerInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
  userId: z.string().describe("ID of the Vanta user to set as document owner."),
});

const SubmitDocumentCollectionInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
});

const DeleteDocumentUploadInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
  uploadedFileId: z
    .string()
    .describe("ID of the uploaded file to delete from the document."),
});

const UploadFileForDocumentInput = z.object({
  documentId: z.string().describe(DOCUMENT_ID_DESCRIPTION),
  content: z
    .string()
    .describe(
      "Base64-encoded contents of the file to upload. REQUIRED unless 'filePath' is given (provide exactly one). When set, 'fileName' is also required.",
    )
    .optional(),
  fileName: z
    .string()
    .describe(
      "Name to give the uploaded file, e.g. 'policy.pdf'. REQUIRED when 'content' is provided; when using 'filePath' it defaults to that file's base name.",
    )
    .optional(),
  filePath: z
    .string()
    .describe(
      "Absolute path to a local file to upload, read from the machine running the MCP server. REQUIRED unless 'content' is given (provide exactly one). Only usable when the server has filesystem access to the path; for remote/hosted servers use 'content' instead.",
    )
    .optional(),
  contentType: z
    .string()
    .describe(
      "Optional MIME type for the uploaded file, e.g. 'application/pdf'. Defaults to the server-detected type.",
    )
    .optional(),
  effectiveAtDate: z
    .string()
    .describe(
      "Optional date the uploaded document is effective from, as an ISO 8601 datetime.",
    )
    .optional(),
  description: z
    .string()
    .describe("Optional description of the uploaded file.")
    .optional(),
});

// 3. Tool Definitions
export const CreateDocumentTool: Tool<typeof CreateDocumentInput> = {
  name: "create_document",
  description:
    "Create a custom document (evidence collection request) in your Vanta account. Requires title, description, time sensitivity, collection cadence, reminder window, and a sensitivity flag.",
  parameters: CreateDocumentInput,
};

export const DeleteDocumentTool: Tool<typeof DeleteDocumentInput> = {
  name: "delete_document",
  description: "Delete a document by ID.",
  parameters: DeleteDocumentInput,
};

export const CreateDocumentLinkTool: Tool<typeof CreateDocumentLinkInput> = {
  name: "create_document_link",
  description:
    "Add an external link as evidence for a document. Requires a URL and title.",
  parameters: CreateDocumentLinkInput,
};

export const DeleteDocumentLinkTool: Tool<typeof DeleteDocumentLinkInput> = {
  name: "delete_document_link",
  description: "Remove an external link from a document.",
  parameters: DeleteDocumentLinkInput,
};

export const SetDocumentOwnerTool: Tool<typeof SetDocumentOwnerInput> = {
  name: "set_document_owner",
  description: "Set the owner of a document to a given Vanta user.",
  parameters: SetDocumentOwnerInput,
};

export const SubmitDocumentCollectionTool: Tool<
  typeof SubmitDocumentCollectionInput
> = {
  name: "submit_document_collection",
  description:
    "Submit a document's collected evidence, marking the current collection as complete.",
  parameters: SubmitDocumentCollectionInput,
};

export const DeleteDocumentUploadTool: Tool<typeof DeleteDocumentUploadInput> =
  {
    name: "delete_document_upload",
    description: "Delete an uploaded file from a document.",
    parameters: DeleteDocumentUploadInput,
  };

export const UploadFileForDocumentTool: Tool<
  typeof UploadFileForDocumentInput
> = {
  name: "upload_file_for_document",
  description:
    "Upload a file as evidence for a document. Provide the file in exactly ONE of two ways: (1) 'content' as a base64-encoded string plus 'fileName' (works anywhere, including remote/hosted servers); or (2) 'filePath' as an absolute path the MCP server host can read from disk. Supplying both or neither is an error. Optionally set 'contentType', 'effectiveAtDate', and 'description'.",
  parameters: UploadFileForDocumentInput,
};

// 4. Implementation Functions
export async function createDocument(
  args: z.infer<typeof CreateDocumentInput>,
): Promise<CallToolResult> {
  const url = buildUrl("/v1/documents");
  const response = await makeAuthenticatedWriteRequest(url, "POST", args);
  return handleWriteApiResponse(response);
}

export async function deleteDocument(
  args: z.infer<typeof DeleteDocumentInput>,
): Promise<CallToolResult> {
  const url = buildUrl(`/v1/documents/${String(args.documentId)}`);
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

export async function createDocumentLink(
  args: z.infer<typeof CreateDocumentLinkInput>,
): Promise<CallToolResult> {
  const { documentId, ...body } = args;
  const url = buildUrl(`/v1/documents/${String(documentId)}/links`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function deleteDocumentLink(
  args: z.infer<typeof DeleteDocumentLinkInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/documents/${String(args.documentId)}/links/${String(args.linkId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

export async function setDocumentOwner(
  args: z.infer<typeof SetDocumentOwnerInput>,
): Promise<CallToolResult> {
  const { documentId, ...body } = args;
  const url = buildUrl(`/v1/documents/${String(documentId)}/set-owner`);
  const response = await makeAuthenticatedWriteRequest(url, "POST", body);
  return handleWriteApiResponse(response);
}

export async function submitDocumentCollection(
  args: z.infer<typeof SubmitDocumentCollectionInput>,
): Promise<CallToolResult> {
  const url = buildUrl(`/v1/documents/${String(args.documentId)}/submit`);
  const response = await makeAuthenticatedWriteRequest(url, "POST");
  return handleWriteApiResponse(response);
}

export async function deleteDocumentUpload(
  args: z.infer<typeof DeleteDocumentUploadInput>,
): Promise<CallToolResult> {
  const url = buildUrl(
    `/v1/documents/${String(args.documentId)}/uploads/${String(args.uploadedFileId)}`,
  );
  const response = await makeAuthenticatedWriteRequest(url, "DELETE");
  return handleWriteApiResponse(response);
}

export async function uploadFileForDocument(
  args: z.infer<typeof UploadFileForDocumentInput>,
): Promise<CallToolResult> {
  const {
    documentId,
    content,
    fileName,
    filePath,
    contentType,
    effectiveAtDate,
    description,
  } = args;

  // Exactly one of content (base64) or filePath must be provided.
  if (content !== undefined && filePath !== undefined) {
    return createErrorResponse(
      "Provide exactly one of 'content' (base64) or 'filePath', not both.",
    );
  }
  if (content === undefined && filePath === undefined) {
    return createErrorResponse(
      "Provide the file as either 'content' (base64 + 'fileName') or 'filePath'.",
    );
  }

  let fileBytes: Buffer;
  let uploadName: string;

  if (content !== undefined) {
    if (fileName === undefined) {
      return createErrorResponse(
        "'fileName' is required when 'content' (base64) is provided.",
      );
    }
    fileBytes = Buffer.from(content, "base64");
    if (fileBytes.length === 0 && content.length > 0) {
      return createErrorResponse(
        "'content' could not be decoded as base64. Ensure it is a valid base64 string.",
      );
    }
    uploadName = fileName;
  } else if (filePath !== undefined) {
    try {
      fileBytes = await fs.promises.readFile(filePath);
    } catch (error) {
      return createErrorResponse(
        `Failed to read file '${filePath}': ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    uploadName = fileName ?? basename(filePath);
  } else {
    // Unreachable: the both/neither checks above guarantee exactly one source.
    return createErrorResponse(
      "Provide the file as either 'content' (base64 + 'fileName') or 'filePath'.",
    );
  }

  // FormData/Blob are Node 18+ globals. Do not set Content-Type manually — fetch
  // derives the multipart boundary from the FormData body.
  const blob =
    contentType !== undefined
      ? new Blob([new Uint8Array(fileBytes)], { type: contentType })
      : new Blob([new Uint8Array(fileBytes)]);
  const form = new FormData();
  form.append("file", blob, uploadName);
  if (effectiveAtDate !== undefined) {
    form.append("effectiveAtDate", effectiveAtDate);
  }
  if (description !== undefined) {
    form.append("description", description);
  }

  const url = buildUrl(`/v1/documents/${String(documentId)}/uploads`);
  const response = await makeAuthenticatedMultipartRequest(url, form);
  return handleWriteApiResponse(response);
}

// Registry export — requiresWrites gates these tools behind --dangerously-allow-writes
export default {
  tools: [
    { tool: CreateDocumentTool, handler: createDocument, requiresWrites: true },
    { tool: DeleteDocumentTool, handler: deleteDocument, requiresWrites: true },
    {
      tool: CreateDocumentLinkTool,
      handler: createDocumentLink,
      requiresWrites: true,
    },
    {
      tool: DeleteDocumentLinkTool,
      handler: deleteDocumentLink,
      requiresWrites: true,
    },
    {
      tool: SetDocumentOwnerTool,
      handler: setDocumentOwner,
      requiresWrites: true,
    },
    {
      tool: SubmitDocumentCollectionTool,
      handler: submitDocumentCollection,
      requiresWrites: true,
    },
    {
      tool: DeleteDocumentUploadTool,
      handler: deleteDocumentUpload,
      requiresWrites: true,
    },
    {
      tool: UploadFileForDocumentTool,
      handler: uploadFileForDocument,
      requiresWrites: true,
    },
  ],
};
