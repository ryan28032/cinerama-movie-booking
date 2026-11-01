import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { CameraControls as CameraControlsImpl } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

export type CameraView = 'overview' | 'front' | 'screen'

const rows = ['A', 'B', 'C', 'D', 'E', 'F']
const cameraViews: Record<CameraView, [number, number, number, number, number, number]> = {
  overview: [0, 8.3, 7.8, 0, 1.1, -3.4],
  front: [0, 5.2, 4.5, 0, 1.5, -4.5],
  screen: [0, 5.2, 1.8, 0, 3.55, -10.4],
}

interface CinemaProps {
  selected: string[]
  reserved: string[]
  onSelect: (seat: string) => void
  view: CameraView
  title: string
}

function Seat({
  seat,
  row,
  selected,
  reserved,
  onSelect,
}: {
  seat: string
  row: number
  selected: boolean
  reserved: boolean
  onSelect: (seat: string) => void
}) {
  const group = useRef<THREE.Group>(null)
  const hovered = useRef(false)
  const xSeat = Number(seat.slice(1))
  const half = xSeat <= 5 ? xSeat - 3 : xSeat - 8
  const x = half * 0.82 + (xSeat > 5 ? 2.3 : -2.3)
  const z = 3.1 - row * 1.52
  const seatColor = reserved ? '#52423c' : selected ? '#d9a86c' : row >= 4 ? '#a67447' : '#637879'
  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (!reserved) hovered.current = true
    document.body.style.cursor = reserved ? 'not-allowed' : 'pointer'
  }
  const handleOut = () => {
    hovered.current = false
    document.body.style.cursor = 'default'
  }
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (!reserved) onSelect(seat)
  }

  useFrame((_, delta) => {
    if (!group.current) return
    const lift = hovered.current && !selected ? 0.14 : 0
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, lift, 10, delta)
    const targetScale = selected ? 1.07 : hovered.current && !reserved ? 1.035 : 1
    const scale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 12, delta)
    group.current.scale.setScalar(scale)
  })

  return (
    <group ref={group} position={[x, 0, z]} onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.17, 0.72]} />
        <meshStandardMaterial color={seatColor} roughness={0.43} metalness={0.08} emissive={selected ? '#815a2a' : '#000000'} emissiveIntensity={selected ? 0.28 : 0} />
      </mesh>
      <mesh position={[0, 0.81, -0.27]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.78, 0.16]} />
        <meshStandardMaterial color={seatColor} roughness={0.45} metalness={0.06} emissive={selected ? '#815a2a' : '#000000'} emissiveIntensity={selected ? 0.28 : 0} />
      </mesh>
      <mesh position={[-0.38, 0.55, 0.03]} castShadow>
        <boxGeometry args={[0.09, 0.34, 0.56]} />
        <meshStandardMaterial color="#302b28" roughness={0.62} />
      </mesh>
      <mesh position={[0.38, 0.55, 0.03]} castShadow>
        <boxGeometry args={[0.09, 0.34, 0.56]} />
        <meshStandardMaterial color="#302b28" roughness={0.62} />
      </mesh>
    </group>
  )
}

function Hall({ selected, reserved, onSelect, title }: Omit<CinemaProps, 'view'>) {
  const screenTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 520
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(0, 0, 1200, 520)
    gradient.addColorStop(0, '#192322')
    gradient.addColorStop(0.52, '#263331')
    gradient.addColorStop(1, '#171d1c')
    context.fillStyle = gradient
    context.fillRect(0, 0, 1200, 520)
    const glow = context.createRadialGradient(600, 330, 20, 600, 330, 560)
    glow.addColorStop(0, 'rgba(196,154,112,.22)')
    glow.addColorStop(1, 'rgba(196,154,112,0)')
    context.fillStyle = glow
    context.fillRect(0, 0, 1200, 520)
    context.fillStyle = 'rgba(230,215,195,.75)'
    context.font = '600 20px Arial'
    context.textAlign = 'center'
    context.letterSpacing = '8px'
    context.fillText('CINERAMA  /  NOW SHOWING', 600, 156)
    context.fillStyle = '#f1e6d5'
    context.font = '700 64px Arial'
    context.letterSpacing = '1px'
    const screenTitle = title.toUpperCase()
    context.fillText(screenTitle, 600, 284, 1040)
    context.fillStyle = 'rgba(230,215,195,.7)'
    context.font = '400 21px Arial'
    context.fillText('THE GOOD KIND OF ESCAPE', 600, 352)
    context.fillStyle = '#c49a70'
    context.fillRect(500, 394, 200, 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return texture
  }, [title])

  useEffect(() => () => screenTexture.dispose(), [screenTexture])

  return (
    <>
      <color attach="background" args={['#151411']} />
      <fog attach="fog" args={['#151411', 17, 36]} />
      <ambientLight intensity={1.35} />
      <spotLight position={[0, 12, -11]} angle={0.68} penumbra={0.7} intensity={65} color="#f4dfc3" castShadow />
      <pointLight position={[-8, 5, 0]} intensity={16} color="#cb8d58" />
      <pointLight position={[8, 5, 0]} intensity={13} color="#d0a776" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[24, 25]} />
        <meshStandardMaterial color="#26221e" roughness={0.84} />
      </mesh>
      <mesh position={[0, 3.55, -10.7]}>
        <boxGeometry args={[12, 5.5, 0.45]} />
        <meshStandardMaterial color="#211c18" emissive="#bd7f46" emissiveIntensity={0.28} roughness={0.24} metalness={0.35} />
      </mesh>
      <mesh position={[0, 3.55, -10.43]}>
        <planeGeometry args={[11.25, 4.72]} />
        <meshBasicMaterial map={screenTexture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 6.6, -10.4]}>
        <boxGeometry args={[10.6, 0.05, 0.03]} />
        <meshBasicMaterial color="#d8ad79" />
      </mesh>
      {rows.map((row, rowIndex) =>
        Array.from({ length: 10 }, (_, seatIndex) => {
          const seat = `${row}${seatIndex + 1}`
          return (
            <Seat
              key={seat}
              seat={seat}
              row={rowIndex}
              selected={selected.includes(seat)}
              reserved={reserved.includes(seat)}
              onSelect={onSelect}
            />
          )
        }),
      )}
    </>
  )
}

export default function Cinema({ selected, reserved, onSelect, view, title }: CinemaProps) {
  const controls = useRef<CameraControlsImpl>(null)
  useEffect(() => {
    const position = cameraViews[view]
    controls.current?.setLookAt(...position, true)
  }, [view])

  return (
    <Canvas
      shadows
      dpr={[1, 1.65]}
      camera={{ position: cameraViews.overview.slice(0, 3) as [number, number, number], fov: 43, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <CameraControls ref={controls} minDistance={6} maxDistance={26} maxPolarAngle={Math.PI / 2.05} smoothTime={0.7} />
      <Hall selected={selected} reserved={reserved} onSelect={onSelect} title={title} />
    </Canvas>
  )
}
