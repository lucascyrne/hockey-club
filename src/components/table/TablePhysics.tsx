import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { TABLE_COLLIDERS, WALL_PHYSICS } from '../../constants/physics'

function WallCollider({
  position,
  args,
  rotation,
}: {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <CuboidCollider
      position={position}
      args={args}
      rotation={rotation}
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
      <WallCollider
        position={c.wallEndNegXNear.position}
        args={c.wallEndNegXNear.args}
      />
      <WallCollider
        position={c.wallEndNegXFar.position}
        args={c.wallEndNegXFar.args}
      />
      <WallCollider
        position={c.wallEndPosXNear.position}
        args={c.wallEndPosXNear.args}
      />
      <WallCollider
        position={c.wallEndPosXFar.position}
        args={c.wallEndPosXFar.args}
      />
      <WallCollider position={c.wallSideNegZ.position} args={c.wallSideNegZ.args} />
      <WallCollider position={c.wallSidePosZ.position} args={c.wallSidePosZ.args} />
      <WallCollider
        position={c.wallCornerNegXNegZ.position}
        args={c.wallCornerNegXNegZ.args}
        rotation={c.wallCornerNegXNegZ.rotation}
      />
      <WallCollider
        position={c.wallCornerNegXPosZ.position}
        args={c.wallCornerNegXPosZ.args}
        rotation={c.wallCornerNegXPosZ.rotation}
      />
      <WallCollider
        position={c.wallCornerPosXNegZ.position}
        args={c.wallCornerPosXNegZ.args}
        rotation={c.wallCornerPosXNegZ.rotation}
      />
      <WallCollider
        position={c.wallCornerPosXPosZ.position}
        args={c.wallCornerPosXPosZ.args}
        rotation={c.wallCornerPosXPosZ.rotation}
      />
    </RigidBody>
  )
}
