import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import RobotCamera from "../RobotCamera";
import RobotHand from "../RobotHand";
import WorldRenderer from "./WorldRenderer";

interface SceneProps {
  handPosition: [number, number, number];
  grip: number;
}

export default function Scene({
  handPosition,
  grip,
}: SceneProps) {
  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 50 }} shadows>
      <PerspectiveCamera
        makeDefault
        position={[0, 3, 5]}
      />

      <color attach="background" args={["#f8fafc"]} />

      <ambientLight intensity={0.85} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
      />

      <WorldRenderer />
      <RobotCamera />

      <RobotHand position={handPosition} grip={grip} />

      <OrbitControls />
    </Canvas>
  );
}