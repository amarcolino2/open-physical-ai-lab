import { useEffect, useRef, useState } from "react";
import {
    buildTrajectoryFromPlan,
    LinearMotionController,
    planToTargetPose,
} from "../ai/motion";
import type { Plan, Pose, Trajectory } from "../types";

const controller = new LinearMotionController();
const REACHED_THRESHOLD = 0.05;

function distance(a: Pose, b: Pose): number {
  const [ax, ay, az] = a.position;
  const [bx, by, bz] = b.position;
  return Math.hypot(ax - bx, ay - by, az - bz);
}

export default function useMotionController(
  plan: Plan
) {
  const [pose, setPose] = useState<Pose>({
    position: [0, 0.6, -1],
    rotation: [0, 0, 0],
  });
  const trajectoryRef = useRef<Trajectory>([]);
  const waypointIndexRef = useRef(0);
  const currentPoseRef = useRef<Pose>({
    position: [0, 0.6, -1],
    rotation: [0, 0, 0],
  });
  const targetPoseRef = useRef<Pose>({
    position: [0, 0.6, -1],
    rotation: [0, 0, 0],
  });

  useEffect(() => {
    const localPlan: Plan = {
      action: plan.action,
      target: plan.target,
      priority: plan.priority,
      confidence: plan.confidence,
      reasoning: plan.reasoning,
      rawCommand: plan.rawCommand,
    };

    const targetPose = planToTargetPose(localPlan);
    const trajectory = buildTrajectoryFromPlan(
      currentPoseRef.current,
      localPlan
    );
    const endPose =
      trajectory.at(-1)?.pose ?? targetPose;

    waypointIndexRef.current = 0;
    targetPoseRef.current = endPose;
    trajectoryRef.current = trajectory;
  }, [
    plan.action,
    plan.target,
    plan.priority,
    plan.confidence,
    plan.reasoning,
    plan.rawCommand,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPose((currentPose) => {
        currentPoseRef.current = currentPose;

        const activeTrajectory =
          trajectoryRef.current.slice(
            waypointIndexRef.current
          );

        const nextPose = controller.computeNextPose(
          currentPose,
          targetPoseRef.current,
          activeTrajectory
        );

        const currentWaypoint =
          trajectoryRef.current[
            waypointIndexRef.current
          ];

        if (
          currentWaypoint &&
          distance(nextPose, currentWaypoint.pose) <=
            REACHED_THRESHOLD
        ) {
          waypointIndexRef.current += 1;
        }

        return nextPose;
      });
    }, 16);

    return () => clearInterval(timer);
  }, []);

  return pose;
}