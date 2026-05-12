/**
 * R9 — canonical provider surface for studio execution.
 * Implementations live next to each vendor; `studioExecutor` routes work here.
 * Providers must not mutate credits (billing stays in TaskBillingService / creditsFreeze).
 */

export type ProviderTaskResult = Record<string, unknown> & {
  /** When true, worker defers completion until remote polling finishes. */
  polling?: boolean;
  vendorTaskId?: string;
};

export type ProviderPollResult = {
  done: boolean;
  result?: Record<string, unknown>;
};

export interface StudioProvider {
  submit(): Promise<ProviderTaskResult>;
  poll?(): Promise<ProviderPollResult>;
  cancel?(): Promise<void>;
}
