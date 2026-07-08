import { perception } from "../../ai/perception";
import ObjectFactory from "../../simulation/renderer/ObjectFactory";

export default function WorldRenderer() {
  const objects = perception.detectObjects();

  return (
    <>
      {objects.map((object) => (
        <ObjectFactory key={object.id} object={object} />
      ))}
    </>
  );
}