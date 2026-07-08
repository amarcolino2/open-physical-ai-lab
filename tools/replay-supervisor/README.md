# Replay Supervisor para Webots

Esta pasta contem um controller Python de exemplo para executar um replay-plan gerado pelo Open Physical AI Lab no lado Webots.

## Arquivos

- `replay_supervisor.py`: controller Supervisor que le `webots-replay-plan-v1` e aplica os steps.
- `config.example.json`: exemplo de configuracao de caminho e mapeamento de IDs para DEFs.

## Como usar

1. Copie `config.example.json` para `config.json`.
2. Edite `config.json` com:
   - `replayPlanPath`: caminho do replay-plan gerado pelo adaptador.
   - `handDef`: DEF da mao/EEF no seu world Webots.
   - `objectDefs`: mapeamento de IDs do replay (`cup-1`, `phone-1`, etc.) para DEFs reais do world.
3. No Webots, use um `Robot` com `Supervisor TRUE`.
4. Defina o controller desse robot para este script (`replay_supervisor.py`).
5. Execute a simulacao.

## Exemplo de config

```json
{
  "replayPlanPath": "D:/Estudos/Projetos/LLMs/open-physical-ai-lab/tools/open-physical-ai-webots-replay-1783534603226.json",
  "handDef": "ROBOT_HAND",
  "objectDefs": {
    "table-1": "TABLE_1",
    "phone-1": "PHONE_1",
    "cup-1": "CUP_1",
    "box-1": "BOX_1"
  },
  "applyObjectRotation": false
}
```

## Observacoes

- O Webots nao possui botao nativo para carregar replay JSON; isso e feito pelo controller.
- O mapeamento `objectDefs` e obrigatorio para mover os objetos corretos.
- `applyObjectRotation` e opcional. A conversao atual de Euler para axis-angle e simplificada.
