import { getObjectById } from "../../simulation/world";
import type { Plan, Pose } from "../../types";
import { handover, home, pick, place, push, rotate } from "../skills";
import { solveIKTargetPose } from "./ik";
import {
    buildLinearTrajectory,
    buildMultiStageTrajectory,
} from "./trajectory";

export { LinearMotionController } from "./controller";
export { solveIKTargetPose } from "./ik";
export {
    buildLinearTrajectory,
    buildMultiStageTrajectory
} from "./trajectory";

export function planToGrip(plan: Plan): number {
  switch (plan.action) {
    case "pick":
      return 0.2;
    case "handover":
      return 0.4;
    case "home":
      return 0.9;
    default:
      return 0.85;
  }
}

function distance(a: Pose, b: Pose): number {
  const [ax, ay, az] = a.position;
  const [bx, by, bz] = b.position;
  return Math.hypot(ax - bx, ay - by, az - bz);
}

export function resolveGrip(
  plan: Plan,
  currentPose: Pose
): number {
  if (plan.action !== "pick" || !plan.target) {
    return planToGrip(plan);
  }

  const target = getObjectById(plan.target);

  if (!target) {
    return 0.85;
  }

  const targetPose: Pose = {
    position: target.position,
    rotation: target.rotation,
  };

  const d = distance(currentPose, targetPose);

  if (d > 0.22) {
    return 0.9;
  }

  if (d > 0.08) {
    return 0.55;
  }

  return 0.18;
}

export function planToTargetPose(plan: Plan): Pose {
  if (plan.action === "none" || !plan.target) {
    return home();
  }

  const target = getObjectById(plan.target);

  if (!target) {
    return home();
  }

  const targetPose: Pose = {
    position: target.position,
    rotation: target.rotation,
  };

  switch (plan.action) {
    case "pick":
      return pick(targetPose);
    case "place":
      return place(targetPose);
    case "push":
      return push(targetPose);
    case "rotate":
      return rotate(targetPose);
    case "handover":
      return handover(targetPose);
    case "home":
      return home();
    default:
      return home();
  }
}

export function buildTrajectoryFromPlan(
  currentPose: Pose,
  plan: Plan
) {
  const targetPose = planToTargetPose(plan);

  if (plan.action === "pick" && plan.target) {
    const preGraspPose: Pose = {
      position: [
        targetPose.position[0],
        targetPose.position[1] + 0.28,
        targetPose.position[2],
      ],
      rotation: targetPose.rotation,
    };

    const approachPose: Pose = {
      position: [
        targetPose.position[0],
        targetPose.position[1] + 0.08,
        targetPose.position[2],
      ],
      rotation: targetPose.rotation,
    };

    const graspPose: Pose = {
      position: [
        targetPose.position[0],
        targetPose.position[1] + 0.03,
        targetPose.position[2],
      ],
      rotation: targetPose.rotation,
    };

    const liftPose: Pose = {
      position: [
        targetPose.position[0],
        targetPose.position[1] + 0.35,
        targetPose.position[2],
      ],
      rotation: targetPose.rotation,
    };

    const ikPreGraspPose = solveIKTargetPose(
      currentPose,
      preGraspPose
    );
    const ikApproachPose = solveIKTargetPose(
      ikPreGraspPose,
      approachPose
    );
    const ikGraspPose = solveIKTargetPose(
      ikApproachPose,
      graspPose
    );
    const ikLiftPose = solveIKTargetPose(
      ikGraspPose,
      liftPose
    );

    return buildMultiStageTrajectory(currentPose, [
      {
        targetPose: ikPreGraspPose,
        phase: "pre-grasp",
        waypointCount: 18,
      },
      {
        targetPose: ikApproachPose,
        phase: "approach",
        waypointCount: 14,
      },
      {
        targetPose: ikGraspPose,
        phase: "grasp",
        waypointCount: 8,
      },
      {
        targetPose: ikLiftPose,
        phase: "lift",
        waypointCount: 20,
      },
    ]);
  }

  const ikTargetPose = solveIKTargetPose(
    currentPose,
    targetPose
  );
  return buildLinearTrajectory(
    currentPose,
    ikTargetPose,
    24,
    "transit"
  );
}
