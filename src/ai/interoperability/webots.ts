import type {
  DemonstrationEpisode,
  WorldSnapshot,
} from "../../types";

interface WebotsBridgeFrame {
  episodeId: string;
  stepIndex: number;
  timestamp: number;
  command: string;
  action: string;
  target: string | null;
  hand: {
    position: [number, number, number];
    rotation: [number, number, number];
    grip: number;
    phase: string;
    proximity: number;
    contact: boolean;
    velocity: [number, number, number];
    jointAngles: number[];
  };
  objects: Array<{
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    state: string;
    attachedTo: string | null;
  }>;
}

interface WebotsBridgePackage {
  version: string;
  source: string;
  generatedAt: number;
  schema: string;
  stats: {
    episodes: number;
    frames: number;
    worldSnapshots: number;
  };
  frames: WebotsBridgeFrame[];
  worldTimeline: Array<{
    timestamp: number;
    sourceAction: string;
    handPosition: [number, number, number];
    handRotation: [number, number, number];
    grip: number;
    phase: string;
    objectCount: number;
  }>;
}

function buildWebotsBridgePackage(input: {
  episodes: DemonstrationEpisode[];
  worldHistory: WorldSnapshot[];
}): WebotsBridgePackage {
  const frames: WebotsBridgeFrame[] = [];

  for (const episode of input.episodes) {
    episode.frames.forEach((frame, stepIndex) => {
      frames.push({
        episodeId: episode.id,
        stepIndex,
        timestamp: frame.timestamp,
        command: frame.command,
        action: frame.plan.action,
        target: frame.plan.target,
        hand: {
          position: [...frame.handPose.position],
          rotation: [...frame.handPose.rotation],
          grip: frame.handProprioception.grip,
          phase: frame.handProprioception.phase,
          proximity: frame.handProprioception.proximity,
          contact: frame.handProprioception.contact,
          velocity: [...frame.handProprioception.velocity],
          jointAngles: [...frame.handProprioception.jointAngles],
        },
        objects: frame.objects.map((object) => ({
          id: object.id,
          type: object.type,
          position: [...object.position],
          rotation: [...object.rotation],
          state: object.state,
          attachedTo: object.attachedTo,
        })),
      });
    });
  }

  const worldTimeline = input.worldHistory.map((snapshot) => ({
    timestamp: snapshot.timestamp,
    sourceAction: snapshot.sourceAction,
    handPosition: [...snapshot.handPose.position] as [number, number, number],
    handRotation: [...snapshot.handPose.rotation] as [number, number, number],
    grip: snapshot.handProprioception.grip,
    phase: snapshot.handProprioception.phase,
    objectCount: snapshot.objects.length,
  }));

  return {
    version: "1.0.0",
    source: "open-physical-ai-lab",
    generatedAt: Date.now(),
    schema: "webots-bridge-v1",
    stats: {
      episodes: input.episodes.length,
      frames: frames.length,
      worldSnapshots: input.worldHistory.length,
    },
    frames,
    worldTimeline,
  };
}

export function downloadWebotsBridgePackage(input: {
  episodes: DemonstrationEpisode[];
  worldHistory: WorldSnapshot[];
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const content = buildWebotsBridgePackage(input);
  const serialized = JSON.stringify(content, null, 2);
  const blob = new Blob([serialized], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `open-physical-ai-webots-bridge-${Date.now()}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
