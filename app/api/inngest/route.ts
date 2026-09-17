import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import { payoutBatchJob, processPayout, fulfillCjOrder, cjTrackingSync, cjInventorySync } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [payoutBatchJob, processPayout, fulfillCjOrder, cjTrackingSync, cjInventorySync],
});
