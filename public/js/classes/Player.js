class Player {
  constructor({ x, y, radius, color, username }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.username = username
  }

  draw() {
    c.font = '12px sans-serif'
    c.fillStyle = 'white'
    c.fillText(this.username, this.x- 17 , this.y + 29)
    c.save()
    c.shadowColor = this.color 
    c.shadowBlur = 8
    c.shadowOffsetX = 0 
    c.shadowOffsetY = 0

    c.beginPath()
    c.arc(
      this.x,
      this.y,
      this.radius * window.devicePixelRatio,
      0,
      Math.PI * 2,
      false
    )
    c.fillStyle = this.color 
    c.fill()
    c.restore()
  }
}
