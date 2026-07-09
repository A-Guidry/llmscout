import type { CheckModule } from "../types.js";
import { crawlerAccess } from "./crawler-access.js";
import { answerFirst } from "./answer-first.js";
import { headingHierarchy } from "./heading-hierarchy.js";
import { jsonLd } from "./json-ld.js";
import { eeatSignals } from "./eeat-signals.js";
import { qaStructure } from "./qa-structure.js";
import { statDensity } from "./stat-density.js";
import { contentRatio } from "./content-ratio.js";
import { llmsTxt } from "./llms-txt.js";

export const ALL_CHECKS: CheckModule[] = [
  crawlerAccess,
  answerFirst,
  jsonLd,
  headingHierarchy,
  eeatSignals,
  qaStructure,
  statDensity,
  contentRatio,
  llmsTxt,
];
