type AppRouteLoadingProps = {
  /** Variante « accueil » : trois cartes ; « bibliotheque » / « list » : squelettes B'. */
  variant?: "home" | "default" | "bibliotheque" | "list";
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

  if (variant === "bibliotheque") {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4" aria-busy="true" aria-label="Chargement">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="skeleton h-12 w-56 max-w-full rounded-xl" />
          <div className="flex gap-2">
            <div className="skeleton h-11 w-36 rounded-full" />
            <div className="skeleton h-11 w-40 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="skeleton min-h-[120px] rounded-[20px]" />
          <div className="skeleton min-h-[120px] rounded-[20px]" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-11 w-28 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-11 w-full max-w-md rounded-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton min-h-[180px] rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Chargement">
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex gap-2">
            <div className="skeleton h-11 w-16 rounded-lg" />
            <div className="skeleton h-11 w-48 max-w-[60vw] rounded-xl" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-11 w-24 rounded-full" />
            <div className="skeleton h-11 w-24 rounded-full" />
          </div>
        </div>
        <div className="skeleton min-h-[120px] rounded-[20px]" />
        <div className="skeleton h-11 w-full rounded-full" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-11 w-24 rounded-full" />
          ))}
        </div>
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
