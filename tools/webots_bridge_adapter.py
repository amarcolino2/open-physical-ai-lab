#!/usr/bin/env python3
"""
Converte o pacote `webots-bridge-v1` exportado pelo laboratorio
em um replay plan simples para uso no lado Webots.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


REQUIRED_TOP_LEVEL_KEYS = {
    "version",
    "source",
    "generatedAt",
    "schema",
    "stats",
    "frames",
    "worldTimeline",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gera um replay plan para Webots a partir do pacote bridge do laboratorio."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Caminho para o JSON exportado pelo Open Physical AI Lab.",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Caminho do replay plan de saida.",
    )
    parser.add_argument(
        "--actions",
        default="pick,place",
        help="Lista de acoes separadas por virgula para incluir no replay (padrao: pick,place).",
    )
    return parser.parse_args()


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError("Arquivo de entrada invalido: JSON raiz deve ser objeto.")

    return data


def _validate_package(data: dict[str, Any]) -> None:
    missing = REQUIRED_TOP_LEVEL_KEYS.difference(data.keys())
    if missing:
        missing_text = ", ".join(sorted(missing))
        raise ValueError(f"Pacote invalido: faltam chaves obrigatorias: {missing_text}")

    if data.get("schema") != "webots-bridge-v1":
        raise ValueError(
            f"Schema invalido: esperado 'webots-bridge-v1', recebido '{data.get('schema')}'"
        )

    frames = data.get("frames")
    if not isinstance(frames, list):
        raise ValueError("Pacote invalido: 'frames' deve ser uma lista.")


def _safe_number(value: Any, default: float = 0.0) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    return default


def _extract_position(value: Any) -> list[float]:
    if not isinstance(value, list) or len(value) < 3:
        return [0.0, 0.0, 0.0]
    return [
        _safe_number(value[0]),
        _safe_number(value[1]),
        _safe_number(value[2]),
    ]


def build_replay_plan(data: dict[str, Any], allowed_actions: set[str]) -> dict[str, Any]:
    raw_frames = data.get("frames", [])
    sorted_frames = sorted(
        raw_frames,
        key=lambda frame: (
            str(frame.get("episodeId", "")),
            int(frame.get("stepIndex", 0)),
            int(frame.get("timestamp", 0)),
        ),
    )

    if not sorted_frames:
        raise ValueError("Nao ha frames no pacote para gerar replay.")

    start_timestamp = int(sorted_frames[0].get("timestamp", 0))
    steps: list[dict[str, Any]] = []
    action_counter: Counter[str] = Counter()

    for frame in sorted_frames:
        action = str(frame.get("action", "none")).strip().lower()

        if allowed_actions and action not in allowed_actions:
            continue

        hand = frame.get("hand", {})
        step_timestamp = int(frame.get("timestamp", start_timestamp))

        action_counter[action] += 1
        steps.append(
            {
                "episodeId": frame.get("episodeId"),
                "stepIndex": int(frame.get("stepIndex", 0)),
                "timestamp": step_timestamp,
                "tOffsetMs": max(0, step_timestamp - start_timestamp),
                "command": frame.get("command"),
                "action": action,
                "target": frame.get("target"),
                "hand": {
                    "position": _extract_position(hand.get("position")),
                    "rotation": _extract_position(hand.get("rotation")),
                    "grip": _safe_number(hand.get("grip"), 1.0),
                    "phase": str(hand.get("phase", "transit")),
                    "proximity": _safe_number(hand.get("proximity"), 1.0),
                    "contact": bool(hand.get("contact", False)),
                    "velocity": _extract_position(hand.get("velocity")),
                    "jointAngles": hand.get("jointAngles", []),
                },
                "objects": frame.get("objects", []),
            }
        )

    if not steps:
        allowed_txt = ", ".join(sorted(allowed_actions)) if allowed_actions else "(todas)"
        raise ValueError(f"Nenhum frame encontrado para as acoes selecionadas: {allowed_txt}")

    return {
        "schema": "webots-replay-plan-v1",
        "sourceSchema": data.get("schema"),
        "generatedAt": data.get("generatedAt"),
        "summary": {
            "episodes": data.get("stats", {}).get("episodes", 0),
            "inputFrames": len(raw_frames),
            "outputSteps": len(steps),
            "actionCounts": dict(action_counter),
        },
        "steps": steps,
    }


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    allowed_actions = {
        action.strip().lower()
        for action in args.actions.split(",")
        if action.strip()
    }

    data = _load_json(input_path)
    _validate_package(data)
    replay_plan = build_replay_plan(data, allowed_actions)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(replay_plan, f, ensure_ascii=False, indent=2)

    print("Replay plan gerado com sucesso")
    print(f"Entrada: {input_path}")
    print(f"Saida:   {output_path}")
    print(f"Steps:   {replay_plan['summary']['outputSteps']}")


if __name__ == "__main__":
    main()
