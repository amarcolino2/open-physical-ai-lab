import type { Pose } from "../../types";

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

export function solveIKTargetPose(
  currentPose: Pose,
  targetPose: Pose
): Pose {
  const [cx, cy, cz] = currentPose.position;
  const [tx, ty, tz] = targetPose.position;

  const dx = tx - cx;
  const dy = ty - cy;
  const dz = tz - cz;

  const horizontalDistance = Math.max(
    Math.hypot(dx, dz),
    1e-6
  );

  const yaw = normalizeAngle(Math.atan2(dx, dz));
  const pitch = -Math.atan2(dy, horizontalDistance);

  return {
    position: targetPose.position,
    rotation: [pitch, yaw, 0],
  };
}
