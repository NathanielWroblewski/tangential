import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import coordinates from './isomorphisms/coordinates.js'
import renderLine from './views/line.js'
import renderCircle from './views/circle.js'
import renderPolygon from './views/polygon.js'
import { seed, noise } from './utilities/noise.js'
import { grid, rand, stableSort, sample, remap } from './utilities/index.js'
import { COLORS } from './constants/colors.js'
import { ZOOM, FPS, τ, TIME_THRESHOLD } from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')

const { sin, cos, tan } = Math

const perspective = FourByFour.identity()
  .rotX(angles.toRadians(20))
  .rotY(angles.toRadians(40))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: 0.05
})

const HEIGHT = canvas.height
const HALF_HEIGHT = HEIGHT/2

const COLOR = '#FCF7FF'

context.shadowColor = COLOR
context.shadowBlur = 3

seed(Math.random())

const campos = Vector.from([0, 0, -100])

const renderOrderComparator = (a, b) => {
  const a0 = campos.subtract(a.center.transform(perspective))
  const b0 = campos.subtract(b.center.transform(perspective))

  if (a0.z < b0.z) return 1
  if (a0.z > b0.z) return -1
  if (a0.x < b0.x) return -1
  if (a0.x > b0.x) return 1
  if (a0.y < b0.y) return -1
  if (a0.y > b0.y) return 1

  return 0
}

const from = Vector.from([-10, -10])
const to = Vector.from([10, 10])
const by = Vector.from([1, 1])

const points = grid({ from, to, by }, coordinates => {
  return {
    coordinates,
    magnitude: coordinates.magnitude * 0.01
  }
})

const getOpacity = (y, height, halfHeight) => {
  if (y <= halfHeight) {
    return remap(y, [0, halfHeight], [0, 1])
  } else if (y > halfHeight) {
    return 1 - remap(y, [halfHeight, height], [0, 1])
  } else {
    return 1
  }
}

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  perspective.rotY(0.005)

  const τtime = τ * time

  points.forEach(({ coordinates, magnitude }, index) => {
    const [x, z] = coordinates
    const y = -2 * tan(τtime - magnitude)
    const Δy = noise(x * 0.1, z * 0.1, time * 10) * 1.5
    const cartesian = Vector.from([x, y + Δy, z])
    const projected = camera.project(cartesian.transform(perspective))
    const opacity = getOpacity(projected.y, HEIGHT, HALF_HEIGHT)

    if (projected.y <= HEIGHT && projected.y >= 0) {
      renderCircle(context, projected, 3, COLOR, COLOR, opacity)
    }
  })

  time += 0.002
  if (time > TIME_THRESHOLD) time = 0
}

let time = 0.15
let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
