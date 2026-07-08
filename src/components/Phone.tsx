interface PhoneProps {
	color: string;
	scale: [number, number, number];
}

export default function Phone({ color, scale }: PhoneProps) {
	return (
		<mesh scale={scale} castShadow>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
