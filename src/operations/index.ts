// Barrel export for all Vanta MCP operations
// This file provides a single entry point for importing any operation tools
// from the Vanta MCP Server operations module.

// Individual operation modules
export * from "./tests.js";
export * from "./frameworks.js";
export * from "./controls.js";
export * from "./risks.js";
export * from "./integrations.js";
export * from "./vendors.js";
export * from "./documents.js";
export * from "./policies.js";
export * from "./discovered-vendors.js";
export * from "./groups.js";
export * from "./people.js";
export * from "./vulnerabilities.js";
export * from "./vulnerability-remediations.js";
export * from "./vulnerable-assets.js";
export * from "./monitored-computers.js";
export * from "./vendor-risk-attributes.js";
export * from "./trust-centers.js";

// Write operation modules (tools gated behind --dangerously-allow-writes)
export * from "./write-vulnerabilities.js";
export * from "./write-tests.js";
export * from "./write-people.js";
export * from "./write-controls.js";
export * from "./write-documents.js";
export * from "./write-risks.js";

// Common utilities and shared resources
export * from "./common/utils.js";
export * from "./common/descriptions.js";
export * from "./common/imports.js";
