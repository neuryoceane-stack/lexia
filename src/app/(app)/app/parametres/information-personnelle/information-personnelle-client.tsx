"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { PhoneInput } from "@/components/phone-input";
import { ChevronLeft, Pencil, Save, Star } from "lucide-react";

const LEVEL_NAMES: Record<number, string> = { 1: "Graine", 2: "Pousse", 3: "Explorateur", 4: "Apprenti", 5: "Maître" };
function getLevelName(l: number) { return l >= 6 ? "Légende" : LEVEL_NAMES[l] ?? "Graine"; }

const STATUS_OPTIONS = [
  { value: "etudiant", label: "Étudiant" },
  { value: "professeur", label: "Enseignant" },
] as const;

type ProfileForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  phone: string;
  role: "etudiant" | "professeur" | "";
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
    role: initialData?.role ?? "",
    institutionName: initialData?.institutionName ?? "",
  });
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
          role: d.role ?? "",
          institutionName: d.institutionName ?? "",
        });
        setEmail(d.email ?? null);
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
      role: form.role || null,
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
        } else setMessage("error");
      })
      .catch(() => setMessage("error"))
      .finally(() => setSaving(false));
  };

  const initial = form.firstName ? form.firstName.trim()[0]?.toUpperCase() ?? "?" : "?";

  const inputBase = "w-full text-sm placeholder:text-[var(--foreground-disabled)]" as const;
  const inputRead = `${inputBase}` as const;
  const inputEdit = `${inputBase}` as const;

  return (
    <div className="mx-auto max-w-lg">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => router.push("/app/parametres")}
        className="mb-4 flex items-center gap-1 transition hover:opacity-70"
        style={{ fontSize: 12, color: "var(--foreground-muted)", background: "none", border: "none", cursor: "pointer", width: "fit-content" }}
      >
        <ChevronLeft size={14} stroke="var(--foreground-muted)" />
        Retour
      </button>

      {/* Hero card */}
      <div
        className="mb-4 flex items-center gap-4"
        style={{ background: "var(--background-subtle)", borderRadius: 14, padding: "20px 16px" }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "3px solid #DDD6F5",
              background: "#6C3FC8",
              color: "white",
              fontSize: 26,
              fontWeight: 500,
            }}
          >
            {initial}
          </div>
          {editing && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#F5A623",
                border: "2px solid white",
                cursor: "pointer",
              }}
            >
              <Pencil size={11} stroke="white" />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: 17, fontWeight: 500, color: "var(--foreground)", marginBottom: 2 }}>
            {form.firstName || "—"} {form.lastName || ""}
          </p>
          <p className="truncate" style={{ fontSize: 12, color: "var(--foreground-muted)", marginBottom: 8 }}>
            {email ?? "—"}
          </p>
          <span
            className="inline-flex items-center gap-[5px]"
            style={{ background: "#DDD6F5", color: "#4B3A9E", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 10 }}
          >
            <Star size={10} stroke="#4B3A9E" />
            Niveau {userLevel} — {getLevelName(userLevel)}
          </span>
          {editing && (
            <button
              type="button"
              className="mt-1.5 block transition hover:brightness-95"
              style={{ fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 16, border: "1.5px solid #6C3FC8", background: "transparent", color: "#6C3FC8", cursor: "pointer" }}
            >
              Changer la photo
            </button>
          )}
        </div>
      </div>

      {/* Badge mode édition */}
      {editing && (
        <div className="mb-3 inline-block" style={{ fontSize: 11, fontWeight: 500, color: "#6C3FC8", background: "var(--background-subtle)", padding: "3px 10px", borderRadius: 8 }}>
          ✏️ Mode modification activé
        </div>
      )}

      {!loaded ? (
        <p style={{ fontSize: 13, color: "var(--foreground-disabled)" }}>Chargement…</p>
      ) : (
        <form onSubmit={submit}>
          {/* Section Informations personnelles */}
          <div className="mb-3" style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <SectionLabel>Informations personnelles</SectionLabel>

            <div className="grid grid-cols-2 gap-[10px] mb-3">
              <FieldBlock label="Prénom">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  disabled={!editing}
                  className={editing ? inputEdit : inputRead}
                  style={fieldStyle(editing)}
                  autoComplete="given-name"
                />
              </FieldBlock>
              <FieldBlock label="Nom">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  disabled={!editing}
                  className={editing ? inputEdit : inputRead}
                  style={fieldStyle(editing)}
                  autoComplete="family-name"
                />
              </FieldBlock>
            </div>

            <FieldBlock label="Date de naissance" className="mb-3">
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update({ dateOfBirth: e.target.value })}
                disabled={!editing}
                className={editing ? inputEdit : inputRead}
                style={fieldStyle(editing)}
                autoComplete="bday"
              />
            </FieldBlock>

            <FieldBlock label="Ville" className="mb-3">
              {editing ? (
                <CityAutocomplete
                  value={form.city}
                  onChange={(v) => update({ city: v })}
                  placeholder="Ta ville"
                  disabled={saving}
                  className={`${inputEdit} !rounded-[10px] !border-[1.5px] !border-[#6C3FC8] !bg-[var(--input-bg)] !text-[13px] !text-[var(--foreground)] !px-3 !py-[9px]`}
                />
              ) : (
                <div className={inputRead} style={fieldStyle(false)}>
                  {form.city || "—"}
                </div>
              )}
            </FieldBlock>

            <FieldBlock label="Téléphone">
              {editing ? (
                <PhoneInput
                  value={form.phone}
                  onChange={(v) => update({ phone: v })}
                  placeholder="6 12 34 56 78"
                  disabled={saving}
                  className="w-full"
                />
              ) : (
                <div className={inputRead} style={fieldStyle(false)}>
                  {form.phone || "—"}
                </div>
              )}
            </FieldBlock>
          </div>

          {/* Section Compte */}
          <div className="mb-3" style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <SectionLabel>Compte</SectionLabel>

            <FieldBlock label="Email" className="mb-3">
              <input
                type="email"
                value={email ?? ""}
                readOnly
                disabled
                className={inputRead}
                style={{ ...fieldStyle(false), cursor: "not-allowed" }}
              />
              <p style={{ fontSize: 11, color: "var(--foreground-disabled)", marginTop: 4 }}>
                L&apos;adresse mail ne peut pas être modifiée ici.
              </p>
            </FieldBlock>

            <FieldBlock label="Statut" className="mb-3">
              <select
                value={form.role}
                onChange={(e) => update({ role: (e.target.value || "") as ProfileForm["role"] })}
                disabled={!editing}
                className={editing ? inputEdit : inputRead}
                style={fieldStyle(editing)}
              >
                <option value="">— Choisir —</option>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FieldBlock>

            <FieldBlock label="Établissement">
              <input
                type="text"
                value={form.institutionName}
                onChange={(e) => update({ institutionName: e.target.value })}
                disabled={!editing}
                placeholder="École, entreprise..."
                className={editing ? inputEdit : inputRead}
                style={fieldStyle(editing)}
                autoComplete="organization"
              />
            </FieldBlock>
          </div>

          {/* Messages */}
          {message === "saved" && (
            <div className="mb-3" style={{ background: "#EAF4EF", border: "0.5px solid #C3E6D6", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#1A6645" }}>
              ✓ Informations mises à jour !
            </div>
          )}
          {message === "error" && (
            <div className="mb-3" style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#A32D2D" }}>
              Erreur lors de l&apos;enregistrement.
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2" style={{ marginTop: 4 }}>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex flex-1 items-center justify-center gap-2 transition hover:brightness-95"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 11,
                  borderRadius: 10,
                  border: "1.5px solid #6C3FC8",
                  background: "transparent",
                  color: "#6C3FC8",
                  cursor: "pointer",
                }}
              >
                <Pencil size={13} stroke="#6C3FC8" />
                Modifier mes informations
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setMessage(null); }}
                  className="flex-1 transition hover:bg-[var(--hover-bg)]"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: 11,
                    borderRadius: 10,
                    border: "0.5px solid var(--border)",
                    background: "transparent",
                    color: "var(--foreground-muted)",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-[2] items-center justify-center gap-2 transition hover:brightness-95 disabled:opacity-50"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: 11,
                    borderRadius: 10,
                    border: "none",
                    background: "#6C3FC8",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <Save size={13} stroke="white" />
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </>
            )}
          </div>
        </form>
      )}

      {/* Zone dangereuse */}
      {loaded && (
        <div
          className="mt-4"
          style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 12, padding: "14px 16px" }}
        >
          <p style={{ fontSize: 12, fontWeight: 500, color: "#A32D2D", marginBottom: 4 }}>
            Zone dangereuse
          </p>
          <p style={{ fontSize: 11, color: "#791F1F", lineHeight: 1.5, marginBottom: 12 }}>
            La suppression de ton compte est définitive. Toutes tes listes, progressions et données seront perdues.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmEmail("");
              setDeleteStatus("idle");
              setDeleteError("");
              setDeleteModalOpen(true);
            }}
            className="transition hover:brightness-95"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1.5px solid #E24B4A",
              background: "transparent",
              color: "#E24B4A",
              cursor: "pointer",
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => deleteStatus !== "loading" && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden"
            style={{ borderRadius: 20, background: "var(--background-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px" }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: "var(--foreground)", marginBottom: 8 }}>
                Supprimer mon compte
              </h2>
              <p style={{ fontSize: 13, color: "var(--foreground-muted)", lineHeight: 1.5, marginBottom: 16 }}>
                Cette action est irréversible. Toutes vos données seront définitivement supprimées : listes, mots, révisions, progression.
              </p>

              <label className="block">
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground-muted)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Pour confirmer, saisissez votre adresse email
                </span>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={email ?? ""}
                  className="w-full"
                  style={{ ...fieldStyle(true), borderColor: "#F09595" }}
                />
              </label>

              {deleteStatus === "error" && deleteError && (
                <div className="mt-3" style={{ background: "#FCEBEB", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#A32D2D" }}>
                  {deleteError}
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={deleteStatus === "loading"}
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 transition hover:bg-[var(--hover-bg)]"
                  style={{ fontSize: 13, fontWeight: 500, padding: 11, borderRadius: 10, border: "0.5px solid var(--border)", background: "transparent", color: "var(--foreground-muted)", cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleteStatus === "loading" || !email || deleteConfirmEmail.trim().toLowerCase() !== email.toLowerCase()}
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
                  className="flex-[2] transition hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: 13, fontWeight: 500, padding: 11, borderRadius: 10, border: "none", background: "#E24B4A", color: "white", cursor: "pointer" }}
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

/* ------------------------------------------------------------------ */

function fieldStyle(editable: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    padding: "9px 12px",
    borderRadius: 10,
    width: "100%",
    border: editable ? "1.5px solid #6C3FC8" : "1px solid transparent",
    background: editable ? "var(--input-bg)" : "var(--background-subtle)",
    outline: "none",
    color: "var(--foreground)",
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "var(--foreground-muted)",
      marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

function FieldBlock({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--foreground-muted)",
        marginBottom: 5,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}
