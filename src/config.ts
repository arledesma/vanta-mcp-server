const normalizeName = (name: string): string => name.trim().toLowerCase();

// Write operations are disabled unless the server is started with
// --dangerously-allow-writes (see src/index.ts). This flag also controls
// whether the OAuth token requests the vanta-api.all:write scope (see src/auth.ts).
let writesEnabled = false;
export const setWritesEnabled = (val: boolean): void => {
  writesEnabled = val;
};
export const isWritesEnabled = (): boolean => writesEnabled;

const enabledToolNames = [
  // Add tool names here to restrict the server to a subset of tools.
  // Leave the array empty to enable every tool.
  // Example:
  // "tests",
  // "list_test_entities",
  "tests",
  "list_test_entities",
  "people",
  "documents",
  "document_resources",
  "integrations",
  "integration_resources",
  "controls",
  "list_control_tests",
  "list_control_documents",
  "vulnerabilities",
  "frameworks",
  "list_framework_controls",
  "risks",
  // Write tools (only registered when --dangerously-allow-writes is set).
  "deactivate_vulnerabilities",
  "reactivate_vulnerabilities",
  "deactivate_test_entity",
  "reactivate_test_entity",
  "update_person",
  "set_person_leave",
  "clear_person_leave",
  "mark_as_people",
  "mark_as_not_people",
  "offboard_people",
  "create_custom_control",
  "add_control_from_library",
  "update_control",
  "delete_control",
  "set_control_owner",
  "add_document_to_control",
  "remove_document_from_control",
  "add_test_to_control",
  "remove_test_from_control",
  "create_document",
  "delete_document",
  "create_document_link",
  "delete_document_link",
  "set_document_owner",
  "submit_document_collection",
  "delete_document_upload",
  "upload_file_for_document",
  "create_risk_scenario",
  "update_risk_scenario",
  "submit_risk_for_approval",
  "cancel_risk_approval_request",
  "add_risk_scenario_control",
  "update_risk_scenario_control",
  "remove_risk_scenario_control",
].map(normalizeName);

export const enabledTools = new Set<string>(enabledToolNames);

export const hasEnabledToolFilter = enabledTools.size > 0;

export const isToolEnabled = (toolName: string): boolean => {
  if (!hasEnabledToolFilter) {
    return true;
  }
  return enabledTools.has(normalizeName(toolName));
};

export const getEnabledToolNames = (): string[] => [...enabledTools];
