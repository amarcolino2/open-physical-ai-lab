import type { LLM, Plan } from "../../types";

class MockLLM implements LLM {
  parseCommand(command: string): string {
    return command.trim().toLowerCase();
  }

  reason(prompt: string): string {
    if (!prompt) {
      return "No command provided";
    }

    return `Interpreting command: ${prompt}`;
  }

  plan(command: string): Plan {
    return {
      action: "none",
      target: null,
      priority: 0,
      confidence: 0,
      reasoning: this.reason(command),
      rawCommand: command,
    };
  }
}

export const llm: LLM = new MockLLM();
