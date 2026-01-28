import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import { payoutBatchJob, processPayout } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [payoutBatchJob, processPayout],
});
