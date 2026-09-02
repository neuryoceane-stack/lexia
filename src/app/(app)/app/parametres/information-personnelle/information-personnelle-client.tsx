"use client";

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { PhoneInput } from "@/components/phone-input";
import {
  ChevronLeft,
  Pencil,
  Save,
  Star,
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

const PROFILE_HONEYCOMB = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='0.65'%3E%3Cpath d='M14 4 L28 4 L35 12 L28 20 L14 20 L7 12 Z'/%3E%3Cpath d='M28 20 L42 20 L49 28 L42 36 L28 36 L21 28 Z'/%3E%3C/g%3E%3C/svg%3E")`;

const PANEL_SHADOW =
  "0 4px 24px rgba(108,63,200,.12), 0 1px 3px rgba(108,63,200,.08)";

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
  const [role, setRole] = useState<"etudiant" | "professeur" | "">(
    initialData?.role ?? ""
  );
  const [email, setEmail] = useState<string | null>(initialData?.email ?? null);
  const [loaded, setLoaded] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [editing, setEditing] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [primaryHover, setPrimaryHover] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");

  const [referralCode, setReferralCode] = useState<string | null>(
    initialData?.referralCode ?? null
  );
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

  const editInputClass =
    "w-full text-[13px] text-[#1A1A1A] placeholder:text-[#6B6478] outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-0";

  return (
    <div className="mx-auto max-w-lg" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <button
        type="button"
        onClick={() => router.push("/app/parametres")}
        className="mb-5 flex items-center gap-1 transition hover:opacity-70"
        style={{
          fontSize: 12,
          color: "#6B6478",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={14} stroke="#6B6478" />
        Retour
      </button>

      {/* En-tête identité */}
      <div
        className="relative mb-5 overflow-hidden"
        style={{
          borderRadius: 18,
          padding: "20px 18px",
          boxShadow: PANEL_SHADOW,
          background:
            "linear-gradient(150deg, #7B4AD4 0%, #6C3FC8 55%, #5A32A8 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            zIndex: 0,
            background:
              "radial-gradient(circle at 100% 120%, rgba(245,166,35,.20), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            zIndex: 1,
            opacity: 0.06,
            backgroundImage: PROFILE_HONEYCOMB,
            backgroundSize: "56px 48px",
            backgroundPosition: "14px 10px",
          }}
        />
        <div className="relative z-[2] flex items-center gap-4">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,.18)",
              color: "white",
              fontSize: 28,
              fontWeight: 600,
              boxShadow:
                "0 0 0 2px rgba(245,166,35,.85), inset 0 0 0 1px rgba(255,255,255,.35)",
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate"
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "white",
                letterSpacing: "-0.01em",
                marginBottom: 3,
              }}
            >
              {displayName || "—"}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 12.5, color: "rgba(255,255,255,.75)", marginBottom: 10 }}
            >
              {email ?? "—"}
            </p>
            <span
              className="inline-flex items-center gap-1"
              style={{
                background: "rgba(255,255,255,.16)",
                color: "white",
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
              }}
            >
              <Star size={11} stroke="#F7B733" fill="#F7B733" aria-hidden />
              Niveau {userLevel} — {getLevelName(userLevel)}
            </span>
          </div>
        </div>
      </div>

      {!loaded ? (
        <p style={{ fontSize: 13, color: "#6B6478" }}>Chargement…</p>
      ) : (
        <form onSubmit={submit}>
          <SectionCard title="Informations personnelles">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <FieldBlock label="Prénom">
                <FieldValueRow icon={User}>
                  {editing ? (
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update({ firstName: e.target.value })}
                      className={editInputClass}
                      style={fieldStyle(true)}
                      autoComplete="given-name"
                    />
                  ) : (
                    <ReadValue value={form.firstName} />
                  )}
                </FieldValueRow>
              </FieldBlock>
              <FieldBlock label="Nom">
                <FieldValueRow icon={User}>
                  {editing ? (
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update({ lastName: e.target.value })}
                      className={editInputClass}
                      style={fieldStyle(true)}
                      autoComplete="family-name"
                    />
                  ) : (
                    <ReadValue value={form.lastName} />
                  )}
                </FieldValueRow>
              </FieldBlock>
            </div>

            <FieldBlock label="Date de naissance" className="mb-3">
              <FieldValueRow icon={Calendar}>
                {editing ? (
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update({ dateOfBirth: e.target.value })}
                    className={editInputClass}
                    style={fieldStyle(true)}
                    autoComplete="bday"
                  />
                ) : (
                  <ReadValue value={formatDateDisplay(form.dateOfBirth) || undefined} />
                )}
              </FieldValueRow>
            </FieldBlock>

            <FieldBlock label="Ville" className="mb-3">
              <FieldValueRow icon={MapPin}>
                {editing ? (
                  <CityAutocomplete
                    value={form.city}
                    onChange={(v) => update({ city: v })}
                    placeholder="Ta ville"
                    disabled={saving}
                    className={`${editInputClass} !rounded-[10px] !border !border-[rgba(108,63,200,.25)] !bg-white !px-3 !py-[9px]`}
                  />
                ) : (
                  <ReadValue value={form.city} placeholder="Ajoutez votre ville" />
                )}
              </FieldValueRow>
            </FieldBlock>

            <FieldBlock label="Téléphone">
              <FieldValueRow icon={Phone}>
                {editing ? (
                  <PhoneInput
                    value={form.phone}
                    onChange={(v) => update({ phone: v })}
                    placeholder="6 12 34 56 78"
                    disabled={saving}
                    className="w-full min-w-0 flex-1"
                    inputClassName="!rounded-r-[10px] !border !border-[rgba(108,63,200,.25)] !border-l-0 !bg-white !text-[13px] !py-[9px] focus-visible:!ring-2 focus-visible:!ring-[#6C3FC8]"
                  />
                ) : (
                  <ReadValue value={form.phone} placeholder="Ajoutez un numéro" />
                )}
              </FieldValueRow>
            </FieldBlock>
          </SectionCard>

          <SectionCard title="Compte">
            <FieldBlock label="Email" className="mb-3">
              <FieldValueRow icon={Mail}>
                <LockedField value={email ?? "—"} />
              </FieldValueRow>
              <p style={{ fontSize: 11, color: "#6B6478", marginTop: 4, paddingLeft: 38 }}>
                L&apos;adresse mail ne peut pas être modifiée ici.
              </p>
            </FieldBlock>

            <FieldBlock label="Statut" className="mb-3">
              <FieldValueRow icon={User}>
                <LockedField value={getRoleLabel(role)} />
              </FieldValueRow>
              <p style={{ fontSize: 11, color: "#6B6478", marginTop: 4, paddingLeft: 38 }}>
                Le statut ne peut pas être modifié.
              </p>
            </FieldBlock>

            <FieldBlock label="Établissement">
              <FieldValueRow icon={Building2}>
                {editing ? (
                  <input
                    type="text"
                    value={form.institutionName}
                    onChange={(e) => update({ institutionName: e.target.value })}
                    placeholder="École, entreprise…"
                    className={editInputClass}
                    style={fieldStyle(true)}
                    autoComplete="organization"
                  />
                ) : (
                  <ReadValue
                    value={form.institutionName}
                    placeholder="École, entreprise…"
                  />
                )}
              </FieldValueRow>
            </FieldBlock>
          </SectionCard>

          {message === "saved" && (
            <div
              className="mb-3"
              style={{
                background: "rgba(29,158,117,.10)",
                border: "0.5px solid rgba(29,158,117,.25)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12,
                color: "#1D9E75",
              }}
            >
              Informations mises à jour !
            </div>
          )}
          {message === "error" && (
            <div
              className="mb-3"
              style={{
                background: "rgba(229,72,77,.08)",
                border: "0.5px solid rgba(229,72,77,.25)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12,
                color: "#E5484D",
              }}
            >
              Erreur lors de l&apos;enregistrement.
            </div>
          )}

          <div className="flex flex-col gap-2" style={{ marginTop: 6 }}>
            {!editing ? (
              <button
                type="button"
                onClick={startEditing}
                onMouseEnter={() => setPrimaryHover(true)}
                onMouseLeave={() => setPrimaryHover(false)}
                className="flex w-full items-center justify-center gap-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: primaryHover ? "#5A32A8" : "#6C3FC8",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <Pencil size={15} stroke="white" />
                Modifier mes informations
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={saving}
                  onMouseEnter={() => setPrimaryHover(true)}
                  onMouseLeave={() => setPrimaryHover(false)}
                  className="flex w-full items-center justify-center gap-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 disabled:opacity-50"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: primaryHover ? "#5A32A8" : "#6C3FC8",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <Save size={15} stroke="white" />
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex w-full items-center justify-center outline-none transition hover:bg-[rgba(108,63,200,.04)] focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(108,63,200,.25)",
                    background: "transparent",
                    color: "#6B6478",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </form>
      )}

      {loaded && (
        <ReferralSection
          referralCode={referralCode}
          referralCount={referralCount}
          referralLoading={referralLoading}
          copiedCode={copiedCode}
          onCopyCode={() => referralCode && void copyReferralCode(referralCode)}
        />
      )}

      {loaded && (
        <div
          className="mt-5"
          style={{
            background: "rgba(229,72,77,.08)",
            border: "0.5px solid rgba(229,72,77,.20)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "#E5484D", marginBottom: 4 }}>
            Zone dangereuse
          </p>
          <p style={{ fontSize: 11, color: "#6B6478", lineHeight: 1.5, marginBottom: 12 }}>
            La suppression de ton compte est définitive. Toutes tes listes, progressions et données
            seront perdues.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmEmail("");
              setDeleteStatus("idle");
              setDeleteError("");
              setDeleteModalOpen(true);
            }}
            className="transition hover:bg-[rgba(229,72,77,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D]"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(229,72,77,.35)",
              background: "transparent",
              color: "#E5484D",
              cursor: "pointer",
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      )}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(26,26,26,.45)" }}
          onClick={() => deleteStatus !== "loading" && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden"
            style={{
              borderRadius: 18,
              background: "white",
              boxShadow: PANEL_SHADOW,
              border: "0.5px solid rgba(108,63,200,.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>
                Supprimer mon compte
              </h2>
              <p style={{ fontSize: 13, color: "#6B6478", lineHeight: 1.5, marginBottom: 16 }}>
                Cette action est irréversible. Toutes tes données seront définitivement supprimées :
                listes, mots, révisions, progression.
              </p>

              <label className="block">
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#6B6478",
                    marginBottom: 5,
                    display: "block",
                  }}
                >
                  Pour confirmer, saisis ton adresse email
                </span>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={email ?? ""}
                  className="w-full outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8]"
                  style={{ ...fieldStyle(true), borderColor: "rgba(229,72,77,.35)" }}
                />
              </label>

              {deleteStatus === "error" && deleteError && (
                <div
                  className="mt-3"
                  style={{
                    background: "rgba(229,72,77,.08)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#E5484D",
                  }}
                >
                  {deleteError}
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={deleteStatus === "loading"}
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 transition hover:bg-[rgba(108,63,200,.04)]"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: 11,
                    borderRadius: 10,
                    border: "1px solid rgba(108,63,200,.25)",
                    background: "transparent",
                    color: "#6B6478",
                    cursor: "pointer",
                  }}
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
                  className="flex-[2] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: 11,
                    borderRadius: 10,
                    border: "none",
                    background: "#E5484D",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {deleteStatus === "loading" ? "Suppression…" : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fieldStyle(editable: boolean): CSSProperties {
  return {
    fontSize: 13,
    padding: "9px 12px",
    borderRadius: 10,
    width: "100%",
    border: editable ? "1px solid rgba(108,63,200,.25)" : "1px solid transparent",
    background: editable ? "white" : "rgba(108,63,200,.04)",
    outline: "none",
    color: "#1A1A1A",
  };
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="mb-3"
      style={{
        background: "white",
        border: "0.5px solid rgba(108,63,200,.12)",
        borderRadius: 12,
        padding: 16,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <SectionLabel>{title}</SectionLabel>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#1A1A1A",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "rgba(108,63,200,.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={16} stroke="#6C3FC8" aria-hidden />
    </div>
  );
}

function FieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#6B6478", marginBottom: 6 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldValueRow({ icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ReadValue({ value, placeholder }: { value?: string; placeholder?: string }) {
  const empty = !value?.trim();
  return (
    <div
      style={{
        ...fieldStyle(false),
        color: empty ? "#6B6478" : "#1A1A1A",
      }}
    >
      {empty ? placeholder ?? "—" : value}
    </div>
  );
}

function LockedField({ value }: { value: string }) {
  return (
    <div className="relative">
      <div
        style={{
          ...fieldStyle(false),
          background: "rgba(108,63,200,.06)",
          paddingRight: 36,
          cursor: "default",
        }}
      >
        {value}
      </div>
      <Lock
        size={14}
        stroke="#6B6478"
        aria-hidden
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function ProfileSectionHeader({
  icon: Icon,
  title,
  subtitle,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3" style={{ marginBottom: compact ? 10 : 16 }}>
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: "rgba(108,63,200,.09)",
        }}
      >
        <Icon size={16} stroke="#6C3FC8" aria-hidden />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>{title}</p>
        {subtitle ? (
          <p style={{ fontSize: 12, color: "#6B6478", marginTop: 2, lineHeight: 1.35 }}>{subtitle}</p>
        ) : null}
      </div>
    </div>
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
  const referralLabel = `Tu as parrainé ${referralCount} ${referralCount >= 2 ? "amis" : "ami"}`;

  const referralBtnBase: CSSProperties = {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
  };

  return (
    <div
      className="mb-3 mt-3"
      style={{
        background: "white",
        border: "0.5px solid rgba(108,63,200,.12)",
        borderRadius: 12,
        padding: 14,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <ProfileSectionHeader
        icon={Gift}
        title="Parrainage"
        subtitle="Partage ton code avec tes amis."
        compact
      />

      {referralLoading ? (
        <div
          style={{
            height: 40,
            borderRadius: 10,
            background: "rgba(108,63,200,.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "#6B6478",
          }}
        >
          …
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                width: "fit-content",
                flexShrink: 0,
                background: "rgba(108,63,200,.05)",
                border: "1px solid rgba(108,63,200,.12)",
                borderRadius: 10,
                padding: "7px 14px",
                height: 36,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  letterSpacing: "1.5px",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopyCode}
              disabled={!referralCode}
              className="outline-none transition focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                ...referralBtnBase,
                flexShrink: 0,
                border: copiedCode
                  ? "1px solid rgba(29,158,117,.35)"
                  : "1px solid rgba(108,63,200,.12)",
                background: copiedCode ? "rgba(29,158,117,.08)" : "transparent",
                color: copiedCode ? "#1D9E75" : "#6B6478",
              }}
            >
              {copiedCode ? (
                <>
                  <Check size={13} stroke="#1D9E75" />
                  Copié ✓
                </>
              ) : (
                <>
                  <Copy size={13} stroke="#6B6478" />
                  Copier
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Users size={13} stroke="#6B6478" aria-hidden />
            <span style={{ fontSize: 12, color: "#6B6478" }}>{referralLabel}</span>
          </div>

          <p style={{ fontSize: 11.5, color: "#6B6478", margin: 0, lineHeight: 1.35 }}>
            Bientôt : des avantages à débloquer en parrainant.
          </p>
        </div>
      )}
    </div>
  );
}
