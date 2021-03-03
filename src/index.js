import './styles/main.scss'
import { isTouchDevice } from "./helper"

const Game = {
    canvas: undefined,
    ctx: undefined,
    width: undefined,
    height: undefined,
    sprites: {
        clouds: undefined,
        land: undefined,
        pipe: undefined,
        bird: undefined,
    },

    dimensions: {
        max: {
            width: 640,
            height: 360,
        },
        min: {
            width: 300,
            height: 280,
        },
    },

    background: undefined,
    pipe: undefined,
    bird: undefined,
    score: 0,
    running: false,

    init() {
        this.canvas = document.getElementById("game")
        this.ctx = this.canvas.getContext("2d")

        this.preload().then(() => {
            this.initDimensions()
            this.setEvents()

            this.start()
            this.run()

            this.background.init()
            this.pipe.init()
            this.bird.init()
        })
    },

    setEvents(){
        const clickEventType = isTouchDevice() ? "touchend" : "click"
        window.addEventListener(clickEventType, () => {
            this.onEventClick()
        })
    },

    onEventClick(){
        if (this.running) {
            this.bird.jump()
        } else {
            this.start()
            this.running = true
        }
    },

    initDimensions(){
        let data = {
            maxWidth: this.dimensions.max.width,
            maxHeight: this.dimensions.max.height,
            minWidth: this.dimensions.min.width,
            minHeight: this.dimensions.min.height,
            realWidth: innerWidth,
            realHeight: innerHeight,
        }

        this.fitWindow(data)

        this.canvas.width = this.width
        this.canvas.height = this.height
    },

    fitWindow(data){
        let ratioWidth = data.realWidth / data.realHeight
        let ratioHeight = data.realHeight / data.realWidth

        if (ratioWidth > data.maxWidth / data.maxHeight) {
            this.height = ratioHeight * data.maxHeight
            this.height = Math.min(this.height, data.maxHeight)
            this.height = Math.max(this.height, data.minHeight)

            this.width = ratioWidth * this.height
            this.canvas.style.width = "100%"
        } else {
            this.width = ratioWidth * data.maxHeight
            this.width = Math.min(this.width, data.maxWidth)
            this.width = Math.max(this.width, data.minWidth)

            this.height = ratioHeight * this.width
            this.canvas.style.height = "100%"
        }
    },

    start() {
        this.bird.restart()
        this.pipe.restart()
        this.score = 0
    },

    onFail(){
        this.running = false
    },

    preload(){
        return new Promise(resolve => {
            let loaded = 0
            let required = Object.keys(this.sprites).length

            const onSpritesLoaded = () => {
                if (++loaded >= required) {
                    resolve()
                }
            }

            for(let key in this.sprites) {
                this.sprites[key] = new Image()
                this.sprites[key].src = `assets/img/${ key }.png`
                this.sprites[key].onload = onSpritesLoaded
            }
        })
    },

    run(){
        requestAnimationFrame(() => {
            this.update()
            this.render()
            this.run()
        })
    },

    update(){
        if (this.running) {
            this.background.move()
            this.bird.update()
            this.pipe.update()
        }
    },

    render(){
        this.background.render()
        this.pipe.render()
        this.bird.render()
        this.renderText()
        if (!this.running) {
            this.renderStartBlock()
        }
    },

    renderText(){
        this.ctx.save()

        // shadow / text border
        this.ctx.strokeStyle = 'rgba(0,0,0,.75)'
        this.ctx.font = "28px 'Trebuchet MS'"
        this.ctx.strokeText(this.score, 15 - 1, this.height - 10 + 1);

        // text
        this.ctx.fillStyle = '#fff'
        this.ctx.font = "27px 'Trebuchet MS'"
        this.ctx.fillText(this.score, 15, this.height - 10)

        this.ctx.restore()
    },

    renderStartBlock(){
        this.ctx.save()

        // block / background
        this.ctx.fillStyle = 'rgba(0,0,0,.8)'
        this.ctx.fillRect(0, 0, this.width, this.height)

        // text
        this.ctx.fillStyle = '#fff'
        this.ctx.font = "27px 'Trebuchet MS'"
        this.ctx.textAlign = 'center'
        this.ctx.fillText('Click to start', this.width / 2, this.height / 2)

        this.ctx.restore()
    },

    addScore(){
        ++this.score
    },
}

Game.background = {
    game: Game,
    clouds: [],
    land: [],
    moving: false,

    init(){
        for(let i = 0; i < 2; i++) {
            ['clouds', 'land'].forEach(type => {
                let dx = -.5
                if (type === 'clouds') {
                    dx = -.25
                }

                this.addSlide({
                    type,
                    dx,
                    x: this.game.sprites[type].width * i,
                })
            })
        }
        this.start()
    },

    start(){
        this.moving = true
    },

    addSlide({ x, type, dx }){
        this[type].push({
            x: x || 0,
            dx: dx || -1.5,
        })
    },

    move() {
        if (this.moving) {
            this.moveObject('clouds')
            this.moveObject('land')
        }
    },

    moveObject(type){
        this[type].forEach(slide => {
            slide.x += slide.dx
        })

        let last = this[type][this[type].length - 1]
        if (last.x < 0) {
            this.addSlide({
                type,
                x: last.x + this.game.sprites[type].width,
                dx: last.dx,
            })
            this[type].shift()
        }
    },

    render(){
        // небо
        this.game.ctx.fillStyle = '#ADE9F4'
        this.game.ctx.fillRect(0, 0, this.game.width, this.game.height)

        // облака
        this.clouds.forEach(slide => {
            this.game.ctx.drawImage(this.game.sprites.clouds, slide.x, 0)
        })

        // земля
        this.land.forEach(slide => {
            this.game.ctx.drawImage(this.game.sprites.land, slide.x, this.game.height - this.game.sprites.land.height)
        })
    },
}

Game.pipe = {
    game: Game,
    width: 80,
    height: 17,
    pipes: [],
    distance: {
        min: 270,
        max: 350,
    },

    init(){
        this.create()
    },

    random(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min)
    },

    create(){
        let x = this.random(this.game.width, this.game.width + this.width)
        let space = this.random(this.game.bird.height * 3, this.game.bird.height * 4)
        let y = this.random((this.height * 2), this.game.height - space - (this.height * 2))
        this.pipes.push({
            x,
            y,
            space,
        })
    },

    move(){
        // тут самая дальняя трубу
        let farPipe = 0
        this.pipes.forEach(pipe => {
            pipe.x -= 1
            farPipe = Math.max(farPipe, pipe.x)
        })

        // добавить новую трубу, если дистанция позволяет
        let distance = this.random(this.distance.min, this.distance.max)
        if (this.game.width - farPipe + this.width > distance) {
            this.create()
        }
    },

    update(){
        this.move()

        // удалить трубу, если она за границей левого экрана
        if (this.pipes.length && this.pipes[0].x + this.width < 0) {
            this.pipes.shift()
        }
    },

    restart(){
        this.pipes = []
    },

    render(){
        this.pipes.forEach(pipe => {
            // градиент веррхней трубы
            this.game.ctx.drawImage(this.game.sprites.pipe,
                0, 0,
                this.width, 1,
                pipe.x,
                pipe.y - this.height - this.game.height,
                this.width, this.game.height
            )
            this.game.ctx.drawImage(this.game.sprites.pipe, pipe.x, pipe.y - this.game.sprites.pipe.height)

            // нижняя труба
            this.game.ctx.save()
            this.game.ctx.translate(this.x + (this.width / 2), this.y + (this.height / 2))
            this.game.ctx.rotate(180 * Math.PI / 180)
            // градиент нижней трубы
            this.game.ctx.drawImage(
                this.game.sprites.pipe,
                0, 0,
                this.width, 1,
                -this.width - pipe.x,
                -pipe.y - this.game.height - pipe.space - this.height,
                this.width, this.game.height
            )
            this.game.ctx.drawImage(this.game.sprites.pipe, -this.width - pipe.x, -this.height - pipe.y - pipe.space)
            this.game.ctx.restore()
        })
    },

    isPassed(index){
        return this.pipes[index].passed
    },

    setPassed(index){
        this.pipes[index].passed = true
    },
}

Game.bird = {
    game: Game,
    width: 44,
    height: 37,
    x: undefined,
    y: undefined,
    frames: 4,
    frame: 0,

    gravity: 0.15,
    gravitySpeed: 0,
    gravityJump: 3,
    angle: {
        current: -25,
        default: -25,
        min: -45,
        max: 30,
        jump: 20,
    },

    init(){
        this.setBirdPositions()
    },

    jump(){
        if (this.gravitySpeed > 0) {
            this.gravitySpeed = -this.gravityJump
        } else {
            this.gravitySpeed -= this.gravityJump
        }
        this.wave()
        this.angle.current -= this.angle.jump
        this.setNormalAngle()
    },

    setBirdPositions(){
        this.x = Math.floor(this.game.width / 5)
        this.y = Math.floor((this.game.height / 2) - (this.height))
    },

    restart(){
        this.gravitySpeed = 0
        this.setBirdPositions()
        this.angle.current = this.angle.default
    },

    move(){
        this.gravitySpeed += this.gravity;
        this.y += this.gravitySpeed;

        if (this.y >= this.game.height || this.y + this.height < 0 || this.isBirdCollideWithPipes()) {
            this.game.onFail()
        }

        this.angle.current += .5
        this.setNormalAngle()
    },

    update() {
        this.move()
        this.checkPipePassed()
    },

    checkPipePassed(){
        this.game.pipe.pipes.map((pipe, index) => {
            if (pipe.x + this.game.pipe.width < this.x && !this.game.pipe.isPassed(index)) {
                this.game.pipe.setPassed(index)
                this.game.addScore()
            }
        })
    },

    isBirdCollideWithPipes(){
        return this.game.pipe.pipes.some(pipe => {
            let y = this.y + this.gravitySpeed

            return pipe.x < this.x + this.width
                && pipe.x + this.game.pipe.width > this.x + 10
                && (
                    pipe.y > y
                    || pipe.y + pipe.space < y + (this.height - 10)
                )
        })
    },

    setNormalAngle(){
        this.angle.current = Math.min(this.angle.current, this.angle.max)
        this.angle.current = Math.max(this.angle.current, this.angle.min)
    },

    wave(){
        if (this.frame) return;

        let interval = setInterval(() => {
            if (++this.frame >= this.frames) {
                this.frame = 0
                interval = clearInterval(interval)
            }
        }, 1000 / 24)
    },

    render(){
        this.game.ctx.save()

        let halfWidth = this.width / 2
        let halfHeight = this.height / 2

        this.game.ctx.translate(this.x + halfWidth, this.y + halfHeight)
        this.game.ctx.rotate(this.angle.current * Math.PI / 180)
        this.game.ctx.drawImage(this.game.sprites.bird, this.width * this.frame, 0, this.width, this.height, -halfWidth, -halfHeight, this.width, this.height)

        this.game.ctx.restore()
    },
}

Game.init()