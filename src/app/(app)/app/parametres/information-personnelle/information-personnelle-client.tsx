"use client";

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { PhoneInput } from "@/components/phone-input";
import {
  Pencil,
  Save,
  Sprout,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building2,
  Lock,
  Gift,
  Copy,
  Check,
  Users,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";

const LEVEL_NAMES: Record<number, string> = {
  1: "Graine",
  2: "Pousse",
  3: "Explorateur",
  4: "Apprenti",
  5: "Maître",
};
function getLevelName(l: number) {
  return l >= 6 ? "Légende" : LEVEL_NAMES[l] ?? "Graine";
}

function getRoleLabel(role: "etudiant" | "professeur" | "" | null): string {
  if (role === "professeur") return "Enseignant";
  if (role === "etudiant") return "Étudiant";
  return "—";
}

function capitalizeDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatDateDisplay(value: string): string {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type ProfileForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  phone: string;
  institutionName: string;
};

export type InitialProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: "etudiant" | "professeur" | null;
  institutionName: string;
  city: string;
  dateOfBirth: string;
  phone: string;
  referralCode?: string;
  referralCount?: number;
};

const cardStyle: CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--line)",
  borderRadius: 20,
  padding: 20,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--muted)",
  marginBottom: 6,
  lineHeight: 1.3,
};

const inputClass =
  "w-full min-w-0 border-0 bg-transparent p-0 text-[15px] leading-normal text-ink outline-none placeholder:text-muted";

export function InformationPersonnelleClient({
  initialData,
}: {
  initialData?: InitialProfileData;
}) {
  const router = useRouter();

  const [form, setForm] = useState<ProfileForm>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    dateOfBirth: initialData?.dateOfBirth ?? "",
    city: initialData?.city ?? "",
    phone: initialData?.phone ?? "",
    institutionName: initialData?.institutionName ?? "",
  });
  const [formSnapshot, setFormSnapshot] = useState<ProfileForm | null>(null);
  const [role, setRole] = useState<"etudiant" | "professeur" | "">(initialData?.role ?? "");
  const [email, setEmail] = useState<string | null>(initialData?.email ?? null);
  const [loaded, setLoaded] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [editing, setEditing] = useState(false);
  const [userLevel, setUserLevel] = useState(1);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");

  const [referralCode, setReferralCode] = useState<string | null>(initialData?.referralCode ?? null);
  const [referralCount, setReferralCount] = useState(initialData?.referralCount ?? 0);
  const [referralLoading, setReferralLoading] = useState(!initialData?.referralCode);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialData?.referralCode) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        if (typeof d.referralCode === "string") setReferralCode(d.referralCode);
        if (typeof d.referralCount === "number") setReferralCount(d.referralCount);
      })
      .finally(() => setReferralLoading(false));
  }, [initialData?.referralCode]);

  useEffect(() => {
    if (initialData) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setForm({
          firstName: d.firstName ?? "",
          lastName: d.lastName ?? "",
          dateOfBirth: d.dateOfBirth ?? "",
          city: d.city ?? "",
          phone: d.phone ?? "",
          institutionName: d.institutionName ?? "",
        });
        setRole(d.role ?? "");
        setEmail(d.email ?? null);
        if (typeof d.referralCode === "string") setReferralCode(d.referralCode);
        if (typeof d.referralCount === "number") setReferralCount(d.referralCount);
        setReferralLoading(false);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [initialData]);

  useEffect(() => {
    fetch("/api/synthese?period=all")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const entries = Object.values(d.sessionsByDay ?? {}) as Array<{ count?: number }>;
        const sessions = entries.reduce((a, x) => a + (x.count ?? 0), 0);
        const xp = (d.wordsRetained ?? 0) * 5 + sessions * 20 + (d.wordsWritten ?? 0) * 3;
        setUserLevel(Math.max(1, Math.min(6, Math.floor(xp / 1000) + 1)));
      })
      .catch(() => {});
  }, []);

  const update = (updates: Partial<ProfileForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setMessage(null);
  };

  const startEditing = () => {
    setFormSnapshot({ ...form });
    setEditing(true);
    setMessage(null);
  };

  const cancelEditing = () => {
    if (formSnapshot) setForm(formSnapshot);
    setFormSnapshot(null);
    setEditing(false);
    setMessage(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      dateOfBirth: form.dateOfBirth.trim() || null,
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      institutionName: form.institutionName.trim() || null,
    };
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (r.ok) {
          setMessage("saved");
          setEditing(false);
          setFormSnapshot(null);
        } else setMessage("error");
      })
      .catch(() => setMessage("error"))
      .finally(() => setSaving(false));
  };

  const initial = form.firstName ? form.firstName.trim()[0]?.toUpperCase() ?? "?" : "?";
  const displayName = [capitalizeDisplayName(form.firstName), form.lastName.trim()]
    .filter(Boolean)
    .join(" ");

  async function copyReferralCode(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1500);
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="m-0 text-[46px] leading-[1.05] tracking-[-0.02em] text-ink">
          Ton <span className="home-mark">profil</span>
        </h1>
      </header>

      {!loaded ? (
        <p className="m-0 text-sm text-muted">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <section
            className="order-1 flex flex-col items-center px-6 py-9 text-center lg:col-start-1 lg:row-start-1"
            style={{ background: "var(--ink)", borderRadius: 20 }}
          >
            <div
              className="flex items-center justify-center"
              aria-hidden
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                border: "3px solid var(--mark)",
                color: "var(--surface)",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 40,
                lineHeight: 1,
              }}
            >
              {initial}
            </div>
            <p
              className="m-0 mt-5 max-w-full break-words text-surface"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 28,
                lineHeight: 1.15,
              }}
            >
              {displayName || "—"}
            </p>
            <p
              className="m-0 mt-1 max-w-full truncate text-[15px]"
              title={email ?? undefined}
              style={{ color: "color-mix(in srgb, var(--surface) 82%, var(--ink))" }}
            >
              {email ?? "—"}
            </p>
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
              style={{ background: "var(--mark)", color: "var(--ink)" }}
            >
              <Sprout size={14} strokeWidth={1.75} color="var(--ink)" aria-hidden />
              Niveau {userLevel} — {getLevelName(userLevel)}
            </span>
          </section>

          <form onSubmit={submit} className="contents">
            <section
              className="order-2 min-w-0 lg:col-start-2 lg:row-start-1"
              style={cardStyle}
              aria-labelledby="profil-infos-titre"
            >
              <h2 id="profil-infos-titre" className="m-0 mb-4 text-xl text-ink">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label="Prénom" icon={User}>
                  {editing ? (
                    <input
                      id="profil-prenom"
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update({ firstName: e.target.value })}
                      className={inputClass}
                      autoComplete="given-name"
                      aria-label="Prénom"
                    />
                  ) : (
                    <Readout value={form.firstName} />
                  )}
                </ProfileField>
                <ProfileField label="Nom" icon={User}>
                  {editing ? (
                    <input
                      id="profil-nom"
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update({ lastName: e.target.value })}
                      className={inputClass}
                      autoComplete="family-name"
                      aria-label="Nom"
                    />
                  ) : (
                    <Readout value={form.lastName} />
                  )}
                </ProfileField>
                <ProfileField label="Date de naissance" icon={Calendar}>
                  {editing ? (
                    <input
                      id="profil-naissance"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => update({ dateOfBirth: e.target.value })}
                      className={inputClass}
                      autoComplete="bday"
                      aria-label="Date de naissance"
                      style={{ colorScheme: "light" }}
                    />
                  ) : (
                    <Readout value={formatDateDisplay(form.dateOfBirth)} />
                  )}
                </ProfileField>
                <ProfileField label="Ville" icon={MapPin}>
                  {editing ? (
                    <div className="relative min-w-0 flex-1">
                      <CityAutocomplete
                        id="profil-ville"
                        value={form.city}
                        onChange={(v) => update({ city: v })}
                        placeholder="Ta ville"
                        disabled={saving}
                        aria-label="Ville"
                        className={inputClass}
                      />
                    </div>
                  ) : (
                    <Readout value={form.city} placeholder="Ajoute ta ville" />
                  )}
                </ProfileField>
                <ProfileField label="Téléphone" icon={Phone}>
                  {editing ? (
                    <PhoneInput
                      id="profil-telephone"
                      value={form.phone}
                      onChange={(v) => update({ phone: v })}
                      placeholder="6 12 34 56 78"
                      disabled={saving}
                      aria-label="Téléphone"
                      className="profile-phone min-w-0 flex-1"
                      prefixClassName="flex min-h-11 min-w-[4.25rem] items-center justify-between gap-1 border-0 bg-transparent px-0 text-[15px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
                      inputClassName="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-[15px] text-ink outline-none placeholder:text-muted"
                    />
                  ) : (
                    <Readout value={form.phone} placeholder="Ajoute un numéro" />
                  )}
                </ProfileField>
              </div>
            </section>

            <section
              className="order-3 min-w-0 lg:col-start-2 lg:row-start-2"
              style={cardStyle}
              aria-labelledby="profil-compte-titre"
            >
              <h2 id="profil-compte-titre" className="m-0 mb-4 text-xl text-ink">
                Compte
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <ProfileField label="Email" icon={Mail} locked>
                    <Readout value={email ?? "—"} />
                  </ProfileField>
                  <p className="m-0 mt-1.5 text-xs leading-snug text-muted">
                    L&apos;adresse mail ne peut pas être modifiée ici.
                  </p>
                </div>
                <div>
                  <ProfileField label="Statut" icon={User} locked>
                    <Readout value={getRoleLabel(role)} />
                  </ProfileField>
                  <p className="m-0 mt-1.5 text-xs leading-snug text-muted">
                    Le statut ne peut pas être modifié.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <ProfileField label="Établissement" icon={Building2}>
                    {editing ? (
                      <input
                        id="profil-etablissement"
                        type="text"
                        value={form.institutionName}
                        onChange={(e) => update({ institutionName: e.target.value })}
                        placeholder="École, entreprise…"
                        className={inputClass}
                        autoComplete="organization"
                        aria-label="Établissement"
                      />
                    ) : (
                      <Readout value={form.institutionName} placeholder="École, entreprise…" />
                    )}
                  </ProfileField>
                </div>
              </div>

              {message === "saved" ? (
                <p
                  role="status"
                  className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                  style={{ background: "var(--just-bg)", color: "var(--just-text)" }}
                >
                  <Check size={16} color="var(--just-sign)" aria-hidden />
                  Informations mises à jour !
                </p>
              ) : null}
              {message === "error" ? (
                <p
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                  style={{ background: "var(--false-bg)", color: "var(--false-text)" }}
                >
                  <CircleAlert size={16} color="var(--false-sign)" aria-hidden />
                  Erreur lors de l&apos;enregistrement.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                {!editing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface outline-none hover:bg-ink-hover focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                  >
                    <Pencil size={16} color="var(--surface)" aria-hidden />
                    Modifier mes informations
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface px-5 text-sm font-medium text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface outline-none hover:bg-ink-hover focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={16} color="var(--surface)" aria-hidden />
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </>
                )}
              </div>
            </section>
          </form>

          <ReferralSection
            referralCode={referralCode}
            referralCount={referralCount}
            referralLoading={referralLoading}
            copiedCode={copiedCode}
            onCopyCode={() => referralCode && void copyReferralCode(referralCode)}
          />

          <section
            className="order-5 lg:col-start-2 lg:row-start-3"
            style={{
              background: "var(--false-bg)",
              border: "1.5px solid color-mix(in srgb, var(--false-sign) 35%, var(--false-bg))",
              borderRadius: 20,
              padding: 20,
            }}
            aria-labelledby="profil-danger-titre"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="profil-danger-titre" className="m-0 text-xl" style={{ color: "var(--false-text)" }}>
                  Zone dangereuse
                </h2>
                <p className="m-0 mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: "var(--false-text)" }}>
                  La suppression de ton compte est définitive. Toutes tes listes, progressions et données
                  seront perdues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmEmail("");
                  setDeleteStatus("idle");
                  setDeleteError("");
                  setDeleteModalOpen(true);
                }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-false-sign bg-surface px-5 text-sm font-medium text-false-text outline-none focus-visible:ring-2 focus-visible:ring-false-sign focus-visible:ring-offset-2"
              >
                Supprimer mon compte
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "color-mix(in srgb, var(--ink) 45%, transparent)" }}
          onClick={() => deleteStatus !== "loading" && setDeleteModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supprimer-compte-titre"
            className="w-full max-w-md"
            style={{
              borderRadius: 20,
              background: "var(--surface)",
              border: "1.5px solid var(--line)",
              boxShadow: "var(--shadow-elevated)",
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="supprimer-compte-titre" className="m-0 text-xl text-ink">
              Supprimer mon compte
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-muted">
              Cette action est irréversible. Toutes tes données seront définitivement supprimées :
              listes, mots, révisions, progression.
            </p>
            <label className="block">
              <span style={labelStyle}>Pour confirmer, saisis ton adresse email</span>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={email ?? ""}
                className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ink"
                style={{
                  height: 50,
                  borderRadius: 14,
                  border: "1.5px solid var(--false-sign)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontSize: 15,
                  padding: "0 14px",
                }}
              />
            </label>
            {deleteStatus === "error" && deleteError ? (
              <p
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--false-bg)", color: "var(--false-text)" }}
              >
                <CircleAlert size={16} color="var(--false-sign)" aria-hidden />
                {deleteError}
              </p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleteStatus === "loading"}
                onClick={() => setDeleteModalOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border-[1.5px] border-line bg-surface text-sm font-medium text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  deleteStatus === "loading" ||
                  !email ||
                  deleteConfirmEmail.trim().toLowerCase() !== email.toLowerCase()
                }
                onClick={async () => {
                  setDeleteStatus("loading");
                  setDeleteError("");
                  try {
                    const res = await fetch("/api/user/delete", { method: "DELETE" });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                      router.push("/?deleted=true");
                    } else {
                      setDeleteError(data.error || "Erreur lors de la suppression.");
                      setDeleteStatus("error");
                    }
                  } catch {
                    setDeleteError("Erreur réseau, réessaie.");
                    setDeleteStatus("error");
                  }
                }}
                className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-full border-0 bg-false-sign text-sm font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-false-sign focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteStatus === "loading" ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileField({
  label,
  icon: Icon,
  locked,
  children,
}: {
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span style={labelStyle}>{label}</span>
      <div
        className="flex items-center gap-2.5 px-3.5 focus-within:ring-2 focus-within:ring-ink"
        style={{
          minHeight: 50,
          borderRadius: 14,
          border: "1.5px solid var(--line)",
          background: locked ? "var(--page)" : "var(--surface)",
        }}
      >
        <Icon size={18} strokeWidth={1.75} color="var(--muted)" aria-hidden className="shrink-0" />
        <div className="min-w-0 flex-1">{children}</div>
        {locked ? <Lock size={16} strokeWidth={1.75} color="var(--muted)" aria-hidden className="shrink-0" /> : null}
      </div>
    </label>
  );
}

function Readout({ value, placeholder }: { value?: string | null; placeholder?: string }) {
  const empty = !value?.trim();
  return (
    <span className="block truncate text-[15px]" style={{ color: empty ? "var(--muted)" : "var(--ink)" }}>
      {empty ? placeholder ?? "—" : value}
    </span>
  );
}

function ReferralSection({
  referralCode,
  referralCount,
  referralLoading,
  copiedCode,
  onCopyCode,
}: {
  referralCode: string | null;
  referralCount: number;
  referralLoading: boolean;
  copiedCode: boolean;
  onCopyCode: () => void;
}) {
  const friendWord = referralCount >= 2 ? "amis" : "ami";

  return (
    <section
      className="order-4 min-w-0 lg:col-start-1 lg:row-start-2"
      style={cardStyle}
      aria-labelledby="profil-parrainage-titre"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface">
          <Gift size={16} strokeWidth={1.75} color="var(--ink)" aria-hidden />
        </span>
        <div>
          <h2 id="profil-parrainage-titre" className="m-0 text-xl text-ink">
            Parrainage
          </h2>
          <p className="m-0 mt-1 text-sm text-muted">Partage ton code avec tes amis.</p>
        </div>
      </div>

      {referralLoading ? (
        <p className="m-0 text-sm text-muted">…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex min-h-11 items-center px-4"
              style={{ border: "1.5px dashed var(--ink)", borderRadius: 14 }}
            >
              <span
                className="whitespace-nowrap text-ink"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                }}
              >
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopyCode}
              disabled={!referralCode}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: copiedCode ? "var(--just-bg)" : "var(--ink)",
                color: copiedCode ? "var(--just-text)" : "var(--surface)",
              }}
            >
              {copiedCode ? (
                <>
                  <Check size={16} color="var(--just-sign)" aria-hidden />
                  Copié
                </>
              ) : (
                <>
                  <Copy size={16} color="var(--surface)" aria-hidden />
                  Copier
                </>
              )}
            </button>
          </div>
          <p className="m-0 flex items-center gap-2 text-sm text-ink">
            <Users size={16} color="var(--muted)" aria-hidden />
            <span>
              Tu as parrainé{" "}
              <span
                className="inline-flex min-w-6 items-center justify-center rounded-full px-1.5"
                style={{ background: "var(--mark)", color: "var(--ink)", fontWeight: 500 }}
              >
                {referralCount}
              </span>{" "}
              {friendWord}
            </span>
          </p>
          <p className="m-0 text-[13px] leading-snug text-muted">
            Bientôt : des avantages à débloquer en parrainant.
          </p>
        </div>
      )}
    </section>
  );
}
