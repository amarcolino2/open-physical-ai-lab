interface TableProps {
	color: string;
	scale: [number, number, number];
}

export default function Table({ color, scale }: TableProps) {
	return (
		<mesh scale={scale} receiveShadow>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
