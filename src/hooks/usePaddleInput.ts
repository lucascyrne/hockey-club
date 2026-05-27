import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PADDLE_INPUT_SPEED } from '../constants/paddle'
import { TABLE_SURFACE_TOP } from '../constants/physics'
import { IS_DEV } from '../lib/env'
import { getGoalCamera } from '../lib/cameraRegistry'
import {
  PointerSession,
  pointerToNdc,
  pointerToNdcFullscreen,
} from '../lib/pointerSession'
import { getSplitAxis } from '../stores/layoutStore'
import { cameraMode } from '../stores/cameraMode'
import { isLocal2pMode, isVsCpuMode } from '../stores/sessionStore'
import { useGameStore } from '../stores/gameStore'
import { useSessionStore } from '../stores/sessionStore'
import { clampPaddlePosition, type PlayerId } from '../systems/bounds'
import { paddleTargets } from '../stores/paddleTargets'

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  up: false,
  down: false,
  left: false,
  right: false,
}

function isP1KeyboardActive() {
  return keys.w || keys.a || keys.s || keys.d
}

function canProcessInput() {
  return (
    useSessionStore.getState().screen === 'match' &&
    useGameStore.getState().phase === 'playing'
  )
}

function nudgeTarget(playerId: PlayerId, dx: number, dz: number, delta: number) {
  const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
  const len = Math.hypot(dx, dz)
  if (len < 1e-6) return

  const step = PADDLE_INPUT_SPEED * delta
  target.x += (dx / len) * step
  target.z += (dz / len) * step

  const clamped = clampPaddlePosition(target.x, target.z, playerId)
  target.x = clamped.x
  target.z = clamped.z
}

function applyKeyboard(delta: number) {
  if (keys.w) nudgeTarget(1, -1, 0, delta)
  if (keys.s) nudgeTarget(1, 1, 0, delta)
  if (keys.a) nudgeTarget(1, 0, 1, delta)
  if (keys.d) nudgeTarget(1, 0, -1, delta)

  if (isLocal2pMode()) {
    if (keys.up) nudgeTarget(2, 1, 0, delta)
    if (keys.down) nudgeTarget(2, -1, 0, delta)
    if (keys.left) nudgeTarget(2, 0, -1, delta)
    if (keys.right) nudgeTarget(2, 0, 1, delta)
  }
}

const GAME_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

export function usePaddleInput() {
  const { camera: defaultCamera, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -TABLE_SURFACE_TOP),
    [],
  )
  const hit = useMemo(() => new THREE.Vector3(), [])
  const pointerNdc = useMemo(() => new THREE.Vector2(), [])
  const keyboardRaf = useRef<number | null>(null)
  const lastKeyboardTime = useRef(performance.now())
  const pointerSession = useRef(new PointerSession())

  const projectPointer = (e: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    const local2p = isLocal2pMode()
    const axis = getSplitAxis()

    let playerId: PlayerId = 1
    if (local2p) {
      const bound = pointerSession.current.get(e.pointerId)
      playerId =
        bound ??
        (() => {
          pointerSession.current.assign(e.pointerId, e.clientX, e.clientY, rect, axis)
          return pointerSession.current.get(e.pointerId)!
        })()
    }

    if (playerId === 1 && isP1KeyboardActive()) return

    const cam =
      getGoalCamera(playerId) ?? (playerId === 1 ? defaultCamera : null)
    if (!cam) return

    const ndc = local2p
      ? pointerToNdc(e.clientX, e.clientY, rect, playerId, axis)
      : pointerToNdcFullscreen(e.clientX, e.clientY, rect)
    pointerNdc.set(ndc.x, ndc.y)
    raycaster.setFromCamera(pointerNdc, cam)
    if (!raycaster.ray.intersectPlane(plane, hit)) return

    const clamped = clampPaddlePosition(hit.x, hit.z, playerId)
    const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
    target.x = clamped.x
    target.z = clamped.z
  }

  useEffect(() => {
    const canvas = gl.domElement
    const session = pointerSession.current

    const setKey = (code: string, down: boolean) => {
      switch (code) {
        case 'KeyW':
          keys.w = down
          break
        case 'KeyA':
          keys.a = down
          break
        case 'KeyS':
          keys.s = down
          break
        case 'KeyD':
          keys.d = down
          break
        case 'ArrowUp':
          keys.up = down
          break
        case 'ArrowDown':
          keys.down = down
          break
        case 'ArrowLeft':
          keys.left = down
          break
        case 'ArrowRight':
          keys.right = down
          break
        default:
          break
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!GAME_KEYS.has(e.code)) return
      if (e.code.startsWith('Arrow') && isVsCpuMode()) return
      if (e.code.startsWith('Arrow')) e.preventDefault()
      setKey(e.code, true)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      setKey(e.code, false)
    }

    const tickKeyboard = (now: number) => {
      if (!canProcessInput()) {
        keyboardRaf.current = requestAnimationFrame(tickKeyboard)
        return
      }
      const delta = Math.min((now - lastKeyboardTime.current) / 1000, 0.05)
      lastKeyboardTime.current = now
      applyKeyboard(delta)
      keyboardRaf.current = requestAnimationFrame(tickKeyboard)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!canProcessInput()) return
      if (IS_DEV && cameraMode.value === 'orbit') return
      if (!isLocal2pMode()) return

      const rect = canvas.getBoundingClientRect()
      session.assign(e.pointerId, e.clientX, e.clientY, rect, getSplitAxis())
      canvas.setPointerCapture(e.pointerId)
      projectPointer(e)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!canProcessInput()) return
      if (IS_DEV && cameraMode.value === 'orbit') return
      projectPointer(e)
    }

    const onPointerUp = (e: PointerEvent) => {
      session.release(e.pointerId)
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId)
      }
    }

    const onPointerCancel = (e: PointerEvent) => {
      session.release(e.pointerId)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    keyboardRaf.current = requestAnimationFrame(tickKeyboard)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      session.clear()
      if (keyboardRaf.current !== null) {
        cancelAnimationFrame(keyboardRaf.current)
      }
    }
  }, [defaultCamera, gl, raycaster, plane, hit, pointerNdc])
}
