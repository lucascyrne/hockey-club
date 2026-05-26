import { DemoGameBridge } from '../game/DemoGameBridge'
import { DemoPaddles } from '../paddle/DemoPaddles'
import { Puck } from '../puck/Puck'
import { Table } from '../table/Table'
import { TablePhysics } from '../table/TablePhysics'
import { ArenaBackdrop } from '../canvas/ArenaBackdrop'
import { PhysicsWorld } from '../canvas/PhysicsWorld'
import { SceneLighting } from '../canvas/SceneLighting'

/** Mesa e física da demo CPU×CPU no menu (sem input humano). */
export function MenuHeroSceneContent() {
  return (
    <>
      <SceneLighting variant="hero" />
      <ArenaBackdrop reactive={false} />
      <Table />
      <PhysicsWorld>
        <DemoGameBridge />
        <TablePhysics />
        <DemoPaddles />
        <Puck />
      </PhysicsWorld>
    </>
  )
}
