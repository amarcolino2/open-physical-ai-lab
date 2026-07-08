from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from controller import Supervisor


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)

    if not isinstance(data, dict):
        raise ValueError(f"JSON invalido em {path}")

    return data


def as_vec3(value: Any, default: float = 0.0) -> list[float]:
    if not isinstance(value, list) or len(value) < 3:
        return [default, default, default]

    out: list[float] = []
    for i in range(3):
        item = value[i]
        out.append(float(item) if isinstance(item, (int, float)) else default)

    return out


def euler_to_axis_angle(euler_xyz: list[float]) -> list[float]:
    # Conversao simplificada para manter compatibilidade basica no replay.
    # Para fidelidade fisica completa, substitua por uma conversao quaternion -> axis-angle.
    rx, ry, rz = euler_xyz
    angle = abs(rx) + abs(ry) + abs(rz)
    if angle == 0:
        return [0.0, 1.0, 0.0, 0.0]

    axis = [rx / angle, ry / angle, rz / angle]
    return [axis[0], axis[1], axis[2], angle]


def resolve_config(script_dir: Path) -> dict[str, Any]:
    cfg_path = script_dir / "config.json"
    if not cfg_path.exists():
        raise FileNotFoundError(
            "Arquivo config.json nao encontrado. Copie config.example.json para config.json e ajuste os DEFs."
        )

    config = load_json(cfg_path)
    replay_plan_path = config.get("replayPlanPath")

    if not isinstance(replay_plan_path, str) or not replay_plan_path.strip():
        raise ValueError("config.json invalido: replayPlanPath obrigatorio")

    return config


def apply_translation(node: Any, position: list[float]) -> None:
    field = node.getField("translation")
    if field is None:
        return
    field.setSFVec3f(position)


def apply_rotation(node: Any, euler_rotation: list[float]) -> None:
    field = node.getField("rotation")
    if field is None:
        return
    field.setSFRotation(euler_to_axis_angle(euler_rotation))


def main() -> None:
    robot = Supervisor()
    time_step = int(robot.getBasicTimeStep())
    script_dir = Path(__file__).resolve().parent

    try:
        config = resolve_config(script_dir)
    except Exception as exc:
        print(f"[replay-supervisor] Falha ao carregar config: {exc}")
        return

    replay_plan_path = Path(str(config["replayPlanPath"])).expanduser().resolve()

    try:
        replay_plan = load_json(replay_plan_path)
    except Exception as exc:
        print(f"[replay-supervisor] Falha ao carregar replay-plan: {exc}")
        return

    steps = replay_plan.get("steps")
    if not isinstance(steps, list) or len(steps) == 0:
        print("[replay-supervisor] Replay-plan sem steps")
        return

    hand_def = config.get("handDef")
    object_defs = config.get("objectDefs", {})
    apply_object_rotation = bool(config.get("applyObjectRotation", False))

    if not isinstance(object_defs, dict):
        print("[replay-supervisor] config.objectDefs deve ser um objeto")
        return

    node_cache: dict[str, Any | None] = {}

    def get_node(def_name: str) -> Any | None:
        cached = node_cache.get(def_name)
        if cached is not None or def_name in node_cache:
            return cached

        node = robot.getFromDef(def_name)
        if node is None:
            print(f"[replay-supervisor] DEF nao encontrado: {def_name}")
        node_cache[def_name] = node
        return node

    # Primeira etapa aplicada imediatamente para garantir estado inicial consistente.
    first_step = steps[0]

    if isinstance(hand_def, str) and hand_def:
        hand_node = get_node(hand_def)
        if hand_node is not None:
            hand = first_step.get("hand", {})
            apply_translation(hand_node, as_vec3(hand.get("position")))

    for obj in first_step.get("objects", []):
        if not isinstance(obj, dict):
            continue
        obj_id = obj.get("id")
        if not isinstance(obj_id, str):
            continue
        def_name = object_defs.get(obj_id)
        if not isinstance(def_name, str) or not def_name:
            continue
        node = get_node(def_name)
        if node is None:
            continue
        apply_translation(node, as_vec3(obj.get("position")))
        if apply_object_rotation:
            apply_rotation(node, as_vec3(obj.get("rotation")))

    start_time_ms = int(robot.getTime() * 1000)
    next_index = 0
    total_steps = len(steps)

    print(f"[replay-supervisor] Replay iniciado com {total_steps} steps")

    while robot.step(time_step) != -1:
        elapsed_ms = int(robot.getTime() * 1000) - start_time_ms

        while next_index < total_steps:
            step = steps[next_index]
            t_offset = int(step.get("tOffsetMs", 0))

            if t_offset > elapsed_ms:
                break

            hand = step.get("hand", {})
            if isinstance(hand_def, str) and hand_def:
                hand_node = get_node(hand_def)
                if hand_node is not None:
                    apply_translation(hand_node, as_vec3(hand.get("position")))

            objects = step.get("objects", [])
            if isinstance(objects, list):
                for obj in objects:
                    if not isinstance(obj, dict):
                        continue
                    obj_id = obj.get("id")
                    if not isinstance(obj_id, str):
                        continue

                    def_name = object_defs.get(obj_id)
                    if not isinstance(def_name, str) or not def_name:
                        continue

                    node = get_node(def_name)
                    if node is None:
                        continue

                    apply_translation(node, as_vec3(obj.get("position")))
                    if apply_object_rotation:
                        apply_rotation(node, as_vec3(obj.get("rotation")))

            next_index += 1

        if next_index >= total_steps:
            print("[replay-supervisor] Replay concluido")
            break


if __name__ == "__main__":
    main()
