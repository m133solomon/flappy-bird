let config = require("visual-config-exposer").default;

const DEBUG = false;

const MOBILE = window.mobile() || window.innerWidth < 500 || window.innerHeight < 500;
const BirdSize = MOBILE ? 50 : 60;
const CoinScore = parseInt(config.settings.coinScore);
const GateSpeed = 230;

function getGapLevel() {
    let lv = parseInt(config.settings.gapLevel);
    if (lv == 1) return 1.2;
    if (lv == 2) return 1.5;
    if (lv == 3) return 1.8;
    if (lv == 4) return 2;

    return 1.4;
}
const GapLevel = getGapLevel();

class Pipe {
    constructor(dir, x, pipeHeight) {
        this.dir = dir;
        this.height = pipeHeight;

        this.pipeSize = {
            width: BirdSize * 1.3,
            height: height - pipeHeight,
        };

        this.x = x - this.pipeSize.width / 2;

        if (this.dir == 1) {
            this.rotation = -PI;

            this.rect = new Rectangle(this.x, 0, this.pipeSize.width, this.height);
        } else if (dir == -1) {
            this.rotation = 0;

            this.rect = new Rectangle(
                this.x,
                this.height,
                this.pipeSize.width,
                this.pipeSize.height
            );
            this.rect.debugColor = 255;
        }

        this.imgSize = {
            width: this.rect.w,
            height: this.rect.h,
        };

        this.head = window.images.pipeHead;
        this.body = window.images.pipeBody;
        this.headSize = calculateAspectRatioFit(
            this.head.width,
            this.head.height,
            this.rect.w,
            this.rect.h
        );
    }

    draw(newX) {
        this.rect.x = newX;

        push();
        translate(this.rect.center().x, this.rect.center().y);
        rotate(this.rotation);
        imageMode(CENTER);
        if (this.dir == 1) {
            image(
                this.head,
                0,
                -this.rect.h / 2 + this.headSize.height / 2,
                this.headSize.width,
                this.headSize.height
            );
            image(
                this.body,
                0,
                this.headSize.height / 2,
                this.rect.w - 7,
                this.rect.h - this.headSize.height
            );
        } else if (this.dir == -1) {
            image(
                this.head,
                0,
                -this.rect.h / 2 + this.headSize.height / 2,
                this.headSize.width,
                this.headSize.height
            );
            image(
                this.body,
                0,
                this.headSize.height / 2,
                this.rect.w - 7,
                this.rect.h - this.headSize.height
            );
        }
        imageMode(CORNER);
        pop();
        this.rect.debug();
    }
}

class Gate {
    constructor(x, gapY) {
        this.speed = GateSpeed;

        let gapUnit = BirdSize * 2;
        let gapHeight = GapLevel * gapUnit;
        if (MOBILE) {
            gapHeight *= 1.1;
        }

        if (gapHeight > height / 2) {
            gapHeight = height / 2;
        }

        if (gapY + gapHeight / 2 > height - height / 6) {
            gapY = height - height / 6 - gapHeight / 2;
        } else if (gapY - gapHeight / 2 < height / 6) {
            gapY = height / 6 + gapHeight / 2;
        }

        this.x = x;
        this.gapY = gapY;
        this.pipeUp = new Pipe(-1, this.x, gapY + gapHeight / 2);
        this.pipeDown = new Pipe(1, this.x, gapY - gapHeight / 2);
        this.scored = false;
        this.dead = false;
    }

    draw() {
        if (!this.finished) {
            this.x -= (this.speed * deltaTime) / 1000;
        }
        this.pipeUp.draw(this.x);
        this.pipeDown.draw(this.x);

        if (DEBUG) {
            fill(255, 0, 0);
            noStroke();
            circle(this.x, this.gapY, 10);
        }

        this.dead = this.pipeDown.rect.right() < 0;
    }
}

class Bird {
    constructor() {
        this.x = width / 3;
        this.y = height / 2;
        this.idleImg = window.images.idle;
        this.jumpImg = window.images.jump;

        this.img = this.idleImg;

        this.size = calculateAspectRatioFit(this.img.width, this.img.height, BirdSize, BirdSize);
        this.rect = Rectangle.FromPosition(this.x, this.y, this.size.width, this.size.height);

        this.rect.debugColor = 255;
        this.scale = 1;
        this.rotation = 0;
        this.firstJump = true;

        this.gravity = BirdSize * 0.9;
        this.jumpForce = floor(BirdSize * 0.2);

        this.vel = 0;

        this.dead = false;

        this.hitbox = Rectangle.FromPosition(
            this.rect.center().x,
            this.rect.center().y,
            this.rect.w * 0.9,
            this.rect.h * 0.8
        );
        this.hitbox.debugColor = color(255, 0, 255);
    }

    kill() {
        this.gravity *= 0.4;
        this.rotDir = random(100) < 50 ? 1 : -1;
        this.rotSpeed = PI * 1.5;
        this.speed = this.rect.w * 4;
    }

    checkCollisions(gates) {
        this.hitbox = Rectangle.FromPosition(
            this.rect.center().x,
            this.rect.center().y,
            this.rect.w * 0.9,
            this.rect.h * 0.9
        );
        this.hitbox.debug();

        gates.map((gate) => {
            if (
                intersectRect(this.hitbox, gate.pipeUp.rect) ||
                intersectRect(this.hitbox, gate.pipeDown.rect)
            ) {
                this.dead = true;
            }
        });

        if (this.rect.bottom() < 0 || this.rect.top() > height) {
            this.dead = true;
        }
    }

    draw() {

        if (this.vel < 0) {
            this.img = this.jumpImg;
        } else {
            this.img = this.idleImg;
        }

        this.size = calculateAspectRatioFit(this.img.width, this.img.height, BirdSize, BirdSize);
        this.rect = Rectangle.FromPosition(this.rect.center().x, this.rect.center().y, this.size.width, this.size.height);

        noStroke();
        fill(0);

        push();
        translate(this.rect.center().x, this.rect.center().y);
        scale(this.scale);
        rotate(this.rotation);
        imageMode(CENTER);
        image(this.img, 0, 0, this.rect.w, this.rect.h);
        imageMode(CORNER);
        pop();
        this.rect.debug();

        if (!this.firstJump) {
            this.vel += (this.gravity * deltaTime) / 1000;
            this.rect.y += this.vel;
        }

        if (this.dead) {
            this.rotation += (this.rotSpeed * this.rotDir * deltaTime) / 1000;
            this.rect.x += (this.speed * this.rotDir * deltaTime) / 1000;
        }
    }

    jump() {
        if (this.firstJump) {
            this.firstJump = false;
        }

        this.vel = -this.jumpForce;
    }
}

class Coin {
    constructor(x, y) {
        this.img = randomFromArray(window.images.coins);
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, BirdSize, BirdSize);
        this.x = x;
        this.y = y;
        this.scale = 1;

        this.growCd = 0.5;
        this.c_growCd = this.growCd;
        this.minScale = 0.9;
        this.maxScale = 1.1;
        this.grow = true;
        this.dead = false;
    }

    draw() {
        this.rect = Rectangle.FromPosition(this.x, this.y, this.size.width, this.size.height);

        push();
        translate(this.x, this.y);
        scale(this.scale);
        imageMode(CENTER);
        image(this.img, 0, 0, this.size.width, this.size.height);
        imageMode(CORNER);
        pop();

        this.rect.debug();

        this.c_growCd -= deltaTime / 1000;
        if (this.c_growCd < 0) {
            this.c_growCd = this.growCd;
            this.grow = !this.grow;
        }

        if (this.grow) {
            this.scale = map(this.c_growCd, this.growCd, 0, this.minScale, this.maxScale);
        } else {
            this.scale = map(this.c_growCd, this.growCd, 0, this.maxScale, this.minScale);
        }

        if (this.rect.right() < 0) {
            this.dead = true;
        }
    }
}

function getSpawnCd() {
    let cd = parseInt(config.settings.spawnCd);
    let result = 2;
    if (cd == 1) result = 1.4;
    if (cd == 2) result = 2.2;
    if (cd == 3) result = 2.8;
    if (cd == 4) result = 3.2;

    if (MOBILE) {
        result += 0.15;
    }
    return result;
}

class Game {
    constructor() {
        this.defaults();

        this.gateSpawnCd = getSpawnCd();
        this.c_gateSpawnCd = 1;
        this.gates = [];
        this.coins = [];
        this.firstGate = true;

        this.bird = new Bird();
    }

    permaUpdate() {}

    updateGame() {
        this.gates = this.gates.filter((gate) => {
            gate.draw();
            if (
                gate.pipeUp.rect.right() < this.bird.rect.left() &&
                !gate.scored &&
                !this.bird.dead
            ) {
                this.increaseScore();
                gate.scored = true;
            }
            if (this.finished) {
                gate.finished = true;
            }

            return !gate.dead;
        });

        this.bird.draw();
        this.bird.checkCollisions(this.gates);

        if (!this.finished) {
            this.c_gateSpawnCd -= deltaTime / 1000;
        }

        if (this.c_gateSpawnCd < 0) {
            this.c_gateSpawnCd = this.gateSpawnCd;
            let gate = new Gate(width, this.getGapY());
            if (random(100) < 25) {
                this.coins.push(new Coin(gate.x + gate.pipeUp.rect.w / 2, gate.gapY));
            }
            this.gates.push(gate);
        }

        if (this.bird.dead && !this.finished) {
            this.finishGame();
            this.bird.kill();
        }

        if (
            this.c_gateSpawnCd > this.gateSpawnCd * 0.3 &&
            this.c_gateSpawnCd < this.gateSpawnCd * 0.8
        ) {
            if (random(150) < 1) {
                let y = floor(random(height / 3, height - height / 3));
                this.coins.push(new Coin(width + BirdSize, y));
            }
        }

        this.coins = this.coins.filter((coin) => {
            coin.draw();

            if (!this.finished) {
                coin.x -= (GateSpeed * deltaTime) / 1000;
            }

            if (intersectRect(this.bird.rect, coin.rect)) {
                this.increaseScore(CoinScore);
                for (let i = 0; i < 5; i++) {
                    let p = new Particle(
                        coin.x,
                        coin.y,
                        randomParticleAcc(3),
                        floor(random(45, 65))
                    );
                    p.image = coin.img;
                    p.setLifespan(random(0.3, 0.5));
                    p.easing = "easeInQuad";
                    this.particles.push(p);
                }
                coin.dead = true;
                playSound(window.sounds.coin);
            }
            return !coin.dead;
        });
    }

    increaseScore(amt = 1) {
        this.score += amt;
        this.c_scoreFontSize = this.scoreFontSize * 1.8;
    }

    getGapY() {
        if (this.firstGate) {
            this.firstGate = false;
            return height / 2;
        }

        let minY = height / 2 - height / 4;
        let maxY = height / 2 + height / 4;

        return floor(random(minY, maxY));
    }

    onMousePress() {
        if (!this.bird.dead) {
            this.bird.jump();

            playSound(window.sounds.tap);

            if (config.settings.jumpParticles) {
                let col = color(config.settings.jumpParticlesColor);
                for (let i = 0; i < 5; i++) {
                    let acc = {
                        x: random(-2, 2),
                        y: random(1, 3),
                    };
                    let x = random(this.bird.rect.center().x - 10, this.bird.rect.center().x + 10);
                    let y = random(this.bird.rect.bottom() + 5, this.bird.rect.bottom() + 15);
                    let p = new Particle(x, y, acc, random(25, 35), col);
                    p.setLifespan(random(0.2, 0.4));
                    this.particles.push(p);
                }
            }
        }
    }

    finishGame() {
        if (!this.finished) {
            this.finished = true;
            playSound(window.sounds.lose);
            let pt = new PopupText(
                "Tap to continue ...",
                width / 2,
                height / 2 + this.instructionsFontSize * 3,
                this.instructionsFontSize,
                color(config.settings.textColor)
            );
            pt.font = config.preGameScreen.fontFamily;
            pt.easeDuration = 1.3;
            pt.easing = "elastic";

            let won = this.score >= config.settings.scoreToWin;
            let msg = won ? config.settings.winText : config.settings.loseText;
            let messageText = new PopupText(
                msg,
                width / 2,
                height / 2,
                MOBILE ? this.instructionsFontSize * 1.5 : this.instructionsFontSize * 2,
                color(config.settings.textColor)
            );
            messageText.font = config.preGameScreen.fontFamily;
            messageText.easeDuration = 1;
            messageText.easing = "elastic";
            this.particles.push(...[pt, messageText]);

            if (won && config.settings.confetti) {
                this.confetti();
            }
        }
    }

    confetti() {
        let spots = 7;
        let amt = 10;
        if (MOBILE) {
            spots = 5;
        }
        for (let i = 0; i < spots; i++) {
            let x = floor(random(width / 4, width - width / 4));
            let y = floor(random(height / 4, height - height / 4));
            for (let j = 0; j < amt; j++) {
                let acc = randomParticleAcc(4);
                let col = color(floor(random(0, 255)), floor(random(255)), floor(random(255)));
                let size = floor(random(30, 40));
                let p = new Particle(x, y, acc, size, col);
                p.setLifespan(random(0.8, 1.4));
                this.particles.push(p);
            }
        }
    }

    defaults() {
        noStroke();

        this.pressed = false;

        this.score = 0;

        // turn this var to true to end the game
        this.finished = false;

        this.particles = [];

        this.instructionsFontSize = height / 27;
        this.scoreFontSize = height / 18;
        this.delayBeforeExit = 0.4;

        // Don'touch these
        this.started = false;
        this.c_instructionsFontSize = 0;
        this.c_scoreFontSize = 0;
    }

    mousePressed() {
        if ((mouseIsPressed || keyIsDown(32)) && !this.mouse_pressed) {
            this.mouse_pressed = true;

            if (!this.started) {
                this.started = true;
            }
            if (this.started) {
                this.onMousePress();
            }
        } else if (!mouseIsPressed && !keyIsDown(32)) {
            this.mouse_pressed = false;
        }
    }

    calcBgImageSize() {
        // background image size calculations
        this.bgImage = window.images.background;

        if (config.preGameScreen.backgroundMode == "fit") {
            let size = calculateAspectRatioFit(
                this.bgImage.width,
                this.bgImage.height,
                width,
                height
            );
            this.bgImageWidth = size.width;
            this.bgImageHeight = size.height;
        } else {
            let originalRatios = {
                width: window.innerWidth / this.bgImage.width,
                height: window.innerHeight / this.bgImage.height,
            };

            let coverRatio = Math.max(originalRatios.width, originalRatios.height);
            this.bgImageWidth = this.bgImage.width * coverRatio;
            this.bgImageHeight = this.bgImage.height * coverRatio;
        }
        this.bgColor = color(config.preGameScreen.backgroundColor);
    }

    draw() {
        background(color(config.preGameScreen.backgroundColor));
        try {
            image(
                this.bgImage,
                width / 2 - this.bgImageWidth / 2,
                height / 2 - this.bgImageHeight / 2,
                this.bgImageWidth,
                this.bgImageHeight
            );
        } catch (err) {
            this.calcBgImageSize();
        }

        if (window.currentScreen == "gameScreen") {
            // Draw fps if in debug mode
            if (DEBUG) {
                noStroke();
                fill(0);
                textAlign(LEFT);
                textFont("Arial");
                textSize(16);
                text(floor(frameRate()), 0, 15);
            }

            this.mousePressed();

            this.permaUpdate();

            if (this.started) {
                this.updateGame();
            }

            this.particles = this.particles.filter((p) => {
                p.draw();
                return !p.dead;
            });

            // Animate instructions font size
            // in and out
            if (this.instructionsFontSize - this.c_instructionsFontSize > 0.1 && !this.started) {
                this.c_instructionsFontSize = lerp(
                    this.c_instructionsFontSize,
                    this.instructionsFontSize,
                    0.2
                );
            }

            if (this.c_instructionsFontSize > 0.1) {
                if (this.started) {
                    this.c_instructionsFontSize = lerp(this.c_instructionsFontSize, 0, 0.4);
                }

                textStyle(NORMAL);
                noStroke();
                fill(color(config.settings.textColor));
                textFont(config.preGameScreen.fontFamily);
                textSize(this.c_instructionsFontSize);
                textAlign(CENTER);

                text(
                    config.settings.instructions1,
                    width / 2,
                    height / 2 - this.instructionsFontSize * 2
                );
                text(
                    config.settings.instructions2,
                    width / 2,
                    height / 2 - this.instructionsFontSize * 0.7
                );
                text(
                    config.settings.instructions3,
                    width / 2,
                    height / 2 + this.instructionsFontSize * 0.7
                );

                text(
                    `Score more than ${config.settings.scoreToWin} to win!`,
                    width / 2,
                    height / 2 + this.instructionsFontSize * 2
                );
            }

            if (this.started) {
                this.c_scoreFontSize = lerp(this.c_scoreFontSize, this.scoreFontSize, 0.2);

                textStyle(NORMAL);
                noStroke();
                fill(color(config.settings.textColor));
                textAlign(CENTER);
                textSize(this.c_scoreFontSize);
                textFont(config.preGameScreen.fontFamily);
                text(this.score, width / 2, height / 6);
            }

            if (this.finished) {
                this.delayBeforeExit -= deltaTime / 1000;

                // this.c_instructionsFontSize = lerp(this.c_instructionsFontSize, 0, 0.4);

                // fill(color(config.settings.textColor));
                // noStroke();
                // textSize(this.c_instructionsFontSize);
                // textAlign(CENTER);
                // textFont(config.preGameScreen.fontFamily);
                // text("Tap to continue ...", width / 2, height / 2);
                if (
                    this.lastMouseState == true &&
                    !mouseIsPressed &&
                    this.delayBeforeExit < 0
                ) {
                    window.setEndScreenWithScore(this.score);
                }
                this.lastMouseState = mouseIsPressed;
            }
        }
    }
}

// Helper functions

function playSound(sound) {
    try {
        if (window.soundEnabled) {
            sound.play();
        }
    } catch (err) {
        console.error("Couldn't play sound");
    }
}

function randomFromArray(arr) {
    return arr[floor(random(arr.length))];
}

function setGradient(x, y, w, h, c1, c2) {
    for (let i = y; i <= y + h; i++) {
        let inter = map(i, y, y + h, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(x, i, x + w, i);
    }
}

class PopupText {
    constructor(text, x, y, size, color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.startSize = 0;
        this.c_size = this.startSize;
        this.size = size;
        this.color = color;
        this.easeDuration = 1;
        this.easing = "easeInQuad";
        this.startEase = false;
        this.font = "Arial";
        this.style = NORMAL;
        this.vAlign = CENTER;
        this.hAlign = CENTER;
        this.dead = false;
    }

    draw() {
        if (!this.startEase) {
            this.startEase = true;
            shifty.tween({
                from: {
                    size: this.startSize,
                },
                to: {
                    size: this.size,
                },
                duration: this.easeDuration * 1000,
                easing: this.easing,
                step: (state) => {
                    this.c_size = state.size;
                },
            });
        }

        noStroke();
        fill(this.color);
        textAlign(this.vAlign, this.hAlign);
        textStyle(this.style);
        textFont(this.font);
        textSize(this.c_size);
        text(this.text, this.x, this.y);
    }
}

class FloatingText {
    constructor(text, x, y, acc, size, color) {
        this.x = x;
        this.text = text;
        this.y = y;
        this.acc = acc;
        this.size = size;
        this.color = color;
        this.lifespan = 1;
        this.iLifespan = 1;
        this.easing = "easeInQuad";
        this.dead = false;
        this.startEase = false;
        this.font = "Arial";
        this.style = NORMAL;
        this.align = CENTER;
    }

    setLifespan(amt) {
        this.lifespan = amt;
        this.iLifespan = amt;
    }

    draw() {
        if (!this.startEase) {
            shifty.tween({
                from: { size: this.size },
                to: { size: 0 },
                duration: this.iLifespan * 1000,
                easing: this.easing,
                step: (state) => {
                    this.size = state.size;
                },
            });
            this.startEase = true;
        }

        this.lifespan -= deltaTime / 1000;
        this.dead = this.lifespan <= 0;

        if (!this.dead) {
            this.x += this.acc.x;
            this.y += this.acc.y;

            noStroke();
            fill(this.color);
            textAlign(this.align);
            textSize(this.size);
            textStyle(this.style);
            textFont(this.font);
            text(this.text, this.x, this.y);
        }
    }
}

class Particle {
    constructor(x, y, acc, size, _color) {
        this.x = x;
        this.y = y;
        this.acc = acc;
        this.size = size;
        this.lifespan = random(0.5, 0.1);
        this.iLifespan = this.lifespan;
        this.iSize = this.size;
        this.dead = false;
        if (_color) {
            this.color = _color;
        }
        this.image;
        this.rotation = 0;
        this.rotSpeed = 0;
        this.easing = "easeOutSine";
        this.startEase = false;
    }

    setLifespan(lifespan) {
        this.lifespan = lifespan;
        this.iLifespan = lifespan;
    }

    draw() {
        if (!this.startEase) {
            this.startEase = true;
            shifty.tween({
                from: { size: this.iSize },
                to: { size: 0 },
                duration: this.iLifespan * 1000,
                easing: this.easing,
                step: (state) => {
                    this.size = state.size;
                },
            });
        }

        this.lifespan -= deltaTime / 1000;

        this.rotation += (this.rotSpeed * deltaTime) / 1000;

        this.dead = this.lifespan <= 0;

        if (!this.dead) {
            this.x += this.acc.x;
            this.y += this.acc.y;

            if (this.image) {
                imageMode(CENTER);
                image(this.image, this.x, this.y, this.size, this.size);
                imageMode(CORNER);
            } else {
                noStroke();
                fill(this.color);
                circle(this.x, this.y, this.size);
            }
        }
    }
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.debugColor = color(255, 0, 0);
    }

    center() {
        return createVector(this.x + this.w / 2, this.y + this.h / 2);
    }

    top() {
        return this.y;
    }

    bottom() {
        return this.y + this.h;
    }

    left() {
        return this.x;
    }

    right() {
        return this.x + this.w;
    }

    includes(v) {
        if (v != null) {
            return v.x > this.x && v.y > this.y && v.x < this.right() && v.y < this.bottom();
        }
        return false;
    }

    debug() {
        if (DEBUG) {
            stroke(this.debugColor);
            rectMode(CORNER);
            noFill();
            rect(this.x, this.y, this.w, this.h);
        }
    }

    static FromPosition(x, y, w, h = w) {
        return new Rectangle(x - w / 2, y - h / 2, w, h);
    }
}

function intersectRect(r1, r2) {
    return !(
        r2.left() > r1.right() ||
        r2.right() < r1.left() ||
        r2.top() > r1.bottom() ||
        r2.bottom() < r1.top()
    );
}

function randomParticleAcc(amt) {
    let x = random(-amt, amt);
    let y = random(-amt, amt);
    return { x, y };
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth * ratio, height: srcHeight * ratio };
}

//------------------------------

module.exports = Game;
