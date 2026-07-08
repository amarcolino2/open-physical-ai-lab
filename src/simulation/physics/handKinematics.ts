export type FingerName =
  | "thumb"
  | "index"
  | "middle"
  | "ring"
  | "pinky";

export interface FingerKinematics {
  name: FingerName;
  offset: [number, number, number];
  yaw: number;
  joints: [number, number, number, number, number];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildFingerKinematics(grip: number): FingerKinematics[] {
  const closeRatio = clamp(1 - grip, 0, 1);

  return [
    {
      name: "thumb",
      offset: [-0.13, 0.01, 0.07],
      yaw: -0.6,
      joints: [0.2, closeRatio * 0.7, closeRatio * 0.45, closeRatio * 0.3, closeRatio * 0.2],
    },
    {
      name: "index",
      offset: [-0.07, 0.02, 0.13],
      yaw: -0.1,
      joints: [0, closeRatio * 0.95, closeRatio * 1.1, closeRatio * 0.8, closeRatio * 0.45],
    },
    {
      name: "middle",
      offset: [0, 0.02, 0.14],
      yaw: 0,
      joints: [0, closeRatio * 0.9, closeRatio * 1.05, closeRatio * 0.8, closeRatio * 0.45],
    },
    {
      name: "ring",
      offset: [0.07, 0.02, 0.13],
      yaw: 0.08,
      joints: [0, closeRatio * 0.88, closeRatio * 1, closeRatio * 0.75, closeRatio * 0.42],
    },
    {
      name: "pinky",
      offset: [0.13, 0.02, 0.11],
      yaw: 0.15,
      joints: [0, closeRatio * 0.8, closeRatio * 0.95, closeRatio * 0.7, closeRatio * 0.4],
    },
  ];
}
