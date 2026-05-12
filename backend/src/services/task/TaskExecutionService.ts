/**
 * Single entry for provider execution (BullMQ worker). Routes must not call providers directly.
 */
export { executeStudioTask } from "../../providers/studioExecutor.js";
