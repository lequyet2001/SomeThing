import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const LANES = [-2.4, 0, 2.4]
const PLAYER_Z = 3.2
const BEST_SCORE_KEY = 'marseille04_atelier_drift_best'
type DifficultyKey = 'easy' | 'normal' | 'hard'

interface DifficultyOption {
  baseSpeed: number
  key: DifficultyKey
  label: string
  levelSeconds: number
  spawnBias: number
  speedGrowth: number
}

interface GameMaterials {
  asphalt: THREE.MeshStandardMaterial
  buildingA: THREE.MeshStandardMaterial
  buildingB: THREE.MeshStandardMaterial
  coin: THREE.MeshStandardMaterial
  glass: THREE.MeshStandardMaterial
  ground: THREE.MeshStandardMaterial
  headlight: THREE.MeshStandardMaterial
  obstacle: THREE.MeshStandardMaterial
  obstacleStripe: THREE.MeshStandardMaterial
  player: THREE.MeshStandardMaterial
  playerAccent: THREE.MeshStandardMaterial
  rim: THREE.MeshStandardMaterial
  shield: THREE.MeshStandardMaterial
  stripe: THREE.MeshStandardMaterial
  taillight: THREE.MeshStandardMaterial
  tire: THREE.MeshStandardMaterial
}

type ActiveObjectType = 'coin' | 'obstacle' | 'shield'

interface ActiveObject {
  lane: number
  mesh: THREE.Object3D
  type: ActiveObjectType
}

interface GameController {
  moveLeft: () => void
  moveRight: () => void
  start: () => void
}

interface GameState {
  activeObjects: ActiveObject[]
  best: number
  camera: THREE.PerspectiveCamera
  coinTimer: number
  difficultyConfig: DifficultyOption
  difficultyLevel: number
  elapsedRun: number
  gameOver: boolean
  lane: number
  lastHudUpdate: number
  obstacleTimer: number
  player: THREE.Group
  renderer: THREE.WebGLRenderer
  running: boolean
  scene: THREE.Scene
  score: number
  shield: number
  speed: number
  targetLane: number
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { key: 'easy', label: 'Easy', baseSpeed: 9.5, speedGrowth: 1.55, spawnBias: 0.95, levelSeconds: 16 },
  { key: 'normal', label: 'Normal', baseSpeed: 11, speedGrowth: 2.05, spawnBias: 1.12, levelSeconds: 13 },
  { key: 'hard', label: 'Hard', baseSpeed: 13.2, speedGrowth: 2.65, spawnBias: 1.32, levelSeconds: 10 },
]
const DEFAULT_DIFFICULTY = DIFFICULTY_OPTIONS[1]

function isMesh(object: THREE.Object3D): object is THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> {
  return object instanceof THREE.Mesh
}

function createRoundedBox(width: number, height: number, depth: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createSportsCar(materials: GameMaterials) {
  const car = new THREE.Group()
  const animatedWheels: THREE.Mesh[] = []

  const lowerBody = createRoundedBox(1.08, 0.36, 1.62, materials.player)
  lowerBody.position.y = 0.52
  car.add(lowerBody)

  const upperBody = createRoundedBox(0.9, 0.26, 1.12, materials.player)
  upperBody.position.set(0, 0.78, -0.02)
  car.add(upperBody)

  const cabin = createRoundedBox(0.62, 0.42, 0.58, materials.glass)
  cabin.position.set(0, 1.06, 0.1)
  car.add(cabin)

  const hoodStripe = createRoundedBox(0.16, 0.04, 1.28, materials.playerAccent)
  hoodStripe.position.set(0, 0.98, -0.22)
  car.add(hoodStripe)

  const splitter = createRoundedBox(1.15, 0.08, 0.16, materials.tire)
  splitter.position.set(0, 0.35, -0.89)
  car.add(splitter)

  const spoilerWing = createRoundedBox(1.14, 0.08, 0.22, materials.playerAccent)
  spoilerWing.position.set(0, 1.04, 0.9)
  car.add(spoilerWing)

  ;[-0.42, 0.42].forEach((x) => {
    const support = createRoundedBox(0.08, 0.32, 0.08, materials.tire)
    support.position.set(x, 0.82, 0.78)
    car.add(support)
  })

  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 28)
  const rimGeometry = new THREE.CylinderGeometry(0.105, 0.105, 0.18, 24)
  ;[-0.62, 0.62].forEach((x) => {
    ;[-0.5, 0.52].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeometry, materials.tire)
      wheel.position.set(x, 0.32, z)
      wheel.rotation.z = Math.PI / 2
      wheel.castShadow = true
      car.add(wheel)
      animatedWheels.push(wheel)

      const rim = new THREE.Mesh(rimGeometry, materials.rim)
      rim.position.copy(wheel.position)
      rim.rotation.z = Math.PI / 2
      rim.castShadow = true
      car.add(rim)
      animatedWheels.push(rim)
    })
  })

  ;[-0.34, 0.34].forEach((x) => {
    const headlight = createRoundedBox(0.22, 0.08, 0.04, materials.headlight)
    headlight.position.set(x, 0.62, -0.86)
    car.add(headlight)

    const taillight = createRoundedBox(0.2, 0.08, 0.04, materials.taillight)
    taillight.position.set(x, 0.6, 0.86)
    car.add(taillight)
  })

  car.userData.animatedWheels = animatedWheels
  return car
}

function createObstacleModel(materials: GameMaterials) {
  const obstacle = new THREE.Group()

  if (Math.random() > 0.45) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.2, 5), materials.obstacle)
    cone.position.y = 0.62
    cone.rotation.y = Math.PI / 5
    cone.castShadow = true
    cone.receiveShadow = true
    obstacle.add(cone)

    const band = createRoundedBox(0.64, 0.12, 0.64, materials.obstacleStripe)
    band.position.y = 0.72
    obstacle.add(band)
  } else {
    const base = createRoundedBox(1.3, 0.72, 0.32, materials.obstacle)
    base.position.y = 0.45
    obstacle.add(base)

    ;[-0.32, 0.32].forEach((x) => {
      const stripe = createRoundedBox(0.18, 0.84, 0.34, materials.obstacleStripe)
      stripe.position.set(x, 0.48, 0.02)
      stripe.rotation.z = x < 0 ? -0.45 : 0.45
      obstacle.add(stripe)
    })
  }

  return obstacle
}

function disposeObjectGeometry(object: THREE.Object3D) {
  object.traverse((child) => {
    if (isMesh(child)) child.geometry.dispose()
  })
}

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  scene.traverse((object) => {
    if (isMesh(object)) {
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    }
  })
  renderer.dispose()
}

function HiddenGamePage() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<GameController | null>(null)
  const difficultyRef = useRef<DifficultyOption>(DEFAULT_DIFFICULTY)
  const [difficultyKey, setDifficultyKey] = useState<DifficultyKey>(DEFAULT_DIFFICULTY.key)
  const [hud, setHud] = useState({
    best: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
    difficulty: DEFAULT_DIFFICULTY.label,
    level: 1,
    score: 0,
    shield: 0,
  })
  const [isGameOver, setIsGameOver] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    difficultyRef.current = DIFFICULTY_OPTIONS.find((option) => option.key === difficultyKey) || DEFAULT_DIFFICULTY
  }, [difficultyKey])

  useEffect(() => {
    if (!mountRef.current) return undefined

    const mount = mountRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x8ed3dd)
    scene.fog = new THREE.Fog(0x8ed3dd, 26, 92)

    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 140)
    camera.position.set(0, 6.8, 10)
    camera.lookAt(0, 0.6, -12)

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'h-[72vh] min-h-[520px] w-full'
    renderer.domElement.dataset.gameCanvas = 'atelier-drift'
    mount.appendChild(renderer.domElement)

    const world = new THREE.Group()
    scene.add(world)

    const materials: GameMaterials = {
      asphalt: new THREE.MeshStandardMaterial({ color: 0x26342f, roughness: 0.86 }),
      stripe: new THREE.MeshStandardMaterial({ color: 0xf8d36a, roughness: 0.68 }),
      ground: new THREE.MeshStandardMaterial({ color: 0x6aa36f, roughness: 0.9 }),
      player: new THREE.MeshStandardMaterial({ color: 0x0f6b5f, metalness: 0.18, roughness: 0.38 }),
      playerAccent: new THREE.MeshStandardMaterial({ color: 0xf3b35b, roughness: 0.42 }),
      obstacle: new THREE.MeshStandardMaterial({ color: 0xd94f45, roughness: 0.55 }),
      coin: new THREE.MeshStandardMaterial({ color: 0xf4c74f, metalness: 0.45, roughness: 0.22 }),
      shield: new THREE.MeshStandardMaterial({ color: 0x45b8d8, metalness: 0.25, roughness: 0.28 }),
      buildingA: new THREE.MeshStandardMaterial({ color: 0xe9efe8, roughness: 0.8 }),
      buildingB: new THREE.MeshStandardMaterial({ color: 0xf0b46d, roughness: 0.74 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x2f6f72, roughness: 0.35 }),
      headlight: new THREE.MeshStandardMaterial({ color: 0xfff1a8, emissive: 0xffd45f, emissiveIntensity: 1.1, roughness: 0.22 }),
      obstacleStripe: new THREE.MeshStandardMaterial({ color: 0xfff3de, roughness: 0.42 }),
      rim: new THREE.MeshStandardMaterial({ color: 0xdfe9e5, metalness: 0.55, roughness: 0.24 }),
      taillight: new THREE.MeshStandardMaterial({ color: 0xff3d3d, emissive: 0xb00000, emissiveIntensity: 0.9, roughness: 0.28 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x17211d, roughness: 0.62 }),
    }

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x426b50, 1.65)
    scene.add(hemiLight)

    const sun = new THREE.DirectionalLight(0xffffff, 2.25)
    sun.position.set(-6, 11, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 36
    sun.shadow.camera.left = -14
    sun.shadow.camera.right = 14
    sun.shadow.camera.top = 14
    sun.shadow.camera.bottom = -14
    scene.add(sun)

    const road = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.22, 180), materials.asphalt)
    road.position.set(0, -0.12, -45)
    road.receiveShadow = true
    world.add(road)

    const groundLeft = new THREE.Mesh(new THREE.BoxGeometry(30, 0.16, 180), materials.ground)
    groundLeft.position.set(-18, -0.18, -45)
    groundLeft.receiveShadow = true
    world.add(groundLeft)

    const groundRight = groundLeft.clone()
    groundRight.position.x = 18
    groundRight.material = materials.ground
    world.add(groundRight)

    const stripes: THREE.Object3D[] = []
    for (let i = 0; i < 30; i += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 2.3), materials.stripe)
      stripe.position.set(-1.2, 0.03, -78 + i * 6)
      stripe.receiveShadow = true
      world.add(stripe)
      stripes.push(stripe)

      const twin = stripe.clone()
      twin.position.x = 1.2
      twin.material = materials.stripe
      world.add(twin)
      stripes.push(twin)
    }

    const skyline: THREE.Object3D[] = []
    for (let i = 0; i < 22; i += 1) {
      const height = 2.2 + Math.random() * 4.8
      const width = 1.6 + Math.random() * 1.7
      const depth = 1.7 + Math.random() * 2.2
      const building = createRoundedBox(width, height, depth, i % 2 ? materials.buildingA : materials.buildingB)
      building.position.set(i % 2 ? -8.4 - Math.random() * 4 : 8.4 + Math.random() * 4, height / 2 - 0.08, -78 + i * 7)
      world.add(building)
      skyline.push(building)

      const windowBand = createRoundedBox(width * 0.76, 0.12, depth + 0.04, materials.glass)
      windowBand.position.set(building.position.x, height * 0.62, building.position.z)
      windowBand.rotation.y = building.position.x < 0 ? Math.PI / 2 : -Math.PI / 2
      world.add(windowBand)
      skyline.push(windowBand)
    }

    const player = createSportsCar(materials)
    const wheelMeshes = (player.userData.animatedWheels as THREE.Mesh[] | undefined) || []
    player.position.set(LANES[1], 0, PLAYER_Z)
    scene.add(player)

    const coinGeometry = new THREE.TorusGeometry(0.38, 0.12, 12, 30)
    const shieldGeometry = new THREE.IcosahedronGeometry(0.48, 0)
    const activeObjects: ActiveObject[] = []
    const clock = new THREE.Clock()

    const game: GameState = {
      activeObjects,
      best: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
      camera,
      coinTimer: 1.1,
      difficultyConfig: difficultyRef.current,
      difficultyLevel: 1,
      elapsedRun: 0,
      gameOver: false,
      lane: 1,
      lastHudUpdate: 0,
      obstacleTimer: 0.45,
      player,
      renderer,
      running: false,
      scene,
      score: 0,
      shield: 0,
      speed: DEFAULT_DIFFICULTY.baseSpeed,
      targetLane: 1,
    }

    function resize() {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(rect.width, 320)
      const height = Math.max(rect.height, 420)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    function removeActiveObject(entry: ActiveObject) {
      const index = activeObjects.indexOf(entry)
      if (index >= 0) activeObjects.splice(index, 1)
      world.remove(entry.mesh)
      if (entry.type === 'obstacle') disposeObjectGeometry(entry.mesh)
    }

    function spawnObstacle() {
      const lane = Math.floor(Math.random() * LANES.length)
      const obstacle = createObstacleModel(materials)
      obstacle.position.set(LANES[lane], 0, -74)
      obstacle.rotation.y = Math.random() * 0.5 - 0.25
      world.add(obstacle)
      activeObjects.push({ lane, mesh: obstacle, type: 'obstacle' })
    }

    function spawnPickup() {
      const lane = Math.floor(Math.random() * LANES.length)
      const isShield = Math.random() > 0.74
      const pickup = new THREE.Mesh(isShield ? shieldGeometry : coinGeometry, isShield ? materials.shield : materials.coin)
      pickup.castShadow = true
      pickup.position.set(LANES[lane], isShield ? 1.02 : 1.18, -76)
      pickup.rotation.x = isShield ? 0.45 : Math.PI / 2
      world.add(pickup)
      activeObjects.push({ lane, mesh: pickup, type: isShield ? 'shield' : 'coin' })
    }

    function endGame() {
      game.running = false
      game.gameOver = true
      game.best = Math.max(game.best, Math.floor(game.score))
      localStorage.setItem(BEST_SCORE_KEY, String(game.best))
      setHud({
        best: game.best,
        difficulty: game.difficultyConfig.label,
        level: game.difficultyLevel,
        score: Math.floor(game.score),
        shield: Math.ceil(game.shield),
      })
      setIsRunning(false)
      setIsGameOver(true)
    }

    function updateGame(delta: number, elapsed: number) {
      if (!game.running) {
        player.rotation.y = Math.sin(elapsed * 1.6) * 0.04
        return
      }

      game.score += delta * (game.speed * 2.1)
      game.elapsedRun += delta
      const difficultyProgress = game.elapsedRun / game.difficultyConfig.levelSeconds
      game.difficultyLevel = 1 + Math.floor(difficultyProgress)
      game.speed = game.difficultyConfig.baseSpeed + difficultyProgress * game.difficultyConfig.speedGrowth
      game.shield = Math.max(0, game.shield - delta)
      game.obstacleTimer -= delta
      game.coinTimer -= delta

      if (game.obstacleTimer <= 0) {
        spawnObstacle()
        game.obstacleTimer = Math.max(
          0.36,
          (1.28 - game.difficultyLevel * 0.08 + Math.random() * 0.38) / game.difficultyConfig.spawnBias,
        )
      }

      if (game.coinTimer <= 0) {
        spawnPickup()
        game.coinTimer = Math.max(0.48, 0.96 - game.difficultyLevel * 0.03 + Math.random() * 0.7)
      }

      player.position.x += (LANES[game.targetLane] - player.position.x) * Math.min(delta * 11, 1)
      player.rotation.z = (LANES[game.targetLane] - player.position.x) * -0.09
      wheelMeshes.forEach((wheel) => {
        wheel.rotation.x -= delta * game.speed * 1.6
      })

      stripes.forEach((stripe) => {
        stripe.position.z += game.speed * delta
        if (stripe.position.z > 8) stripe.position.z -= 180
      })

      skyline.forEach((building) => {
        building.position.z += game.speed * delta * 0.62
        if (building.position.z > 18) building.position.z -= 154
      })

      for (let index = activeObjects.length - 1; index >= 0; index -= 1) {
        const entry = activeObjects[index]
        entry.mesh.position.z += game.speed * delta
        entry.mesh.rotation.y += delta * (entry.type === 'obstacle' ? 1.2 : 3.4)

        const nearPlayer = Math.abs(entry.mesh.position.z - PLAYER_Z) < 0.78 && Math.abs(entry.mesh.position.x - player.position.x) < 0.88
        if (nearPlayer) {
          if (entry.type === 'obstacle') {
            if (game.shield > 0) {
              game.score += 18
              game.shield = 0
              removeActiveObject(entry)
            } else {
              endGame()
            }
          } else {
            game.score += entry.type === 'shield' ? 36 : 20
            if (entry.type === 'shield') game.shield = 5
            removeActiveObject(entry)
          }
        } else if (entry.mesh.position.z > 10) {
          removeActiveObject(entry)
        }
      }

      camera.position.x += (player.position.x * 0.18 - camera.position.x) * Math.min(delta * 3.2, 1)
      camera.lookAt(player.position.x * 0.18, 0.8, -12)

      if (elapsed - game.lastHudUpdate > 0.1) {
        game.lastHudUpdate = elapsed
        setHud({
          best: game.best,
          difficulty: game.difficultyConfig.label,
          level: game.difficultyLevel,
          score: Math.floor(game.score),
          shield: Math.ceil(game.shield),
        })
      }
    }

    let animationId = 0
    function animate() {
      const delta = Math.min(clock.getDelta(), 0.045)
      const elapsed = clock.elapsedTime
      updateGame(delta, elapsed)
      renderer.render(scene, camera)
      animationId = window.requestAnimationFrame(animate)
    }

    function setLane(direction: number) {
      if (!game.running && !game.gameOver) return
      game.targetLane = Math.max(0, Math.min(LANES.length - 1, game.targetLane + direction))
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') setLane(-1)
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') setLane(1)
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        gameRef.current?.start()
      }
    }

    function start() {
      activeObjects.splice(0).forEach((entry) => removeActiveObject(entry))
      const difficultyConfig = difficultyRef.current
      game.coinTimer = 0.95
      game.difficultyConfig = difficultyConfig
      game.difficultyLevel = 1
      game.elapsedRun = 0
      game.gameOver = false
      game.lane = 1
      game.obstacleTimer = 0.4
      game.running = true
      game.score = 0
      game.shield = 0
      game.speed = difficultyConfig.baseSpeed
      game.targetLane = 1
      player.position.set(LANES[1], 0, PLAYER_Z)
      player.rotation.set(0, 0, 0)
      camera.position.set(0, 6.8, 10)
      setHud({ best: game.best, difficulty: difficultyConfig.label, level: 1, score: 0, shield: 0 })
      setIsGameOver(false)
      setIsRunning(true)
    }

    gameRef.current = {
      moveLeft: () => setLane(-1),
      moveRight: () => setLane(1),
      start,
    }

    resize()
    animate()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      gameRef.current = null
      mount.removeChild(renderer.domElement)
      disposeScene(scene, renderer)
      coinGeometry.dispose()
      shieldGeometry.dispose()
    }
  }, [])

  function handleStart() {
    gameRef.current?.start()
  }

  return (
    <section className="relative min-h-[72vh] overflow-hidden rounded-md border border-line bg-slate-900 text-white shadow-panel" aria-label="Atelier Drift">
      <div className="h-[72vh] min-h-[520px] w-full" ref={mountRef} />

      <div className="pointer-events-none absolute left-4 right-4 top-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div>
          <span>Score</span>
          <strong>{hud.score}</strong>
        </div>
        <div>
          <span>Best</span>
          <strong>{hud.best}</strong>
        </div>
        <div>
          <span>Level</span>
          <strong>{hud.level}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{hud.difficulty}</strong>
        </div>
        <div className={hud.shield > 0 ? 'border-primary bg-primary/10 text-primaryDark' : ''}>
          <span>Shield</span>
          <strong>{hud.shield}</strong>
        </div>
      </div>

      <div className="absolute left-4 top-44 text-xl font-black">
        <p>Atelier Drift</p>
      </div>

      {!isRunning && (
        <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 gap-2" aria-label="Difficulty">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              type="button"
              className={difficultyKey === option.key ? 'border-primary bg-primary/10 text-primaryDark' : ''}
              key={option.key}
              onClick={() => setDifficultyKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {(!isRunning || isGameOver) && (
        <button type="button" className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 border-primary bg-primary px-5 py-3 font-black" onClick={handleStart}>
          {isGameOver ? <RotateCcw size={18} /> : <Play size={18} />}
          {isGameOver ? 'Restart' : 'Start'}
        </button>
      )}

      <div className="absolute bottom-8 right-4 flex gap-2" aria-label="Game controls">
        <button type="button" aria-label="Left" onClick={() => gameRef.current?.moveLeft()}>
          <ChevronLeft size={28} />
        </button>
        <button type="button" aria-label="Right" onClick={() => gameRef.current?.moveRight()}>
          <ChevronRight size={28} />
        </button>
      </div>
    </section>
  )
}

export default HiddenGamePage
