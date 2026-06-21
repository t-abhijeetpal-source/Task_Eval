// Real ingested content (agent definitions + output reports) pulled from the sibling
// task folders by scripts/ingest.mjs into agents-content.json. This is what the
// detail page's DocViewer renders — actual task markdown, not synthesized samples.
import realContent from "@/content/agents-content.json";

export interface AgentDoc {
  file: string;
  label: string;
  content: string;
  lines: number;
  bytes: number;
}

export interface AgentEntry {
  code: string;
  tier: string;
  title: string;
  definitionFile: string | null;
  definition: string | null;
  documents: AgentDoc[];
}

export const AGENT_CONTENT = realContent as unknown as Record<string, AgentEntry>;

export function agentEntry(code: string): AgentEntry | undefined {
  return AGENT_CONTENT[code];
}
