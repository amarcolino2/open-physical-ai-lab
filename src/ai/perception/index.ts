import {
  getHandProprioception,
  getObjectById,
  getWorldState,
} from "../../simulation/world";
import type {
  HandProprioception,
  Perception,
  Pose,
  WorldEntity,
} from "../../types";

const HOME_HAND_POSE: Pose = {
  position: [0, 0.6, -1],
  rotation: [0, 0, 0],
};

class WorldStatePerception implements Perception {
  detectObjects(): WorldEntity[] {
    return getWorldState();
  }

  detectHand(): Pose {
    return getHandProprioception().pose ?? HOME_HAND_POSE;
  }

  detectProprioception(): HandProprioception {
    return getHandProprioception();
  }

  estimatePose(objectId: string): Pose | null {
    const object = getObjectById(objectId);

    if (!object) {
      return null;
    }

    return {
      position: object.position,
      rotation: object.rotation,
    };
  }
}

export const perception = new WorldStatePerception();
