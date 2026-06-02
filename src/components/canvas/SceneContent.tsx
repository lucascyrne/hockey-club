import { GameBridge } from '../game/GameBridge'
import { useSessionStore } from '../../stores/sessionStore'
import { OnlineCanvasSync } from './OnlineCanvasSync'
import { Paddles } from '../paddle/Paddles'
import { Puck } from '../puck/Puck'
import { Table } from '../table/Table'
import { TablePhysics } from '../table/TablePhysics'
import { ArenaBackdrop } from './ArenaBackdrop'
import { PhysicsWorld } from './PhysicsWorld'
import { SceneLighting } from './SceneLighting'

/** Mesa, física e entidades — compartilhado entre modos de câmera. */
export function SceneContent() {
  const online =
    useSessionStore((s) => s.screen === 'match' && s.matchMode === 'online')

  return (
    <>
      <SceneLighting />
      <ArenaBackdrop reactive />
      <Table />
      <PhysicsWorld>
        <GameBridge />
        <TablePhysics />
        {online && <OnlineCanvasSync />}
        <Paddles />
        <Puck />
      </PhysicsWorld>
    </>
  )
}
