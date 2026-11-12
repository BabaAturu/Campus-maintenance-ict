import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const KEY_LAYOUT = Array.from({ length: 5 }, (_, row) => {
  const keyCount = row === 4 ? 9 : 13
  const start = -(keyCount - 1) * 0.19 / 2
  return Array.from({ length: keyCount }, (_, column) => ({
    x: start + column * 0.19,
    y: 0.101,
    z: -0.73 + row * 0.22,
  }))
}).flat()

const PARTICLE_DIRECTIONS = Array.from({ length: 72 }, (_, index) => {
  const y = 1 - (index / 71) * 2
  const radius = Math.sqrt(1 - y * y)
  const angle = index * Math.PI * (3 - Math.sqrt(5))
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
})

function KeyboardKeys() {
  const keyboard = useMemo(() => {
    const geometry = new THREE.BoxGeometry(0.145, 0.035, 0.14)
    const material = new THREE.MeshStandardMaterial({ color: '#202a36', metalness: 0.28, roughness: 0.42 })
    const mesh = new THREE.InstancedMesh(geometry, material, KEY_LAYOUT.length)
    const dummy = new THREE.Object3D()

    KEY_LAYOUT.forEach(({ x, y, z }, index) => {
      dummy.position.set(x, y, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = true
    return mesh
  }, [])

  useEffect(() => () => {
    keyboard.geometry.dispose()
    keyboard.material.dispose()
  }, [keyboard])

  return <primitive object={keyboard} />
}

function CircuitBoard({ boardRef, ledRefs }) {
  const circuits = [
    { position: [-0.73, 0.035, -0.28], size: [0.75, 0.012, 0.025] },
    { position: [0.51, 0.035, -0.42], size: [0.82, 0.012, 0.025] },
    { position: [-0.2, 0.035, 0.22], size: [0.9, 0.012, 0.025] },
    { position: [0.83, 0.035, 0.31], size: [0.42, 0.012, 0.025] },
  ]

  return (
    <group ref={boardRef} position={[0, -0.75, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.52, 0.055, 1.53]} />
        <meshStandardMaterial color="#153b35" metalness={0.45} roughness={0.48} />
      </mesh>
      {circuits.map(({ position, size }, index) => (
        <mesh key={index} position={position}>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#48d9ec" emissive="#168da4" emissiveIntensity={0.65} />
        </mesh>
      ))}
      {[-1.02, -0.16, 0.62, 1.08].map((x, index) => (
        <mesh
          key={x}
          ref={(element) => { ledRefs.current[index] = element }}
          position={[x, 0.07, index % 2 ? 0.53 : -0.56]}
        >
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color="#8effd0" emissive="#26ffa8" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  )
}

function CoolingFan({ fanRef }) {
  return (
    <group ref={fanRef} position={[-0.72, -0.65, 0.05]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.045, 32]} />
        <meshStandardMaterial color="#263746" metalness={0.62} roughness={0.3} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[Math.cos(index * Math.PI / 3.5) * 0.13, 0.028, Math.sin(index * Math.PI / 3.5) * 0.13]} rotation={[0, -index * Math.PI / 3.5, 0.18]}>
          <boxGeometry args={[0.2, 0.018, 0.075]} />
          <meshStandardMaterial color="#8ba6b8" metalness={0.68} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.025, 20]} />
        <meshStandardMaterial color="#42cfe7" emissive="#167caa" emissiveIntensity={0.55} />
      </mesh>
    </group>
  )
}

function LaptopModel({ exploded, reducedMotion }) {
  const laptopRef = useRef()
  const deckRef = useRef()
  const screenRef = useRef()
  const boardRef = useRef()
  const batteryRef = useRef()
  const ramRef = useRef()
  const driveRef = useRef()
  const gpuRef = useRef()
  const fanRef = useRef()
  const particleRef = useRef()
  const progressRef = useRef(0)
  const ledRefs = useRef([])
  const pointer = useThree((state) => state.pointer)
  const invalidate = useThree((state) => state.invalidate)
  const particleMesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.024, 6, 6)
    const material = new THREE.MeshBasicMaterial({ color: '#61e4ff', transparent: true, opacity: 0, depthWrite: false })
    const mesh = new THREE.InstancedMesh(geometry, material, PARTICLE_DIRECTIONS.length)
    mesh.frustumCulled = false
    return mesh
  }, [])

  useEffect(() => () => {
    particleMesh.geometry.dispose()
    particleMesh.material.dispose()
  }, [particleMesh])

  useFrame((state, delta) => {
    const target = exploded ? 1 : 0
    const progress = reducedMotion
      ? target
      : THREE.MathUtils.damp(progressRef.current, target, 3.5, delta)
    progressRef.current = progress

    if (laptopRef.current) {
      if (!reducedMotion) laptopRef.current.rotation.y += delta * 0.22
      laptopRef.current.rotation.x = THREE.MathUtils.damp(laptopRef.current.rotation.x, -0.1 + pointer.y * 0.13, 4, delta)
      laptopRef.current.rotation.z = THREE.MathUtils.damp(laptopRef.current.rotation.z, -pointer.x * 0.055, 4, delta)
    }

    if (deckRef.current) deckRef.current.position.y = -0.59 + progress * 0.38
    if (screenRef.current) screenRef.current.position.y = -0.51 + progress * 0.32
    if (boardRef.current) boardRef.current.position.y = -0.75 - progress * 0.1
    if (batteryRef.current) batteryRef.current.position.y = -0.65 - progress * 0.43
    if (ramRef.current) ramRef.current.position.y = -0.66 + progress * 0.31
    if (driveRef.current) driveRef.current.position.y = -0.67 - progress * 0.35
    if (gpuRef.current) gpuRef.current.position.y = -0.66 + progress * 0.48

    if (fanRef.current) {
      fanRef.current.position.y = -0.66 - progress * 0.2
      if (!reducedMotion) fanRef.current.rotation.y += delta * 3.5
    }

    ledRefs.current.forEach((led, index) => {
      if (!led || !led.material) return
      led.material.emissiveIntensity = reducedMotion ? 1.3 : 1 + Math.max(0, Math.sin(state.clock.elapsedTime * 2.2 + index * 1.4)) * 2.2
    })

    if (particleRef.current) {
      const burst = Math.sin(progress * Math.PI)
      particleRef.current.visible = burst > 0.02
      particleRef.current.material.opacity = burst * 0.9
      const dummy = new THREE.Object3D()
      PARTICLE_DIRECTIONS.forEach((direction, index) => {
        const distance = 0.2 + burst * (1.3 + (index % 5) * 0.13)
        dummy.position.set(direction.x * distance, -0.22 + direction.y * distance, direction.z * distance)
        dummy.scale.setScalar(0.55 + burst * 0.55)
        dummy.updateMatrix()
        particleRef.current.setMatrixAt(index, dummy.matrix)
      })
      particleRef.current.instanceMatrix.needsUpdate = true
    }

    if (!reducedMotion && Math.abs(progress - target) > 0.002) invalidate()
  })

  return (
    <group ref={laptopRef} rotation={[-0.1, 0, 0]}>
      <mesh position={[0, -0.79, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.16, 0.09, 2.27]} />
        <meshStandardMaterial color="#202b37" metalness={0.72} roughness={0.31} />
      </mesh>

      <group ref={deckRef} position={[0, -0.59, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.18, 0.15, 2.3]} />
          <meshStandardMaterial color="#394957" metalness={0.78} roughness={0.27} />
        </mesh>
        <mesh position={[0, 0.079, 0]}>
          <boxGeometry args={[2.78, 0.012, 1.13]} />
          <meshStandardMaterial color="#202d39" metalness={0.38} roughness={0.54} />
        </mesh>
        <KeyboardKeys />
        <mesh position={[0.66, 0.083, 0.67]}>
          <boxGeometry args={[0.78, 0.018, 0.48]} />
          <meshStandardMaterial color="#778693" metalness={0.56} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.083, -1.08]}>
          <boxGeometry args={[0.46, 0.025, 0.08]} />
          <meshStandardMaterial color="#151e27" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      <group ref={screenRef} position={[0, -0.51, -1.04]} rotation={[-0.18, 0, 0]}>
        <mesh position={[0, 0.99, 0]} castShadow>
          <boxGeometry args={[3.16, 2, 0.12]} />
          <meshStandardMaterial color="#202a35" metalness={0.72} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1, 0.064]}>
          <planeGeometry args={[2.88, 1.73]} />
          <meshBasicMaterial color="#071526" />
        </mesh>
        <mesh position={[-0.64, 1.48, 0.07]}>
          <planeGeometry args={[1.45, 0.045]} />
          <meshBasicMaterial color="#48b8ed" />
        </mesh>
        <mesh position={[-0.8, 1.34, 0.071]}>
          <planeGeometry args={[1.1, 0.022]} />
          <meshBasicMaterial color="#7495b4" />
        </mesh>
        <mesh position={[-0.66, 1.19, 0.071]}>
          <planeGeometry args={[1.38, 0.022]} />
          <meshBasicMaterial color="#426b93" />
        </mesh>
        <mesh position={[0.65, 0.96, 0.071]}>
          <planeGeometry args={[0.42, 0.52]} />
          <meshBasicMaterial color="#102e49" />
        </mesh>
        <mesh position={[0, 1.99, 0.065]}>
          <sphereGeometry args={[0.027, 12, 12]} />
          <meshStandardMaterial color="#10171e" metalness={0.4} roughness={0.25} />
        </mesh>
      </group>

      <CircuitBoard boardRef={boardRef} ledRefs={ledRefs} />

      <group ref={batteryRef} position={[0.6, -0.65, 0.59]}>
        <mesh castShadow>
          <boxGeometry args={[1.25, 0.12, 0.46]} />
          <meshStandardMaterial color="#192d42" metalness={0.58} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <boxGeometry args={[0.58, 0.012, 0.018]} />
          <meshStandardMaterial color="#65d8ff" emissive="#1596ca" emissiveIntensity={0.7} />
        </mesh>
      </group>

      <group ref={ramRef} position={[-0.3, -0.66, -0.47]}>
        {[-0.13, 0.13].map((offset) => (
          <mesh key={offset} position={[offset, 0, 0]} castShadow>
            <boxGeometry args={[0.11, 0.08, 0.72]} />
            <meshStandardMaterial color="#178259" metalness={0.47} roughness={0.3} emissive="#075638" emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>

      <group ref={driveRef} position={[0.93, -0.67, -0.43]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.075, 0.42]} />
          <meshStandardMaterial color="#8193a2" metalness={0.8} roughness={0.23} />
        </mesh>
        <mesh position={[0, 0.041, 0]}>
          <boxGeometry args={[0.32, 0.012, 0.08]} />
          <meshStandardMaterial color="#56d9ef" emissive="#148ca6" emissiveIntensity={0.75} />
        </mesh>
      </group>

      <group ref={gpuRef} position={[0.5, -0.66, -0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.095, 0.65]} />
          <meshStandardMaterial color="#27384a" metalness={0.68} roughness={0.31} />
        </mesh>
        <mesh position={[0, 0.053, 0]}>
          <boxGeometry args={[0.35, 0.018, 0.32]} />
          <meshStandardMaterial color="#42bce3" metalness={0.42} roughness={0.27} emissive="#0a638c" emissiveIntensity={0.65} />
        </mesh>
      </group>

      <CoolingFan fanRef={fanRef} />

      <primitive object={particleMesh} ref={particleRef} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]} receiveShadow>
        <planeGeometry args={[7, 6]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

function CinematicRig({ reducedMotion }) {
  const camera = useThree((state) => state.camera)

  useFrame((state) => {
    const targetX = Math.sin(state.clock.elapsedTime * 0.45) * 0.42
    const targetY = 2.1 + Math.cos(state.clock.elapsedTime * 0.55) * 0.18
    const targetZ = 6.2 + Math.sin(state.clock.elapsedTime * 0.35) * 0.5

    if (!reducedMotion) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 1.5, 0.016)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 1.5, 0.016)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 1.5, 0.016)
    }

    camera.lookAt(0, 0.4, 0)
  })

  return null
}

function PrinterModel({ reducedMotion }) {
  const ref = useRef()
  const paperRef = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.3) * 0.18
    ref.current.rotation.y += delta * (reducedMotion ? 0.12 : 0.42)
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -0.35 + Math.sin(state.clock.elapsedTime * 0.8) * 0.12, 3, delta)
    if (paperRef.current) {
      paperRef.current.position.y = 0.22 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06
      paperRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.8) * 0.18
    }
  })

  return (
    <group ref={ref} position={[-2.7, 0.25, -1.3]} rotation={[0.3, 0.45, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.8, 1.2]} />
        <meshStandardMaterial color="#48576b" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[1.25, 0.16, 0.8]} />
        <meshStandardMaterial color="#27384a" metalness={0.78} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.28, 0.55]} castShadow>
        <boxGeometry args={[1.3, 0.22, 0.12]} />
        <meshStandardMaterial color="#152330" metalness={0.72} roughness={0.26} />
      </mesh>
      <mesh position={[0.15, 0.12, 0.68]}>
        <boxGeometry args={[0.78, 0.08, 0.06]} />
        <meshStandardMaterial color="#7de7ff" emissive="#1fb6ff" emissiveIntensity={1.3} />
      </mesh>
      <group ref={paperRef} position={[0.18, 0.24, 0.58]} rotation={[0.4, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.65, 0.02, 0.8]} />
          <meshStandardMaterial color="#f3f7fb" roughness={0.8} metalness={0.05} />
        </mesh>
      </group>
      {[-0.48, -0.16, 0.16, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.75]}>
          <boxGeometry args={[0.08, 0.08, 0.06]} />
          <meshStandardMaterial color="#57d7ff" emissive="#1dc5f7" emissiveIntensity={1.6} />
        </mesh>
      ))}
      <mesh position={[-0.65, -0.6, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.44, 18]} />
        <meshStandardMaterial color="#2b3843" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0.62, -0.6, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.44, 18]} />
        <meshStandardMaterial color="#2b3843" metalness={0.75} roughness={0.25} />
      </mesh>
    </group>
  )
}

function NetworkSwitchModel({ reducedMotion }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.25 + 0.7) * 0.25
    ref.current.rotation.y += delta * (reducedMotion ? 0.1 : 0.35)
  })

  return (
    <group ref={ref} position={[2.9, 0.9, -0.9]} rotation={[0.4, -0.75, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 0.7]} />
        <meshStandardMaterial color="#1d2d40" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[1.1, 0.12, 0.42]} />
        <meshStandardMaterial color="#253b56" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-0.46, -0.15, 0.15, 0.46].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.37]}>
          <boxGeometry args={[0.18, 0.08, 0.03]} />
          <meshStandardMaterial color="#6df0ff" emissive="#1dc9ff" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {[-0.48, -0.16, 0.16, 0.48].map((x) => (
        <mesh key={`port-${x}`} position={[x, 0.42, -0.38]}>
          <boxGeometry args={[0.12, 0.12, 0.03]} />
          <meshStandardMaterial color="#4ff7d2" emissive="#2ce6b3" emissiveIntensity={1.3} />
        </mesh>
      ))}
      <mesh position={[0.7, 0.38, 0.1]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 1.7, 18]} />
        <meshStandardMaterial color="#6b8db2" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[-0.7, 0.36, -0.15]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 18]} />
        <meshStandardMaterial color="#6b8db2" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.2, 0.45]}>
        <boxGeometry args={[0.7, 0.12, 0.08]} />
        <meshStandardMaterial color="#0d1f2d" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ServerRackModel({ reducedMotion }) {
  const ref = useRef()
  const glowRef = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.1 + 1.8) * 0.2
    ref.current.rotation.y += delta * (reducedMotion ? 0.08 : 0.28)
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 3.6) * 0.5
    }
  })

  return (
    <group ref={ref} position={[0.3, -0.6, -2.7]} rotation={[0.2, -0.6, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.1, 3.4, 1.3]} />
        <meshStandardMaterial color="#2c3d50" metalness={0.85} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0, 0.7]}>
        <boxGeometry args={[1.8, 3, 0.1]} />
        <meshStandardMaterial color="#101920" metalness={0.7} roughness={0.32} />
      </mesh>
      {Array.from({ length: 5 }).map((_, index) => (
        <group key={index} position={[0, 1.1 - index * 0.7, 0.05]}>
          <mesh>
            <boxGeometry args={[1.5, 0.42, 0.08]} />
            <meshStandardMaterial color="#384d66" metalness={0.8} roughness={0.28} />
          </mesh>
          {[-0.52, -0.18, 0.17, 0.52].map((x, lightIndex) => (
            <mesh key={`${index}-${x}`} position={[x, 0.03, 0.09]}>
              <boxGeometry args={[0.12, 0.12, 0.04]} />
              <meshStandardMaterial color={lightIndex % 2 === 0 ? '#5ce8ff' : '#7ef5b7'} emissive={lightIndex % 2 === 0 ? '#26d1ff' : '#3cf1a6'} emissiveIntensity={1.5} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh ref={glowRef} position={[0, 0, 0.8]}>
        <boxGeometry args={[1.6, 2.7, 0.04]} />
        <meshStandardMaterial color="#9ee7ff" emissive="#51d8ff" emissiveIntensity={1.2} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, -1.7, 0.72]}>
        <boxGeometry args={[0.9, 0.18, 0.07]} />
        <meshStandardMaterial color="#68f0d5" emissive="#39c8a2" emissiveIntensity={1.8} />
      </mesh>
    </group>
  )
}

function MotherboardModel({ reducedMotion }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.4 + 2.2) * 0.18
    ref.current.rotation.y += delta * (reducedMotion ? 0.1 : 0.45)
  })

  return (
    <group ref={ref} position={[-0.2, -0.8, 2.3]} rotation={[0.2, 1.1, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 1.8]} />
        <meshStandardMaterial color="#1b2d3d" metalness={0.82} roughness={0.26} />
      </mesh>
      {[
        { position: [-0.8, 0.1, -0.35], size: [1.1, 0.02, 0.06], color: '#55d3ff' },
        { position: [0.7, 0.1, 0.2], size: [1.2, 0.02, 0.06], color: '#7ef6d5' },
        { position: [-0.2, 0.1, 0.6], size: [1.8, 0.02, 0.06], color: '#6bd5ff' },
        { position: [0.1, 0.1, -0.7], size: [0.9, 0.02, 0.06], color: '#8db6ff' },
      ].map(({ position, size, color }, index) => (
        <mesh key={index} position={position}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
        </mesh>
      ))}
      {[
        [-0.9, 0.1, -0.1],
        [-0.6, 0.1, 0.65],
        [0.4, 0.1, 0.5],
        [0.8, 0.1, -0.4],
      ].map((position, index) => (
        <mesh key={`chip-${index}`} position={position} castShadow>
          <boxGeometry args={[0.42, 0.12, 0.28]} />
          <meshStandardMaterial color="#2d4156" metalness={0.9} roughness={0.18} />
        </mesh>
      ))}
      {Array.from({ length: 18 }).map((_, index) => {
        const x = -1.05 + (index % 6) * 0.38
        const z = -0.66 + Math.floor(index / 6) * 0.36
        return (
          <mesh key={`pin-${index}`} position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
            <meshStandardMaterial color="#d8edf9" emissive="#9be5ff" emissiveIntensity={0.8} />
          </mesh>
        )
      })}
      <mesh position={[0.85, 0.12, -0.1]}>
        <boxGeometry args={[0.8, 0.12, 0.45]} />
        <meshStandardMaterial color="#213c52" metalness={0.84} roughness={0.26} />
      </mesh>
      <mesh position={[0.02, 0.12, 0.08]}>
        <boxGeometry args={[0.42, 0.08, 0.22]} />
        <meshStandardMaterial color="#4de3ff" emissive="#00b7ff" emissiveIntensity={1.7} />
      </mesh>
    </group>
  )
}

function ExtraEquipment({ reducedMotion }) {
  return (
    <group>
      <PrinterModel reducedMotion={reducedMotion} />
      <NetworkSwitchModel reducedMotion={reducedMotion} />
      <ServerRackModel reducedMotion={reducedMotion} />
      <MotherboardModel reducedMotion={reducedMotion} />
    </group>
  )
}

class SceneErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function LaptopFallback({ className = '' }) {
  return <img className={`laptop-scene-fallback ${className}`} src="/laptop.png" alt="Laptop computer" />
}

function Laptop3DExperience({ reducedMotion }) {
  const [exploded, setExploded] = useState(false)
  const [ready, setReady] = useState(false)
  const fallback = <LaptopFallback />

  return (
    <div className="laptop-experience">
      {!ready && <LaptopFallback className="is-loading" />}
      <SceneErrorBoundary fallback={fallback}>
        <Canvas
          className="laptop-canvas"
          aria-label="Interactive procedural 3D laptop; use the button to explode or reassemble its components"
          fallback={fallback}
          dpr={[1, 1.4]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          camera={{ position: [0, 2.1, 6.4], fov: 36, near: 0.1, far: 40 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          shadows
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            setReady(true)
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={1.2} />
            <hemisphereLight args={['#d7efff', '#172535', 1.5]} />
            <directionalLight position={[4, 7, 5]} intensity={3.1} castShadow shadow-mapSize={[1024, 1024]} />
            <pointLight position={[-3, 2, 2]} intensity={18} color="#4cbfff" distance={9} />
            <pointLight position={[2, 1, -3]} intensity={11} color="#528cff" distance={8} />
            <CinematicRig reducedMotion={reducedMotion} />
            <LaptopModel exploded={exploded} reducedMotion={reducedMotion} />
            <ExtraEquipment reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
      <button
        className="laptop-explode-button"
        type="button"
        aria-pressed={exploded}
        onClick={() => setExploded((value) => !value)}
      >
        {exploded ? 'Reassemble laptop' : 'Explode components'}
      </button>
      <span className="laptop-scene-caption" aria-live="polite">
        {exploded ? 'Motherboard, memory, storage, and cooling' : 'Interactive 3D laptop · Drag your pointer'}
      </span>
    </div>
  )
}

export default Laptop3DExperience