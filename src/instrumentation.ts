import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  try {
    const { recordServerErrorFromInstrumentation } = await import("@/lib/server-error-log");
    await recordServerErrorFromInstrumentation(err, request, context);
  } catch {
    // Ne jamais faire échouer la requête à cause du journal d'erreurs.
  }
};
