import type { StudioTaskRow } from "./types.js";

/** Normalized result from an external generation provider (submit path). */
export type ProviderTaskResult = Record<string, unknown> & {
  provider?: string;
  polling?: boolean;
  vendorTaskId?: string;
};

export type ProviderPollResult = {
  status: "running" | "succeeded" | "failed" | "unknown";
  videoUrl?: string;
  errorMessage?: string;
};

/**
 * NOVE Studio provider contract — implementations must not debit credits (billing is TaskBillingService).
 */
export interface StudioProvider {
  submit(task: StudioTaskRow): Promise<ProviderTaskResult>;
  poll?(): Promise<ProviderPollResult>;
  cancel?(): Promise<void>;
}
