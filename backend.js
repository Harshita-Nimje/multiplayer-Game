const express = require('express')
const app = express()

const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}
const backEndProjectiles = {}

const SPEED = 10
const RADIUS = 10
const PROJECTILE_RADIUS = 5
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')

  io.emit('updatePlayers', backEndPlayers)

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }
    console.log(backEndProjectiles)
  })

  socket.on('initGame', ({ username, width, height, devicePixelRatio }) => {
    backEndPlayers[socket.id] = {
      x: 500 * Math.random(),
      y: 500 * Math.random(),
      color: `hsl(${300 * Math.random()}0,100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    }
    backEndPlayers[socket.id].canvas = {
      width,
      height
    }

    // Initialize player radius
    backEndPlayers[socket.id].radius = RADIUS

    if (devicePixelRatio > 1) {
      backEndPlayers[socket.id].radius = 2 * RADIUS
    }
    console.log(username)
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id]
    const canvasWidth = backEndPlayer.canvas.width
    const canvasHeight = backEndPlayer.canvas.height

    backEndPlayer.sequenceNumber = sequenceNumber

    switch (keycode) {
      case 'KeyW':
        if (backEndPlayer.y - SPEED - backEndPlayer.radius >= 0) {
          backEndPlayer.y -= SPEED
        }
        break
      case 'KeyA':
        if (backEndPlayer.x - SPEED - backEndPlayer.radius >= 0) {
          backEndPlayer.x -= SPEED
        }
        break
      case 'KeyS':
        if (backEndPlayer.y + SPEED + backEndPlayer.radius <= canvasHeight) {
          backEndPlayer.y += SPEED
        }
        break
      case 'KeyD':
        if (backEndPlayer.x + SPEED + backEndPlayer.radius <= canvasWidth) {
          backEndPlayer.x += SPEED
        }
        break
    }
  })
})

//backend ticker
setInterval(() => {
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    const PROJECTILE_RADIUS = 5
    if (
      backEndProjectiles[id].x - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
    ) {
      delete backEndProjectiles[id]
      continue
    }

    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]
      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      )
      //collision detection
      if (
        DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        if (backEndPlayers[backEndProjectiles[id].playerId])
          backEndPlayers[backEndProjectiles[id].playerId].score++

        console.log(backEndPlayer[backEndProjectiles[id].playerId])

        delete backEndProjectiles[id]
        delete backEndPlayers[playerId]
        break
      }
    }
  }
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server started')
