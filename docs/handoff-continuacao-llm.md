# Handoff de Continuidade - Open Physical AI Lab

## Objetivo deste documento

Este arquivo foi criado para servir como ponto de partida para outro modelo de LLM continuar o trabalho no repositório sem depender do historico da conversa.

O projeto e um laboratorio educacional de Physical AI, browser-first, com Digital Twin, demonstracao de movimento, gravacao de exemplos, exportacao para Google Colab e importacao de policy aprendida.

O foco nao e competir com simuladores maduros como Isaac Sim, MuJoCo, Gazebo ou Webots. O foco e ensinar, documentar, reproduzir e evoluir o fluxo de Physical AI de forma clara e auditavel.

## Mensagem central do projeto

O repositorio existe para demonstrar, em camadas, como um sistema de robota pode ser estruturado:

Usuario -> LLM -> Planner -> Perception -> World State -> Motion Controller -> Skill -> Policy -> Robot Hand

A proposta tem valor educacional e de pesquisa aplicada. Ela tambem pode ser usada para comunicacao publica no LinkedIn e no GitHub sem prometer algo que o projeto ainda nao entrega.

## O que ja foi construido

### Estrutura geral

- Aplicacao React + TypeScript + Vite.
- Cena 3D no navegador com Three.js, React Three Fiber e Drei.
- Organizacao em camadas para evitar acoplamento entre UI, IA, movimento, simulacao e treino.
- Painel lateral com informacoes operacionais e educacionais.

### Digital Twin e World State

- World State centralizado como fonte unica de verdade.
- Objetos do mundo com contrato comum.
- Attach, release e sincronizacao da mao com objetos anexados.
- Historico de snapshots do estado do mundo.
- Event log com eventos de snapshot, attach, release, sync e state.

### Percepcao

- Camada de percepcao isolada em interface propria.
- Leitura do estado atual do mundo.
- Estimativa de pose de objeto a partir do World State.
- Base pronta para evoluir para uma percepcao mais rica.

### Planejamento e movimento

- Planner de linguagem natural retornando planos estruturados.
- IK simplificada para pose-alvo.
- Trajetoria com fases de movimento.
- Motion controller com interpolacao de pose.
- Hook de controle com cursor monotono para evitar regressao na trajetoria.

### Mao robotica

- Representacao visual de mao antropomorfica simplificada.
- Estrutura de dedos e juntas.
- Integra com estado de grip e posicao da mao.

### Demonstracoes e treino

- Gravacao de demonstracoes diretamente no navegador.
- Exportacao de dataset em JSON.
- Notebook de Google Colab gerado automaticamente.
- Treino baseline de policy a partir de demonstracoes.
- Importacao de policy aprendida para o runtime do navegador.

### Documentacao publica

- README reposicionado com objetivo explicito.
- Post para LinkedIn com narrativa humana e tecnica.
- Manual de replicacao e uso ja existente.
- Handoff de continuidade com matriz de roadmap e interoperabilidade.

### Interoperabilidade inicial (Webots)

- Ponte inicial implementada no app para exportacao de pacote JSON voltado a Webots.
- O pacote inclui episodios, frames com propriocepcao e timeline do Digital Twin.
- Exportacao acionada diretamente pelo painel da UI (botao "Exportar Webots").
- Status de exportacao exibido no painel para facilitar validacao manual.
- Adaptador Python inicial criado para validar o pacote e gerar replay plan (`tools/webots_bridge_adapter.py`).
- Guia operacional da ponte Webots criado em `docs/webots-interoperabilidade.md`.

## Estado atual da arquitetura

### Camadas principais

| Camada | Responsabilidade | Estado atual |
|---|---|---|
| UI | Exibir estado, permitir interacao e controle | Implementada e funcional |
| World State | Manter o estado unico do ambiente | Implementado |
| Perception | Interpretar o mundo e expor observacoes | Basica, ainda dependente do World State |
| Planner | Transformar comandos em planos | Implementado em nivel de regra/baseline |
| Motion | Converter plano em movimento | Implementado com trajetoria e IK simplificada |
| Policy | Aprender/usar comportamento a partir de demos | Baseline funcional |
| Training | Gerar dataset, notebook e artefatos | Implementado em formato educacional |
| Runtime de inferencia | Executar policy aprendida no navegador | Parcial, ainda simples |

### Leitura tecnica importante

O projeto hoje e mais forte como laboratorio educacional e ponte browser -> Colab do que como runtime robótico de producao.

Isso significa que a arquitetura esta boa para ensinar e prototipar, mas ainda nao esta no ponto de modelos de pesquisa mais pesados com propriocepcao rica, multimodalidade e inferencia temporal avancada.

## Matriz do roadmap

| Avanco | E possivel agora? | O que a base atual ja oferece | Limitacoes principais | Caminho recomendado |
|---|---:|---|---|---|
| ACT em inferencia real | Parcialmente | Pipeline de demonstracoes, notebook de Colab, runtime basico de policy | ACT costuma exigir sequencias temporais, modelos treinados em Python/GPU, dataset maior e inferencia fora do browser | Treinar em Colab ou backend Python e importar artefatos para o app |
| Integracao com GR00T, pi0 e SmolVLA | Parcialmente | Contratos de plano, policy e artefato permitem adaptacao de dados | Modelos normalmente exigem observacoes, acoes e runtime especificos; integracao direta no browser tende a ser impraticavel | Criar camada de adaptacao e executar inferencia em runtime externo |
| Propriocepcao mais rica | Sim | World State com snapshots e eventos; percepcao isolada | Falta modelagem de joints, velocidade, contato, forca e estado articular real | Evoluir para propriocepcao simulada mais rica |
| Treino BC/ACT mais avancado no Colab | Sim | Notebook gerado automaticamente e dataset exportavel | O notebook atual e baseline, nao um pipeline de pesquisa robusto | Evoluir para BC/ACT em PyTorch com sequencias e validacao formal |

## Continuidade com Webots

Se o objetivo for uma integracao com alto valor e baixo atrito, Webots e a melhor extensao natural deste projeto.

### Por que Webots encaixa bem

- Mantem o projeto dentro de uma narrativa educacional e reproducivel.
- Permite mostrar interoperabilidade com um simulador maduro sem depender de uma stack industrial pesada logo de inicio.
- Combina com a ideia de laboratorio browser-first que gera demos, planos e policies.
- E uma ponte boa para demonstrar que o projeto nao vive isolado: ele pode conversar com um ambiente de simulacao mais consolidado.

### O que faz sentido trocar entre o laboratorio e o Webots

- Do laboratorio para o Webots: comandos, planos, poses-alvo, trajetorias simplificadas e episodios de demonstracao.
- Do Webots para o laboratorio: observacoes, estados do objeto, feedback de execucao, falhas de manipulacao e trajetorias refinadas.

### Interoperabilidade recomendada

1. Usar o laboratorio como camada de autoria e experimentacao.
2. Usar o Webots como camada de execucao e validacao mais madura.
3. Definir um contrato de dados comum para comandos, observacoes e episodios.
4. Se precisar de integracao futura com ROS 2, tratar o Webots como primeiro passo e o ROS 2 como barramento de longa duracao.

### Menor caminho tecnico para começar

- Exportar episodios e planos do laboratorio em JSON bem estruturado.
- Mapear esses dados para um formato que o Webots consiga consumir com facilidade.
- Manter a maior parte da logica de autoria no browser.
- Evitar acoplamento direto com hardware ou com modelos grandes logo na primeira iteracao.

## Matriz de interoperabilidade com Webots

| Eixo | Esforco | Valor para o projeto | Aderencia ao escopo atual | Prioridade |
|---|---:|---:|---:|---:|
| Exportar comandos, planos e episodios do laboratorio para Webots | Baixo | Alto | Muito alta | 1 |
| Receber observacoes e feedback de execucao do Webots | Medio | Alto | Alta | 2 |
| Usar Webots como ambiente de validacao para manipulacao | Medio | Alto | Alta | 3 |
| Integrar ROS 2 como barramento entre laboratorio e Webots | Medio a alto | Muito alto | Media | 4 |
| Expandir para Isaac Sim, MuJoCo, Habitat ou ManiSkill depois da ponte com Webots | Alto | Alto | Media | 5 |

### Leitura da matriz

- O melhor primeiro passo e a exportacao do que o laboratorio ja sabe produzir: comandos, planos, poses e episodios.
- O segundo passo e trazer de volta observacoes e sinais de execucao para o laboratorio aprender com a simulacao externa.
- ROS 2 deve entrar como camada de interop quando a troca de dados estiver madura, e nao como requisito inicial.
- Webots e o ponto de equilibrio entre baixo atrito tecnico e valor de demonstracao.

### O que implementar primeiro nesta integracao

1. Definir um schema unico de episodio.
2. Criar exportador para JSON compatível com Webots.
3. Criar importador de feedback do Webots para o laboratorio.
4. Validar um fluxo simples de pick e release.
5. Somente depois avaliar ROS 2 como barramento adicional.

## Limites reais do projeto hoje

### 1. O runtime de policy ainda e simples

O runtime atual aprende principalmente um mapeamento comando -> plano. Isso e suficiente para demonstrar a ideia, mas nao e o mesmo que rodar uma policy temporal robusta como ACT, GR00T ou SmolVLA.

### 2. A percepcao ainda e centrada no mundo virtual

A percepcao atual depende do World State e nao de sensores fisicos reais. Isso e otimo para o laboratorio, mas limita propriocepcao, contato, forca e observacao multimodal.

### 3. O treino em Colab ainda e baseline

O notebook atual organiza o fluxo de dados e gera artefatos, mas nao representa ainda um pipeline maduro de pesquisa com modelos grandes, validacao e versionamento de experimentos.

### 4. Nao existe hardware nem telemetria real

Sem hardware fisico, o projeto consegue simular, ensinar e preparar integracoes, mas nao validar comportamento real de manipulacao, latencia, ruido de sensor ou falhas mecanicas.

### 5. Integracao com modelos externos exige uma ponte tecnica

Para ACT, GR00T, pi0 ou SmolVLA, o mais provavel e precisar de um backend em Python, GPU e contrato de dados bem definido.

## Prioridade recomendada de evolucao

### Sequencia sugerida

1. Propriocepcao simulada mais rica.
2. Treino BC/ACT mais avancado no Colab.
3. Camada de adaptacao para integrar modelos externos como GR00T, pi0 e SmolVLA.
4. ACT em inferencia real fora do navegador.

### Por que essa ordem

- A propriocepcao melhora a qualidade dos dados sem quebrar a arquitetura atual.
- O Colab e o caminho mais natural para evoluir treino sem exigir GPU local.
- A adaptacao para modelos externos depende de contrato de dados e formatos mais maduros.
- ACT em inferencia real e o passo mais custoso e o que mais depende de infraestrutura externa.

## O que outro modelo de LLM deve fazer primeiro

Se voce estiver retomando o projeto com outro modelo, siga esta ordem de leitura e acao:

1. Ler o README para entender o posicionamento do projeto.
2. Ler o manual de replicacao e uso.
3. Ler `src/types/index.ts` para entender os contratos centrais.
4. Ler `src/simulation/world/worldState.ts` para entender o Digital Twin.
5. Ler `src/ai/perception/index.ts`, `src/ai/policies/index.ts` e `src/ai/training/colab.ts` para entender percepcao, policy e treino.
6. Verificar se a proposta nova respeita o escopo educacional e nao promete simulacao industrial completa.

## Sugestao de proximos passos tecnicos

### Curto prazo

- Enriquecer a propriocepcao simulada.
- Formalizar melhor os sinais de observacao usados no treino.
- Melhorar a estrutura do dataset exportado para Colab.
- Documentar o formato dos artefatos de policy.

### Medio prazo

- Trocar o baseline do Colab por BC mais consistente.
- Incluir sequencias temporais por episodio.
- Preparar contrato para modelos externos.

### Longo prazo

- Integrar ACT ou modelo similar em runtime externo.
- Conectar o laboratorio a uma pipeline de inferencia mais robusta.
- Definir uma camada de validacao para comparar policy aprendida com planner baseline.

## Checklist de continuidade para a proxima LLM

- Nao apagar funcionalidades existentes.
- Nao transformar o projeto em uma promessa de produto pronto.
- Preservar o papel educacional do laboratorio.
- Manter a separacao entre simulacao, treino, policy e UI.
- Tratar Colab como ponte de treino, nao como unica fonte de verdade.
- Preferir evolucao incremental a refatoracoes amplas sem necessidade.

## Referencias uteis no repositorio

- [README.md](../README.md)
- [docs/manual-replicacao-e-uso.md](manual-replicacao-e-uso.md)
- [docs/linkedin-post.md](linkedin-post.md)
- [src/types/index.ts](../src/types/index.ts)
- [src/simulation/world/worldState.ts](../src/simulation/world/worldState.ts)
- [src/ai/perception/index.ts](../src/ai/perception/index.ts)
- [src/ai/policies/index.ts](../src/ai/policies/index.ts)
- [src/ai/training/colab.ts](../src/ai/training/colab.ts)

## Resumo final

Este projeto ja e valioso como laboratorio de Physical AI browser-first com Digital Twin, demonstracoes e Colab.

Os avancos mais realistas agora sao propriocepcao mais rica e treino mais avancado no Colab.

Integracao com GR00T, pi0 e SmolVLA e possivel, mas deve ser tratada como ponte externa.

ACT em inferencia real e viavel apenas com uma arquitetura de runtime mais pesada, normalmente fora do browser.
