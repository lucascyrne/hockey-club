import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { TABLE_COLLIDERS, WALL_PHYSICS } from '../../constants/physics'

function WallCollider({
  position,
  args,
}: {
  position: [number, number, number]
  args: [number, number, number]
}) {
  return (
    <CuboidCollider
      position={position}
      args={args}
      friction={WALL_PHYSICS.friction}
      restitution={WALL_PHYSICS.restitution}
    />
  )
}

export function TablePhysics() {
  const c = TABLE_COLLIDERS

  return (
    <RigidBody type="fixed" colliders={false} name="TablePhysics">
      <WallCollider position={c.floor.position} args={c.floor.args} />
      <WallCollider position={c.wallEndNegXNear.position} args={c.wallEndNegXNear.args} />
      <WallCollider position={c.wallEndNegXFar.position} args={c.wallEndNegXFar.args} />
      <WallCollider position={c.wallEndPosXNear.position} args={c.wallEndPosXNear.args} />
      <WallCollider position={c.wallEndPosXFar.position} args={c.wallEndPosXFar.args} />
      <WallCollider position={c.wallSideNegZ.position} args={c.wallSideNegZ.args} />
      <WallCollider position={c.wallSidePosZ.position} args={c.wallSidePosZ.args} />
    </RigidBody>
  )
}
