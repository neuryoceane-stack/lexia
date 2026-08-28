"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, BookOpen, X, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Passer à true pour réactiver le Lexi Shop (mode étudiant : désactivé au lancement).
const SHOP_ENABLED = false;

type Pack = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  wordCount: number;
  expressionCount: number;
  price: number;
  language: string;
  level: string;
  type: string;
  owned: boolean;
  wordsJson?: string;
};

type PackWord = {
  term: string;
  definition: string;
  isExpression?: boolean;
};

const LANGUAGES = [
  { code: "all", label: "Toutes les langues", flag: "🌍" },
  { code: "eng", label: "Anglais", flag: "🇬🇧" },
  { code: "deu", label: "Allemand", flag: "🇩🇪" },
  { code: "spa", label: "Espagnol", flag: "🇪🇸" },
  { code: "ita", label: "Italien", flag: "🇮🇹" },
  { code: "fra", label: "Français", flag: "🇫🇷" },
];

const LANGUAGE_FLAGS: Record<string, string> = {
  eng: "🇬🇧", deu: "🇩🇪", spa: "🇪🇸", ita: "🇮🇹", fra: "🇫🇷",
};

const LANGUAGE_LABELS: Record<string, string> = {
  eng: "Anglais", deu: "Allemand", spa: "Espagnol", ita: "Italien", fra: "Français",
};

const DEMO_PACKS: Pack[] = [
  {
    id: "demo-1", title: "Voyages & transports", emoji: "✈️",
    description: "Tout le vocabulaire pour voyager sereinement.",
    wordCount: 60, expressionCount: 20, price: 400, language: "eng",
    level: "A2→B2", type: "thematique", owned: true,
    wordsJson: JSON.stringify([
      { term: "Aéroport", definition: "Airport" },
      { term: "Embarquement", definition: "Boarding" },
      { term: "Correspondance", definition: "Connection" },
      { term: "Décollage", definition: "Take-off" },
      { term: "Escale", definition: "Stopover" },
      { term: "Bagage", definition: "Luggage" },
      { term: "Passeport", definition: "Passport", isExpression: false },
      { term: "Douane", definition: "Customs" },
      { term: "Navette", definition: "Shuttle" },
      { term: "Siège", definition: "Seat" },
      { term: "À l'heure", definition: "On time", isExpression: true },
      { term: "Vol annulé", definition: "Cancelled flight", isExpression: true },
      { term: "Enregistrement en ligne", definition: "Online check-in", isExpression: true },
    ]),
  },
  {
    id: "demo-2", title: "Food & restaurants", emoji: "🍕",
    description: "Commander, cuisiner, déguster en italien.",
    wordCount: 60, expressionCount: 20, price: 400, language: "ita",
    level: "A1→B1", type: "thematique", owned: false,
  },
  {
    id: "demo-3", title: "Business & économie", emoji: "💼",
    description: "Le vocabulaire professionnel en allemand.",
    wordCount: 60, expressionCount: 20, price: 400, language: "deu",
    level: "B1→C1", type: "thematique", owned: false,
  },
  {
    id: "demo-4", title: "Culture & arts", emoji: "🎨",
    description: "Parler culture et patrimoine en français.",
    wordCount: 60, expressionCount: 20, price: 400, language: "fra",
    level: "B1→B2", type: "thematique", owned: true,
  },
  {
    id: "demo-5", title: "Sciences & nature", emoji: "🔬",
    description: "Le vocabulaire scientifique en anglais.",
    wordCount: 60, expressionCount: 20, price: 400, language: "eng",
    level: "B1→C1", type: "thematique", owned: false,
  },
  {
    id: "demo-6", title: "Sport & loisirs", emoji: "⚽",
    description: "Sports et activités en espagnol.",
    wordCount: 60, expressionCount: 20, price: 400, language: "spa",
    level: "A2→B2", type: "thematique", owned: false,
  },
];

export default function ShopPage() {
  // Mode étudiant : la boutique est désactivée au lancement. On affiche un écran
  // teasing et on n'exécute aucun hook de fetch tant que SHOP_ENABLED est false.
  if (!SHOP_ENABLED) return <ShopComingSoon />;
  return <ShopContent />;
}

function ShopContent() {
  const router = useRouter();
  const [packs, setPacks] = useState<Pack[]>(DEMO_PACKS);
  const [selectedLang, setSelectedLang] = useState("all");
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const ownedCount = packs.filter((p) => p.owned).length;

  useEffect(() => {
    fetch("/api/shop/packs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setPacks(data); })
      .catch(() => {});
  }, []);

  const filtered = selectedLang === "all"
    ? packs.filter((p) => p.type === "thematique")
    : packs.filter((p) => p.type === "thematique" && p.language === selectedLang);

  const bundleThemes = [...new Set(packs.slice(0, 5).map((p) => p.title.split(" ")[0]))];

  async function handleBuy(pack: Pack) {
    if (pack.owned) { router.push("/app/bibliotheque"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
    setLoading(false);
  }

  const previewWords = selectedPack?.wordsJson
    ? (JSON.parse(selectedPack.wordsJson) as PackWord[]).filter((w) => !w.isExpression)
    : [];
  const previewExpressions = selectedPack?.wordsJson
    ? (JSON.parse(selectedPack.wordsJson) as PackWord[]).filter((w) => w.isExpression)
    : [];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Header violet */}
        <div style={{
          background: "#6C3FC8", borderRadius: 16, padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 12,
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingBag size={22} color="white" />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 500, fontSize: 18 }}>Lexiva Shop</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                Packs thématiques prêts à réviser — 60 mots + 20 expressions par pack.
              </div>
            </div>
          </div>
          {ownedCount > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 12,
              padding: "8px 14px", textAlign: "center", flexShrink: 0,
            }}>
              <div style={{ color: "white", fontWeight: 500, fontSize: 20 }}>{ownedCount}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>packs achetés</div>
            </div>
          )}
        </div>

        {/* Bandeau Bundle */}
        <div style={{
          background: "white", borderRadius: 16, padding: "16px 20px",
          border: "1.5px solid #F0EBFC", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>
              Bundle — 5 packs au choix
            </div>
            <div style={{
              background: "#F5A623", borderRadius: 20, padding: "3px 10px",
              fontSize: 11, fontWeight: 500, color: "white",
            }}>
              Meilleure offre
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
            Choisis 5 packs thématiques dans n'importe quelle langue et économise 4€.
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {["Voyages", "Food", "Business", "Culture", "+ 4 autres"].map((tag) => (
              <span key={tag} style={{
                background: "#F0EBFC", borderRadius: 20, padding: "3px 10px",
                fontSize: 12, color: "#6C3FC8", fontWeight: 400,
              }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a" }}>16€</span>
              <span style={{ fontSize: 13, color: "#999", textDecoration: "line-through" }}>20€</span>
              <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 500 }}>-20%</span>
            </div>
            <button style={{
              background: "#6C3FC8", color: "white", border: "none",
              borderRadius: 20, padding: "10px 20px", fontSize: 14,
              fontWeight: 500, cursor: "pointer",
            }}>
              Acheter le bundle
            </button>
          </div>
        </div>

        {/* Filtres langue */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
          {LANGUAGES.map((lang) => (
            <button key={lang.code} onClick={() => setSelectedLang(lang.code)} style={{
              background: selectedLang === lang.code ? "#6C3FC8" : "white",
              color: selectedLang === lang.code ? "white" : "#444",
              border: "1.5px solid", borderColor: selectedLang === lang.code ? "#6C3FC8" : "#E5E0F5",
              borderRadius: 20, padding: "6px 14px", fontSize: 13,
              fontWeight: 400, cursor: "pointer", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>

        {/* Titre section */}
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "#888", textTransform: "uppercase", marginBottom: 12 }}>
          Packs thématiques — 4€ chacun
        </div>

        {/* Grille de cartes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map((pack) => (
            <div key={pack.id} onClick={() => setSelectedPack(pack)} style={{
              background: "white", borderRadius: 16, padding: "16px",
              border: "1.5px solid #F0EBFC", cursor: "pointer",
              position: "relative", transition: "box-shadow 0.15s",
            }}>
              {pack.owned && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  fontSize: 11, fontWeight: 500, color: "#1D9E75",
                }}>
                  Possédé ✓
                </div>
              )}
              <div style={{ fontSize: 28, marginBottom: 8 }}>{pack.emoji}</div>
              <div style={{ fontWeight: 500, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>
                {pack.title}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                {pack.wordCount} mots · {pack.expressionCount} expressions
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  background: "#F0EBFC", borderRadius: 20, padding: "3px 10px",
                  fontSize: 11, color: "#6C3FC8",
                }}>
                  {LANGUAGE_FLAGS[pack.language]} {LANGUAGE_LABELS[pack.language]}
                </span>
              </div>
              {pack.owned ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1D9E75", marginBottom: 8 }}>
                    Dans ta bibliothèque
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push("/app/bibliotheque"); }}
                    style={{
                      width: "100%", background: "#1D9E75", color: "white",
                      border: "none", borderRadius: 20, padding: "8px 0",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}>
                    Réviser
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>4€</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{pack.wordCount + pack.expressionCount} contenus</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuy(pack); }}
                    style={{
                      background: "#6C3FC8", color: "white", border: "none",
                      borderRadius: 20, padding: "8px 16px",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}>
                    Acheter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modale détail */}
      {selectedPack && (
        <div
          onClick={() => setSelectedPack(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 50, padding: "0 0 0 0",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "20px 20px 0 0",
              width: "100%", maxWidth: 600, maxHeight: "90vh",
              overflowY: "auto",
            }}>
            {/* Header modale violet */}
            <div style={{ background: "#6C3FC8", borderRadius: "20px 20px 0 0", padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    background: "rgba(255,255,255,0.2)", borderRadius: 12,
                    width: 44, height: 44, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 22,
                  }}>
                    {selectedPack.emoji}
                  </div>
                  <div style={{ color: "white", fontWeight: 500, fontSize: 18 }}>
                    {selectedPack.title}
                  </div>
                </div>
                <button onClick={() => setSelectedPack(null)} style={{
                  background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20,
                  width: 32, height: 32, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={16} color="white" />
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  `${LANGUAGE_FLAGS[selectedPack.language]} ${LANGUAGE_LABELS[selectedPack.language]}`,
                  `📖 ${selectedPack.wordCount} mots`,
                  `💬 ${selectedPack.expressionCount} expressions`,
                ].map((pill) => (
                  <span key={pill} style={{
                    background: "rgba(255,255,255,0.2)", borderRadius: 20,
                    padding: "4px 10px", fontSize: 12, color: "white",
                  }}>{pill}</span>
                ))}
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { value: selectedPack.wordCount, label: "mots" },
                  { value: selectedPack.expressionCount, label: "expressions" },
                  { value: selectedPack.level || "A2→B2", label: "niveau" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: "#F8F7FF", borderRadius: 12, padding: "12px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontWeight: 500, fontSize: 20, color: "#1a1a1a" }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Aperçu mots */}
              {previewWords.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
                    Aperçu des mots
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {previewWords.map((w, i) => (
                      <div key={i} style={{
                        background: i < 6 ? "#F8F7FF" : "#F8F7FF",
                        borderRadius: 10, padding: "10px 12px",
                        filter: i >= 6 ? "blur(4px)" : "none",
                        userSelect: i >= 6 ? "none" : "auto",
                      }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: "#1a1a1a" }}>{w.term}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{w.definition}</div>
                      </div>
                    ))}
                  </div>
                  {previewWords.length > 6 && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "#6C3FC8", marginTop: 8 }}>
                      … et {selectedPack.wordCount - 6} autres mots dans le pack
                    </div>
                  )}
                </div>
              )}

              {/* Aperçu expressions */}
              {previewExpressions.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
                    Aperçu des expressions
                  </div>
                  {previewExpressions.map((w, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "8px 0", borderBottom: "1px solid #F0EBFC",
                      filter: i >= 3 ? "blur(4px)" : "none",
                      userSelect: i >= 3 ? "none" : "auto",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#6C3FC8", flexShrink: 0, marginTop: 5,
                      }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: "#1a1a1a" }}>{w.term}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{w.definition}</div>
                      </div>
                    </div>
                  ))}
                  {previewExpressions.length > 3 && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "#6C3FC8", marginTop: 8 }}>
                      … et {selectedPack.expressionCount - 3} autres expressions
                    </div>
                  )}
                </div>
              )}

              {/* Footer achat */}
              <div style={{
                borderTop: "1px solid #F0EBFC", paddingTop: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 18, color: "#1a1a1a" }}>4€</div>
                  <div style={{ fontSize: 12, color: "#888" }}>Accès illimité · dans ta bibliothèque</div>
                </div>
                <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
                  Paiement sécurisé<br />via Stripe
                </div>
              </div>
              {selectedPack.owned ? (
                <button
                  onClick={() => router.push("/app/bibliotheque")}
                  style={{
                    width: "100%", background: "#1D9E75", color: "white",
                    border: "none", borderRadius: 20, padding: "14px 0",
                    fontSize: 15, fontWeight: 500, cursor: "pointer",
                  }}>
                  Réviser ce pack
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(selectedPack)}
                  disabled={loading}
                  style={{
                    width: "100%", background: "#6C3FC8", color: "white",
                    border: "none", borderRadius: 20, padding: "14px 0",
                    fontSize: 15, fontWeight: 500, cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? "Redirection…" : `Acheter ce pack — 4€`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopComingSoon() {
  const ARGUMENTS = [
    "Packs thématiques prêts à l'emploi",
    "Spécial collège, lycée et prépa",
    "Ajoutés directement à ta bibliothèque",
  ];

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 16px",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "white",
          borderRadius: 16,
          border: "1px solid rgba(108,63,200,0.18)",
          boxShadow: "0 8px 40px rgba(108,63,200,0.1)",
          padding: "44px 36px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: "#EEEDFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={36} color="#6C3FC8" />
            </div>
            <span
              style={{
                position: "absolute",
                top: -8,
                right: -14,
                background: "#F5A623",
                color: "white",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 12,
                padding: "3px 9px",
              }}
            >
              Bientôt
            </span>
          </div>
        </div>

        <p style={{ fontSize: 22, fontWeight: 500, color: "#2C2C2A", marginBottom: 12 }}>
          Le Lexi Shop arrive bientôt
        </p>
        <p style={{ fontSize: 15, fontWeight: 400, color: "#6b6b6b", lineHeight: 1.6, marginBottom: 28 }}>
          Des listes de vocabulaire prêtes à réviser, conçues par des experts :
          philosophie, littérature, prépa, et bien plus. Prépare tes révisions, la
          boutique ouvre très prochainement.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32, textAlign: "left" }}>
          {ARGUMENTS.map((arg) => (
            <div key={arg} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle size={18} color="#1D9E75" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: "#2C2C2A" }}>{arg}</span>
            </div>
          ))}
        </div>

        <Link
          href="/app"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 50,
            borderRadius: 20,
            background: "#6C3FC8",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Retour à mon tableau de bord
        </Link>
      </div>
    </div>
  );
}
