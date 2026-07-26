"use client";

import { useEffect, useMemo, useState } from "react";
import { generateBoard, RESOURCE_CYCLE, NUMBER_CYCLE, pipsForNumber } from "@/lib/board";

const PORT_CYCLE = ["3:1", "wood", "brick", "sheep", "wheat", "ore"];

const STORAGE_KEY = "catan-board-tracker-v1";

const RESOURCE_COLORS = {
  desert: { fill: "var(--desert)", ink: "var(--desert-ink)" },
  wood: { fill: "var(--wood)", ink: "var(--wood-ink)" },
  brick: { fill: "var(--brick)", ink: "var(--brick-ink)" },
  sheep: { fill: "var(--sheep)", ink: "var(--sheep-ink)" },
  wheat: { fill: "var(--wheat)", ink: "var(--wheat-ink)" },
  ore: { fill: "var(--ore)", ink: "var(--ore-ink)" },
};

const RESOURCE_IMAGES = {
  brick: "brick.svg",
  wood: "wood.svg",
  sheep: "sheep.svg",
  wheat: "wheat.svg",
  ore: "ore.svg",
};

const PLAYERS = [
  { id: "red", color: "var(--player-red)" },
  { id: "blue", color: "var(--player-blue)" },
  { id: "orange", color: "var(--player-orange)" },
  { id: "white", color: "var(--player-white)" },
];

const MODES = [
  { id: "tiles", label: "Tiles" },
  { id: "ports", label: "Ports" },
  { id: "roads", label: "Roads" },
  { id: "buildings", label: "Buildings" },
  { id: "robber", label: "Robber" },
];

const PADDING = 56;

export default function BoardTracker() {
  const base = useMemo(() => generateBoard(), []);
  const [tiles, setTiles] = useState(base.tiles);
  const [vertices, setVertices] = useState(base.vertices);
  const [edges, setEdges] = useState(base.edges);
  const [ports, setPorts] = useState(base.ports);
  const [robberTileId, setRobberTileId] = useState(base.tiles.find((t) => t.resource === "desert")?.id ?? null);
  const [mode, setMode] = useState("buildings");
  const [activePlayer, setActivePlayer] = useState("red");
  const [activePiece, setActivePiece] = useState("settlement");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        if (saved.tiles) {
          setTiles((prev) =>
            prev.map((t) => {
              const s = saved.tiles.find((x) => x.id === t.id);
              return s ? { ...t, resource: s.resource, number: s.number } : t;
            })
          );
        }
        if (saved.vertices) {
          setVertices((prev) =>
            prev.map((v) => {
              const s = saved.vertices.find((x) => x.id === v.id);
              return s ? { ...v, building: s.building } : v;
            })
          );
        }
        if (saved.edges) {
          setEdges((prev) =>
            prev.map((e) => {
              const s = saved.edges.find((x) => x.id === e.id);
              return s ? { ...e, road: s.road } : e;
            })
          );
        }
        if (saved.ports) {
          setPorts((prev) =>
            prev.map((p) => {
              const s = saved.ports.find((x) => x.id === p.id);
              return s ? { ...p, type: s.type } : p;
            })
          );
        }
        if (saved.robberTileId !== undefined) setRobberTileId(saved.robberTileId);
      }
    } catch {
      // ignore, start fresh
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tiles: tiles.map((t) => ({ id: t.id, resource: t.resource, number: t.number })),
          vertices: vertices.map((v) => ({ id: v.id, building: v.building })),
          edges: edges.map((e) => ({ id: e.id, road: e.road })),
          ports: ports.map((p) => ({ id: p.id, type: p.type })),
          robberTileId,
        })
      );
    } catch {
      // storage unavailable, tracker still works for this session
    }
  }, [tiles, vertices, edges, ports, robberTileId, loaded]);

  function handleTileClick(tile) {
    if (mode === "robber") {
      setRobberTileId(tile.id);
      return;
    }
    if (mode !== "tiles") return;
    setTiles((prev) =>
      prev.map((t) => {
        if (t.id !== tile.id) return t;
        const idx = RESOURCE_CYCLE.indexOf(t.resource);
        const nextResource = RESOURCE_CYCLE[(idx + 1) % RESOURCE_CYCLE.length];
        const nextNumber = nextResource === "desert" ? null : t.number ?? 6;
        return { ...t, resource: nextResource, number: nextNumber };
      })
    );
  }

  function handleNumberClick(e, tile) {
    e.stopPropagation();
    if (mode !== "tiles" || tile.resource === "desert") return;
    setTiles((prev) =>
      prev.map((t) => {
        if (t.id !== tile.id) return t;
        const idx = NUMBER_CYCLE.indexOf(t.number);
        const next = NUMBER_CYCLE[(idx + 1) % NUMBER_CYCLE.length];
        return { ...t, number: next };
      })
    );
  }

  function handlePortClick(port) {
    if (mode !== "ports") return;
    setPorts((prev) =>
      prev.map((p) => {
        if (p.id !== port.id) return p;
        const idx = PORT_CYCLE.indexOf(p.type);
        const next = PORT_CYCLE[(idx + 1) % PORT_CYCLE.length];
        return { ...p, type: next };
      })
    );
  }

  function handleVertexClick(vertex) {
    if (mode !== "buildings") return;
    setVertices((prev) =>
      prev.map((v) => {
        if (v.id !== vertex.id) return v;
        const same =
          v.building && v.building.player === activePlayer && v.building.type === activePiece;
        return { ...v, building: same ? null : { player: activePlayer, type: activePiece } };
      })
    );
  }

  function handleEdgeClick(edge) {
    if (mode !== "roads") return;
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== edge.id) return e;
        return { ...e, road: e.road === activePlayer ? null : activePlayer };
      })
    );
  }

  function resetBoard() {
    const fresh = generateBoard();
    setTiles(fresh.tiles);
    setVertices(fresh.vertices);
    setEdges(fresh.edges);
    setPorts(fresh.ports);
    setRobberTileId(fresh.tiles.find((t) => t.resource === "desert")?.id ?? null);
  }

  const width = base.bounds.maxX - base.bounds.minX + PADDING * 2;
  const height = base.bounds.maxY - base.bounds.minY + PADDING * 2;
  const offsetX = PADDING - base.bounds.minX;
  const offsetY = PADDING - base.bounds.minY;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row-reverse" }}>

      <div
        style={{
          display: "flex",
          width: 150,
          height: "100%",
          flexDirection: "column",
          flexWrap: "wrap",
          justifyContent: "center",
          itemsAlign: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", textAlign: "center" }}>Settings</p>
        
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 6,
              background: mode === m.id ? "var(--ink)" : "var(--panel)",
              color: mode === m.id ? "var(--panel)" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}

        {(mode === "roads" || mode === "buildings") && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {PLAYERS.map((p) => (
              <button
                key={p.id}
                aria-label={`Play as ${p.id}`}
                onClick={() => setActivePlayer(p.id)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: p.color,
                  border:
                    activePlayer === p.id ? "3px solid var(--ink)" : "1px solid var(--ink-soft)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {mode === "buildings" && (
                <div style={{ display: "flex", gap: 6 }}>
                  {["settlement", "city"].map((piece) => (
                    <button
                      key={piece}
                      onClick={() => setActivePiece(piece)}
                      style={{
                        fontSize: 13,
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--ink-soft)",
                        background: activePiece === piece ? "var(--dev-bg)" : "var(--panel)",
                        color: "var(--ink)",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {piece}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          
        <p
          style={{
            fontSize: 12,
            width: '100px',
            height: 'fit-content',
            color: "var(--ink-soft)",
            textAlign: "center",
            justifyContent: "center",
            itemsAlign: "center",
            margin: "0 0"
          }}
        >
          {mode === "tiles" && "Tap a tile to cycle its resource, tap the number to change it."}
          {mode === "ports" && "Tap a harbor to cycle its trade ratio and resource."}
          {mode === "roads" && "Tap an edge to add or remove a road for the selected color."}
          {mode === "buildings" &&
            "Tap a corner to place or remove a settlement or city for the selected color."}
          {mode === "robber" && "Tap a tile to move the robber there."}
        </p>

      </div>


      

      <div
        style={{
          background: "var(--water)",
          borderRadius: 12,
          padding: 8,
          height: "720px",
          width: "720px",
          marginBottom: 16,
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Catan board layout with tiles, roads, and buildings"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <g transform={`translate(${offsetX} ${offsetY})`}>
            {tiles.map((tile) => {
              const colors = RESOURCE_COLORS[tile.resource];
              const points = tile.corners.map((c) => `${c.x},${c.y}`).join(" ");
              const pips = tile.number ? pipsForNumber(tile.number) : 0;
              return (
                <g key={tile.id} onClick={() => handleTileClick(tile)} style={{ cursor: "pointer" }}>
                  <polygon
                    points={points}
                    fill={colors.fill}
                    stroke="var(--ink)"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                  <image
                    href={RESOURCE_IMAGES[tile.resource]}
                    x={tile.cx - 20}
                    y={tile.cy - 20}
                    width="40"
                    height="40"
                    opacity={0.8}
                    pointerEvents="none"
                  />
                  {tile.number && (
                    <g onClick={(e) => handleNumberClick(e, tile)}>
                      <circle
                        cx={tile.cx}
                        cy={tile.cy+22}
                        r="14"
                        fill="var(--panel)"
                        stroke="var(--ink)"
                        strokeWidth="0.5"
                      />
                      <text
                        x={tile.cx}
                        y={tile.cy + 26}
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-display)"
                        fontWeight="600"
                        fill={tile.number === 6 || tile.number === 8 ? "var(--brick)" : "var(--ink)"}
                      >
                        {tile.number}
                      </text>
                      {pips > 0 && (
                        <text
                          x={tile.cx}
                          y={tile.cy + 14}
                          textAnchor="middle"
                          fontSize="6"
                          letterSpacing="1"
                          fill="var(--ink-soft)"
                        >
                          {"•".repeat(pips)}
                        </text>
                      )}
                    </g>
                  )}
                  {robberTileId === tile.id && (
                    <circle
                      cx={tile.cx}
                      cy={tile.cy+24}
                      r="14"
                      fill="gray"
                      stroke="var(--panel)"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}

            {ports.map((port) => {
              const isGeneric = port.type === "3:1";
              const colors = isGeneric ? null : RESOURCE_COLORS[port.type];
              return (
                <g
                  key={port.id}
                  onClick={() => handlePortClick(port)}
                  style={{ cursor: mode === "ports" ? "pointer" : "default" }}
                >
                  <line
                    x1={port.ex1}
                    y1={port.ey1}
                    x2={port.x}
                    y2={port.y}
                    stroke="var(--ink)"
                    strokeOpacity="0.45"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={port.ex2}
                    y1={port.ey2}
                    x2={port.x}
                    y2={port.y}
                    stroke="var(--ink)"
                    strokeOpacity="0.45"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={port.x}
                    cy={port.y}
                    r="13"
                    fill={isGeneric ? "var(--panel)" : colors.fill}
                    stroke="var(--ink)"
                    strokeWidth="1"
                  />
                  <text
                    x={port.x}
                    y={port.y + 3.5}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill={isGeneric ? "var(--ink)" : colors.ink}
                  >
                    {isGeneric ? "3:1" : "2:1"}
                  </text>
                </g>
              );
            })}

            {edges.map((edge) => {
              const player = PLAYERS.find((p) => p.id === edge.road);
              return (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={player ? player.color : "var(--panel-line)"}
                  strokeWidth={player ? 5 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {vertices.map((vertex) => {
              const player = vertex.building && PLAYERS.find((p) => p.id === vertex.building.player);
              return (
                <g key={vertex.id}>
                  {player && vertex.building.type === "settlement" && (
                    <circle
                      cx={vertex.x}
                      cy={vertex.y}
                      r="6"
                      fill={player.color}
                      stroke="var(--ink)"
                      strokeWidth="1"
                    />
                  )}
                  {player && vertex.building.type === "city" && (
                    <rect
                      x={vertex.x - 6}
                      y={vertex.y - 6}
                      width="12"
                      height="12"
                      fill={player.color}
                      stroke="var(--ink)"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}

            {edges.map((edge) => (
              <line
                key={`hit-${edge.id}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="transparent"
                strokeWidth="14"
                style={{ cursor: mode === "roads" ? "pointer" : "default" }}
                onClick={() => handleEdgeClick(edge)}
              />
            ))}

            {vertices.map((vertex) => (
              <circle
                key={`hit-${vertex.id}`}
                cx={vertex.x}
                cy={vertex.y}
                r="10"
                fill="transparent"
                style={{ cursor: mode === "buildings" ? "pointer" : "default" }}
                onClick={() => handleVertexClick(vertex)}
              />
            ))}
          </g>
        </svg>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={resetBoard}
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
              Reset board
            </button>
          </div>
        </div>



      
    </div>
  );
}
