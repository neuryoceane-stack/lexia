"use client";

import { useEffect, useState, useRef } from "react";
import { ShoppingBag, Plus, Trash2, Eye, EyeOff, Upload, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";

type ShopPack = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  wordCount: number;
  expressionCount: number;
  price: number;
  language: string;
  level: string;
  isActive: boolean;
  wordsJson?: string;
  sales: number;
  revenue: number;
};

type PackWord = { term: string; definition: string; isExpression?: boolean };

const LANGUAGE_LABELS: Record<string, string> = {
  eng: "🇬🇧 Anglais", deu: "🇩🇪 Allemand", spa: "🇪🇸 Espagnol",
  ita: "🇮🇹 Italien", fra: "🇫🇷 Français",
};

export function CreatorShopTab() {
  const [packs, setPacks] = useState<ShopPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", emoji: "📦",
    language: "fra", level: "", price: 400,
  });
  const [words, setWords] = useState<PackWord[]>([]);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPacks(); }, []);

  async function loadPacks() {
    setLoading(true);
    const res = await fetch("/api/creator/shop");
    const data = await res.json();
    if (Array.isArray(data)) setPacks(data);
    setLoading(false);
  }

  async function toggleActive(pack: ShopPack) {
    await fetch("/api/creator/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pack.id, isActive: !pack.isActive }),
    });
    await loadPacks();
  }

  async function deletePack(id: string) {
    if (!confirm("Supprimer ce pack définitivement ?")) return;
    await fetch("/api/creator/shop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadPacks();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        const parsed: PackWord[] = rows.map((row) => ({
          term: row["terme"] ?? row["term"] ?? row["mot"] ?? "",
          definition: row["definition"] ?? row["traduction"] ?? row["translation"] ?? "",
          isExpression: String(row["type"] ?? "").toLowerCase() === "expression",
        })).filter((w) => w.term && w.definition);
        if (parsed.length === 0) {
          setImportError("Aucun mot trouvé. Colonnes attendues : terme, definition, type (optionnel)");
          return;
        }
        setWords(parsed);
      } catch {
        setImportError("Erreur de lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleSubmit() {
    if (!form.title || !form.description || words.length === 0) return;
    setSaving(true);
    const wordCount = words.filter((w) => !w.isExpression).length;
    const expressionCount = words.filter((w) => w.isExpression).length;
    await fetch("/api/creator/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        wordCount,
        expressionCount,
        wordsJson: JSON.stringify(words),
      }),
    });
    setForm({ title: "", description: "", emoji: "📦", language: "fra", level: "", price: 400 });
    setWords([]);
    setShowForm(false);
    setSaving(false);
    await loadPacks();
  }

  const totalRevenue = packs.reduce((acc, p) => acc + (p.revenue ?? 0), 0);
  const totalSales = packs.reduce((acc, p) => acc + (p.sales ?? 0), 0);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif" }}>

      {/* Stats globales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Packs actifs", value: packs.filter((p) => p.isActive).length },
          { label: "Ventes totales", value: totalSales },
          { label: "Revenus totaux", value: `${(totalRevenue / 100).toFixed(2)}€` },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "#F8F7FF", borderRadius: 12, padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ fontWeight: 500, fontSize: 22, color: "#6C3FC8" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bouton créer */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: "#6C3FC8", color: "white", border: "none",
            borderRadius: 20, padding: "10px 20px", fontSize: 14,
            fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}>
          <Plus size={16} /> Nouveau pack
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{
          background: "white", borderRadius: 16, padding: 20,
          border: "1.5px solid #E0D8F5", marginBottom: 24,
        }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 16, color: "#1a1a1a" }}>
            Créer un nouveau pack
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Titre</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Voyages & transports"
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Emoji</label>
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="✈️"
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Tout le vocabulaire pour voyager sereinement."
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Langue</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}>
                {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Niveau</label>
              <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="Ex: A2→B2"
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Prix (centimes)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                style={{ width: "100%", border: "1.5px solid #E0D8F5", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>400 = 4€</div>
            </div>
          </div>

          {/* Import Excel */}
          <div style={{
            border: "1.5px dashed #C4B5F4", borderRadius: 12, padding: "16px",
            textAlign: "center", marginBottom: 12, cursor: "pointer",
            background: words.length > 0 ? "#F0EBFC" : "transparent",
          }} onClick={() => fileRef.current?.click()}>
            <Upload size={20} color="#6C3FC8" style={{ margin: "0 auto 6px" }} />
            {words.length > 0 ? (
              <div style={{ fontSize: 13, color: "#6C3FC8", fontWeight: 500 }}>
                ✅ {words.filter((w) => !w.isExpression).length} mots + {words.filter((w) => w.isExpression).length} expressions importés
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#888" }}>
                Importer un fichier Excel (.xlsx)<br />
                <span style={{ fontSize: 11 }}>Colonnes : terme | definition | type (mot/expression)</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          </div>
          {importError && <div style={{ fontSize: 12, color: "#E24B4A", marginBottom: 8 }}>{importError}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)}
              style={{ background: "#f4f4f5", color: "#444", border: "none", borderRadius: 20, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={saving || !form.title || !form.description || words.length === 0}
              style={{
                background: saving || !form.title || !form.description || words.length === 0 ? "#C4B5F4" : "#6C3FC8",
                color: "white", border: "none", borderRadius: 20, padding: "9px 18px",
                fontSize: 13, cursor: "pointer", fontWeight: 500,
              }}>
              {saving ? "Création…" : "Créer le pack"}
            </button>
          </div>
        </div>
      )}

      {/* Liste des packs */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>Chargement…</div>
      ) : packs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>
          <ShoppingBag size={32} color="#C4B5F4" style={{ margin: "0 auto 8px" }} />
          <div>Aucun pack pour l'instant</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {packs.map((pack) => (
            <div key={pack.id} style={{
              background: "white", borderRadius: 14, padding: "14px 16px",
              border: `1.5px solid ${pack.isActive ? "#C4E8D8" : "#E5E0F5"}`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{pack.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>{pack.title}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {LANGUAGE_LABELS[pack.language]} · {pack.wordCount ?? 0} mots · {pack.expressionCount ?? 0} expressions · {(pack.price / 100).toFixed(2)}€
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 500 }}>
                    {pack.sales ?? 0} vente{(pack.sales ?? 0) > 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 11, color: "#6C3FC8", fontWeight: 500 }}>
                    {((pack.revenue ?? 0) / 100).toFixed(2)}€ générés
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                  background: pack.isActive ? "#E1F5EE" : "#F4F4F5",
                  color: pack.isActive ? "#1D9E75" : "#888",
                }}>
                  {pack.isActive ? "Actif" : "Inactif"}
                </span>
                <button onClick={() => toggleActive(pack)} title={pack.isActive ? "Désactiver" : "Activer"}
                  style={{ background: "#F8F7FF", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer" }}>
                  {pack.isActive ? <EyeOff size={14} color="#888" /> : <Eye size={14} color="#6C3FC8" />}
                </button>
                <button onClick={() => deletePack(pack.id)} title="Supprimer"
                  style={{ background: "#FCEBEB", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer" }}>
                  <Trash2 size={14} color="#E24B4A" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
