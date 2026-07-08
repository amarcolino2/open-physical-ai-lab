import type { HandProprioception, Plan } from "../../types";
import type { PolicyMode } from "../../types";

interface PlannerPanelProps {
  command: string;
  setCommand: (value: string) => void;
  plan: Plan;
  handPosition: [number, number, number];
  handProprioception: HandProprioception;
  selectedObject: string;
  selectedObjectState: string;
  currentSkill: string;
  elapsedSeconds: number;
  fps: number;
  policyConfidence: number;
  grip: number;
  policyName: string;
  policyState: string;
  policyMode: PolicyMode;
  demoCount: number;
  historyCount: number;
  eventCount: number;
  isRecording: boolean;
  canUseLearnedPolicy: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownloadDemos: () => void;
  onTrainPolicy: () => void;
  onExportColab: () => void;
  onExportWebots: () => void;
  onImportWebotsFeedback: () => void;
  onImportColabPolicy: () => void;
  onPolicyModeChange: (mode: PolicyMode) => void;
  onClearRuntimeData: () => void;
  colabImportStatus: string;
  webotsExportStatus: string;
  webotsFeedbackStatus: string;
  webotsFeedbackCount: number;
}

export default function PlannerPanel({
  command,
  setCommand,
  plan,
  handPosition,
  handProprioception,
  selectedObject,
  selectedObjectState,
  currentSkill,
  elapsedSeconds,
  fps,
  policyConfidence,
  grip,
  policyName,
  policyState,
  policyMode,
  demoCount,
  historyCount,
  eventCount,
  isRecording,
  canUseLearnedPolicy,
  onStartRecording,
  onStopRecording,
  onDownloadDemos,
  onTrainPolicy,
  onExportColab,
  onExportWebots,
  onImportWebotsFeedback,
  onImportColabPolicy,
  onPolicyModeChange,
  onClearRuntimeData,
  colabImportStatus,
  webotsExportStatus,
  webotsFeedbackStatus,
  webotsFeedbackCount,
}: PlannerPanelProps) {
  const paragraphStyle = {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.3,
  } as const;

  const buttonStyle = {
    padding: 8,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    color: "white",
    fontSize: 12,
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: "min(360px, calc(100vw - 40px))",
        maxHeight: "calc(100vh - 40px)",
        background: "#1f2937",
        color: "white",
        padding: 14,
        borderRadius: 10,
        fontFamily: "system-ui, sans-serif",
        display: "grid",
        gap: 6,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>Physical AI Panel</h2>

      <input
        value={command}
        onChange={(e) =>
          setCommand(e.target.value)
        }
        style={{
          width: "100%",
          padding: 8,
          boxSizing: "border-box",
        }}
      />

      <hr />

      <p style={paragraphStyle}>
        <strong>Comando:</strong> {plan.rawCommand}
      </p>

      <p style={paragraphStyle}>
        <strong>Plano:</strong> {plan.reasoning}
      </p>

      <p style={paragraphStyle}>
        <strong>Objeto:</strong> {selectedObject}
      </p>

      <p style={paragraphStyle}>
        <strong>Posicao:</strong>
      </p>

      <p style={paragraphStyle}>X: {handPosition[0].toFixed(2)}</p>

      <p style={paragraphStyle}>Y: {handPosition[1].toFixed(2)}</p>

      <p style={paragraphStyle}>Z: {handPosition[2].toFixed(2)}</p>

      <p style={paragraphStyle}>
        <strong>Propriocepcao:</strong> {handProprioception.phase}
      </p>

      <p style={paragraphStyle}>
        <strong>Contato:</strong> {handProprioception.contact ? "sim" : "nao"}
      </p>

      <p style={paragraphStyle}>
        <strong>Proximidade:</strong> {handProprioception.proximity.toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        <strong>Velocidade:</strong>
      </p>

      <p style={paragraphStyle}>
        X: {handProprioception.velocity[0].toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        Y: {handProprioception.velocity[1].toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        Z: {handProprioception.velocity[2].toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        <strong>Juntas sintéticas:</strong>
      </p>

      <p style={paragraphStyle}>
        J1: {handProprioception.jointAngles[0].toFixed(2)} | J2: {handProprioception.jointAngles[1].toFixed(2)} | J3: {handProprioception.jointAngles[2].toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        J4: {handProprioception.jointAngles[3].toFixed(2)} | J5: {handProprioception.jointAngles[4].toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        <strong>Estado:</strong> {selectedObjectState}
      </p>

      <p style={paragraphStyle}>
        <strong>Skill atual:</strong> {currentSkill}
      </p>

      <p style={paragraphStyle}>
        <strong>Tempo:</strong> {elapsedSeconds}s
      </p>

      <p style={paragraphStyle}>
        <strong>FPS:</strong> {fps}
      </p>

      <p style={paragraphStyle}>
        <strong>Confianca do plano:</strong>{" "}
        {plan.confidence.toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        <strong>Confianca da politica:</strong>{" "}
        {policyConfidence.toFixed(2)}
      </p>

      <p style={paragraphStyle}>
        <strong>Policy:</strong> {policyName} ({policyState})
      </p>

      <p style={paragraphStyle}>
        <strong>Modo:</strong> {policyMode}
      </p>

      <p style={paragraphStyle}>
        <strong>Abertura da garra:</strong>{" "}
        {(grip * 100).toFixed(0)}%
      </p>

      <hr />

      <p style={paragraphStyle}>
        <strong>Digital Twin snapshots:</strong> {historyCount}
      </p>

      <p style={paragraphStyle}>
        <strong>Digital Twin eventos:</strong> {eventCount}
      </p>

      <p style={paragraphStyle}>
        <strong>Demonstracoes:</strong> {demoCount}
      </p>

      <p style={paragraphStyle}>
        <strong>Colab:</strong> {colabImportStatus}
      </p>

      <p style={paragraphStyle}>
        <strong>Webots:</strong> {webotsExportStatus}
      </p>

      <p style={paragraphStyle}>
        <strong>Feedback Webots:</strong> {webotsFeedbackStatus}
      </p>

      <p style={paragraphStyle}>
        <strong>Frames com feedback:</strong> {webotsFeedbackCount}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        <button
          onClick={() =>
            isRecording
              ? onStopRecording()
              : onStartRecording()
          }
          style={{
            ...buttonStyle,
            background: isRecording
              ? "#dc2626"
              : "#16a34a",
          }}
        >
          {isRecording
            ? "Parar gravacao"
            : "Iniciar gravacao"}
        </button>

        <button
          onClick={onDownloadDemos}
          style={{
            ...buttonStyle,
            background: "#0ea5e9",
          }}
        >
          Baixar demos
        </button>

        <button
          onClick={onTrainPolicy}
          style={{
            ...buttonStyle,
            background: "#4f46e5",
          }}
        >
          Treinar policy
        </button>

        <button
          onClick={onExportColab}
          style={{
            ...buttonStyle,
            background: "#f97316",
          }}
        >
          Exportar Colab
        </button>

        <button
          onClick={onExportWebots}
          style={{
            ...buttonStyle,
            background: "#0f766e",
          }}
        >
          Exportar Webots
        </button>

        <button
          onClick={onImportWebotsFeedback}
          style={{
            ...buttonStyle,
            background: "#115e59",
          }}
        >
          Importar feedback Webots
        </button>

        <button
          onClick={onImportColabPolicy}
          style={{
            ...buttonStyle,
            background: "#2563eb",
          }}
        >
          Importar policy Colab
        </button>

        <button
          onClick={() => onPolicyModeChange("planner")}
          style={{
            ...buttonStyle,
            background:
              policyMode === "planner"
                ? "#14b8a6"
                : "#334155",
          }}
        >
          Modo planner
        </button>

        <button
          onClick={() => onPolicyModeChange("learned")}
          disabled={!canUseLearnedPolicy}
          style={{
            ...buttonStyle,
            cursor: canUseLearnedPolicy
              ? "pointer"
              : "not-allowed",
            background:
              policyMode === "learned"
                ? "#14b8a6"
                : "#334155",
            opacity: canUseLearnedPolicy ? 1 : 0.5,
          }}
        >
          Modo learned
        </button>

        <button
          onClick={onClearRuntimeData}
          style={{
            ...buttonStyle,
            background: "#6b7280",
            gridColumn: "1 / -1",
          }}
        >
          Limpar runtime
        </button>
      </div>
    </div>
  );
}