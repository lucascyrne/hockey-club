import { GameBridge } from '../game/GameBridge'
import { Paddles } from '../paddle/Paddles'
import { Puck } from '../puck/Puck'
import { Table } from '../table/Table'
import { TablePhysics } from '../table/TablePhysics'
import { ArenaBackdrop } from './ArenaBackdrop'
import { PhysicsWorld } from './PhysicsWorld'
import { SceneLighting } from './SceneLighting'

/** Mesa, física e entidades — compartilhado entre modos de câmera. */
export function SceneContent() {
  return (
    <>
      <SceneLighting />
      <ArenaBackdrop reactive />
      <Table />
      <PhysicsWorld>
        <GameBridge />
        <TablePhysics />
        <Paddles />
        <Puck />
      </PhysicsWorld>
    </>
  )
}
