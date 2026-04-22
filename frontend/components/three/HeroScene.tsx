"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line, Html, Environment } from "@react-three/drei"
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing"
import * as THREE from "three"
import { useScrollStore } from "@/lib/scroll-store"

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_ANGLE  = Math.PI * 5
const HELIX_HEIGHT = 5.5
const HELIX_RADIUS = 1.1
const NODE_COUNT   = 14
const ORBIT_COUNT  = 35
const COSMIC_COUNT = 4000

// Module-level shared pointer — written by PointerTracker, read in useFrame
const sharedPointerPos = new THREE.Vector3(9999, 9999, 9999)

// ── Renderer setup ─────────────────────────────────────────────────────────────
function RendererSetup() {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.1
  }, [gl])
  return null
}


// ── CosmicField — 4 000-point twinkling nebula shader ─────────────────────────
function CosmicField() {
  const pointsRef = useRef<THREE.Points>(null)

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(COSMIC_COUNT * 3)
    const sizes     = new Float32Array(COSMIC_COUNT)

    for (let i = 0; i < COSMIC_COUNT; i++) {
      const r     = 5 + Math.random() * 18
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sizes[i] = 0.4 + Math.random() * 2.2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes,     1))

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time:   { value: 0 },
        color1: { value: new THREE.Color("#F5C842") },
        color2: { value: new THREE.Color("#A855F7") },
        color3: { value: new THREE.Color("#FF6B2B") },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        uniform float time;
        varying float vAlpha;
        varying float vColorMix;

        void main() {
          vAlpha    = 0.25 + 0.75 * abs(sin(time * 0.7 + position.x * 0.4 + position.y * 0.25));
          vColorMix = sin(position.y * 0.15 + position.x * 0.1) * 0.5 + 0.5;

          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (280.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying float vAlpha;
        varying float vColorMix;

        void main() {
          vec2  uv   = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;

          float alpha = (1.0 - dist * 2.0) * vAlpha * 0.55;
          vec3  col   = mix(mix(color1, color2, vColorMix), color3, vAlpha * 0.3);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const mat = pointsRef.current.material as THREE.ShaderMaterial
    mat.uniforms.time.value = state.clock.elapsedTime
    pointsRef.current.rotation.y += 0.00025
    pointsRef.current.rotation.x += 0.0001
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

// Bezier sampler for LineageEdges
function quadBezier(
  s: [number, number, number],
  m: [number, number, number],
  e: [number, number, number],
  segs = 28,
): [number, number, number][] {
  return Array.from({ length: segs + 1 }, (_, k) => {
    const t = k / segs, mt = 1 - t
    return [
      mt * mt * s[0] + 2 * mt * t * m[0] + t * t * e[0],
      mt * mt * s[1] + 2 * mt * t * m[1] + t * t * e[1],
      mt * mt * s[2] + 2 * mt * t * m[2] + t * t * e[2],
    ] as [number, number, number]
  })
}

// ── NeuralCore ─────────────────────────────────────────────────────────────────
function NeuralCore() {
  const hoveredNode   = useRef(-1)
  const nodeMeshRefs  = useRef<(THREE.Mesh | null)[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connLineRefs  = useRef<any[]>([])
  const tmpVec        = useMemo(() => new THREE.Vector3(), [])

  const nodePositions = useMemo(() =>
    Array.from({ length: NODE_COUNT }, (_, i) => {
      const phi   = Math.acos(-1 + (2 * i) / NODE_COUNT)
      const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi
      const r     = 0.28 + (i % 3) * 0.06
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      )
    }), [])

  const connections = useMemo(() => {
    const conns: { a: THREE.Vector3; b: THREE.Vector3; idxA: number; idxB: number }[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePositions
        .map((p, j) => ({ j, d: nodePositions[i].distanceTo(p) }))
        .filter(({ j }) => j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
        .forEach(({ j }) => {
          if (j > i) conns.push({ a: nodePositions[i], b: nodePositions[j], idxA: i, idxB: j })
        })
    }
    return conns
  }, [nodePositions])

  const { sphereGeo, nodeMaterials } = useMemo(() => ({
    sphereGeo: new THREE.SphereGeometry(0.045, 10, 10),
    nodeMaterials: Array.from({ length: NODE_COUNT }, (_, i) =>
      new THREE.MeshPhysicalMaterial({
        color:                     i % 2 === 0 ? "#F5C842" : "#A855F7",
        emissive:                  i % 2 === 0 ? "#F5C842" : "#A855F7",
        emissiveIntensity:         2,
        metalness:                 0,
        roughness:                 0.05,
        iridescence:               0.6,
        iridescenceIOR:            1.3,
        iridescenceThicknessRange: [100, 400] as [number, number],
        clearcoat:                 1,
        clearcoatRoughness:        0,
      })
    ),
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // World-space proximity hover — works even inside rotating group
    let newHov = -1
    nodeMeshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.getWorldPosition(tmpVec)
      const dx = tmpVec.x - sharedPointerPos.x
      const dy = tmpVec.y - sharedPointerPos.y
      if (Math.sqrt(dx * dx + dy * dy) < 0.22) newHov = i
    })
    hoveredNode.current = newHov
    const hov = newHov

    nodeMaterials.forEach((mat, i) => {
      const base   = 1.8 + Math.sin(t * 2 + i * 0.3) * 0.8
      const boost  = hov === i ? 3.5 + Math.sin(t * 8) * 1.2 : 0
      mat.emissiveIntensity = base + boost
    })

    nodeMeshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const target = hov === i ? 2.0 : 1.0
      mesh.scale.setScalar(mesh.scale.x + (target - mesh.scale.x) * 0.14)
    })

    connections.forEach(({ idxA, idxB }, i) => {
      const line = connLineRefs.current[i]
      if (!line?.material) return
      const active = hov === idxA || hov === idxB
      line.material.opacity += ((active ? 0.95 : 0.4) - line.material.opacity) * 0.13
    })
  })

  return (
    <group>
      {nodePositions.map((pos, i) => (
        <mesh
          key={`n${i}`}
          ref={(el) => { nodeMeshRefs.current[i] = el }}
          position={pos}
          geometry={sphereGeo}
          material={nodeMaterials[i]}
        />
      ))}
      {connections.map(({ a, b }, i) => (
        <Line
          key={`s${i}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { connLineRefs.current[i] = el }}
          points={[a, b]}
          color="#FF6B2B"
          opacity={0.4}
          transparent
          lineWidth={1}
        />
      ))}
    </group>
  )
}

// ── LineageEdges ───────────────────────────────────────────────────────────────
function LineageEdges() {
  const hoveredTerminal = useRef(-1)
  const wasHovered      = useRef(-1)
  const [labelIdx, setLabelIdx] = useState(-1)
  const terminalMeshRefs = useRef<(THREE.Mesh | null)[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edgeLineRefs     = useRef<any[]>([])
  const tmpVec           = useMemo(() => new THREE.Vector3(), [])

  const { edges, terminalGeo, terminalMats } = useMemo(() => {
    const edges = Array.from({ length: 9 }, (_, i) => {
      const t          = (i / 9) * TOTAL_ANGLE
      const y          = (i / 9) * HELIX_HEIGHT - HELIX_HEIGHT / 2
      const startAngle = t + Math.PI * 0.25
      const startR     = HELIX_RADIUS * 0.5
      const start: [number, number, number] = [startR * Math.cos(startAngle), y, startR * Math.sin(startAngle)]
      const endAngle   = t + (i % 3 - 1) * 0.4
      const endR       = 2.1 + (i % 4) * 0.18
      const end: [number, number, number]   = [endR * Math.cos(endAngle), y + (i % 5 - 2) * 0.3, endR * Math.sin(endAngle)]
      const mid: [number, number, number]   = [
        (start[0] + end[0]) * 0.5 + Math.cos(endAngle + Math.PI / 3) * 0.4,
        (start[1] + end[1]) * 0.5,
        (start[2] + end[2]) * 0.5 + Math.sin(endAngle + Math.PI / 3) * 0.4,
      ]
      return { start, mid, end, points: quadBezier(start, mid, end) }
    })

    return {
      edges,
      terminalGeo: new THREE.SphereGeometry(0.05, 8, 8),
      terminalMats: Array.from({ length: 9 }, () =>
        new THREE.MeshPhysicalMaterial({
          color:             "#F59E0B",
          emissive:          "#F59E0B",
          emissiveIntensity: 1.8,
          metalness:         0,
          roughness:         0.05,
          clearcoat:         1,
          clearcoatRoughness: 0,
        })
      ),
    }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // World-space proximity hover
    let newHov = -1
    terminalMeshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.getWorldPosition(tmpVec)
      const dx = tmpVec.x - sharedPointerPos.x
      const dy = tmpVec.y - sharedPointerPos.y
      if (Math.sqrt(dx * dx + dy * dy) < 0.2) newHov = i
    })
    hoveredTerminal.current = newHov

    if (newHov !== wasHovered.current) {
      wasHovered.current = newHov
      setLabelIdx(newHov)
    }

    edges.forEach((_, i) => {
      const mesh = terminalMeshRefs.current[i]
      const mat  = terminalMats[i]
      const hov  = newHov

      if (mesh) {
        const target = hov === i ? 2.5 : 1.0
        mesh.scale.setScalar(mesh.scale.x + (target - mesh.scale.x) * 0.13)
      }
      if (mat) {
        mat.emissiveIntensity = 1.8 + Math.sin(t * 1.6 + i * 0.4) * 0.4 + (hov === i ? 4.0 : 0)
      }

      const line = edgeLineRefs.current[i]
      if (line?.material) {
        const target = hov === i ? 0.92 : 0.3
        line.material.opacity += (target - line.material.opacity) * 0.13
      }
    })
  })

  return (
    <group>
      {edges.map(({ points, end }, i) => (
        <group key={i}>
          <Line
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={(el: any) => { edgeLineRefs.current[i] = el }}
            points={points}
            color="#F59E0B"
            opacity={0.3}
            transparent
            lineWidth={1.5}
          />
          <mesh
            ref={(el) => { terminalMeshRefs.current[i] = el }}
            position={end}
            geometry={terminalGeo}
            material={terminalMats[i]}
          />
        </group>
      ))}

      {labelIdx >= 0 && (
        <Html
          position={edges[labelIdx].end}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            color:         "#F59E0B",
            fontFamily:    "monospace",
            fontSize:      "8px",
            letterSpacing: "0.24em",
            textTransform: "uppercase" as const,
            whiteSpace:    "nowrap",
            background:    "rgba(10,10,15,0.88)",
            padding:       "3px 9px",
            border:        "1px solid rgba(245,158,11,0.28)",
            borderRadius:  "2px",
          }}>
            link.{String(labelIdx + 1).padStart(2, "0")}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── OrbitingParticles ──────────────────────────────────────────────────────────
function OrbitingParticles() {
  const cyanRef   = useRef<THREE.InstancedMesh>(null)
  const violetRef = useRef<THREE.InstancedMesh>(null)
  const dummy     = useMemo(() => new THREE.Object3D(), [])
  const tempVec   = useMemo(() => new THREE.Vector3(), [])

  const { particles, geo, cyanMat, violetMat } = useMemo(() => {
    const particles = Array.from({ length: ORBIT_COUNT }, (_, i) => ({
      radius: 1.8 + (i / ORBIT_COUNT) * 1.4,
      y:      ((i * 7 % ORBIT_COUNT) / ORBIT_COUNT - 0.5) * 3.0,
      speed:  0.003 + (i / ORBIT_COUNT) * 0.005,
      angle:  (i / ORBIT_COUNT) * Math.PI * 2,
    }))
    const geo = new THREE.SphereGeometry(0.035, 6, 6)
    return {
      particles,
      geo,
      cyanMat:   new THREE.MeshStandardMaterial({ color: "#F5C842", emissive: "#F5C842", emissiveIntensity: 2.5, transparent: true, opacity: 0.7 }),
      violetMat: new THREE.MeshStandardMaterial({ color: "#A855F7", emissive: "#A855F7", emissiveIntensity: 2.5, transparent: true, opacity: 0.7 }),
    }
  }, [])

  useFrame((state) => {
    const t          = state.clock.elapsedTime
    const progress   = useScrollStore.getState().heroProgress
    const scrollMult = 1 + progress * 3

    if (cyanRef.current) {
      particles.forEach((p, i) => {
        const a  = p.angle + t * p.speed * scrollMult
        const px = p.radius * Math.cos(a)
        const pz = p.radius * Math.sin(a)
        tempVec.set(px, p.y, pz)
        const proximity = Math.max(0, 1 - tempVec.distanceTo(sharedPointerPos) / 2.4)
        const finalA = p.angle + t * p.speed * scrollMult * (1 + proximity * 0.9)
        dummy.position.set(p.radius * Math.cos(finalA), p.y, p.radius * Math.sin(finalA))
        dummy.scale.setScalar(1 + proximity * 1.2)
        dummy.updateMatrix()
        cyanRef.current!.setMatrixAt(i, dummy.matrix)
      })
      cyanRef.current.instanceMatrix.needsUpdate = true
    }

    if (violetRef.current) {
      particles.forEach((p, i) => {
        const a  = p.angle + Math.PI + t * p.speed * 0.7 * scrollMult
        const r2 = p.radius + 0.4
        const px = r2 * Math.cos(a)
        const pz = r2 * Math.sin(a)
        tempVec.set(px, -p.y * 0.8, pz)
        const proximity = Math.max(0, 1 - tempVec.distanceTo(sharedPointerPos) / 2.4)
        const finalA = p.angle + Math.PI + t * p.speed * 0.7 * scrollMult * (1 + proximity * 0.9)
        dummy.position.set(r2 * Math.cos(finalA), -p.y * 0.8, r2 * Math.sin(finalA))
        dummy.scale.setScalar(1 + proximity * 1.2)
        dummy.updateMatrix()
        violetRef.current!.setMatrixAt(i, dummy.matrix)
      })
      violetRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={cyanRef}   args={[geo, cyanMat,   ORBIT_COUNT]} />
      <instancedMesh ref={violetRef} args={[geo, violetMat, ORBIT_COUNT]} />
    </group>
  )
}

// ── BabyNode ───────────────────────────────────────────────────────────────────
function BabyNode() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { geo, mat } = useMemo(() => ({
    geo: new THREE.SphereGeometry(0.22, 18, 18),
    mat: new THREE.MeshPhysicalMaterial({
      color:             "#F59E0B",
      emissive:          "#F59E0B",
      emissiveIntensity: 3,
      metalness:         0,
      roughness:         0.03,
      clearcoat:         1,
      clearcoatRoughness: 0,
    }),
  }), [])

  useFrame((state) => {
    const progress = useScrollStore.getState().heroProgress
    const appear   = Math.max(0, (progress - 0.65) / 0.2)
    if (!meshRef.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.09 * appear
    meshRef.current.scale.setScalar(appear * pulse)
    mat.emissiveIntensity = 2.5 + Math.sin(state.clock.elapsedTime * 2.2) * 1.2
  })

  return <mesh ref={meshRef} position={[0, 0, 0]} geometry={geo} material={mat} />
}

// ── Scene — scroll-driven camera ──────────────────────────────────────────────
function Scene() {
  const innerRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const hero   = useScrollStore.getState().heroProgress
    const global = useScrollStore.getState().globalProgress
    const t      = state.clock.elapsedTime

    // Base rotation + breathing
    if (innerRef.current) {
      innerRef.current.rotation.y += 0.003 + hero * 0.007
      const s = 1 + Math.sin(t * 0.75) * 0.04
      innerRef.current.scale.set(s, s, s)
    }

    // Global scroll camera path
    const camZ = 2.8 + global * 4.5
    const camX = Math.sin(global * Math.PI * 0.6) * 0.6
    const camY = -global * 0.5
    state.camera.position.x += (camX - state.camera.position.x) * 0.018
    state.camera.position.y += (camY - state.camera.position.y) * 0.018
    state.camera.position.z += (camZ - state.camera.position.z) * 0.022
    state.camera.lookAt(0, 3.0, 0)
  })

  return (
    <group ref={innerRef}>
      <NeuralCore />
      <LineageEdges />
      <OrbitingParticles />
      <BabyNode />
    </group>
  )
}

// ── HeroScene ──────────────────────────────────────────────────────────────────
export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0.3, 0.6, 2.8], fov: 68 }}
      dpr={[1, 1.5]}
      gl={{
        antialias:       true,
        alpha:           false,
        powerPreference: "high-performance" as const,
      }}
      style={{ width: "100%", height: "100%", background: "#07060A" }}
      frameloop="always"
    >
      <RendererSetup />

      <ambientLight intensity={0.4} />
      <pointLight position={[4,  4,  3]}  color="#F5C842" intensity={2.0} />
      <pointLight position={[-4, -3, 2]}  color="#A855F7" intensity={1.8} />
      <pointLight position={[0,  0, -4]}  color="#FF6B2B" intensity={0.8} />

      <Environment preset="studio" background={false} />
      <fog attach="fog" args={["#07060A", 14, 32]} />

      <CosmicField />
      <Scene />

      <EffectComposer>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.04}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Noise opacity={0.035} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
