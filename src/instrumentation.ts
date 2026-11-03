import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  try {
    const { handleOnRequestError } = await import("./on-request-error.node");
    await handleOnRequestError(err, request, context);
  } catch {
    // Ne jamais faire échouer la requête à cause du journal d'erreurs.
  }
};
