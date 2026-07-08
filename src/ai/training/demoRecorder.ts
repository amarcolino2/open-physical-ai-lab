import type {
  DemonstrationEpisode,
  DemonstrationFrame,
  ExternalExecutionFeedback,
  HandProprioception,
  Plan,
  Pose,
  WorldEntity,
} from "../../types";

let activeEpisode: DemonstrationEpisode | null = null;
const completedEpisodes: DemonstrationEpisode[] = [];
const FEEDBACK_MATCH_WINDOW_MS = 500;

function createEpisodeId(): string {
  return `demo-${Date.now()}`;
}

export function startDemoRecording(): DemonstrationEpisode {
  activeEpisode = {
    id: createEpisodeId(),
    createdAt: Date.now(),
    frames: [],
  };

  return activeEpisode;
}

export function stopDemoRecording(): DemonstrationEpisode | null {
  if (!activeEpisode) {
    return null;
  }

  if (activeEpisode.frames.length > 0) {
    completedEpisodes.push(activeEpisode);
  }

  const episode = activeEpisode;
  activeEpisode = null;
  return episode;
}

export function isRecordingDemo(): boolean {
  return Boolean(activeEpisode);
}

export function recordDemoFrame(input: {
  command: string;
  plan: Plan;
  handPose: Pose;
  handProprioception: HandProprioception;
  objects: WorldEntity[];
}): void {
  if (!activeEpisode) {
    return;
  }

  const frame: DemonstrationFrame = {
    timestamp: Date.now(),
    command: input.command,
    plan: {
      ...input.plan,
    },
    handPose: {
      position: [...input.handPose.position],
      rotation: [...input.handPose.rotation],
    },
    handProprioception: {
      pose: {
        position: [...input.handProprioception.pose.position],
        rotation: [...input.handProprioception.pose.rotation],
      },
      grip: input.handProprioception.grip,
      jointAngles: [...input.handProprioception.jointAngles],
      velocity: [...input.handProprioception.velocity],
      proximity: input.handProprioception.proximity,
      contact: input.handProprioception.contact,
      phase: input.handProprioception.phase,
      timestamp: input.handProprioception.timestamp,
    },
    objects: input.objects.map((object) => ({
      ...object,
      position: [...object.position],
      rotation: [...object.rotation],
      scale: [...object.scale],
      metadata: { ...object.metadata },
    })),
  };

  activeEpisode.frames.push(frame);
}

export function getDemoEpisodes(): DemonstrationEpisode[] {
  return completedEpisodes;
}

export function attachExecutionFeedbackToEpisodes(
  feedbackEntries: ExternalExecutionFeedback[]
): number {
  if (feedbackEntries.length === 0) {
    return 0;
  }

  let attachedCount = 0;

  for (const entry of feedbackEntries) {
    let bestFrame: DemonstrationFrame | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const episode of completedEpisodes) {
      for (const frame of episode.frames) {
        const delta = Math.abs(frame.timestamp - entry.timestamp);

        if (delta <= FEEDBACK_MATCH_WINDOW_MS && delta < bestDelta) {
          bestDelta = delta;
          bestFrame = frame;
        }
      }
    }

    if (!bestFrame) {
      continue;
    }

    bestFrame.executionFeedback = {
      ...entry,
      timestamp: bestFrame.timestamp,
    };
    attachedCount += 1;
  }

  return attachedCount;
}

export function clearDemoEpisodes(): void {
  completedEpisodes.length = 0;
}

export function serializeDemoEpisodes(): string {
  return JSON.stringify(completedEpisodes, null, 2);
}

export function downloadDemoEpisodes(): void {
  if (typeof window === "undefined") {
    return;
  }

  const content = serializeDemoEpisodes();
  const blob = new Blob([content], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `open-physical-ai-demos-${Date.now()}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
