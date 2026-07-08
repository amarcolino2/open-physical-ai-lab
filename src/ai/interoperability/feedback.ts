import type { ExternalExecutionFeedback } from "../../types";

interface WebotsReplayStep {
  timestamp?: number;
  action?: string;
  target?: string | null;
  feedback?: {
    success?: boolean;
    collision?: boolean;
    latencyMs?: number;
    notes?: string;
  };
}

interface WebotsReplayPlan {
  schema?: string;
  steps?: WebotsReplayStep[];
}

export function parseWebotsFeedbackArtifact(
  artifact: unknown
): ExternalExecutionFeedback[] {
  const plan = artifact as WebotsReplayPlan;

  if (!plan || !Array.isArray(plan.steps)) {
    return [];
  }

  const feedbackEntries: ExternalExecutionFeedback[] = [];

  for (const step of plan.steps) {
    if (!step || typeof step !== "object") {
      continue;
    }

    const feedback = step.feedback;

    if (!feedback || typeof feedback !== "object") {
      continue;
    }

    const timestamp =
      typeof step.timestamp === "number"
        ? step.timestamp
        : Date.now();

    feedbackEntries.push({
      timestamp,
      action: step.action ?? "none",
      target:
        typeof step.target === "string"
          ? step.target
          : null,
      success: Boolean(feedback.success),
      collision: Boolean(feedback.collision),
      latencyMs:
        typeof feedback.latencyMs === "number"
          ? feedback.latencyMs
          : 0,
      source: "webots",
      notes:
        typeof feedback.notes === "string"
          ? feedback.notes
          : undefined,
    });
  }

  return feedbackEntries;
}
