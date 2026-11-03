type AppRouteLoadingProps = {
  /** Variante « accueil » : trois cartes ; « default » : bloc unique. */
  variant?: "home" | "default" | "list";
};

/** Squelette instantané pendant la navigation (charte B', sans changement de page). */
export function AppRouteLoading({ variant = "default" }: AppRouteLoadingProps) {
  if (variant === "home") {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4" aria-busy="true" aria-label="Chargement">
        <div className="skeleton h-14 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton min-h-[220px] rounded-[20px]" />
          ))}
        </div>
        <div className="skeleton h-32 rounded-[20px]" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Chargement">
        <div className="skeleton h-4 w-40 rounded-lg" />
        <div className="skeleton h-10 w-2/3 max-w-md rounded-xl" />
        <div className="skeleton min-h-[280px] rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-12 w-64 max-w-full rounded-xl" />
      <div className="skeleton min-h-[240px] rounded-[20px]" />
    </div>
  );
}
