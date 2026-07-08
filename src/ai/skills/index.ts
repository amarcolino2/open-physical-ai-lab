import type { ActionType, Pose } from "../../types";

export function pick(targetPose: Pose): Pose {
  return targetPose;
}

export function place(targetPose: Pose): Pose {
  return targetPose;
}

export function push(targetPose: Pose): Pose {
  return targetPose;
}

export function rotate(targetPose: Pose): Pose {
  return targetPose;
}

export function handover(targetPose: Pose): Pose {
  return targetPose;
}

export function home(): Pose {
  return {
    position: [0, 0.6, -1],
    rotation: [0, 0, 0],
  };
}

export const SKILL_NAMES: ActionType[] = [
  "pick",
  "place",
  "push",
  "rotate",
  "handover",
  "home",
  "none",
];
