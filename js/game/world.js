import { BLOCK, isSolid, tileForFace, tileUV } from './blocks.js'

export const SIZE = 48 // 水平尺寸 (x, z)
export const HEIGHT = 40 // 竖直尺寸 (y)

// 立方体 6 个面的几何与 UV 定义（朝外的逆时针缠绕）
const FACES = [
  { dir: [-1, 0, 0], corners: [ { p: [0, 1, 0], uv: [0, 1] }, { p: [0, 0, 0], uv: [0, 0] }, { p: [0, 1, 1], uv: [1, 1] }, { p: [0, 0, 1], uv: [1, 0] } ] },
  { dir: [1, 0, 0], corners: [ { p: [1, 1, 1], uv: [0, 1] }, { p: [1, 0, 1], uv: [0, 0] }, { p: [1, 1, 0], uv: [1, 1] }, { p: [1, 0, 0], uv: [1, 0] } ] },
  { dir: [0, -1, 0], corners: [ { p: [1, 0, 1], uv: [1, 0] }, { p: [0, 0, 1], uv: [0, 0] }, { p: [1, 0, 0], uv: [1, 1] }, { p: [0, 0, 0], uv: [0, 1] } ] },
  { dir: [0, 1, 0], corners: [ { p: [0, 1, 1], uv: [1, 1] }, { p: [1, 1, 1], uv: [0, 1] }, { p: [0, 1, 0], uv: [1, 0] }, { p: [1, 1, 0], uv: [0, 0] } ] },
  { dir: [0, 0, -1], corners: [ { p: [1, 0, 0], uv: [0, 0] }, { p: [0, 0, 0], uv: [1, 0] }, { p: [1, 1, 0], uv: [0, 1] }, { p: [0, 1, 0], uv: [1, 1] } ] },
  { dir: [0, 0, 1], corners: [ { p: [0, 0, 1], uv: [0, 0] }, { p: [1, 0, 1], uv: [1, 0] }, { p: [0, 1, 1], uv: [0, 1] }, { p: [1, 1, 1], uv: [1, 1] } ] }
]

export class World {
  constructor(THREE, seed = 1337) {
    this.THREE = THREE
    this.seed = seed
    this.data = new Uint8Array(SIZE * SIZE * HEIGHT)
    this.geometry = new THREE.BufferGeometry()
    this.mesh = null
    this.generate()
  }

  index(x, y, z) {
    return (y * SIZE + z) * SIZE + x
  }

  inBounds(x, y, z) {
    return x >= 0 && x < SIZE && y >= 0 && y < HEIGHT && z >= 0 && z < SIZE
  }

  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) return BLOCK.AIR
    return this.data[this.index(x, y, z)]
  }

  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return
    this.data[this.index(x, y, z)] = id
  }

  // 基于坐标哈希的伪随机，用于可复现的地形
  hash(x, z) {
    let n = (x | 0) * 374761393 + (z | 0) * 668265263 + this.seed * 2147483647
    n = (n ^ (n >> 13)) * 1274126177
    n = n ^ (n >> 16)
    return ((n >>> 0) / 4294967295)
  }

  // 平滑值噪声（双线性插值）
  valueNoise(x, z) {
    const xi = Math.floor(x)
    const zi = Math.floor(z)
    const xf = x - xi
    const zf = z - zi
    const s = (t) => t * t * (3 - 2 * t)
    const a = this.hash(xi, zi)
    const b = this.hash(xi + 1, zi)
    const c = this.hash(xi, zi + 1)
    const d = this.hash(xi + 1, zi + 1)
    const u = s(xf)
    const v = s(zf)
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
  }

  heightAt(x, z) {
    const base = 8
    let h = this.valueNoise(x / 14, z / 14) * 7
    h += this.valueNoise(x / 6, z / 6) * 3
    return Math.floor(base + h)
  }

  generate() {
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const h = Math.min(HEIGHT - 6, this.heightAt(x, z))
        for (let y = 0; y <= h; y++) {
          let id
          if (y === 0) id = BLOCK.STONE
          else if (y < h - 3) id = BLOCK.STONE
          else if (y < h) id = BLOCK.DIRT
          else id = BLOCK.GRASS
          this.setBlock(x, y, z, id)
        }
        // 稀疏种树
        if (h > 6 && this.hash(x * 7 + 1, z * 13 + 5) > 0.985) {
          this.plantTree(x, h + 1, z)
        }
      }
    }
  }

  plantTree(x, y, z) {
    const trunk = 4
    for (let i = 0; i < trunk; i++) this.setBlock(x, y + i, z, BLOCK.WOOD)
    const top = y + trunk
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue
          const tx = x + dx
          const ty = top + dy
          const tz = z + dz
          if (this.getBlock(tx, ty, tz) === BLOCK.AIR) this.setBlock(tx, ty, tz, BLOCK.LEAVES)
        }
      }
    }
    this.setBlock(x, top + 1, z, BLOCK.LEAVES)
  }

  // 仅生成可见面，构建合并网格
  buildGeometry() {
    const positions = []
    const normals = []
    const uvs = []
    const indices = []

    for (let y = 0; y < HEIGHT; y++) {
      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const id = this.getBlock(x, y, z)
          if (!isSolid(id)) continue
          for (const face of FACES) {
            const [dx, dy, dz] = face.dir
            if (isSolid(this.getBlock(x + dx, y + dy, z + dz))) continue
            const tile = tileForFace(id, dy)
            const { u0, v0, u1, v1 } = tileUV(tile)
            const ndx = positions.length / 3
            for (const c of face.corners) {
              positions.push(x + c.p[0], y + c.p[1], z + c.p[2])
              normals.push(dx, dy, dz)
              uvs.push(u0 + c.uv[0] * (u1 - u0), v0 + c.uv[1] * (v1 - v0))
            }
            indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3)
          }
        }
      }
    }

    const THREE = this.THREE
    const g = this.geometry
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setIndex(indices)
    g.computeBoundingSphere()
  }

  createMesh(material) {
    this.buildGeometry()
    this.mesh = new this.THREE.Mesh(this.geometry, material)
    this.mesh.matrixAutoUpdate = false
    return this.mesh
  }

  rebuild() {
    this.buildGeometry()
  }

  // Amanatides & Woo 体素射线步进，返回命中方块与可放置的相邻空格
  raycast(origin, dir, maxDist = 6) {
    let x = Math.floor(origin.x)
    let y = Math.floor(origin.y)
    let z = Math.floor(origin.z)
    const stepX = Math.sign(dir.x)
    const stepY = Math.sign(dir.y)
    const stepZ = Math.sign(dir.z)
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity
    const distToBound = (s, o, v) => {
      if (v === 0) return Infinity
      const b = v > 0 ? Math.floor(o) + 1 : Math.floor(o)
      return Math.abs((b - o) / v)
    }
    let tMaxX = distToBound(stepX, origin.x, dir.x)
    let tMaxY = distToBound(stepY, origin.y, dir.y)
    let tMaxZ = distToBound(stepZ, origin.z, dir.z)
    let nx = 0
    let ny = 0
    let nz = 0
    let t = 0
    while (t <= maxDist) {
      if (isSolid(this.getBlock(x, y, z))) {
        return { x, y, z, nx, ny, nz, place: { x: x + nx, y: y + ny, z: z + nz } }
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ
      }
    }
    return null
  }
}
