// 第一人称输入：指针锁定鼠标视角 + 键盘移动状态

const SENS = 0.0022 // 鼠标灵敏度
const MAX_PITCH = Math.PI / 2 - 0.01

export class Controls {
  constructor(domElement) {
    this.dom = domElement
    this.yaw = 0
    this.pitch = 0
    this.locked = false
    this.keys = Object.create(null)
    this.onLockChange = null

    this._bind()
  }

  _bind() {
    this.dom.addEventListener('click', () => {
      if (!this.locked) this.dom.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom
      if (this.onLockChange) this.onLockChange(this.locked)
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return
      this.yaw -= e.movementX * SENS
      this.pitch -= e.movementY * SENS
      if (this.pitch > MAX_PITCH) this.pitch = MAX_PITCH
      if (this.pitch < -MAX_PITCH) this.pitch = -MAX_PITCH
    })

    document.addEventListener('keydown', (e) => { this.keys[e.code] = true })
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false })
  }

  isDown(code) {
    return !!this.keys[code]
  }

  // 依据当前朝向把 WASD 输入转换为世界坐标系下的水平单位向量
  moveVector() {
    let forward = 0
    let strafe = 0
    if (this.isDown('KeyW')) forward += 1
    if (this.isDown('KeyS')) forward -= 1
    if (this.isDown('KeyD')) strafe += 1
    if (this.isDown('KeyA')) strafe -= 1

    if (forward === 0 && strafe === 0) return { x: 0, z: 0 }

    const sin = Math.sin(this.yaw)
    const cos = Math.cos(this.yaw)
    // 前方向 (相机看向 -z)：(-sin, -cos)；右方向：(cos, -sin)
    let x = -sin * forward + cos * strafe
    let z = -cos * forward - sin * strafe
    const len = Math.hypot(x, z)
    if (len > 0) { x /= len; z /= len }
    return { x, z }
  }
}
