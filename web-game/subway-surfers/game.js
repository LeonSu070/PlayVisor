class SubwaySurfersGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gameSpeed = 5;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        
        // Game objects with object pooling
        this.player = new Player();
        this.obstacles = [];
        this.coinObjects = [];
        this.particles = [];
        
        // Object pools for better memory management
        this.obstaclePool = [];
        this.coinPool = [];
        this.particlePool = [];
        
        // Lane system (3 lanes)
        this.lanes = [
            this.canvas.width * 0.25,
            this.canvas.width * 0.5,
            this.canvas.width * 0.75
        ];
        this.currentLane = 1; // Middle lane
        
        // Obstacle types - much shorter heights to be easily jumpable
        this.obstacleTypes = [
            { width: 60, height: 40, color: '#e74c3c' }, // Red box - very short
            { width: 80, height: 30, color: '#f39c12' }, // Orange rectangle - very short
            { width: 50, height: 45, color: '#9b59b6' }  // Purple box - very short
        ];
        
        // Input handling
        this.keys = {};
        this.setupInputs();
        this.setupUI();
        
        // Game loop
        this.lastTime = 0;
        this.obstacleTimer = 0;
        this.coinTimer = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.watchdogTimer = null;
        
        this.startScreen();
    }
    
    setupInputs() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50 && this.currentLane > 0) {
                    this.currentLane--;
                } else if (deltaX < -50 && this.currentLane < 2) {
                    this.currentLane++;
                }
            } else {
                if (deltaY < -50) {
                    this.player.jump();
                } else if (deltaY > 50) {
                    this.player.slide();
                }
            }
        });
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        this.gameRunning = false;
    }
    
    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.gameRunning = true;
        this.lastFrameTime = Date.now();
        this.startWatchdog();
        this.startFallbackLoop();
        this.gameLoop();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.stopWatchdog();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('finalDistance').textContent = this.distance;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    restartGame() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameSpeed = 5;
        this.obstacles = [];
        this.coinObjects = [];
        this.particles = [];
        this.currentLane = 1;
        this.player.reset();
        this.updateUI();
        document.getElementById('gameOver').classList.add('hidden');
        this.startGame();
    }
    
    startWatchdog() {
        this.watchdogTimer = setInterval(() => {
            const currentTime = Date.now();
            const timeSinceLastFrame = currentTime - this.lastFrameTime;
            
            // If no frame for more than 2 seconds, restart the game loop
            if (timeSinceLastFrame > 2000 && this.gameRunning) {
                console.warn('Watchdog detected game loop pause, restarting...');
                this.restartGameLoop();
            }
        }, 1000);
    }
    
    stopWatchdog() {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
        }
    }
    
    restartGameLoop() {
        console.log('Restarting game loop...');
        this.lastFrameTime = Date.now();
        this.gameLoop();
    }
    
    startFallbackLoop() {
        // Fallback loop using setInterval as backup
        setInterval(() => {
            if (this.gameRunning && Date.now() - this.lastFrameTime > 100) {
                console.log('Fallback loop triggered');
                this.lastFrameTime = Date.now();
                this.handleInput();
                this.update(16);
                this.render();
            }
        }, 16); // 60fps fallback
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('coins').textContent = `Coins: ${this.coins}`;
        document.getElementById('distance').textContent = `Distance: ${this.distance}m`;
    }
    
    handleInput() {
        // Lane movement
        if ((this.keys['KeyA'] || this.keys['ArrowLeft']) && this.currentLane > 0) {
            this.currentLane--;
            this.keys['KeyA'] = false;
            this.keys['ArrowLeft'] = false;
        }
        if ((this.keys['KeyD'] || this.keys['ArrowRight']) && this.currentLane < 2) {
            this.currentLane++;
            this.keys['KeyD'] = false;
            this.keys['ArrowRight'] = false;
        }
        
        // Jump and slide - more responsive
        if ((this.keys['KeyW'] || this.keys['ArrowUp']) && !this.player.isJumping) {
            this.player.jump();
            console.log('Jump command received!');
            this.keys['KeyW'] = false;
            this.keys['ArrowUp'] = false;
        }
        if ((this.keys['KeyS'] || this.keys['ArrowDown']) && !this.player.isSliding) {
            this.player.slide();
            this.keys['KeyS'] = false;
            this.keys['ArrowDown'] = false;
        }
        
        // Test jump with spacebar
        if (this.keys['Space'] && !this.player.isJumping) {
            this.player.jump();
            console.log('Spacebar jump!');
            this.keys['Space'] = false;
        }
    }
    
    spawnObstacle() {
        if (this.obstacleTimer <= 0) {
            const lane = Math.floor(Math.random() * 3);
            const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
            
            // Limit maximum obstacles to prevent memory issues
            if (this.obstacles.length < 15) {
                this.obstacles.push(this.getObstacleFromPool(
                    this.lanes[lane] - type.width / 2,
                    -type.height,
                    type.width,
                    type.height,
                    type.color
                ));
            }
            
            this.obstacleTimer = Math.random() * 60 + 60; // Random spawn between 60-120 frames
        }
        this.obstacleTimer--;
    }
    
    spawnCoin() {
        if (this.coinTimer <= 0) {
            const lane = Math.floor(Math.random() * 3);
            
            // Limit maximum coins to prevent memory issues
            if (this.coinObjects.length < 10) {
                this.coinObjects.push(this.getCoinFromPool(
                    this.lanes[lane] - 15,
                    -30,
                    30,
                    30
                ));
            }
            
            this.coinTimer = Math.random() * 30 + 30; // Random spawn between 30-60 frames
        }
        this.coinTimer--;
    }
    
    update(deltaTime) {
        if (!this.gameRunning) return;
        
        // Update player
        this.player.update(deltaTime);
        this.player.x = this.lanes[this.currentLane] - this.player.width / 2;
        
        // Spawn obstacles and coins
        this.spawnObstacle();
        this.spawnCoin();
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(deltaTime, this.gameSpeed);
            
            // Remove obstacles that are off screen
            if (this.obstacles[i].y > this.canvas.height) {
                this.obstacles.splice(i, 1);
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, this.obstacles[i])) {
                this.gameOver();
                return;
            }
        }
        
        // Update coins
        for (let i = this.coinObjects.length - 1; i >= 0; i--) {
            this.coinObjects[i].update(deltaTime, this.gameSpeed);
            
            // Remove coins that are off screen
            if (this.coinObjects[i].y > this.canvas.height) {
                this.coinObjects.splice(i, 1);
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, this.coinObjects[i])) {
                this.coins++;
                this.score += 10;
                this.createCoinParticles(this.coinObjects[i].x, this.coinObjects[i].y);
                this.coinObjects.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Performance monitoring and cleanup
        this.frameCount++;
        if (this.frameCount % 300 === 0) { // Every 300 frames (about 5 seconds at 60fps)
            this.cleanupObjects();
        }
        
        // Force cleanup if too many objects
        if (this.obstacles.length > 20 || this.coinObjects.length > 15 || this.particles.length > 40) {
            this.cleanupObjects();
        }
        
        // Performance logging
        if (this.frameCount % 600 === 0) { // Every 10 seconds
            const fps = Math.round(1000 / deltaTime);
            console.log(`Performance: FPS: ${fps}, Objects: ${this.obstacles.length + this.coinObjects.length + this.particles.length}, Score: ${this.score}`);
        }
        
        // Update score and distance
        this.score += Math.floor(this.gameSpeed);
        this.distance += Math.floor(this.gameSpeed / 10);
        
        // Increase game speed over time (with a cap to prevent it from becoming unplayable)
        this.gameSpeed = Math.min(this.gameSpeed + 0.01, 15);
        
        this.updateUI();
    }
    
    checkCollision(obj1, obj2) {
        // More accurate collision detection with jump consideration
        const playerBottom = obj1.y + obj1.height;
        const obstacleTop = obj2.y;
        
        // If player is jumping and above the obstacle, no collision
        if (obj1.isJumping && playerBottom < obstacleTop + 10) {
            console.log(`Jump successful! Player bottom: ${playerBottom}, Obstacle top: ${obstacleTop}`);
            return false;
        }
        
        const collision = obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
        
        // Debug collision info
        if (collision) {
            console.log(`Collision detected! Player: (${obj1.x}, ${obj1.y}, ${obj1.width}, ${obj1.height}), Obstacle: (${obj2.x}, ${obj2.y}, ${obj2.width}, ${obj2.height})`);
            console.log(`Player bottom: ${playerBottom}, Obstacle top: ${obstacleTop}, Jumping: ${obj1.isJumping}`);
        }
        
        return collision;
    }
    
    createCoinParticles(x, y) {
        // Limit particles to prevent memory issues
        if (this.particles.length < 30) {
            for (let i = 0; i < 6; i++) {
                this.particles.push(this.getParticleFromPool(
                    x + 15,
                    y + 15,
                    Math.random() * 200 - 100,
                    Math.random() * -200 - 100,
                    '#FFD700'
                ));
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects (only if they're visible)
        this.player.render(this.ctx);
        
        // Only render visible obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.y < this.canvas.height + 100) {
                obstacle.render(this.ctx);
            }
        });
        
        // Only render visible coins
        this.coinObjects.forEach(coin => {
            if (coin.y < this.canvas.height + 100) {
                coin.render(this.ctx);
            }
        });
        
        // Only render visible particles
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                particle.render(this.ctx);
            }
        });
        
        // Draw lane indicators
        this.drawLaneIndicators();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Road
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // Lane dividers
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        this.lanes.forEach(lane => {
            this.ctx.beginPath();
            this.ctx.moveTo(lane, this.canvas.height - 100);
            this.ctx.lineTo(lane, this.canvas.height);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }
    
    drawLaneIndicators() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            this.lanes[this.currentLane] - 40,
            this.canvas.height - 120,
            80,
            20
        );
    }
    
    cleanupObjects() {
        // Force cleanup of any objects that might be stuck
        this.obstacles = this.obstacles.filter(obs => obs.y < this.canvas.height + 100);
        this.coinObjects = this.coinObjects.filter(coin => coin.y < this.canvas.height + 100);
        this.particles = this.particles.filter(particle => particle.life > 0);
        
        // Return objects to pools
        this.obstacles.forEach(obs => this.obstaclePool.push(obs));
        this.coinObjects.forEach(coin => this.coinPool.push(coin));
        this.particles.forEach(particle => this.particlePool.push(particle));
        
        // Clear active arrays
        this.obstacles.length = 0;
        this.coinObjects.length = 0;
        this.particles.length = 0;
        
        // Log performance info
        console.log(`Performance: ${this.obstacles.length} obstacles, ${this.coinObjects.length} coins, ${this.particles.length} particles`);
    }
    
    getObstacleFromPool(x, y, width, height, color) {
        if (this.obstaclePool.length > 0) {
            const obstacle = this.obstaclePool.pop();
            obstacle.x = x;
            obstacle.y = y;
            obstacle.width = width;
            obstacle.height = height;
            obstacle.color = color;
            return obstacle;
        }
        return new Obstacle(x, y, width, height, color);
    }
    
    getCoinFromPool(x, y, width, height) {
        if (this.coinPool.length > 0) {
            const coin = this.coinPool.pop();
            coin.x = x;
            coin.y = y;
            coin.width = width;
            coin.height = height;
            coin.rotation = 0;
            return coin;
        }
        return new Coin(x, y, width, height);
    }
    
    getParticleFromPool(x, y, velocityX, velocityY, color) {
        if (this.particlePool.length > 0) {
            const particle = this.particlePool.pop();
            particle.x = x;
            particle.y = y;
            particle.velocityX = velocityX;
            particle.velocityY = velocityY;
            particle.color = color;
            particle.life = 60;
            particle.maxLife = 60;
            return particle;
        }
        return new Particle(x, y, velocityX, velocityY, color);
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        try {
            const deltaTime = Math.min(currentTime - this.lastTime, 33); // Cap deltaTime to prevent huge jumps
            this.lastTime = currentTime;
            this.lastFrameTime = Date.now(); // Update watchdog timer
            
            this.handleInput();
            this.update(deltaTime);
            this.render();
            
            // Use a more robust game loop
            if (this.gameRunning) {
                requestAnimationFrame((time) => this.gameLoop(time));
            }
        } catch (error) {
            console.error('Game loop error:', error);
            // Restart the game loop if there's an error
            if (this.gameRunning) {
                setTimeout(() => this.gameLoop(), 16);
            }
        }
    }
}

class Player {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = 0;
        this.y = 0;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpPower = -20;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.normalHeight = 60;
        this.slideHeight = 30;
        this.jumpHeight = 150; // Maximum jump height
    }
    
    reset() {
        this.y = 400;
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.height = this.normalHeight;
    }
    
    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
            console.log('Player jumped!'); // Debug log
        }
    }
    
    slide() {
        if (!this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.slideTimer = 30;
            this.height = this.slideHeight;
        }
    }
    
    update(deltaTime) {
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Ground collision
        if (this.y > 400) {
            this.y = 400;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Update slide
        if (this.isSliding) {
            this.slideTimer--;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.height = this.normalHeight;
            }
        }
        
        // Debug jump info
        if (this.isJumping) {
            console.log(`Jump height: ${400 - this.y}, Velocity: ${this.velocityY}`);
        }
    }
    
    render(ctx) {
        // Player body
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Player head
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(this.x + 5, this.y - 20, 30, 20);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y - 15, 5, 5);
        ctx.fillRect(this.x + 20, this.y - 15, 5, 5);
        
        // Arms
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(this.x - 10, this.y + 10, 10, 20);
        ctx.fillRect(this.x + this.width, this.y + 10, 10, 20);
        
        // Jump indicator (debug)
        if (this.isJumping) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            ctx.setLineDash([]);
            
            // Show jump trajectory
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + this.height);
            ctx.lineTo(this.x + this.width/2, this.y + this.height - 100);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

class Obstacle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    
    update(deltaTime, gameSpeed) {
        this.y += gameSpeed;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some detail
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Coin {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = 0;
    }
    
    update(deltaTime, gameSpeed) {
        this.y += gameSpeed;
        this.rotation += 0.1;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Coin body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin border
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Dollar sign
        ctx.fillStyle = '#FFA500';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, velocityX, velocityY, color) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.life = 60;
        this.maxLife = 60;
    }
    
    update(deltaTime) {
        this.x += this.velocityX * 0.1;
        this.y += this.velocityY * 0.1;
        this.velocityY += 0.5; // Gravity
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SubwaySurfersGame();
});
