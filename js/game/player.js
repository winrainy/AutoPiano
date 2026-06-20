import { isSolid } from './blocks.js'
import { HEIGHT } from './world.js'

const HALF = 0.3 // 玩家半宽
const BODY = 1.8 // 玩家身高
export const EYE = 1.62 // 视线高度
const GRAVITY = 28
const JUMP = 9
const SPEED = 5.2
const EPS = 1e-3

export class Player {
  constructor(world, x, y, z) {
    this.world = world
    this.pos = new world.THREE.Vector3(x, y, z) // 脚底坐标
    this.vel = new world.THREE.Vector3(0, 0, 0)
    this.onGround = false
  }

  // 根据水平输入方向、是否跳跃推进物理
  update(dt, moveX, moveZ, wantJump) {
    this.vel.x = moveX * SPEED
    this.vel.z = moveZ * SPEED
    this.vel.y -= GRAVITY * dt
    if (wantJump && this.onGround) {
      this.vel.y = JUMP
      this.onGround = false
    }

    this.move('x', this.vel.x * dt)
    this.move('z', this.vel.z * dt)
    this.onGround = false
    this.move('y', this.vel.y * dt)
  }

  move(axis, amount) {
    if (amount === 0) return
    this.pos[axis] += amount
    this.resolve(axis, amount)
  }

  resolve(axis, amount) {
    const w = this.world
    const minX = Math.floor(this.pos.x - HALF)
    const maxX = Math.floor(this.pos.x + HALF)
    const minY = Math.floor(this.pos.y)
    const maxY = Math.floor(this.pos.y + BODY)
    const minZ = Math.floor(this.pos.z - HALF)
    const maxZ = Math.floor(this.pos.z + HALF)

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (!isSolid(w.getBlock(bx, by, bz))) continue
          if (axis === 'x') {
            if (amount > 0) this.pos.x = bx - HALF - EPS
            else this.pos.x = bx + 1 + HALF + EPS
            this.vel.x = 0
          } else if (axis === 'z') {
            if (amount > 0) this.pos.z = bz - HALF - EPS
            else this.pos.z = bz + 1 + HALF + EPS
            this.vel.z = 0
          } else {
            if (amount > 0) {
              this.pos.y = by - BODY - EPS
            } else {
              this.pos.y = by + 1 + EPS
              this.onGround = true
            }
            this.vel.y = 0
          }
          return
        }
      }
    }
  }

  eyePosition() {
    return { x: this.pos.x, y: this.pos.y + EYE, z: this.pos.z }
  }

  // 判断某方块格是否与玩家碰撞体重叠（用于禁止把方块放到自己身上）
  intersectsBlock(bx, by, bz) {
    return (
      bx + 1 > this.pos.x - HALF && bx < this.pos.x + HALF &&
      by + 1 > this.pos.y && by < this.pos.y + BODY &&
      bz + 1 > this.pos.z - HALF && bz < this.pos.z + HALF
    )
  }
}

// 把世界顶层作为出生点，避免卡在方块里：从上往下找第一个实心方块
export function spawnOnTop(world, x, z) {
  for (let y = HEIGHT - 1; y >= 0; y--) {
    if (isSolid(world.getBlock(x, y, z))) {
      return { x: x + 0.5, y: y + 1, z: z + 0.5 }
    }
  }
  return { x: x + 0.5, y: HEIGHT, z: z + 0.5 }
}
