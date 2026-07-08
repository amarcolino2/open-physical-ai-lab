import { buildFingerKinematics } from "../simulation/physics/handKinematics";

interface RobotHandProps {
  position: [number, number, number];
  grip: number;
}

const FINGER_SEGMENTS = [0.05, 0.045, 0.04, 0.03] as const;

function FingerChain({
  yaw,
  joints,
}: {
  yaw: number;
  joints: [number, number, number, number, number];
}) {
  return (
    <group rotation={[0, yaw + joints[0], 0]}>
      <mesh>
        <sphereGeometry args={[0.014, 10, 10]} />
        <meshStandardMaterial color="#14532d" />
      </mesh>

      <group rotation={[joints[1], 0, 0]}>
        <mesh position={[0, FINGER_SEGMENTS[0] / 2, 0]} castShadow>
          <capsuleGeometry args={[0.012, FINGER_SEGMENTS[0], 4, 8]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>

        <group position={[0, FINGER_SEGMENTS[0], 0]} rotation={[joints[2], 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.012, 10, 10]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>

          <mesh position={[0, FINGER_SEGMENTS[1] / 2, 0]} castShadow>
            <capsuleGeometry args={[0.01, FINGER_SEGMENTS[1], 4, 8]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>

          <group position={[0, FINGER_SEGMENTS[1], 0]} rotation={[joints[3], 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.01, 10, 10]} />
              <meshStandardMaterial color="#14532d" />
            </mesh>

            <mesh position={[0, FINGER_SEGMENTS[2] / 2, 0]} castShadow>
              <capsuleGeometry args={[0.009, FINGER_SEGMENTS[2], 4, 8]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>

            <group position={[0, FINGER_SEGMENTS[2], 0]} rotation={[joints[4], 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.009, 10, 10]} />
                <meshStandardMaterial color="#14532d" />
              </mesh>

              <mesh position={[0, FINGER_SEGMENTS[3] / 2, 0]} castShadow>
                <capsuleGeometry args={[0.008, FINGER_SEGMENTS[3], 4, 8]} />
                <meshStandardMaterial color="#15803d" />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function RobotHand({
  position,
  grip,
}: RobotHandProps) {
  const fingers = buildFingerKinematics(grip);

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.08, 0.2]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      {fingers.map((finger) => (
        <group key={finger.name} position={finger.offset}>
          <FingerChain yaw={finger.yaw} joints={finger.joints} />
        </group>
      ))}
    </group>
  );
}