import type {
    MotionPhase,
    Pose,
    Trajectory,
} from "../../types";

const WAYPOINTS = 24;
const REACHED_THRESHOLD = 0.05;

export interface TrajectoryStage {
  targetPose: Pose;
  phase: MotionPhase;
  waypointCount?: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function distance(a: Pose, b: Pose): number {
  const [ax, ay, az] = a.position;
  const [bx, by, bz] = b.position;
  return Math.hypot(ax - bx, ay - by, az - bz);
}

export function buildLinearTrajectory(
  startPose: Pose,
  targetPose: Pose,
  waypointCount = WAYPOINTS,
  phase: MotionPhase = "transit"
): Trajectory {
  const trajectory: Trajectory = [];

  for (let index = 1; index <= waypointCount; index += 1) {
    const t = index / waypointCount;
    trajectory.push({
      t,
      phase,
      pose: {
        position: [
          lerp(startPose.position[0], targetPose.position[0], t),
          lerp(startPose.position[1], targetPose.position[1], t),
          lerp(startPose.position[2], targetPose.position[2], t),
        ],
        rotation: [
          lerp(startPose.rotation[0], targetPose.rotation[0], t),
          lerp(startPose.rotation[1], targetPose.rotation[1], t),
          lerp(startPose.rotation[2], targetPose.rotation[2], t),
        ],
      },
    });
  }

  return trajectory;
}

export function buildMultiStageTrajectory(
  startPose: Pose,
  stages: TrajectoryStage[]
): Trajectory {
  const trajectory: Trajectory = [];
  let currentPose = startPose;

  for (const stage of stages) {
    const segment = buildLinearTrajectory(
      currentPose,
      stage.targetPose,
      stage.waypointCount,
      stage.phase
    );
    trajectory.push(...segment);
    currentPose = stage.targetPose;
  }

  return trajectory;
}

export function selectTrajectoryTarget(
  currentPose: Pose,
  trajectory: Trajectory,
  targetPose: Pose
): Pose {
  const nextWaypoint = trajectory.find(
    (point) =>
      distance(currentPose, point.pose) >
      REACHED_THRESHOLD
  );

  return nextWaypoint?.pose ?? targetPose;
}
