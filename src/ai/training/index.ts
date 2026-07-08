export interface TrainingModule {
  name: string;
  status: "pending" | "ready";
}

export const TRAINING_MODULES: TrainingModule[] = [
  { name: "LeRobot", status: "pending" },
  { name: "SmolVLA", status: "pending" },
  { name: "ACT", status: "pending" },
  { name: "Datasets", status: "pending" },
  { name: "Policies", status: "pending" },
  { name: "Evaluation", status: "pending" },
];

export {
  clearDemoEpisodes,
  downloadDemoEpisodes,
  getDemoEpisodes,
  isRecordingDemo,
  recordDemoFrame,
  startDemoRecording,
  stopDemoRecording,
} from "./demoRecorder";

export { downloadColabNotebook } from "./colab";
