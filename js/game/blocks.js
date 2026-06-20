// 方块类型定义与程序化纹理图集（无需任何外部贴图资源）

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  PLANKS: 7,
  COBBLE: 8
}

// 纹理图集中每个 16x16 小图块的索引
const TILE = {
  grass_top: 0,
  grass_side: 1,
  dirt: 2,
  stone: 3,
  log_top: 4,
  log_side: 5,
  leaves: 6,
  sand: 7,
  planks: 8,
  cobble: 9
}

// 每种方块在不同朝向上使用的图块
const BLOCK_DEF = {
  [BLOCK.GRASS]: { name: '草方块', top: TILE.grass_top, bottom: TILE.dirt, side: TILE.grass_side },
  [BLOCK.DIRT]: { name: '泥土', top: TILE.dirt, bottom: TILE.dirt, side: TILE.dirt },
  [BLOCK.STONE]: { name: '石头', top: TILE.stone, bottom: TILE.stone, side: TILE.stone },
  [BLOCK.WOOD]: { name: '木头', top: TILE.log_top, bottom: TILE.log_top, side: TILE.log_side },
  [BLOCK.LEAVES]: { name: '树叶', top: TILE.leaves, bottom: TILE.leaves, side: TILE.leaves },
  [BLOCK.SAND]: { name: '沙子', top: TILE.sand, bottom: TILE.sand, side: TILE.sand },
  [BLOCK.PLANKS]: { name: '木板', top: TILE.planks, bottom: TILE.planks, side: TILE.planks },
  [BLOCK.COBBLE]: { name: '圆石', top: TILE.cobble, bottom: TILE.cobble, side: TILE.cobble }
}

// 物品栏可选方块（按数字键 1-8 选择）
export const HOTBAR = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.WOOD,
  BLOCK.LEAVES, BLOCK.SAND, BLOCK.PLANKS, BLOCK.COBBLE
]

export function isSolid(id) {
  return id !== BLOCK.AIR
}

export function blockName(id) {
  return (BLOCK_DEF[id] && BLOCK_DEF[id].name) || '空气'
}

// 根据方块与面法线方向取对应图块索引；ny>0 顶面，ny<0 底面，其余为侧面
export function tileForFace(id, ny) {
  const def = BLOCK_DEF[id]
  if (!def) return TILE.stone
  if (ny > 0) return def.top
  if (ny < 0) return def.bottom
  return def.side
}

const ATLAS_COLS = 4
const ATLAS_ROWS = 4
const TILE_PX = 16

// 返回某图块在归一化 UV 空间中的范围（three.js 以左下角为 0,0）
export function tileUV(tile) {
  const col = tile % ATLAS_COLS
  const row = Math.floor(tile / ATLAS_COLS)
  const u0 = col / ATLAS_COLS
  const u1 = (col + 1) / ATLAS_COLS
  const v1 = 1 - row / ATLAS_ROWS
  const v0 = 1 - (row + 1) / ATLAS_ROWS
  return { u0, v0, u1, v1 }
}

function pick(palette) {
  return palette[(Math.random() * palette.length) | 0]
}

// 在画布上绘制一个 16x16 的像素风图块
function drawTile(ctx, tile, painter) {
  const col = tile % ATLAS_COLS
  const row = Math.floor(tile / ATLAS_COLS)
  const ox = col * TILE_PX
  const oy = row * TILE_PX
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      ctx.fillStyle = painter(x, y)
      ctx.fillRect(ox + x, oy + y, 1, 1)
    }
  }
}

// 构建纹理图集，返回 THREE.Texture
export function buildAtlas(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_COLS * TILE_PX
  canvas.height = ATLAS_ROWS * TILE_PX
  const ctx = canvas.getContext('2d')

  const greens = ['#5fae3a', '#6cba43', '#558f33', '#74c24a']
  const dirts = ['#866043', '#7a5638', '#9b7150', '#6f4e34']
  const stones = ['#8f8f8f', '#828282', '#9a9a9a', '#777777']
  const sands = ['#e0d6a0', '#d8cc90', '#e8dcab', '#d2c585']
  const leaves = ['#3f7d2a', '#356a23', '#4a8c31', '#2f5d1e']
  const logsTan = ['#caa46a', '#bd9659', '#d4ae74']
  const bark = ['#6e4e2e', '#7a5836', '#5e4226']
  const plank = ['#b5894f', '#a87c44', '#c0935a']
  const cobble = ['#9a9a9a', '#7d7d7d', '#8a8a8a', '#6f6f6f']

  drawTile(ctx, TILE.grass_top, () => pick(greens))
  drawTile(ctx, TILE.grass_side, (x, y) => (y < 4 ? pick(greens) : pick(dirts)))
  drawTile(ctx, TILE.dirt, () => pick(dirts))
  drawTile(ctx, TILE.stone, () => pick(stones))
  drawTile(ctx, TILE.sand, () => pick(sands))
  drawTile(ctx, TILE.leaves, () => pick(leaves))
  drawTile(ctx, TILE.log_top, (x, y) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
    return (d | 0) % 2 === 0 ? pick(logsTan) : '#a07c46'
  })
  drawTile(ctx, TILE.log_side, (x) => (x % 4 === 0 ? '#5e4226' : pick(bark)))
  drawTile(ctx, TILE.planks, (x, y) => (y % 5 === 0 ? '#8c6636' : pick(plank)))
  drawTile(ctx, TILE.cobble, (x, y) => (((x + y) % 4 === 0) ? '#5f5f5f' : pick(cobble)))

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
