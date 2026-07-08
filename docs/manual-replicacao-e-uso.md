# Manual de Replicacao e Uso

## 1. Proposito do projeto

Este laboratorio demonstra, em ambiente totalmente virtual, como uma arquitetura de Physical AI pode ser organizada para controle de uma mao robotica antropomorfica simplificada.

Proposito educacional:
- Explicar o fluxo de decisao de um sistema robotico.
- Demonstrar coleta de demonstracoes para treino.
- Conectar simulacao local com rotina de treinamento no Google Colab.
- Conectar o laboratorio com simulacao externa (Webots) por interoperabilidade.

## 2. Escopo atual (implementado)

- Ambiente 3D no navegador (React + Three.js + React Three Fiber).
- World State centralizado como fonte unica de verdade.
- Planner de linguagem natural (baseline por regras).
- Motion controller com trajetoria e interpolacao.
- Rotina de grasp em estagios (pre-grasp, approach, grasp, lift).
- Digital Twin com historico e event log.
- Propriocepcao simulada ativa no runtime:
  - fase
  - contato
  - proximidade
  - velocidade
  - juntas sinteticas
- Gravacao de demonstracoes no navegador.
- Exportacao de notebook para Google Colab.
- Pipeline temporal no Colab com PyTorch.
- Integracao de policy aprendida no runtime (modo learned).
- Exportacao de pacote Webots (bridge v1) pelo painel.
- Importacao de feedback Webots e anexacao aos frames.

## 3. Em evolucao

- Imitation Learning avancado alem do baseline atual.
- ACT (Action Chunking Transformer) em inferencia real.
- Integracao com GR00T, pi0 e SmolVLA em runtime externo.
- ROS 2 como barramento de interoperabilidade entre laboratorio e simuladores.

## 4. Pre-requisitos

- Node.js 20+ (ou versao compativel com Vite 8).
- npm.
- Navegador moderno (Chrome, Edge ou Firefox recente).
- Conta Google para uso do Colab (opcional, recomendado).
- Python 3.10+ para o adaptador Webots (opcional).

## 5. Execucao local

No terminal, na raiz do projeto:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Opcional (adaptador Webots):

```bash
python tools/webots_bridge_adapter.py --help
```

## 6. Fluxo de uso

### 6.1 Fluxo basico

1. Abrir a aplicacao no navegador.
2. Inserir um comando no painel lateral.
3. Exemplo: `Pegue o celular`.
4. Observar plano, movimento e sinais de propriocepcao no painel.

### 6.2 Coleta de demonstracoes

1. Clicar em `Iniciar gravacao`.
2. Executar uma sequencia de comandos.
3. Clicar em `Parar gravacao`.
4. Clicar em `Baixar demos` para salvar o dataset local.

### 6.3 Treino no Colab

1. Clicar em `Exportar Colab`.
2. Abrir o notebook no Google Colab.
3. Executar as celulas em ordem.
4. Gerar `learned_policy_browser.json`.

Observacoes:
- O notebook usa sequencias temporais e sinais proprioceptivos.
- Se houver feedback Webots anexado aos frames, o dataset inclui:
  - `exec_success`
  - `exec_collision`
  - `exec_latency_ms`

### 6.4 Importacao de policy no navegador

1. Clicar em `Importar policy Colab`.
2. Selecionar `learned_policy_browser.json`.
3. Alternar para `Modo learned`.
4. Comparar comportamento entre modo `planner` e `learned`.

### 6.5 Fluxo Webots (bridge v1)

1. Gerar demonstracoes e/ou historico no app.
2. Clicar em `Exportar Webots`.
3. O app gera `open-physical-ai-webots-bridge-<timestamp>.json`.
4. Para executar replay no Webots via controller Supervisor, use os arquivos em `tools/replay-supervisor/`.
5. Copiar `tools/replay-supervisor/config.example.json` para `config.json` e ajustar `replayPlanPath` + mapeamento de DEFs.
6. Converter para replay plan:

```bash
python tools/webots_bridge_adapter.py --input <bridge.json> --output <replay-plan.json> --actions pick,place
```

7. No Webots, configurar um robot com `Supervisor TRUE` e apontar o controller para `tools/replay-supervisor/replay_supervisor.py`.
8. Executar a simulacao para reproduzir os steps do replay plan.

### 6.6 Importacao de feedback Webots

1. No replay plan, preencher feedback por step:
  - `success`
  - `collision`
  - `latencyMs`
  - `notes` (opcional)
2. Clicar em `Importar feedback Webots` no app.
3. Selecionar o JSON de replay com feedback.
4. O app anexa feedback aos frames por proximidade temporal.
5. Validar no painel:
  - `Feedback Webots`
  - `Frames com feedback`

## 7. Arquitetura (resumo)

Fluxo principal:

`Usuario -> LLM -> Planner -> Perception -> Digital Twin World State -> Motion Controller -> Skill -> Policy -> Robot Hand`

Fluxo de interoperabilidade externa atual:

`Laboratorio -> Webots Bridge JSON -> Adaptador Python -> Replay Plan Webots -> Feedback -> Importacao no laboratorio`

## 8. Papel do Digital Twin

O Digital Twin e o nucleo do sistema:
- Mantem a fonte unica de verdade do ambiente.
- Registra snapshots e eventos para rastreabilidade.
- Alimenta demonstracoes para treino.
- Alimenta exportacao para Webots e analise de replay.

## 9. Reproducibilidade (passo a passo)

1. Clonar o repositorio.
2. Rodar `npm install`.
3. Rodar `npm run dev`.
4. Gravar pelo menos 3 episodios com comandos diferentes.
5. Exportar notebook para Colab.
6. Treinar e exportar `learned_policy_browser.json`.
7. Importar policy no app e ativar `Modo learned`.
8. Exportar pacote Webots e converter para replay plan.
9. Executar replay no Webots e preencher feedback por step.
10. Importar feedback no app.
11. Reexportar notebook Colab com feedback anexado e comparar resultados.

## 10. Metricas recomendadas

- Taxa de comandos corretamente interpretados.
- Tempo medio para completar `pick/place`.
- Distancia final ao alvo.
- Numero de eventos `attach/release` consistentes.
- Diferenca entre baseline planner e policy learned.
- Taxa de sucesso de steps com feedback Webots.
- Taxa de colisao reportada no replay externo.
- Latencia media de execucao externa (`latencyMs`).

## 11. Limites atuais

Este projeto e uma prova de conceito educacional. Nao substitui validacao clinica, mecanica ou normativa para assistive robotics real.

Limites tecnicos atuais:
- O runtime no navegador ainda nao executa ACT real.
- A ponte Webots atual e baseada em arquivos (nao streaming em tempo real).
- ROS 2 ainda nao foi integrado como barramento de mensagens.

## 12. Proximos passos recomendados

1. Incluir replay deterministico dos episodios para benchmark.
2. Adicionar avaliacao automatica por cenarios no replay externo.
3. Expandir contrato de feedback com sinais fisicos adicionais.
4. Integrar ROS 2 entre laboratorio e Webots.
5. Integrar ACT/SmolVLA com inferencia em runtime externo e importacao de artefato no app.

## 13. Documentos relacionados

- `docs/webots-interoperabilidade.md`
- `docs/handoff-continuacao-llm.md`
