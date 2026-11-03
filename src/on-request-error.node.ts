import "server-only";

import { recordServerErrorFromInstrumentation } from "@/lib/server-error-log";

export async function handleOnRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: {
    routeType: "render" | "route" | "action" | "proxy";
    routePath: string;
  },
): Promise<void> {
  await recordServerErrorFromInstrumentation(err, request, context);
}
