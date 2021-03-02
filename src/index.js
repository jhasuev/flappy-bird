import './styles/main.scss'

const Game = {
    canvas: undefined,
    ctx: undefined,
    width: undefined,
    height: undefined,
    sprites: {
        clouds: undefined,
        land: undefined,
        pipe_top: undefined,
        pipe_bottom: undefined,
        bird: undefined,
    },

    background: undefined,
    pipe: undefined,
    bird: undefined,

    init(){
        this.canvas = document.getElementById("game")
        this.ctx = this.canvas.getContext("2d")

        this.width = this.canvas.width = 640
        this.height = this.canvas.height = 360
    },

    start() {
        this.init()

        this.preload().then(() => {
            this.background.init()
            this.pipe.init()
            this.run()
            this.bird.wave()
        })
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
        this.background.move()
    },

    render(){
        this.renderSky()
        this.background.render()
        this.pipe.render()
        this.bird.render()
    },

    renderSky(){
        this.ctx.fillStyle = '#ADE9F4'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
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

    stop(){
        this.moving = false
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
        this.clouds.forEach(slide => {
            this.game.ctx.drawImage(this.game.sprites.clouds, slide.x, 0)
        })
        this.land.forEach(slide => {
            this.game.ctx.drawImage(this.game.sprites.land, slide.x, this.game.height - this.game.sprites.land.height)
        })
    },
}

Game.pipe = {
    game: Game,
    pipes: [],

    init(){
        // this
        this.pipes.push({
            x: 111,
            y: 111,
            height: 111,
        })
    },

    render(){
        this.pipes.forEach(pipe => {
            this.game.ctx.drawImage(this.game.sprites.pipe_top, pipe.x, pipe.y - this.game.sprites.pipe_top.height)
            this.game.ctx.drawImage(this.game.sprites.pipe_bottom, pipe.x, pipe.y + pipe.height)
        })
    },
}

Game.bird = {
    game: Game,
    width: 44,
    height: 37,
    frames: 4,
    frame: 0,

    wave(){
        if (this.frame) return;

        let interval = setInterval(() => {
            if (++this.frame >= this.frames) {
                this.frame = 0
                interval = clearInterval(interval)
            }
        }, 75)
    },

    render(){
        this.game.ctx.drawImage(this.game.sprites.bird, this.width * this.frame, 0, this.width, this.height, 0, 0, this.width, this.height)
    },
}

Game.start()