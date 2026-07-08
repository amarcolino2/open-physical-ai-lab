# Webots Interoperabilidade (Bridge v1)

## Objetivo

Este guia descreve como consumir o pacote exportado pelo laboratorio para iniciar um replay simples no lado Webots.

Arquivo exportado pelo painel:

- `open-physical-ai-webots-bridge-<timestamp>.json`

## O que vem no pacote

Top-level esperado (`webots-bridge-v1`):

- `version`
- `source`
- `generatedAt`
- `schema`
- `stats`
- `frames`
- `worldTimeline`

Cada item de `frames` contem:

- `episodeId`
- `stepIndex`
- `timestamp`
- `command`
- `action`
- `target`
- `hand` (position, rotation, grip, phase, proximity, contact, velocity, jointAngles)
- `objects` (id, type, position, rotation, state, attachedTo)

## Fluxo recomendado (primeira iteracao)

1. Exportar o pacote no painel (`Exportar Webots`).
2. Rodar o adaptador Python para validar e gerar um replay plan.
3. Consumir o replay plan no controlador Webots.
4. Executar somente `pick/place` na primeira validacao.
5. Gerar feedback no replay plan (`step.feedback`) e importar no app (`Importar feedback Webots`).

## Adaptador Python

Script no repositorio:

- `tools/webots_bridge_adapter.py`

Uso basico:

```bash
python tools/webots_bridge_adapter.py \
  --input path/to/open-physical-ai-webots-bridge.json \
  --output path/to/webots-replay-plan.json
```

Filtrar somente acoes de interesse:

```bash
python tools/webots_bridge_adapter.py \
  --input path/to/open-physical-ai-webots-bridge.json \
  --output path/to/webots-replay-plan.json \
  --actions pick,place
```

## Saida gerada pelo adaptador

O replay plan gerado inclui:

- `schema`: `webots-replay-plan-v1`
- `sourceSchema`: schema de origem
- `generatedAt`: timestamp da conversao
- `summary`: totais e distribuicao por acao
- `steps`: lista temporal com `tOffsetMs`, `action`, `target`, `hand`, `objects`

### Formato esperado para feedback

Cada `step` pode conter:

```json
{
  "feedback": {
    "success": true,
    "collision": false,
    "latencyMs": 42.5,
    "notes": "pick executado sem colisao"
  }
}
```

Quando presente, o app tenta anexar esse feedback aos frames gravados por proximidade temporal.

## Proximo passo apos a primeira validacao

Depois que o replay de `pick/place` estiver estavel:

1. Incluir feedback de execucao do Webots (sucesso, falha, colisao, tempo).
2. Importar esse feedback de volta no laboratorio.
3. Usar feedback para ajustar dataset e policy.
