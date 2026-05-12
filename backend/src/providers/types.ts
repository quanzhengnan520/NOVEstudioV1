export type StudioTaskType = "chat" | "prompt" | "image" | "video";

export type StudioTaskRow = {
  id: string;
  user_id: string;
  task_type: StudioTaskType;
  status: string;
  payload: Record<string, unknown>;
  credits_amount: number;
};

export type ProviderResult = Record<string, unknown>;
