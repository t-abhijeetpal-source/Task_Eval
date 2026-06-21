// Barrel: the data layer is split into focused modules. Import from here or from the
// individual modules — both work.
//   agents.ts   — the typed agent catalog (source of truth) + lookups
//   projects.ts — the Projects showcase
//   content.ts  — real ingested task markdown (agents-content.json)
//   metrics.ts  — build-time-generated dashboard metrics (metrics.json)
export * from "./agents";
export * from "./projects";
export * from "./content";
export * from "./metrics";
