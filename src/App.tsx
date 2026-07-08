import { useEffect, useMemo, useState } from "react";

import { llm } from "./ai/llm";
import { parseWebotsFeedbackArtifact } from "./ai/interoperability/feedback";
import { downloadWebotsBridgePackage } from "./ai/interoperability/webots";
import { resolveGrip } from "./ai/motion";
import { perception } from "./ai/perception";
import { planner } from "./ai/planner";
import {
  hasLearnedPolicy,
  inferLearnedPolicy,
  loadPolicyFromColabArtifact,
  policyStatus,
  resetPolicyRuntimeState,
  trainPolicyFromDemonstrations,
} from "./ai/policies";
import {
  downloadColabNotebook,
} from "./ai/training/colab";
import {
  clearDemoEpisodes,
  downloadDemoEpisodes,
  getDemoEpisodes,
  isRecordingDemo,
  attachExecutionFeedbackToEpisodes,
  recordDemoFrame,
  startDemoRecording,
  stopDemoRecording,
} from "./ai/training/demoRecorder";
import {
    attachObjectToHand,
    clearWorldHistory,
    getWorldEventLog,
    getWorldStateHistory,
    getWorldState,
  updateHandProprioception,
    recordWorldSnapshot,
    releaseAllAttachedObjects,
    syncAttachedObjectsWithHand,
    updateObjectState,
} from "./simulation/world";

import Scene from "./components/scene/Scene";
import PlannerPanel from "./components/ui/PlannerPanel";
import useFps from "./hooks/useFps";
import useMotionController from "./hooks/useMotionController";
import type {
  ColabPolicyArtifact,
  Plan,
  PolicyMode,
} from "./types";

export default function App() {
  const [command, setCommand] = useState("Pegue o celular");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [policyMode, setPolicyMode] =
    useState<PolicyMode>("planner");
  const [isRecording, setIsRecording] =
    useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [colabImportStatus, setColabImportStatus] =
    useState("Nenhum artefato Colab importado");
  const [webotsExportStatus, setWebotsExportStatus] =
    useState("Nenhum pacote Webots exportado");
  const [webotsFeedbackStatus, setWebotsFeedbackStatus] =
    useState("Nenhum feedback Webots importado");
  const [webotsFeedbackCount, setWebotsFeedbackCount] =
    useState(0);

  const fps = useFps();

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startedAt) / 1000)
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const parsedCommand = llm.parseCommand(command);
  const detectedObjects = perception.detectObjects();

  const plannerPlan = planner(
    parsedCommand,
    detectedObjects
  );
  const learnedPolicyPlan =
    policyMode === "learned"
      ? inferLearnedPolicy(parsedCommand)
      : null;
  const plan: Plan = learnedPolicyPlan ?? plannerPlan;

  const handPose = useMotionController(plan);
  const grip = resolveGrip(plan, handPose);

  const handProprioception = perception.detectProprioception();

  useEffect(() => {
    const isPickAction =
      plan.action === "pick" && Boolean(plan.target);

    if (isPickAction && plan.target) {
      if (grip <= 0.24) {
        attachObjectToHand(
          plan.target,
          handPose.position
        );
        updateObjectState(plan.target, "grasped");
      }
    } else if (grip >= 0.7) {
      releaseAllAttachedObjects("idle");
    }

    const updatedHandProprioception = updateHandProprioception({
      pose: handPose,
      grip,
      phase:
        plan.action === "pick"
          ? grip <= 0.25
            ? "grasp"
            : grip <= 0.5
              ? "approach"
              : "pre-grasp"
          : plan.action === "home"
            ? "transit"
            : "lift",
    });
    syncAttachedObjectsWithHand(handPose.position);

    recordWorldSnapshot(
      handPose,
      plan.action,
      updatedHandProprioception
    );
  }, [
    plan.action,
    plan.target,
    grip,
    handPose,
  ]);

  useEffect(() => {
    if (!isRecordingDemo()) {
      return;
    }

    recordDemoFrame({
      command,
      plan,
      handPose,
      handProprioception: perception.detectProprioception(),
      objects: getWorldState(),
    });
  }, [command, plan, handPose, handProprioception]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHistoryCount(getWorldStateHistory().length);
      setEventCount(getWorldEventLog().length);
    }, 250);

    return () => clearInterval(timer);
  }, []);

  function handleStartRecording(): void {
    startDemoRecording();
    setIsRecording(true);
  }

  function handleStopRecording(): void {
    stopDemoRecording();
    setIsRecording(false);
    setDemoCount(getDemoEpisodes().length);
  }

  function handleDownloadDemos(): void {
    downloadDemoEpisodes();
  }

  function handleTrainPolicy(): void {
    const episodes = getDemoEpisodes();
    trainPolicyFromDemonstrations(episodes);
  }

  function handleClearRuntimeData(): void {
    clearDemoEpisodes();
    clearWorldHistory();
    setDemoCount(0);
    setHistoryCount(0);
    setEventCount(0);
    setWebotsFeedbackCount(0);
    setWebotsFeedbackStatus("Nenhum feedback Webots importado");
    resetPolicyRuntimeState();
    setPolicyMode("planner");
  }

  function handleExportColab(): void {
    downloadColabNotebook(getDemoEpisodes());
  }

  function handleExportWebots(): void {
    const episodes = getDemoEpisodes();
    const worldHistory = getWorldStateHistory();

    if (episodes.length === 0 && worldHistory.length === 0) {
      setWebotsExportStatus("Sem dados para exportar");
      return;
    }

    downloadWebotsBridgePackage({
      episodes,
      worldHistory,
    });

    setWebotsExportStatus(
      `Pacote exportado: ${episodes.length} episodios, ${worldHistory.length} snapshots`
    );
  }

  async function handleImportWebotsFeedback(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const feedbackEntries = parseWebotsFeedbackArtifact(parsed);

        if (feedbackEntries.length === 0) {
          setWebotsFeedbackStatus("Arquivo sem feedback valido");
          return;
        }

        const attached = attachExecutionFeedbackToEpisodes(
          feedbackEntries
        );

        setWebotsFeedbackStatus(
          `Feedback aplicado em ${attached} frames`
        );
        setWebotsFeedbackCount((prev) => prev + attached);
      } catch {
        setWebotsFeedbackStatus(
          "Falha ao importar feedback Webots"
        );
      }
    };

    input.click();
  }

  function handlePolicyModeChange(
    mode: PolicyMode
  ): void {
    if (mode === "learned" && !hasLearnedPolicy()) {
      return;
    }

    setPolicyMode(mode);
    resetPolicyRuntimeState();
  }

  async function handleImportColabPolicy(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(
          text
        ) as ColabPolicyArtifact;

        const loaded = loadPolicyFromColabArtifact(parsed);

        if (!loaded) {
          setColabImportStatus(
            "Artefato invalido ou vazio"
          );
          return;
        }

        setColabImportStatus(
          `Policy importada: ${parsed.model}`
        );
      } catch {
        setColabImportStatus("Falha ao importar policy Colab");
      }
    };

    input.click();
  }

  const targetObject = useMemo(
    () =>
      detectedObjects.find(
        (object) => object.id === plan.target
      ) ?? null,
    [detectedObjects, plan.target]
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      <Scene
        handPosition={handPose.position}
        grip={grip}
      />

      <PlannerPanel
        command={command}
        setCommand={setCommand}
        plan={plan}
        handPosition={handPose.position}
        handProprioception={handProprioception}
        selectedObject={targetObject?.type ?? "none"}
        selectedObjectState={targetObject?.state ?? "n/a"}
        currentSkill={plan.action}
        elapsedSeconds={elapsedSeconds}
        fps={fps}
        policyConfidence={policyStatus.confidence}
        grip={grip}
        policyName={policyStatus.name}
        policyState={policyStatus.state}
        policyMode={policyMode}
        demoCount={demoCount}
        historyCount={historyCount}
        eventCount={eventCount}
        isRecording={isRecording}
        canUseLearnedPolicy={hasLearnedPolicy()}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onDownloadDemos={handleDownloadDemos}
        onTrainPolicy={handleTrainPolicy}
        onExportColab={handleExportColab}
        onExportWebots={handleExportWebots}
        onImportWebotsFeedback={handleImportWebotsFeedback}
        onImportColabPolicy={handleImportColabPolicy}
        onPolicyModeChange={handlePolicyModeChange}
        onClearRuntimeData={handleClearRuntimeData}
        colabImportStatus={colabImportStatus}
        webotsExportStatus={webotsExportStatus}
        webotsFeedbackStatus={webotsFeedbackStatus}
        webotsFeedbackCount={webotsFeedbackCount}
      />
    </div>
  );
}