export type FeedbackDeviceClass = "mobile" | "tablette" | "ordinateur";

const NANOID_SEGMENT = /^[A-Za-z0-9_-]{16,}$/;
const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_ID_SEGMENT = /^\d{5,}$/;

/** Segments dynamiques (id, nanoid, uuid…) retirés du chemin enregistré. */
export function sanitizeFeedbackPagePath(pathname: string): string {
  const raw = pathname.trim();
  if (!raw || raw === "/") return "/";

  const segments = raw.split("/").filter(Boolean);
  const safe = segments.filter(
    (segment) =>
      !NANOID_SEGMENT.test(segment) &&
      !UUID_SEGMENT.test(segment) &&
      !NUMERIC_ID_SEGMENT.test(segment),
  );

  return safe.length === 0 ? "/" : `/${safe.join("/")}`;
}

export function detectFeedbackDeviceClass(
  viewportWidth: number,
  userAgent: string,
  maxTouchPoints = 0,
): FeedbackDeviceClass {
  const ua = userAgent.toLowerCase();
  const tabletUa =
    /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent) ||
    (ua.includes("macintosh") && maxTouchPoints > 1);

  if (tabletUa) return "tablette";
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablette";
  return "ordinateur";
}

/** Nom du navigateur et version majeure, sans envoyer le user-agent complet. */
export function detectFeedbackBrowser(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) return "Inconnu";

  const rules: { name: string; pattern: RegExp }[] = [
    { name: "Edge", pattern: /Edg\/(\d+)/ },
    { name: "Opera", pattern: /OPR\/(\d+)/ },
    { name: "Chrome", pattern: /Chrome\/(\d+)/ },
    { name: "Firefox", pattern: /Firefox\/(\d+)/ },
    { name: "Safari", pattern: /Version\/(\d+).*Safari/ },
  ];

  for (const rule of rules) {
    const match = ua.match(rule.pattern);
    if (match?.[1]) return `${rule.name} ${match[1]}`;
  }

  if (/Safari\//.test(ua) && /Mobile\//.test(ua)) {
    const ios = ua.match(/OS (\d+)[_.]/);
    return ios?.[1] ? `Safari iOS ${ios[1]}` : "Safari iOS";
  }

  return "Inconnu";
}

export function collectFeedbackClientContext(pathname: string): {
  page: string;
  device: FeedbackDeviceClass;
  browser: string;
} {
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const maxTouchPoints =
    typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) : 0;
  return {
    page: sanitizeFeedbackPagePath(pathname),
    device: detectFeedbackDeviceClass(width, ua, maxTouchPoints),
    browser: detectFeedbackBrowser(ua),
  };
}
