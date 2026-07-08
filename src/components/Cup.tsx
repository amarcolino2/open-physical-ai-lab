interface CupProps {
	color: string;
	scale: [number, number, number];
}

export default function Cup({ color, scale }: CupProps) {
	return (
		<mesh scale={scale} castShadow>
			<cylinderGeometry args={[1, 1, 1, 24]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
