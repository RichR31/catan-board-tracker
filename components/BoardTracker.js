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
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row-reverse", gap: 60, justifyContent: "between", alignItems: "flex-start" }}>

      <div
        style={{
          display: "flex",
          width: 160,
          height: "100%",
          flexDirection: "column",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
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
          padding: 0,
          paddingRight: 50,
          display: "flex-column",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
          height: "700px",
          width: "700px",
          marginBottom: 16,
          border: "1px solid var(--panel-line)",
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
                    stroke="#d7da98"
                    strokeWidth="7"
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
                        <g>
                          {Array.from({ length: pips }).map((_, i) => {
                            const arcRadius = 9;
                            const spreadDeg = 80;
                            const startDeg = 90 - spreadDeg / 2;
                            const angleDeg = pips > 1 ? startDeg + (spreadDeg * i) / (pips - 1) : 90;
                            const angleRad = (angleDeg * Math.PI) / 180;
                            const centerX = tile.cx;
                            const centerY = tile.cy + 22;
                            return (
                              <circle
                                key={i}
                                cx={centerX + arcRadius * Math.cos(angleRad)}
                                cy={centerY + arcRadius * Math.sin(angleRad)}
                                r="1.2"
                                fill="var(--ink-soft)"
                              />
                            );
                          })}
                        </g>
                      )}
                    </g>
                  )}
                  {robberTileId === tile.id && (
                    <circle
                      cx={tile.cx}
                      cy={tile.cy+22}
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
              const angle = Math.atan2(port.ey2 - port.ey1, port.ex2 - port.ex1) * (180 / Math.PI);
              const rotation = `rotate(${angle} ${port.x} ${port.y})`;

              const halfLength = 32;
              const bulge = 20;

              return (
                <g
                  key={port.id}
                  onClick={() => handlePortClick(port)}
                  style={{ cursor: mode === "ports" ? "pointer" : "default" }}
                >
                  <line x1={port.ex1} y1={port.ey1} x2={port.x} y2={port.y}
                    stroke="var(--ink)" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1={port.ex2} y1={port.ey2} x2={port.x} y2={port.y}
                    stroke="var(--ink)" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 3" />

                  <path
                    d={`M ${port.x - halfLength} ${port.y}
                        Q ${port.x} ${port.y - bulge} ${port.x + halfLength} ${port.y}
                        Q ${port.x} ${port.y + bulge} ${port.x - halfLength} ${port.y}
                        Z`}
                    fill={isGeneric ? "var(--panel)" : colors.fill}
                    stroke="var(--ink)"
                    strokeWidth="1"
                    transform={rotation}
                  />

                  

                  <text
                    x={port.x}
                    y={port.y + 3.5}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill={isGeneric ? "var(--ink)" : colors.ink}
                    color='black'
                    transform={rotation}
                  >
                    {isGeneric ? "3:1" : "2:1"}
                  </text>

                  {!isGeneric && (
                    <image
                      href={`${port.type}.svg`}
                      x={port.x-12 }
                      y={port.y-25}
                      width="22"
                      height="22"
                      transform={rotation}
                    />
                  )}
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
                  stroke={player ? player.color : "transparent"}
                  strokeWidth={player ?7 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {vertices.map((vertex) => {
              const player = vertex.building && PLAYERS.find((p) => p.id === vertex.building.player);
              return (
                <g key={vertex.id}>
                  {player && vertex.building.type === "settlement" && (
                    <path
                      d="M 0,150 L 0,70 Q 0,60 7.59,53.49 L 62.41,6.51 Q 70,0 77.59,6.51 L 132.41,53.49 Q 140,60 140,70 L 140,150 Q 140,160 130,160 L 10,160 Q 0,160 0,150 Z"
                      transform={`translate(${vertex.x}, ${vertex.y}) scale(0.1) translate(-70, -80)`}
                      fill={player.color}
                      stroke="#d7da98"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth="1.5"
                    />
                  )}
                  {player && vertex.building.type === "city" && (
                    <path
                      d="M -10,7.4 L -10,0.6 Q -10,0 -9.6159,-0.4610 L -5.3841,-5.5390 Q -5,-6 -4.6159,-5.5390 L -0.3841,-0.4610 Q 0,0 0,-0.6 L 0,-9.4 Q 0,-10 0.6,-10 L 7.4,-10 Q 8,-10 8,-9.4 L 8,7.4 Q 8,8 7.4,8 L -9.4,8 Q -10,8 -10,7.4 Z"
                      transform={`translate(${vertex.x}, ${vertex.y})`}
                      fill={player.color}
                      stroke="#d7da98"
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

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
            <button
              onClick={resetBoard}
              style={{
                background: "transparent",
                border: "1px solid white",
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
