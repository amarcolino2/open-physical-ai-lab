import type { ActionType, Plan, WorldEntity } from "../../types";

function inferAction(command: string): ActionType {
  if (command.includes("peg") || command.includes("pick")) {
    return "pick";
  }

  if (command.includes("coloque") || command.includes("place")) {
    return "place";
  }

  if (command.includes("empurre") || command.includes("push")) {
    return "push";
  }

  if (command.includes("gire") || command.includes("rotate")) {
    return "rotate";
  }

  if (command.includes("entregue") || command.includes("handover")) {
    return "handover";
  }

  if (command.includes("home") || command.includes("inicial")) {
    return "home";
  }

  return "none";
}

function findTarget(command: string, objects: WorldEntity[]): WorldEntity | null {
  if (command.includes("celular") || command.includes("phone")) {
    return objects.find((object) => object.type === "phone") ?? null;
  }

  if (command.includes("copo") || command.includes("cup")) {
    return objects.find((object) => object.type === "cup") ?? null;
  }

  if (command.includes("caixa") || command.includes("box")) {
    return objects.find((object) => object.type === "box") ?? null;
  }

  return null;
}

export function planner(command: string, objects: WorldEntity[]): Plan {
  const normalized = command.trim().toLowerCase();
  const action = inferAction(normalized);
  const target = findTarget(normalized, objects);

  const hasTarget = Boolean(target);

  return {
    action,
    target: target?.id ?? null,
    priority: action === "none" ? 0 : 1,
    confidence: hasTarget ? 0.9 : 0.35,
    reasoning: hasTarget
      ? `Target detected in world model: ${target?.type}`
      : "No known target matched command",
    rawCommand: command,
  };
}
