"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  User,
  Sprout,
  Flame,
  Gem,
  CreditCard,
  Check,
  Star,
  Plus,
} from "lucide-react";

type AvatarType = "arbre" | "phenix" | "koala";

const AVATAR_OPTIONS: {
  value: AvatarType;
  label: string;
  subLabel: string;
  icon: typeof Sprout;
  color: string;
}[] = [
  { value: "arbre", label: "Arbre", subLabel: "Graine → Forêt", icon: Sprout, color: "#1D9E75" },
  { value: "phenix", label: "Phénix", subLabel: "Étincelle → Phénix", icon: Flame, color: "#F5A623" },
  { value: "koala", label: "Cristal", subLabel: "Éclat → Nexus", icon: Gem, color: "#6C3FC8" },
];

export function ParametresClient() {
  const router = useRouter();
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.avatarType && AVATAR_OPTIONS.some((o) => o.value === d.avatarType)) {
          setAvatarType(d.avatarType);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveAvatarType = (value: AvatarType) => {
    setAvatarType(value);
    setSaving(true);
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarType: value }),
    })
      .then(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div className="mx-auto max-w-lg" style={{ background: "#F8F7FF" }}>
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => router.push("/app")}
        className="mb-4 flex items-center gap-1 transition hover:opacity-70"
        style={{
          fontSize: 12,
          color: "#71717a",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={14} stroke="#71717a" />
        Retour
      </button>

      {/* Titre */}
      <h1 className="mb-4" style={{ fontSize: 20, fontWeight: 500, color: "#1a1a1a" }}>
        Paramètres
      </h1>

      {/* -------- Section Avatar -------- */}
      <div
        className="mb-3"
        style={{ background: "white", border: "0.5px solid #e4e4e7", borderRadius: 12, padding: 16 }}
      >
        <div className="mb-3.5 flex items-start gap-2.5">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 7, background: "#F0EDF8" }}
          >
            <User size={14} stroke="#6C3FC8" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>Avatar</p>
            <p style={{ fontSize: 11, color: "#71717a", marginTop: 1 }}>
              Choisis ton avatar — il évolue avec ton niveau d&apos;activité.
            </p>
          </div>
        </div>

        {loaded && (
          <div className="grid grid-cols-3 gap-2">
            {AVATAR_OPTIONS.map(({ value, label, subLabel, icon: Icon, color }) => {
              const selected = avatarType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => saveAvatarType(value)}
                  disabled={saving}
                  className="flex flex-col items-center transition-all disabled:opacity-60 card-hover"
                  style={{
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                    border: `1.5px solid ${selected ? "#6C3FC8" : "#e4e4e7"}`,
                    background: selected ? "#F0EDF8" : "#f4f4f5",
                    cursor: "pointer",
                    transition: "border-color 120ms, background 120ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "#6C3FC8";
                      e.currentTarget.style.background = "#F0EDF8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "#e4e4e7";
                      e.currentTarget.style.background = "#f4f4f5";
                    }
                  }}
                >
                  <Icon size={26} stroke={color} style={{ marginBottom: 6 }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: selected ? "#6C3FC8" : "#71717a",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: 10, color: "#a1a1aa" }}>{subLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* -------- Section Abonnement & Paiement -------- */}
      <div
        style={{ background: "white", border: "0.5px solid #e4e4e7", borderRadius: 12, padding: 16 }}
      >
        {/* Header section */}
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 7, background: "#FEF3DC" }}
          >
            <CreditCard size={14} stroke="#C47D0A" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
            Abonnement &amp; paiement
          </p>
        </div>

        {/* Pill plan actif */}
        <span
          className="mb-3 inline-flex items-center gap-[5px]"
          style={{
            background: "#EAF4EF",
            color: "#1A6645",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 8,
          }}
        >
          <Check size={10} stroke="#1A6645" />
          Plan Étudiant — actif
        </span>

        {/* Détails plan */}
        <div
          className="mb-3"
          style={{ background: "#f4f4f5", borderRadius: 10, padding: "12px 14px" }}
        >
          <PlanRow label="Tarif" value="6 € / mois" />
          <div style={{ borderTop: "0.5px solid #e4e4e7", margin: "4px 0" }} />
          <PlanRow label="Prochain renouvellement" value="—" />
          <div style={{ borderTop: "0.5px solid #e4e4e7", margin: "4px 0" }} />
          <PlanRow label="Statut" value="✓ Actif" valueColor="#1D9E75" />
        </div>

        {/* Boutons actions */}
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-[5px] transition hover:brightness-95"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: 9,
              borderRadius: 10,
              border: "1.5px solid #6C3FC8",
              background: "transparent",
              color: "#6C3FC8",
              cursor: "pointer",
            }}
          >
            <CreditCard size={11} stroke="#6C3FC8" />
            Gérer
          </button>
          <button
            type="button"
            className="flex flex-[2] items-center justify-center gap-[5px] transition hover:brightness-95"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: 9,
              borderRadius: 10,
              border: "none",
              background: "#F5A623",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Star size={11} stroke="white" />
            Passer à l&apos;annuel — 50&nbsp;€/an
          </button>
        </div>

        {/* Méthode de paiement */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#71717a",
            marginBottom: 8,
          }}
        >
          Méthode de paiement
        </p>

        {/* Carte placeholder */}
        <div
          className="mb-2 flex items-center gap-2.5"
          style={{ background: "#f4f4f5", borderRadius: 10, padding: "10px 14px" }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 32,
              height: 22,
              borderRadius: 4,
              background: "#1A1F71",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            VISA
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>
              •••• •••• •••• 4242
            </p>
            <p style={{ fontSize: 11, color: "#a1a1aa" }}>Expire 12/27</p>
          </div>
          <button
            type="button"
            className="shrink-0 transition hover:opacity-70"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6C3FC8",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Modifier
          </button>
        </div>

        {/* Bouton ajouter carte */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-[5px] transition hover:bg-[#F0EDF8]/40"
          style={{
            fontSize: 12,
            color: "#6C3FC8",
            background: "transparent",
            border: "1.5px dashed #DDD6F5",
            borderRadius: 10,
            padding: 9,
            cursor: "pointer",
          }}
        >
          <Plus size={12} stroke="#6C3FC8" />
          Ajouter une carte
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PlanRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "4px 0" }}>
      <span style={{ fontSize: 12, color: "#71717a" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: valueColor ?? "#1a1a1a" }}>
        {value}
      </span>
    </div>
  );
}
