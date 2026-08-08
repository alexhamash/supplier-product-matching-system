import { schedule, type ScheduledTask } from "node-cron";
import { prisma } from "../lib/prisma";
import { ingestSupplierFeed } from "./ingestionService";

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * Cron schedule for the automated sync job.
 *
 * Default: every 6 hours at minute 0 (e.g. 00:00, 06:00, 12:00, 18:00).
 * Override via the `SYNC_CRON_SCHEDULE` environment variable.
 */
const DEFAULT_SYNC_SCHEDULE = "0 */6 * * *";

const getSchedule = (): string =>
  process.env.SYNC_CRON_SCHEDULE || DEFAULT_SYNC_SCHEDULE;

// ─── Job Implementation ─────────────────────────────────────────────────────

export type SyncJobSummary = {
  startedAt: string;
  finishedAt: string;
  suppliersFound: number;
  succeeded: number;
  failed: number;
  failures: Array<{
    supplierId: string;
    supplierName: string;
    error: string;
  }>;
};

/**
 * Run the ingestion pipeline for every supplier with `autoSync = true`.
 *
 * Suppliers are processed sequentially so that a single failing feed does not
 * break the rest of the job. Each failure is captured and logged individually.
 */
export const runAutoSync = async (): Promise<SyncJobSummary> => {
  const startedAt = new Date();

  const suppliers = await prisma.supplier.findMany({
    where: { autoSync: true },
    select: { id: true, name: true },
  });

  const failures: SyncJobSummary["failures"] = [];
  let succeeded = 0;

  for (const supplier of suppliers) {
    try {
      const result = await ingestSupplierFeed(supplier.id);
      succeeded++;
      console.log(
        `[cron] Sync OK for supplier '${supplier.name}': ` +
          `created=${result.created}, updated=${result.updated}, ` +
          `outOfStock=${result.markedOutOfStock}, totalRows=${result.totalRows}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        error: message,
      });
      console.error(
        `[cron] Sync FAILED for supplier '${supplier.name}' (${supplier.id}): ${message}`,
      );
    }
  }

  const finishedAt = new Date();

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    suppliersFound: suppliers.length,
    succeeded,
    failed: failures.length,
    failures,
  };
};

// ─── Scheduler Lifecycle ────────────────────────────────────────────────────

let scheduledTask: ScheduledTask | null = null;

/**
 * Start the periodic cron job.
 *
 * Safe to call multiple times — if a job is already running it will be
 * restarted with the (possibly updated) schedule.
 */
export const startCronService = (): void => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const cronSchedule = getSchedule();
  scheduledTask = schedule(cronSchedule, async () => {
    console.log(`[cron] Starting automated sync job (schedule: ${cronSchedule})`);
    try {
      const summary = await runAutoSync();
      console.log(
        `[cron] Sync job finished: found=${summary.suppliersFound}, ` +
          `succeeded=${summary.succeeded}, failed=${summary.failed}`,
      );
    } catch (err) {
      console.error(
        `[cron] Sync job crashed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  console.log(`[cron] Scheduled automated sync job with cron: "${cronSchedule}"`);
};

/**
 * Stop the periodic cron job if it is running.
 */
export const stopCronService = (): void => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[cron] Automated sync job stopped.");
  }
};
