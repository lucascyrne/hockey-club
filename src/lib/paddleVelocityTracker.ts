import { PADDLE_VELOCITY_SAMPLES } from '../constants/paddle'
import type { PlanarVelocity } from '../systems/paddleHit'

type Sample = { x: number; z: number; t: number }

export class PaddleVelocityTracker {
  private samples: Sample[] = []

  record(x: number, z: number) {
    this.samples.push({ x, z, t: performance.now() })
    if (this.samples.length > PADDLE_VELOCITY_SAMPLES) {
      this.samples.shift()
    }
  }

  getVelocity(): PlanarVelocity {
    if (this.samples.length < 2) return { x: 0, z: 0 }
    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const dt = (last.t - first.t) / 1000
    if (dt < 1e-4) return { x: 0, z: 0 }
    return {
      x: (last.x - first.x) / dt,
      z: (last.z - first.z) / dt,
    }
  }

  reset(x: number, z: number) {
    const t = performance.now()
    this.samples = [{ x, z, t }]
  }
}
