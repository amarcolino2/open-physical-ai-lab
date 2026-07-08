import type { ReactElement } from "react";
import BoxObject from "../../components/BoxObject";
import Cup from "../../components/Cup";
import Phone from "../../components/Phone";
import Table from "../../components/Table";
import type { WorldEntity } from "../../types";

type RenderComponentProps = {
  color: string;
  scale: [number, number, number];
};

type RenderComponent = (
  props: RenderComponentProps
) => ReactElement;

const OBJECT_COMPONENTS: Record<WorldEntity["type"], RenderComponent | null> = {
  table: Table,
  phone: Phone,
  cup: Cup,
  box: BoxObject,
  book: null,
  pen: null,
  bottle: null,
  key: null,
  remote: null,
};

interface ObjectFactoryProps {
  object: WorldEntity;
}

export default function ObjectFactory({ object }: ObjectFactoryProps) {
  const Component = OBJECT_COMPONENTS[object.type];

  if (!Component) {
    return null;
  }

  return (
    <group
      key={object.id}
      position={object.position}
      rotation={object.rotation}
      userData={{
        id: object.id,
        state: object.state,
        attachedTo: object.attachedTo,
      }}
    >
      <Component color={object.color} scale={object.scale} />
    </group>
  );
}
