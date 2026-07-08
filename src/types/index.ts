export type Position = [number, number, number];
export type Rotation = [number, number, number];
export type Scale = [number, number, number];

export type ObjectType =
  | "table"
  | "phone"
  | "cup"
  | "box"
  | "book"
  | "pen"
  | "bottle"
  | "key"
  | "remote";

export type ActionType =
  | "pick"
  | "place"
  | "push"
  | "rotate"
  | "handover"
  | "home"
  | "none";

export interface WorldEntity {
  id: string;
  type: ObjectType;
  position: Position;
  rotation: Rotation;
  scale: Scale;
  color: string;
  state: string;
  attachedTo: string | null;
  metadata: Record<string, string | number | boolean | null>;
}

export interface Pose {
  position: Position;
  rotation: Rotation;
}

export interface HandProprioception {
  pose: Pose;
  grip: number;
  jointAngles: number[];
  velocity: Position;
  proximity: number;
  contact: boolean;
  phase: MotionPhase;
  timestamp: number;
}

export interface WorldEvent {
  timestamp: number;
  type: "attach" | "release" | "sync" | "state" | "snapshot";
  objectId: string | null;
  details: string;
}

export interface WorldSnapshot {
  timestamp: number;
  handPose: Pose;
  handProprioception: HandProprioception;
  objects: WorldEntity[];
  sourceAction: ActionType;
}

export interface DemonstrationFrame {
  timestamp: number;
  command: string;
  plan: Plan;
  handPose: Pose;
  handProprioception: HandProprioception;
  executionFeedback?: ExternalExecutionFeedback;
  objects: WorldEntity[];
}

export interface DemonstrationEpisode {
  id: string;
  createdAt: number;
  frames: DemonstrationFrame[];
}

export interface ExternalExecutionFeedback {
  timestamp: number;
  action: ActionType | string;
  target: string | null;
  success: boolean;
  collision: boolean;
  latencyMs: number;
  source: string;
  notes?: string;
}

export interface LearnedPolicyEntry {
  action: ActionType;
  target: string | null;
  confidence: number;
  reasoning: string;
}

export interface ColabPolicyArtifact {
  version: string;
  generatedAt: number;
  model: string;
  commandToPlan: Record<string, LearnedPolicyEntry>;
}

export type PolicyMode = "planner" | "learned";

export type MotionPhase =
  | "transit"
  | "pre-grasp"
  | "approach"
  | "grasp"
  | "lift";

export interface TrajectoryPoint {
  t: number;
  pose: Pose;
  phase: MotionPhase;
}

export type Trajectory = TrajectoryPoint[];

export interface Plan {
  action: ActionType;
  target: string | null;
  priority: number;
  confidence: number;
  reasoning: string;
  rawCommand: string;
}

export interface LLM {
  parseCommand(command: string): string;
  reason(prompt: string): string;
  plan(command: string): Plan;
}

export interface Perception {
  detectObjects(): WorldEntity[];
  detectHand(): Pose;
  detectProprioception(): HandProprioception;
  estimatePose(objectId: string): Pose | null;
}

export interface MotionController {
  computeNextPose(
    currentPose: Pose,
    targetPose: Pose,
    trajectory: Trajectory
  ): Pose;
}