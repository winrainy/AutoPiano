import * as THREE from 'three'
import { buildAtlas, HOTBAR, blockName, BLOCK } from './blocks.js'
import { World, SIZE } from './world.js'
import { Player, EYE, spawnOnTop } from './player.js'
import { Controls } from './controls.js'

const canvas = document.getElementById('game')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const scene = new THREE.Scene()
const skyColor = 0x8ecbff
scene.background = new THREE.Color(skyColor)
scene.fog = new THREE.Fog(skyColor, 30, 70)

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
camera.rotation.order = 'YXZ'

// 光照
scene.add(new THREE.HemisphereLight(0xffffff, 0x556b2f, 0.9))
const sun = new THREE.DirectionalLight(0xffffff, 0.8)
sun.position.set(0.5, 1, 0.3)
scene.add(sun)
scene.add(new THREE.AmbientLight(0xffffff, 0.25))

// 世界
const atlas = buildAtlas(THREE)
const material = new THREE.MeshLambertMaterial({ map: atlas })
const world = new World(THREE)
const worldMesh = world.createMesh(material)
scene.add(worldMesh)

function refreshMesh() {
  world.rebuild()
  world.geometry.attributes.position.needsUpdate = true
}

// 玩家与控制
const spawn = spawnOnTop(world, Math.floor(SIZE / 2), Math.floor(SIZE / 2))
const player = new Player(world, spawn.x, spawn.y, spawn.z)
const controls = new Controls(canvas)

const overlay = document.getElementById('overlay')
controls.onLockChange = (locked) => {
  overlay.style.display = locked ? 'none' : 'flex'
}

// 选中方块的线框高亮
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
)
highlight.visible = false
scene.add(highlight)

// 物品栏
let selected = 0
const hotbarEl = document.getElementById('hotbar')
function buildHotbar() {
  hotbarEl.innerHTML = ''
  HOTBAR.forEach((id, i) => {
    const slot = document.createElement('div')
    slot.className = 'slot' + (i === selected ? ' active' : '')
    slot.innerHTML = `<span class="num">${i + 1}</span><span class="name">${blockName(id)}</span>`
    hotbarEl.appendChild(slot)
  })
}
function setSelected(i) {
  selected = (i + HOTBAR.length) % HOTBAR.length
  buildHotbar()
}
buildHotbar()

window.addEventListener('keydown', (e) => {
  const n = parseInt(e.key, 10)
  if (n >= 1 && n <= HOTBAR.length) setSelected(n - 1)
})
window.addEventListener('wheel', (e) => {
  if (!controls.locked) return
  setSelected(selected + (e.deltaY > 0 ? 1 : -1))
})

// 视线方向（由 yaw/pitch 推导）
const dirVec = new THREE.Vector3()
function lookDir() {
  const cp = Math.cos(controls.pitch)
  dirVec.set(-Math.sin(controls.yaw) * cp, Math.sin(controls.pitch), -Math.cos(controls.yaw) * cp)
  return dirVec
}

let currentTarget = null
function updateTarget() {
  const eye = player.eyePosition()
  const hit = world.raycast(new THREE.Vector3(eye.x, eye.y, eye.z), lookDir(), 6)
  currentTarget = hit
  if (hit) {
    highlight.visible = true
    highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)
  } else {
    highlight.visible = false
  }
}

// 挖掘 / 放置
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
canvas.addEventListener('mousedown', (e) => {
  if (!controls.locked || !currentTarget) return
  if (e.button === 0) {
    world.setBlock(currentTarget.x, currentTarget.y, currentTarget.z, BLOCK.AIR)
    refreshMesh()
  } else if (e.button === 2) {
    const p = currentTarget.place
    if (world.getBlock(p.x, p.y, p.z) === BLOCK.AIR && !player.intersectsBlock(p.x, p.y, p.z)) {
      world.setBlock(p.x, p.y, p.z, HOTBAR[selected])
      refreshMesh()
    }
  }
})

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

// 渲染循环
let last = performance.now()
function frame(now) {
  let dt = (now - last) / 1000
  last = now
  if (dt > 0.1) dt = 0.1

  if (controls.locked) {
    const mv = controls.moveVector()
    player.update(dt, mv.x, mv.z, controls.isDown('Space'))
  }

  const eye = player.eyePosition()
  camera.position.set(eye.x, eye.y, eye.z)
  camera.rotation.set(controls.pitch, controls.yaw, 0)

  updateTarget()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
