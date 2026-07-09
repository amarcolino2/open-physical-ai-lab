# Open Physical AI Lab

Laboratorio educacional virtual para demonstrar como um robo "pensa" usando arquitetura de Physical AI em camadas.

## Propósito

Este repositório é um laboratório educacional e reprodutível de Physical AI.

O objetivo não é substituir simuladores industriais maduros, nem entregar um produto assistivo pronto. O objetivo é demonstrar, de forma clara e auditável, como um sistema de robótica pode ser estruturado em camadas: linguagem, planejamento, percepção, world state, movimento, skill, policy e demonstração.

Tudo roda 100% no navegador e serve como ponte entre:

Usuario -> LLM -> Planner -> Perception -> World State -> Motion Controller -> Skill -> Policy -> Robot Hand

Sem hardware. O projeto existe para ensinar, documentar e permitir reprodução local do ciclo completo: simulação, gravação de demonstrações, treino no Colab e importação de policy aprendida.

Os itens LeRobot, SmolVLA, ACT, GR00T e pi0 fazem parte do roadmap conceitual. Alguns já têm pontos de integração preparados; outros ainda estão apenas como direção futura do laboratório.

## Stack

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Rapier Physics (planejado para fases seguintes)

## Estrutura Atual

```text
src/
  ai/
    llm/
    motion/
    perception/
    planner/
    policies/
    skills/
    training/
  components/
    scene/
    ui/
  hooks/
  simulation/
    camera/
    physics/
    renderer/
    world/
  types/
  utils/
```

## Principios Arquiteturais

- Single source of truth para objetos no World State.
- Renderizacao em pipeline: Scene -> WorldRenderer -> ObjectFactory -> Meshes.
- Motion Controller desacoplado da UI.
- Planner retorna somente plano sem movimentar diretamente a mao.
- Perception isolada com interface pronta para trocar World State por OpenCV no futuro.

## World State

Todos os objetos usam o mesmo contrato:

- id
- type
- position
- rotation
- scale
- color
- state
- attachedTo
- metadata

Runtime atual:

- Objetos podem ser anexados a `robot-hand` durante o `pick`.
- Quando anexados, a posicao do objeto sincroniza com a pose da mao.
- Ao liberar grip (ou sair de pick), os objetos retornam para estado `idle`.
- Historico temporal de snapshots do mundo (Digital Twin) ativo durante execucao.
- Event log de attach/release/sync/state para auditoria do comportamento.

## Demonstracoes

- Gravacao de demonstracoes diretamente no navegador (episodios e frames).
- Exportacao de demonstracoes em JSON para dataset.
- Pipeline preparado para imitation learning.

## Google Colab

- Exportacao automatica de notebook `.ipynb` com dados de demonstracao incorporados.
- Abertura direta do Colab para iniciar treino de policy.

## Policy Aprendida

- Treino inicial de uma policy aprendida a partir de demonstracoes gravadas.
- Alternancia entre modo `planner` e modo `learned` no painel.
- Inferencia learned-policy por comando natural mapeado das demos.

## UI Educacional

Painel lateral exibe:

- Comando
- Plano
- Objeto
- Posicao
- Estado
- Skill atual
- Tempo
- FPS
- Confianca

Campos futuros planejados:

- Imagem RGB
- Imagem Depth
- Estado da policy
- Tokens da LLM

## Como Executar

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

## Documentacao de Uso e Divulgacao

- Manual completo de replicacao e operacao: [docs/manual-replicacao-e-uso.md](docs/manual-replicacao-e-uso.md)
- Texto base para postagem no LinkedIn: [docs/linkedin-post.md](docs/linkedin-post.md)

## Roadmap

1. Fase 1: arquitetura, world state, object factory, planner, perception, motion e UI.
2. Fase 2: mao robotica com cinco dedos, cinco juntas por dedo e abertura/fechamento cinematico (implementacao base concluida).
3. Fase 3: IK e trajetoria com grasp orientado por alvo (pre-grasp -> approach -> grasp -> lift) + grip dinamico por proximidade.
4. Fase 4: Digital Twin com historico temporal e event log (implementado).
5. Fase 5: Gravacao de demonstracoes e exportacao de dataset (implementado).
6. Fase 6: Integracao com Google Colab via notebook gerado automaticamente (implementado).
7. Fase 7: Integracao inicial de policy aprendida com alternancia de modo de inferencia (implementado).
8. Fase 8: evoluir para treinamento BC/ACT real no Colab com artefatos versionados.
9. Fase 9: deploy de policy treinada para inferencia no navegador.
    
<img width="1635" height="944" alt="img" src="https://github.com/user-attachments/assets/ffadf72c-228c-43a7-9fd3-ddc5bc7e14b2" />

