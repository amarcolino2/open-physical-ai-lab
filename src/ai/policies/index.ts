import type {
  ColabPolicyArtifact,
  DemonstrationEpisode,
  Plan,
} from "../../types";

export interface PolicyStatus {
  name: string;
  confidence: number;
  state: "idle" | "running" | "trained";
}

export const policyStatus: PolicyStatus = {
  name: "rule-based-baseline",
  confidence: 0.42,
  state: "idle",
};

interface LearnedPolicyModel {
  commandToPlan: Record<string, Plan>;
  trainedAt: number;
  samples: number;
}

let learnedPolicyModel: LearnedPolicyModel | null = null;

const STOP_WORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "para",
  "pra",
  "por",
  "com",
  "no",
  "na",
  "nos",
  "nas",
  "ao",
  "aos",
  "e",
]);

const TOKEN_ALIASES: Record<string, string> = {
  pegue: "pegar",
  pega: "pegar",
  pegar: "pegar",
  apanhe: "pegar",
  coloque: "colocar",
  coloca: "colocar",
  por: "colocar",
  mova: "mover",
  movao: "mover",
  celular: "phone",
  telefone: "phone",
  phone: "phone",
  copo: "cup",
  xicara: "cup",
  cup: "cup",
  caixa: "box",
  box: "box",
};

function normalizeCommand(command: string): string {
  const ascii = command
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const normalized = ascii
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const normalizedTokens = normalized
    .split(" ")
    .filter((token) => token.length > 0)
    .filter((token) => !STOP_WORDS.has(token))
    .map((token) => TOKEN_ALIASES[token] ?? token);

  return normalizedTokens.join(" ");
}

function buildBigrams(value: string): Set<string> {
  const compact = value.replace(/\s+/g, " ").trim();

  if (!compact) {
    return new Set();
  }

  if (compact.length === 1) {
    return new Set([compact]);
  }

  const grams = new Set<string>();

  for (let i = 0; i < compact.length - 1; i += 1) {
    grams.add(compact.slice(i, i + 2));
  }

  return grams;
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  const unionTokenCount = new Set([
    ...tokensA,
    ...tokensB,
  ]).size;
  let tokenIntersection = 0;

  for (const token of tokensA) {
    if (tokensB.has(token)) {
      tokenIntersection += 1;
    }
  }

  const tokenJaccard =
    unionTokenCount > 0
      ? tokenIntersection / unionTokenCount
      : 0;

  const gramsA = buildBigrams(a);
  const gramsB = buildBigrams(b);
  const unionGramCount = new Set([
    ...gramsA,
    ...gramsB,
  ]).size;
  let gramIntersection = 0;

  for (const gram of gramsA) {
    if (gramsB.has(gram)) {
      gramIntersection += 1;
    }
  }

  const gramJaccard =
    unionGramCount > 0
      ? gramIntersection / unionGramCount
      : 0;

  return tokenJaccard * 0.7 + gramJaccard * 0.3;
}

function findBestApproximateKey(
  key: string,
  commandToPlan: Record<string, Plan>
): string | null {
  const candidates = Object.keys(commandToPlan);

  if (candidates.length === 0) {
    return null;
  }

  let bestKey: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarityScore(key, candidate);

    if (score > bestScore) {
      bestScore = score;
      bestKey = candidate;
    }
  }

  return bestScore >= 0.58 ? bestKey : null;
}

export function hasLearnedPolicy(): boolean {
  return Boolean(learnedPolicyModel);
}

export function trainPolicyFromDemonstrations(
  episodes: DemonstrationEpisode[]
): void {
  const commandToPlan: Record<string, Plan> = {};
  let samples = 0;

  for (const episode of episodes) {
    for (const frame of episode.frames) {
      const key = normalizeCommand(frame.command);

      if (!key) {
        continue;
      }

      commandToPlan[key] = {
        ...frame.plan,
        confidence: Math.max(frame.plan.confidence, 0.7),
        reasoning: "Learned policy prediction from demonstrations",
      };
      samples += 1;
    }
  }

  if (samples === 0) {
    return;
  }

  learnedPolicyModel = {
    commandToPlan,
    trainedAt: Date.now(),
    samples,
  };

  policyStatus.name = "learned-demo-policy";
  policyStatus.confidence = 0.86;
  policyStatus.state = "trained";
}

export function loadPolicyFromColabArtifact(
  artifact: ColabPolicyArtifact
): boolean {
  const entries = Object.entries(
    artifact.commandToPlan ?? {}
  );

  if (entries.length === 0) {
    return false;
  }

  const commandToPlan: Record<string, Plan> = {};

  for (const [command, plan] of entries) {
    const normalized = normalizeCommand(command);

    if (!normalized) {
      continue;
    }

    commandToPlan[normalized] = {
      action: plan.action,
      target: plan.target,
      priority: 1,
      confidence: plan.confidence,
      reasoning: plan.reasoning,
      rawCommand: normalized,
    };
  }

  if (Object.keys(commandToPlan).length === 0) {
    return false;
  }

  learnedPolicyModel = {
    commandToPlan,
    trainedAt: artifact.generatedAt,
    samples: Object.keys(commandToPlan).length,
  };

  policyStatus.name = artifact.model || "learned-colab-policy";
  policyStatus.confidence = 0.92;
  policyStatus.state = "trained";

  return true;
}

export function inferLearnedPolicy(
  command: string
): Plan | null {
  if (!learnedPolicyModel) {
    return null;
  }

  const key = normalizeCommand(command);
  const exactPlan = learnedPolicyModel.commandToPlan[key];

  if (exactPlan) {
    policyStatus.state = "running";

    return {
      ...exactPlan,
      rawCommand: command,
    };
  }

  const approximateKey = findBestApproximateKey(
    key,
    learnedPolicyModel.commandToPlan
  );

  if (!approximateKey) {
    return null;
  }

  const plan = learnedPolicyModel.commandToPlan[approximateKey];

  if (!plan) {
    return null;
  }

  policyStatus.state = "running";

  return {
    ...plan,
    confidence: Math.max(plan.confidence * 0.9, 0.4),
    reasoning: `${plan.reasoning} (aproximado de: \"${approximateKey}\")`,
    rawCommand: command,
  };
}

export function resetPolicyRuntimeState(): void {
  if (learnedPolicyModel) {
    policyStatus.state = "trained";
    return;
  }

  policyStatus.state = "idle";
}
