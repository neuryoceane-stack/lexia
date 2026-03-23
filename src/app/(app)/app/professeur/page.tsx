import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FileText,
  FolderOpen,
  Users,
  Zap,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { getTeacherDashboardStats } from "@/lib/teacher-dashboard-stats";

const PAGE_BG = "#F8F7FF";
const PRIMARY = "#6C3FC8";
const GOLD = "#F5A623";
const GREEN = "#1D9E75";
const BORDER_TERTIARY = "#E2DCF5";

export default async function ProfesseurAccueilPage() {
  const user = await getUser();
  if (!user?.id) return null;

  const stats = await getTeacherDashboardStats(user.id);
  const prenom = stats.firstName ?? "";
  const deltaSigned =
    stats.topClassBanner && stats.topClassBanner.hasRevisionData
      ? `${stats.topClassBanner.masteryDeltaPct >= 0 ? "+" : ""}${stats.topClassBanner.masteryDeltaPct}%`
      : null;

  return (
    <div
      className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto max-w-[1100px]">
        {/* Titre */}
        <header style={{ marginBottom: 18 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Bonjour{prenom ? ` ${prenom}` : ""} 👋
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--foreground-muted)",
              margin: "6px 0 0",
            }}
          >
            Voici un aperçu de tes classes et de leur activité.
          </p>
        </header>

        {/* Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: 10, marginBottom: 16 }}
        >
          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#F0EDF8",
              }}
            >
              <Users size={14} stroke={PRIMARY} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: PRIMARY,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {stats.activeClassesCount}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              classes actives
            </p>
          </div>

          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#FEF3DC",
              }}
            >
              <Zap size={14} stroke={GOLD} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: GOLD,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {stats.activeStudentsThisWeek}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              élèves actifs / semaine
            </p>
          </div>

          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#EAF4EF",
              }}
            >
              <FileText size={14} stroke={GREEN} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: GREEN,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {stats.assignedListsCount}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              listes assignées
            </p>
          </div>
        </div>

        {/* Bannière classe en hausse */}
        {stats.activeClassesCount > 0 && stats.topClassBanner && (
          <div
            className="flex items-center gap-3"
            style={{
              background: "#F0EDF8",
              border: "0.5px solid #DDD6F5",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
            }}
          >
            <Activity size={16} stroke={PRIMARY} strokeWidth={2} aria-hidden />
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#4B3A9E",
                  margin: "0 0 2px",
                }}
              >
                {stats.topClassBanner.title}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: PRIMARY,
                  margin: 0,
                }}
              >
                {stats.topClassBanner.hasRevisionData ? (
                  <>
                    Moyenne de maîtrise : {stats.topClassBanner.masteryPct}% ·{" "}
                    {deltaSigned} vs semaine dernière
                  </>
                ) : (
                  <>Pas encore assez de révisions cette semaine pour la moyenne.</>
                )}
              </p>
            </div>
            <Link
              href={`/app/professeur/classes/${stats.topClassBanner.classId}`}
              className="shrink-0 no-underline"
              style={{
                background: PRIMARY,
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 14px",
                borderRadius: 16,
                border: "none",
              }}
            >
              Voir la classe
            </Link>
          </div>
        )}

        {/* Section label */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--foreground-muted)",
            margin: "0 0 10px",
          }}
        >
          Vos espaces
        </p>

        {/* Deux cartes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ gap: 12 }}>
          <Link
            href="/app/professeur/classes"
            className="group relative flex flex-col overflow-hidden no-underline transition-transform duration-150 hover:-translate-y-0.5"
            style={{
              background: "#F0EDF8",
              border: "1.5px solid #C4B5F4",
              borderRadius: 14,
              padding: "18px 16px 16px",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                bottom: -20,
                right: -20,
                width: 70,
                height: 70,
                background: PRIMARY,
                opacity: 0.1,
              }}
            />
            <div
              className="relative z-[1] flex flex-1 flex-col"
              style={{ marginBottom: 12 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: PRIMARY,
                  marginBottom: 12,
                }}
              >
                <Users size={20} stroke="white" strokeWidth={2} aria-hidden />
              </div>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--foreground)",
                  margin: "0 0 4px",
                }}
              >
                Mes classes
              </h2>
              <p
                className="flex-1"
                style={{
                  fontSize: 11,
                  color: "var(--foreground-muted)",
                  margin: "0 0 14px",
                  lineHeight: 1.45,
                }}
              >
                Gérez vos classes, suivez la progression de vos élèves et assignez
                des listes.
              </p>
            </div>
            <div
              className="relative z-[1] flex items-center justify-between"
              style={{ marginTop: "auto" }}
            >
              <span
                className="inline-flex items-center gap-1.5"
                style={{
                  background: PRIMARY,
                  color: "white",
                  borderRadius: 20,
                  border: "none",
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <ArrowRight size={11} stroke="white" strokeWidth={2} aria-hidden />
                Voir mes classes
              </span>
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  background: "#DDD6F5",
                  borderRadius: "50%",
                }}
              >
                <Users size={12} stroke={PRIMARY} strokeWidth={2} aria-hidden />
              </span>
            </div>
          </Link>

          <Link
            href="/app/familles"
            className="group relative flex flex-col overflow-hidden no-underline transition-transform duration-150 hover:-translate-y-0.5"
            style={{
              background: "#FEF8EC",
              border: "1.5px solid #F5D08A",
              borderRadius: 14,
              padding: "18px 16px 16px",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                bottom: -20,
                right: -20,
                width: 70,
                height: 70,
                background: GOLD,
                opacity: 0.1,
              }}
            />
            <div
              className="relative z-[1] flex flex-1 flex-col"
              style={{ marginBottom: 12 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: GOLD,
                  marginBottom: 12,
                }}
              >
                <FolderOpen size={20} stroke="white" strokeWidth={2} aria-hidden />
              </div>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--foreground)",
                  margin: "0 0 4px",
                }}
              >
                Ma bibliothèque
              </h2>
              <p
                className="flex-1"
                style={{
                  fontSize: 11,
                  color: "var(--foreground-muted)",
                  margin: "0 0 14px",
                  lineHeight: 1.45,
                }}
              >
                Créez et importez vos listes de vocabulaire. Assignez-les à vos
                classes.
              </p>
            </div>
            <div
              className="relative z-[1] flex items-center justify-between"
              style={{ marginTop: "auto" }}
            >
              <span
                className="inline-flex items-center gap-1.5"
                style={{
                  background: GOLD,
                  color: "white",
                  borderRadius: 20,
                  border: "none",
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <ArrowRight size={11} stroke="white" strokeWidth={2} aria-hidden />
                Mes listes
              </span>
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  background: "#FAE5B0",
                  borderRadius: "50%",
                }}
              >
                <FolderOpen size={12} stroke={GOLD} strokeWidth={2} aria-hidden />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
