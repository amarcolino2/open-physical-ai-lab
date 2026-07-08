import type {
  ActionType,
  HandProprioception,
  MotionPhase,
  Pose,
  WorldEntity,
  WorldEvent,
  WorldSnapshot,
} from "../../types";

const ROBOT_HAND_ID = "robot-hand";
const ATTACH_OFFSET_Y = 0.02;
const MAX_HISTORY = 2000;
const MAX_EVENTS = 3000;

const WORLD_OBJECTS: WorldEntity[] = [
  {
    id: "table-1",
    type: "table",
    position: [0, -0.05, 0],
    rotation: [0, 0, 0],
    scale: [5, 0.1, 5],
    color: "#6b4f3a",
    state: "static",
    attachedTo: null,
    metadata: {
      surface: "wood",
      friction: 0.6,
    },
  },
  {
    id: "phone-1",
    type: "phone",
    position: [0.5, 0.04, 0],
    rotation: [0, 0.15, 0],
    scale: [0.8, 0.1, 1.5],
    color: "#1f2937",
    state: "idle",
    attachedTo: null,
    metadata: {
      category: "electronics",
      graspable: true,
    },
  },
  {
    id: "cup-1",
    type: "cup",
    position: [-1, 0.4, 0],
    rotation: [0, 0, 0],
    scale: [0.3, 0.8, 0.3],
    color: "#f8fafc",
    state: "idle",
    attachedTo: null,
    metadata: {
      category: "kitchen",
      graspable: true,
    },
  },
  {
    id: "box-1",
    type: "box",
    position: [1.5, 0.4, 0.8],
    rotation: [0, 0.1, 0],
    scale: [0.8, 0.8, 0.8],
    color: "#4169e1",
    state: "idle",
    attachedTo: null,
    metadata: {
      category: "container",
      graspable: true,
    },
  },
];

const WORLD_HISTORY: WorldSnapshot[] = [];
const WORLD_EVENTS: WorldEvent[] = [];
const DEFAULT_HAND_POSE: Pose = {
  position: [0, 0.6, -1],
  rotation: [0, 0, 0],
};

let CURRENT_HAND_PROPRIOCEPTION: HandProprioception = {
  pose: DEFAULT_HAND_POSE,
  grip: 1,
  jointAngles: [0.05, 0.05, 0.05, 0.05, 0.05],
  velocity: [0, 0, 0],
  proximity: 1,
  contact: false,
  phase: "transit",
  timestamp: Date.now(),
};

function cloneObjects(): WorldEntity[] {
  return WORLD_OBJECTS.map((object) => ({
    ...object,
    position: [...object.position],
    rotation: [...object.rotation],
    scale: [...object.scale],
    metadata: { ...object.metadata },
  }));
}

function cloneHandProprioception(): HandProprioception {
  return {
    pose: {
      position: [...CURRENT_HAND_PROPRIOCEPTION.pose.position],
      rotation: [...CURRENT_HAND_PROPRIOCEPTION.pose.rotation],
    },
    grip: CURRENT_HAND_PROPRIOCEPTION.grip,
    jointAngles: [...CURRENT_HAND_PROPRIOCEPTION.jointAngles],
    velocity: [...CURRENT_HAND_PROPRIOCEPTION.velocity],
    proximity: CURRENT_HAND_PROPRIOCEPTION.proximity,
    contact: CURRENT_HAND_PROPRIOCEPTION.contact,
    phase: CURRENT_HAND_PROPRIOCEPTION.phase,
    timestamp: CURRENT_HAND_PROPRIOCEPTION.timestamp,
  };
}

function distance(a: Pose, b: Pose): number {
  const [ax, ay, az] = a.position;
  const [bx, by, bz] = b.position;

  return Math.hypot(ax - bx, ay - by, az - bz);
}

function getNearestGraspableDistance(handPose: Pose): number {
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const object of WORLD_OBJECTS) {
    if (!object.metadata.graspable) {
      continue;
    }

    const objectPose: Pose = {
      position: object.position,
      rotation: object.rotation,
    };

    bestDistance = Math.min(bestDistance, distance(handPose, objectPose));
  }

  return Number.isFinite(bestDistance) ? bestDistance : 1;
}

function inferJointAngles(grip: number): number[] {
  const base = Math.max(0.02, Math.min(1, grip));

  return [
    Number((base * 0.18).toFixed(4)),
    Number((base * 0.35).toFixed(4)),
    Number((base * 0.52).toFixed(4)),
    Number((base * 0.7).toFixed(4)),
    Number((base * 0.88).toFixed(4)),
  ];
}

function inferPhase(grip: number, phase?: MotionPhase): MotionPhase {
  if (phase) {
    return phase;
  }

  if (grip <= 0.22) {
    return "grasp";
  }

  if (grip <= 0.45) {
    return "approach";
  }

  if (grip <= 0.72) {
    return "pre-grasp";
  }

  return "transit";
}

function inferHandVelocity(
  nextPose: Pose,
  previousPose: Pose,
  deltaMs: number
): [number, number, number] {
  const elapsed = Math.max(deltaMs, 16) / 1000;

  return [
    (nextPose.position[0] - previousPose.position[0]) / elapsed,
    (nextPose.position[1] - previousPose.position[1]) / elapsed,
    (nextPose.position[2] - previousPose.position[2]) / elapsed,
  ];
}

export function getHandProprioception(): HandProprioception {
  return cloneHandProprioception();
}

export function updateHandProprioception(input: {
  pose: Pose;
  grip: number;
  phase?: MotionPhase;
}): HandProprioception {
  const previous = CURRENT_HAND_PROPRIOCEPTION;
  const nextPose = {
    position: [...input.pose.position] as Pose["position"],
    rotation: [...input.pose.rotation] as Pose["rotation"],
  };
  const now = Date.now();
  const deltaMs = now - previous.timestamp;
  const proximity = Math.max(0, Math.min(1, getNearestGraspableDistance(nextPose)));
  const contact = input.grip <= 0.25 && proximity <= 0.25;

  CURRENT_HAND_PROPRIOCEPTION = {
    pose: nextPose,
    grip: Math.max(0, Math.min(1, input.grip)),
    jointAngles: inferJointAngles(input.grip),
    velocity: inferHandVelocity(nextPose, previous.pose, deltaMs),
    proximity,
    contact,
    phase: inferPhase(input.grip, input.phase),
    timestamp: now,
  };

  return cloneHandProprioception();
}

function appendWorldEvent(event: WorldEvent): void {
  WORLD_EVENTS.push(event);

  if (WORLD_EVENTS.length > MAX_EVENTS) {
    WORLD_EVENTS.shift();
  }
}

export function getWorldState(): WorldEntity[] {
  return WORLD_OBJECTS;
}

export function getObjectById(objectId: string): WorldEntity | undefined {
  return WORLD_OBJECTS.find((object) => object.id === objectId);
}

export function getFirstObjectByType(type: WorldEntity["type"]): WorldEntity | undefined {
  return WORLD_OBJECTS.find((object) => object.type === type);
}

export function getWorldStateHistory(): WorldSnapshot[] {
  return WORLD_HISTORY;
}

export function getWorldEventLog(): WorldEvent[] {
  return WORLD_EVENTS;
}

export function clearWorldHistory(): void {
  WORLD_HISTORY.length = 0;
  WORLD_EVENTS.length = 0;
}

export function recordWorldSnapshot(
  handPose: Pose,
  sourceAction: ActionType,
  handProprioception: HandProprioception = getHandProprioception()
): void {
  WORLD_HISTORY.push({
    timestamp: Date.now(),
    handPose,
    handProprioception,
    objects: cloneObjects(),
    sourceAction,
  });

  if (WORLD_HISTORY.length > MAX_HISTORY) {
    WORLD_HISTORY.shift();
  }

  appendWorldEvent({
    timestamp: Date.now(),
    type: "snapshot",
    objectId: null,
    details: `Snapshot from action: ${sourceAction}`,
  });
}

export function updateObjectState(
  objectId: string,
  state: string
): void {
  const object = getObjectById(objectId);

  if (!object) {
    return;
  }

  object.state = state;

  appendWorldEvent({
    timestamp: Date.now(),
    type: "state",
    objectId,
    details: `State updated to ${state}`,
  });
}

function getAttachedObjects(): WorldEntity[] {
  return WORLD_OBJECTS.filter(
    (object) => object.attachedTo === ROBOT_HAND_ID
  );
}

export function attachObjectToHand(
  objectId: string,
  handPosition: [number, number, number]
): void {
  const object = getObjectById(objectId);

  if (!object) {
    return;
  }

  object.attachedTo = ROBOT_HAND_ID;
  object.state = "attached";
  object.position = [
    handPosition[0],
    handPosition[1] - ATTACH_OFFSET_Y,
    handPosition[2],
  ];

  appendWorldEvent({
    timestamp: Date.now(),
    type: "attach",
    objectId,
    details: "Object attached to robot hand",
  });
}

export function releaseObjectFromHand(
  objectId: string,
  state = "idle"
): void {
  const object = getObjectById(objectId);

  if (!object) {
    return;
  }

  object.attachedTo = null;
  object.state = state;

  appendWorldEvent({
    timestamp: Date.now(),
    type: "release",
    objectId,
    details: `Object released with state ${state}`,
  });
}

export function releaseAllAttachedObjects(
  state = "idle"
): void {
  for (const object of getAttachedObjects()) {
    object.attachedTo = null;
    object.state = state;
  }
}

export function syncAttachedObjectsWithHand(
  handPosition: [number, number, number]
): void {
  for (const object of getAttachedObjects()) {
    object.position = [
      handPosition[0],
      handPosition[1] - ATTACH_OFFSET_Y,
      handPosition[2],
    ];

    appendWorldEvent({
      timestamp: Date.now(),
      type: "sync",
      objectId: object.id,
      details: "Attached object synchronized with hand",
    });
  }
}
