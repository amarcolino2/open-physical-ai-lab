import type {
    MotionController,
    Pose,
    Trajectory,
} from "../../types";
import { selectTrajectoryTarget } from "./trajectory";

const INTERPOLATION_GAIN = 0.08;

function lerp(a: number, b: number, gain: number): number {
  return a + (b - a) * gain;
}

export class LinearMotionController implements MotionController {
  computeNextPose(
    currentPose: Pose,
    targetPose: Pose,
    trajectory: Trajectory
  ): Pose {
    const waypoint = selectTrajectoryTarget(
      currentPose,
      trajectory,
      targetPose
    );

    const [cx, cy, cz] = currentPose.position;
    const [tx, ty, tz] = waypoint.position;
    const [crx, cry, crz] = currentPose.rotation;
    const [trx, tryy, trz] = waypoint.rotation;

    return {
      position: [
        lerp(cx, tx, INTERPOLATION_GAIN),
        lerp(cy, ty, INTERPOLATION_GAIN),
        lerp(cz, tz, INTERPOLATION_GAIN),
      ],
      rotation: [
        lerp(crx, trx, INTERPOLATION_GAIN),
        lerp(cry, tryy, INTERPOLATION_GAIN),
        lerp(crz, trz, INTERPOLATION_GAIN),
      ],
    };
  }
}
