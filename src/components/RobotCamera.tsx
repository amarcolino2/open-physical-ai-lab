export default function RobotCamera() {
	return (
		<group position={[0, 1.8, 2.2]}>
			<mesh castShadow>
				<boxGeometry args={[0.22, 0.14, 0.14]} />
				<meshStandardMaterial color="#0f172a" />
			</mesh>

			<mesh position={[0, 0, 0.09]}>
				<cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
				<meshStandardMaterial color="#38bdf8" />
			</mesh>
		</group>
	);
}
