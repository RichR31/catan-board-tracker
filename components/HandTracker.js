"use client";

import { useEffect, useState } from "react";

const RESOURCES = [
  { id: "wood", label: "Wood", var: "wood", icon: "wood.svg" },
  { id: "brick", label: "Brick", var: "brick", icon: "brick.svg" },
  { id: "sheep", label: "Sheep", var: "sheep", icon: "sheep.svg" },
  { id: "wheat", label: "Wheat", var: "wheat", icon: "wheat.svg" },
  { id: "ore", label: "Ore", var: "ore", icon: "ore.svg" },
];

const DEV_CARDS = [
  { id: "knight", label: "Knight" },
  { id: "vp", label: "Victory point" },
  { id: "roadbuilding", label: "Road building" },
  { id: "invention", label: "Invention" },
  { id: "monopoly", label: "Monopoly" },
];

const STORAGE_KEY = "catan-hand-tracker-v1";

function initialState() {
  const state = {};
  RESOURCES.forEach((r) => (state[r.id] = 0));
  DEV_CARDS.forEach((d) => (state[d.id] = 0));
  return state;
}

export default function HandTracker() {
  const [counts, setCounts] = useState(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCounts({ ...initialState(), ...JSON.parse(saved) });
    } catch {
      // ignore, start fresh
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch {
      // storage unavailable, tracker still works for this session
    }
  }, [counts, loaded]);

  function adjust(id, delta) {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
  }

  function resetAll() {
    setCounts(initialState());
  }

  const resourceTotal = RESOURCES.reduce((sum, r) => sum + counts[r.id], 0);
  const devTotal = DEV_CARDS.reduce((sum, d) => sum + counts[d.id], 0);

  return (
    <div style={{ width: "100%"}}>
      <header style={{ marginBottom: 10, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 16,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          Your hand
        </h1>
      </header>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 10px",
          marginBottom: 30,
        }}
      >
        {RESOURCES.map((r) => (
           <ResourceCard key={r.id} resource={r} count={counts[r.id]} onAdjust={adjust} />
        ))}
      </section>

      <section style={{ marginBottom: 10 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--ink)",
            margin: "0 0 12px",
            textAlign: "center",
          }}
        >
          Development cards
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {DEV_CARDS.map((d) => (
            <DevCard key={d.id} card={d} count={counts[d.id]} onAdjust={adjust} />
          ))}
        </div>
      </section>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--panel-line)",
          paddingTop: 0,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {resourceTotal} resource{resourceTotal === 1 ? "" : "s"} &middot; {devTotal} development
          card{devTotal === 1 ? "" : "s"}
        </div>
        <button
          onClick={resetAll}
          style={{
            background: "transparent",
            border: "1px solid var(--panel-line)",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13,
            color: "var(--ink-soft)",
            cursor: "pointer",
          }}
        >
          Reset hand
        </button>
      </footer>
    </div>
  );
}

function ResourceCard({ resource, count, onAdjust }) {
  const bg = `var(--${resource.var})`;
  const fg = `var(--${resource.var}-ink)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 80, height: 90, borderRadius: "6px", background: bg}}>
      <div
        style={{
          color: fg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <img
          src={resource.icon}
          alt={resource.label}
          width="35"
          height="35"
          style={{
            objectFit: "contain",
            marginTop: 5,
            marginBottom: 2,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 25,
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
        <StepButton label={`Remove ${resource.label}`} onClick={() => onAdjust(resource.id, -1)}>
          &minus;
        </StepButton>
        <StepButton label={`Add ${resource.label}`} onClick={() => onAdjust(resource.id, 1)}>
          +
        </StepButton>
      </div>
    </div>
  );
}

function DevCard({ card, count, onAdjust }) {
  return (
    <div
      style={{
        background: "var(--dev-bg)",
        color: "var(--dev-ink)",
        borderRadius: "6px 6px 3px 3px",
        borderTop: "3px solid var(--ink)",
        padding: "10px 12px",
        width: 116,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        boxShadow: "var(--shadow)",
      }}
    >
      <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.25 }}>{card.label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}>
        {count}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <StepButton label={`Remove ${card.label}`} onClick={() => onAdjust(card.id, -1)} small>
          &minus;
        </StepButton>
        <StepButton label={`Add ${card.label}`} onClick={() => onAdjust(card.id, 1)} small>
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({ children, label, onClick, small }) {
  const size = small ? 22 : 26;
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid var(--ink)",
        background: "var(--panel)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: small ? 13 : 15,
        lineHeight: 1,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
