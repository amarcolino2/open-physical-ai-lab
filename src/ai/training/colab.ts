import type { DemonstrationEpisode } from "../../types";

interface TrainingRow {
  episode_id: string;
  step_index: number;
  timestamp: number;
  command: string;
  action: string;
  target: string;
  hand_x: number;
  hand_y: number;
  hand_z: number;
  grip: number;
  phase: string;
  proximity: number;
  contact: number;
  joint_1: number;
  joint_2: number;
  joint_3: number;
  joint_4: number;
  joint_5: number;
  vel_x: number;
  vel_y: number;
  vel_z: number;
  exec_success: number;
  exec_collision: number;
  exec_latency_ms: number;
}

interface ColabCell {
  cell_type: "markdown" | "code";
  metadata: {
    language: "markdown" | "python";
  };
  source: string[];
  outputs?: unknown[];
  execution_count?: number | null;
}

interface NotebookModel {
  cells: ColabCell[];
  metadata: Record<string, unknown>;
  nbformat: number;
  nbformat_minor: number;
}

const NOTEBOOK_MAX_ROWS = 6000;

function markdownCell(source: string[]): ColabCell {
  const normalizedSource = source.map((line) => `${line}\n`);

  return {
    cell_type: "markdown",
    metadata: { language: "markdown" },
    source: normalizedSource,
  };
}

function codeCell(source: string[]): ColabCell {
  const normalizedSource = source.map((line) => `${line}\n`);

  return {
    cell_type: "code",
    metadata: { language: "python" },
    source: normalizedSource,
    outputs: [],
    execution_count: null,
  };
}

function buildTrainingRows(
  episodes: DemonstrationEpisode[]
): TrainingRow[] {
  const rows: TrainingRow[] = [];

  for (const episode of episodes) {
    episode.frames.forEach((frame, stepIndex) => {
      const proprio = frame.handProprioception;
      const proprioPosition =
        proprio?.pose?.position ?? frame.handPose.position;
      const joints = proprio?.jointAngles ?? [0, 0, 0, 0, 0];
      const velocity = proprio?.velocity ?? [0, 0, 0];
      const feedback = frame.executionFeedback;

      rows.push({
        episode_id: episode.id,
        step_index: stepIndex,
        timestamp: frame.timestamp,
        command: frame.command,
        action: frame.plan.action,
        target: frame.plan.target ?? "none",
        hand_x: Number(proprioPosition[0] ?? 0),
        hand_y: Number(proprioPosition[1] ?? 0),
        hand_z: Number(proprioPosition[2] ?? 0),
        grip: Number(proprio?.grip ?? 0.85),
        phase: proprio?.phase ?? "transit",
        proximity: Number(proprio?.proximity ?? 1),
        contact: Number(Boolean(proprio?.contact)),
        joint_1: Number(joints[0] ?? 0),
        joint_2: Number(joints[1] ?? 0),
        joint_3: Number(joints[2] ?? 0),
        joint_4: Number(joints[3] ?? 0),
        joint_5: Number(joints[4] ?? 0),
        vel_x: Number(velocity[0] ?? 0),
        vel_y: Number(velocity[1] ?? 0),
        vel_z: Number(velocity[2] ?? 0),
        exec_success: Number(Boolean(feedback?.success)),
        exec_collision: Number(Boolean(feedback?.collision)),
        exec_latency_ms: Number(feedback?.latencyMs ?? 0),
      });
    });
  }

  return rows;
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

function chunkString(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

function createNotebook(episodes: DemonstrationEpisode[]): NotebookModel {
  const allRows = buildTrainingRows(episodes);
  const sampleStride =
    allRows.length > NOTEBOOK_MAX_ROWS
      ? Math.ceil(allRows.length / NOTEBOOK_MAX_ROWS)
      : 1;
  const rows =
    sampleStride === 1
      ? allRows
      : allRows.filter((_, index) => index % sampleStride === 0);
  const payloadBase64 = encodeBase64Utf8(JSON.stringify(rows));
  const payloadChunks = chunkString(payloadBase64, 4000);
  const payloadChunkLines = payloadChunks.map(
    (chunk) => `    '${chunk}',`
  );
  const samplingNote =
    sampleStride > 1
      ? `Amostragem automatica aplicada: 1 a cada ${sampleStride} frames (de ${allRows.length} para ${rows.length}).`
      : "Sem amostragem automatica (dataset completo no notebook).";

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      colab: {
        name: "open_physical_ai_training.ipynb",
      },
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
      },
    },
    cells: [
      markdownCell([
        "# Open Physical AI Lab - Training Notebook",
        "Notebook gerado automaticamente a partir das demonstracoes do simulador.",
        "",
        "Otimizacao ativa: dataset embutido em formato compacto para reduzir tamanho do upload no Colab.",
        samplingNote,
        "",
        "Pipeline temporal mais rico para imitation learning:",
        "1. Carregamento das demonstracoes",
        "2. Normalizacao das observacoes proprioceptivas",
        "3. Geracao de sequencias por episodio",
        "4. Treino de um baseline temporal em PyTorch",
        "5. Avaliacao e exportacao de artefatos",
      ]),
      codeCell([
        "# Setup basico de ambiente",
        "import sys",
        "import subprocess",
        "",
        "def ensure_package(pkg):",
        "    try:",
        "        __import__(pkg)",
        "    except Exception:",
        "        subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg])",
        "",
        "for package in ['pandas', 'numpy', 'scikit-learn', 'joblib', 'torch']:",
        "    ensure_package(package)",
        "",
        "print('Ambiente pronto')",
      ]),
      codeCell([
        "# Carrega dataset compacto exportado do simulador",
        "import base64",
        "import json",
        "import numpy as np",
        "import pandas as pd",
        "",
        "payload_chunks = [",
        ...payloadChunkLines,
        "]",
        "payload_b64 = ''.join(payload_chunks)",
        "rows = json.loads(base64.b64decode(payload_b64).decode('utf-8'))",
        "df = pd.DataFrame(rows)",
        "episode_count = int(df['episode_id'].nunique()) if not df.empty else 0",
        "print(f'Episodios carregados: {episode_count}')",
        "print(f'Total de frames: {len(df)}')",
      ]),
      codeCell([
        "# Valida a tabela tabular de treino com propriocepcao",
        "if df.empty:",
        "    raise ValueError('Dataset vazio. Grave demonstracoes antes de exportar o notebook.')",
        "",
        "display(df.head())",
        "print(df[['action', 'target']].value_counts().head(10))",
      ]),
      codeCell([
        "# Treino baseline temporal em PyTorch para imitation learning",
        "from sklearn.model_selection import train_test_split",
        "from sklearn.preprocessing import LabelEncoder, StandardScaler",
        "from sklearn.metrics import classification_report",
        "import torch",
        "import torch.nn as nn",
        "from torch.utils.data import Dataset, DataLoader",
        "",
        "if len(df) < 5:",
        "    raise ValueError('Poucos dados para treino. Grave mais demonstracoes.')",
        "",
        "feature_columns = [",
        "    'hand_x', 'hand_y', 'hand_z',",
        "    'grip', 'proximity', 'contact',",
        "    'joint_1', 'joint_2', 'joint_3', 'joint_4', 'joint_5',",
        "    'vel_x', 'vel_y', 'vel_z',",
        "]",
        "",
        "episode_ids = df['episode_id'].unique().tolist()",
        "if len(episode_ids) >= 2:",
        "    train_ids, test_ids = train_test_split(episode_ids, test_size=0.25, random_state=42)",
        "    train_df = df[df['episode_id'].isin(train_ids)].copy()",
        "    test_df = df[df['episode_id'].isin(test_ids)].copy()",
        "else:",
        "    # Fallback para datasets com 1 episodio: split por frame",
        "    train_df, test_df = train_test_split(df.copy(), test_size=0.25, random_state=42)",
        "",
        "if len(train_df) == 0 or len(test_df) == 0:",
        "    raise ValueError('Split de treino/teste invalido. Grave mais demonstracoes.')",
        "",
        "scaler = StandardScaler()",
        "train_features = scaler.fit_transform(train_df[feature_columns].fillna(0))",
        "test_features = scaler.transform(test_df[feature_columns].fillna(0))",
        "",
        "action_encoder = LabelEncoder()",
        "target_encoder = LabelEncoder()",
        "action_encoder.fit(df['action'].astype(str))",
        "target_encoder.fit(df['target'].astype(str))",
        "train_action = action_encoder.transform(train_df['action'].astype(str))",
        "train_target = target_encoder.transform(train_df['target'].astype(str))",
        "test_action = action_encoder.transform(test_df['action'].astype(str))",
        "test_target = target_encoder.transform(test_df['target'].astype(str))",
        "",
        "SEQ_LEN = 6",
        "",
        "def build_sequences(features, actions, targets):",
        "    xs, ya, yt = [], [], []",
        "    for i in range(len(features)):",
        "        start = max(0, i - SEQ_LEN + 1)",
        "        seq = features[start:i + 1]",
        "        if len(seq) < SEQ_LEN:",
        "            pad_count = SEQ_LEN - len(seq)",
        "            pad = np.repeat(seq[:1], pad_count, axis=0) if len(seq) > 0 else np.zeros((pad_count, features.shape[1]))",
        "            seq = np.vstack([pad, seq]) if len(seq) > 0 else pad",
        "        xs.append(seq[-SEQ_LEN:])",
        "        ya.append(actions[i])",
        "        yt.append(targets[i])",
        "    return np.stack(xs), np.array(ya), np.array(yt)",
        "",
        "X_train, y_action_train, y_target_train = build_sequences(train_features, train_action, train_target)",
        "X_test, y_action_test, y_target_test = build_sequences(test_features, test_action, test_target)",
        "",
        "class SequenceDataset(Dataset):",
        "    def __init__(self, X, y_action, y_target):",
        "        self.X = torch.tensor(X, dtype=torch.float32)",
        "        self.y_action = torch.tensor(y_action, dtype=torch.long)",
        "        self.y_target = torch.tensor(y_target, dtype=torch.long)",
        "",
        "    def __len__(self):",
        "        return len(self.X)",
        "",
        "    def __getitem__(self, idx):",
        "        return self.X[idx], self.y_action[idx], self.y_target[idx]",
        "",
        "train_loader = DataLoader(SequenceDataset(X_train, y_action_train, y_target_train), batch_size=8, shuffle=True)",
        "test_loader = DataLoader(SequenceDataset(X_test, y_action_test, y_target_test), batch_size=8, shuffle=False)",
        "",
        "class TemporalPolicyNet(nn.Module):",
        "    def __init__(self, input_dim, hidden_dim, action_classes, target_classes):",
        "        super().__init__()",
        "        self.encoder = nn.GRU(input_dim, hidden_dim, batch_first=True)",
        "        self.action_head = nn.Linear(hidden_dim, action_classes)",
        "        self.target_head = nn.Linear(hidden_dim, target_classes)",
        "",
        "    def forward(self, x):",
        "        _, hidden = self.encoder(x)",
        "        latent = hidden[-1]",
        "        return self.action_head(latent), self.target_head(latent)",
        "",
        "device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')",
        "model = TemporalPolicyNet(X_train.shape[-1], 64, len(action_encoder.classes_), len(target_encoder.classes_)).to(device)",
        "optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)",
        "criterion = nn.CrossEntropyLoss()",
        "",
        "for epoch in range(10):",
        "    model.train()",
        "    epoch_loss = 0.0",
        "    for xb, ya, yt in train_loader:",
        "        xb, ya, yt = xb.to(device), ya.to(device), yt.to(device)",
        "        optimizer.zero_grad()",
        "        action_logits, target_logits = model(xb)",
        "        loss = criterion(action_logits, ya) + criterion(target_logits, yt)",
        "        loss.backward()",
        "        optimizer.step()",
        "        epoch_loss += loss.item()",
        "    print(f'Epoch {epoch + 1}: loss={epoch_loss:.4f}')",
        "",
        "model.eval()",
        "action_preds = []",
        "target_preds = []",
        "with torch.no_grad():",
        "    for xb, _, _ in test_loader:",
        "        xb = xb.to(device)",
        "        action_logits, target_logits = model(xb)",
        "        action_preds.extend(torch.argmax(action_logits, dim=1).cpu().tolist())",
        "        target_preds.extend(torch.argmax(target_logits, dim=1).cpu().tolist())",
        "",
        "print('=== Action model report ===')",
        "print(classification_report(y_action_test, action_preds, labels=np.arange(len(action_encoder.classes_)), target_names=action_encoder.classes_, zero_division=0))",
        "print('=== Target model report ===')",
        "print(classification_report(y_target_test, target_preds, labels=np.arange(len(target_encoder.classes_)), target_names=target_encoder.classes_, zero_division=0))",
      ]),
      codeCell([
        "# Exporta artefatos para reutilizar no navegador/servico",
        "import joblib",
        "from google.colab import files",
        "",
        "joblib.dump({",
        "    'scaler': scaler,",
        "    'action_encoder': action_encoder,",
        "    'target_encoder': target_encoder,",
        "    'feature_columns': feature_columns,",
        "    'seq_len': SEQ_LEN,",
        "}, 'training_metadata.joblib')",
        "torch.save(model.state_dict(), 'temporal_policy_model.pt')",
        "df.to_csv('training_frames.csv', index=False)",
        "",
        "with open('training_summary.json', 'w', encoding='utf-8') as fp:",
        "    json.dump({",
        "        'episodes': int(episode_count),",
        "        'frames': int(len(df)),",
        "        'actions': sorted(df['action'].unique().tolist()),",
        "        'targets': sorted(df['target'].unique().tolist()),",
        "        'sequence_length': SEQ_LEN,",
        "    }, fp, ensure_ascii=False, indent=2)",
        "",
        "print('Arquivos gerados: temporal_policy_model.pt, training_metadata.joblib, training_frames.csv, training_summary.json')",
        "files.download('training_summary.json')",
      ]),
      codeCell([
        "# Gera artefato simplificado para importacao no browser",
        "browser_policy = {",
        "    'version': '2.0.0',",
        "    'generatedAt': int(pd.Timestamp.utcnow().timestamp() * 1000),",
        "    'model': 'colab-temporal-policy',",
        "    'commandToPlan': {},",
        "}",
        "",
        "for command in sorted(df['command'].dropna().unique().tolist()):",
        "    normalized_command = str(command).strip().lower()",
        "    command_df = df[df['command'].astype(str).str.strip().str.lower() == normalized_command]",
        "    source_df = command_df if not command_df.empty else df",
        "    command_features = scaler.transform(source_df[feature_columns].fillna(0))",
        "    if len(command_features) == 0:",
        "        continue",
        "",
        "    if len(command_features) >= SEQ_LEN:",
        "        command_sequence = command_features[-SEQ_LEN:]",
        "    else:",
        "        pad_count = SEQ_LEN - len(command_features)",
        "        pad = np.repeat(command_features[:1], pad_count, axis=0)",
        "        command_sequence = np.vstack([pad, command_features])",
        "",
        "    sample_tensor = torch.tensor(command_sequence[None, :, :], dtype=torch.float32).to(device)",
        "",
        "    with torch.no_grad():",
        "        action_logits, target_logits = model(sample_tensor)",
        "        action_prob = torch.softmax(action_logits, dim=1)[0]",
        "        target_prob = torch.softmax(target_logits, dim=1)[0]",
        "        action_idx = int(torch.argmax(action_prob).cpu().item())",
        "        target_idx = int(torch.argmax(target_prob).cpu().item())",
        "        action = action_encoder.inverse_transform([action_idx])[0]",
        "        target = target_encoder.inverse_transform([target_idx])[0]",
        "        confidence = float(action_prob[action_idx].cpu().item())",
        "",
        "    browser_policy['commandToPlan'][str(command).strip().lower()] = {",
        "        'action': str(action),",
        "        'target': None if str(target) == 'none' else str(target),",
        "        'confidence': round(confidence, 4),",
        "        'reasoning': 'Predicted by Colab-trained temporal policy',",
        "    }",
        "",
        "with open('learned_policy_browser.json', 'w', encoding='utf-8') as fp:",
        "    json.dump(browser_policy, fp, ensure_ascii=False, indent=2)",
        "",
        "print(f'Comandos no artefato: {len(browser_policy[\"commandToPlan\"]) }')",
        "files.download('learned_policy_browser.json')",
      ]),
      codeCell([
        "# Verificacao final do artefato para browser",
        "import os",
        "",
        "artifact_path = 'learned_policy_browser.json'",
        "if not os.path.exists(artifact_path):",
        "    raise FileNotFoundError('Arquivo learned_policy_browser.json nao foi gerado. Reexecute as celulas anteriores.')",
        "",
        "with open(artifact_path, 'r', encoding='utf-8') as fp:",
        "    artifact = json.load(fp)",
        "",
        "if not isinstance(artifact.get('commandToPlan'), dict) or len(artifact['commandToPlan']) == 0:",
        "    raise ValueError('Artefato invalido: commandToPlan ausente ou vazio.')",
        "",
        "print('Verificacao concluida com sucesso.')",
        "print(f\"Modelo: {artifact.get('model', 'n/a')}\")",
        "print(f\"Comandos exportados: {len(artifact['commandToPlan'])}\")",
      ]),
      markdownCell([
        "## Rotina concluida",
        "Com isso voce fecha a rotina de Colab para o laboratorio: dados -> sequencias -> treino -> avaliacao -> artefatos.",
        "",
        "Proxima evolucao recomendada: refinar o modelo temporal, separar validacao por episodios e depois testar ACT ou um substituto mais fiel.",
      ]),
    ],
  };
}

export function downloadColabNotebook(
  episodes: DemonstrationEpisode[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  const notebook = createNotebook(episodes);
  const notebookJson = JSON.stringify(notebook);
  const blob = new Blob([notebookJson], {
    type: "application/x-ipynb+json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "open_physical_ai_training.ipynb";
  anchor.click();

  URL.revokeObjectURL(url);

  window.open(
    "https://colab.research.google.com/",
    "_blank",
    "noopener,noreferrer"
  );
}
