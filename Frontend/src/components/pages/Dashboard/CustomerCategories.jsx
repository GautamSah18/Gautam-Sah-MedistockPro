import { useMemo, useState } from "react";
import {
  FaAllergies,
  FaAppleAlt,
  FaArrowRight,
  FaBandAid,
  FaCapsules,
  FaClinicMedical,
  FaSyringe,
} from "react-icons/fa";
import TopNav from "./TopNav";
import "./customerDashboard.css";

const CATEGORY_DATA = [
  { id: 1, name: "Pain Relief", icon: <FaBandAid />, desc: "Fever, headache, body pain" },
  { id: 2, name: "Antibiotics", icon: <FaSyringe />, desc: "Prescription antibiotics" },
  { id: 3, name: "Supplements", icon: <FaAppleAlt />, desc: "Vitamins & immunity" },
  { id: 4, name: "Allergy Care", icon: <FaAllergies />, desc: "Sneezing, itching, cold" },
  { id: 5, name: "Capsules", icon: <FaCapsules />, desc: "Capsules & soft gels" },
  { id: 6, name: "General Care", icon: <FaClinicMedical />, desc: "Daily essentials" },
];

export default function CustomerCategories() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CATEGORY_DATA;
    return CATEGORY_DATA.filter((c) => c.name.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="mdp">
      <TopNav
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        cartCount={0}
        onCartClick={() => {}}
      />

      <div className="page-wrap">
        <div className="page-card">
          <h2>Categories</h2>
          <p className="page-sub">Browse medicines by category.</p>

          <div className="cat-grid">
            {filtered.map((c) => (
              <div className="cat-tile" key={c.id}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(32,180,106,0.12)",
                      border: "1px solid rgba(32,180,106,0.22)",
                      color: "#0f7a44",
                      fontSize: 18,
                      flex: "0 0 auto",
                    }}
                  >
                    {c.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="cat-title">{c.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{c.desc}</div>
                  </div>
                </div>

                <div className="cat-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Explore <FaArrowRight />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ marginTop: 14, color: "#6b7280" }}>
              No category found for “{q}”
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
