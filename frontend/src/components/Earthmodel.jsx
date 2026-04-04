// src/components/EarthModel.jsx
import { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stars, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { fetchTopAttackedCountries } from "../services/radarService";

// ── lat/lon → 3D position ─────────────────────────────────────────────────────
function latLonToVec3(lat, lon, radius = 1.55) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Single animated pin ───────────────────────────────────────────────────────
function ThreatPin({ lat, lon, color, severity, country, value, attacks, rank, onHover }) {
  const ringRef  = useRef();
  const outerRef = useRef();
  const phase    = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const pos = latLonToVec3(lat, lon);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    pos.clone().normalize()
  );

  // Pulse animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase.current;
    if (ringRef.current) {
      const s = 1 + 0.9 * ((t % (Math.PI * 2)) / (Math.PI * 2));
      ringRef.current.scale.setScalar(s);
      ringRef.current.material.opacity = 0.85 * (1 - (s - 1) / 0.9);
    }
    if (outerRef.current) {
      const s2 = 1 + 0.9 * (((t + 1.2) % (Math.PI * 2)) / (Math.PI * 2));
      outerRef.current.scale.setScalar(s2);
      outerRef.current.material.opacity = 0.4 * (1 - (s2 - 1) / 0.9);
    }
  });

  const dotSize   = severity === "critical" ? 0.024 : severity === "high" ? 0.019 : 0.015;
  const ringInner = dotSize * 1.4;
  const ringOuter = dotSize * 2.1;

  return (
    <group
      position={pos}
      quaternion={quaternion}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover({ country, value, attacks, rank, severity, color });
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
      }}
    >
      {/* Glow behind the dot */}
      <mesh>
        <circleGeometry args={[dotSize * 2.5, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[hovered ? dotSize * 1.7 : dotSize, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : color} />
      </mesh>

      {/* Inner pulse ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[ringInner, ringOuter, 32]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Outer pulse ring — critical & high only */}
      {severity !== "elevated" && (
        <mesh ref={outerRef}>
          <ringGeometry args={[ringOuter * 1.5, ringOuter * 1.85, 32]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Rank badge — always visible */}
      <Html
        position={[0, 0, 0.05]}
        center
        distanceFactor={5.5}
        zIndexRange={[0, 10]}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          background: "rgba(0,0,0,0.82)",
          border: `1.5px solid ${color}`,
          borderRadius: "50%",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: "800",
          color,
          fontFamily: "monospace",
          userSelect: "none",
          transform: "translate(-50%, -260%)",
          boxShadow: `0 0 6px ${color}88`,
        }}>
          {rank}
        </div>
      </Html>
    </group>
  );
}

// ── Earth GLTF mesh ───────────────────────────────────────────────────────────
function EarthGLTF() {
  const groupRef = useRef();
  const { scene } = useGLTF("/earth/scene.gltf");
  const cloned = scene.clone(true);

  cloned.traverse((node) => {
    if (node.isMesh && node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((m) => { m.envMapIntensity = 1.4; m.needsUpdate = true; });
    }
  });

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  return <primitive ref={groupRef} object={cloned} scale={1} />;
}

// ── Hover tooltip (DOM overlay, not in Canvas) ────────────────────────────────
function Tooltip({ data }) {
  if (!data) return null;
  const { country, value, attacks, rank, severity, color } = data;

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  const severityLabel =
    severity === "critical" ? "CRITICAL" :
    severity === "high"     ? "HIGH"     : "ELEVATED";

  return (
    <div style={{
      position: "absolute",
      top: "16px",
      left: "16px",
      background: "linear-gradient(135deg, rgba(5,5,25,0.95), rgba(10,5,30,0.92))",
      border: `1px solid ${color}`,
      borderRadius: "14px",
      padding: "14px 18px",
      color: "#fff",
      fontFamily: "'Courier New', monospace",
      fontSize: "12px",
      lineHeight: "1.9",
      pointerEvents: "none",
      zIndex: 20,
      backdropFilter: "blur(10px)",
      boxShadow: `0 0 30px ${color}55, 0 4px 20px rgba(0,0,0,0.6)`,
      minWidth: "220px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", borderBottom: `1px solid ${color}44`, paddingBottom: "8px" }}>
        <span style={{ fontSize: "18px" }}>{medal}</span>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "bold", color }}>{country}</div>
          <div style={{ fontSize: "10px", color: "#888", letterSpacing: "1px" }}>ATTACK ORIGIN</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 10px" }}>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>SHARE</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color }}>{value}%</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 10px" }}>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>THREAT</div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color }}>{severityLabel}</div>
        </div>
      </div>

      <div style={{ marginTop: "8px", color: "#aaa", fontSize: "11px" }}>
        Est. volume: <span style={{ color: "#fff", fontWeight: "bold" }}>{attacks.toLocaleString()} units</span>
      </div>
    </div>
  );
}

// ── Status bar ────────────────────────────────────────────────────────────────
function StatusBar({ isLive, lastUpdated, loading }) {
  const col = loading ? "#666" : isLive ? "#00ff88" : "#ff9900";
  return (
    <div style={{
      position: "absolute",
      bottom: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(5,5,20,0.80)",
      border: `1px solid ${col}`,
      borderRadius: "20px",
      padding: "5px 16px",
      fontSize: "10px",
      fontFamily: "monospace",
      color: col,
      display: "flex",
      alignItems: "center",
      gap: "7px",
      zIndex: 20,
      backdropFilter: "blur(8px)",
      whiteSpace: "nowrap",
      letterSpacing: "0.5px",
    }}>
      <span style={{
        width: "7px", height: "7px", borderRadius: "50%",
        background: col, display: "inline-block",
        animation: !loading ? "sbpulse 1.5s infinite" : "none",
      }} />
      {loading
        ? "FETCHING THREAT DATA…"
        : isLive
          ? `● LIVE  ·  Cloudflare Radar  ·  ${lastUpdated}`
          : "● STATIC DATA  ·  Set CLOUDFLARE_TOKEN for live feed"}
      <style>{`@keyframes sbpulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "rgba(5,5,20,0.82)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "11px",
      fontFamily: "monospace",
      color: "#aaa",
      zIndex: 20,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ color: "#fff", marginBottom: "8px", fontWeight: "bold", letterSpacing: "1px", fontSize: "10px" }}>
        THREAT LEVEL
      </div>
      {[
        { color: "#ff2244", label: "Critical", sub: "Rank 1–3"  },
        { color: "#ff9900", label: "High",     sub: "Rank 4–6"  },
        { color: "#ffee00", label: "Elevated", sub: "Rank 7–10" },
      ].map(({ color, label, sub }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{
            width: "9px", height: "9px", borderRadius: "50%",
            background: color, display: "inline-block",
            boxShadow: `0 0 6px ${color}`,
          }} />
          <span style={{ color: "#ddd" }}>{label}</span>
          <span style={{ color: "#555", fontSize: "10px" }}>{sub}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "8px", paddingTop: "8px", fontSize: "10px", color: "#555" }}>
        Hover pin for details
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EarthModel() {
  const [threats,     setThreats]     = useState([]);
  const [hoveredPin,  setHoveredPin]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isLive,      setIsLive]      = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await fetchTopAttackedCountries();
      if (!cancelled) {
        setThreats(data);
        setIsLive(data[0]?.isLive ?? false);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      }
    }

    load();
    const iv = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "520px", position: "relative" }}>
      <Tooltip data={hoveredPin} />
      <Legend />
      <StatusBar isLive={isLive} lastUpdated={lastUpdated} loading={loading} />

      <Canvas
        camera={{ position: [0, 0.6, 3.2], fov: 42 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "transparent" }}
      >
        <Stars radius={200} depth={50} count={6000} factor={3} fade speed={0.4} />

        <ambientLight intensity={0.05} />
        <directionalLight position={[4, 2, 3]}   intensity={3.8}  color="#fff8e7" />
        <directionalLight position={[-5, 1, -4]} intensity={1.1}  color="#2255cc" />
        <directionalLight position={[0, -3, -5]} intensity={0.4}  color="#112244" />
        <directionalLight position={[0, 8, 0]}   intensity={0.25} color="#aabbff" />

        <Environment preset="night" />

        <Suspense fallback={null}>
          <EarthGLTF />

          {!loading && threats.map((t) => (
            <ThreatPin key={t.code} {...t} onHover={setHoveredPin} />
          ))}
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.3}
          minDistance={1.8}
          maxDistance={6}
          enablePan={false}
          autoRotate={!hoveredPin}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/earth/scene.gltf");