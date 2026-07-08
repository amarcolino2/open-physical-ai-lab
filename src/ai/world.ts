import { getObjectById, getWorldState } from "../simulation/world";
import type { Position, WorldEntity } from "../types";

export function getObjectPosition(objectId: string | null): Position {
  if (!objectId) {
    return [0, 0.6, -1];
  }

  return getObjectById(objectId)?.position ?? [0, 0.6, -1];
}

export function getObjects(): WorldEntity[] {
  return getWorldState();
}