interface BoxObjectProps {
	color: string;
	scale: [number, number, number];
}

export default function BoxObject({
	color,
	scale,
}: BoxObjectProps) {
	return (
		<mesh scale={scale} castShadow>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
