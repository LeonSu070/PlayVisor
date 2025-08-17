// 太空跑酷游戏 - 正式版
// 完整的太空主题跑酷游戏体验

class SpaceRunner extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceRunner' });
        
        // 游戏状态
        this.score = 0;
        this.highScore = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.gameSpeed = 200;
        this.level = 1;
        
        // 游戏对象
        this.player = null;
        this.platforms = null;
        this.crystals = null;
        this.obstacles = null;
        this.scoreText = null;
        this.levelText = null;
        this.startScreen = null;
        
        // 游戏参数
        this.platformSpeed = 2;
        this.crystalSpawnRate = 2000;
        this.obstacleSpawnRate = 3000;
    }

    preload() {
        console.log('🚀 游戏资源预加载完成');
    }

    create() {
        console.log('🚀 开始创建游戏场景');
        
        // 设置背景色
        this.cameras.main.setBackgroundColor('#0a0a2a');
        
        // 创建简单的星空背景
        this.createStars();
        
        // 创建物理世界
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // 创建游戏元素
        this.createPlayer();
        this.createPlatforms();
        this.createCrystals();
        this.createObstacles();
        this.createUI();
        
        // 设置碰撞
        this.setupCollisions();
        
        // 显示开始界面
        this.showStartScreen();
        
        // 在游戏画布上方添加HTML内容
        this.addHTMLOverlay();
        
        console.log('🚀 游戏场景创建完成');
    }
    
    addHTMLOverlay() {
        // 在游戏画布上方添加HTML内容
        const gameContainer = document.getElementById('game');
        if (gameContainer) {
            // 创建游戏信息面板
            const infoPanel = document.createElement('div');
            infoPanel.id = 'game-info-panel';
            infoPanel.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
            `;
            infoPanel.innerHTML = `
                <div>🚀 太空跑酷</div>
                <div>状态: 等待开始</div>
                <div>操作: 空格键开始/跳跃</div>
            `;
            
            gameContainer.appendChild(infoPanel);
            
            // 创建游戏控制提示
            const controlHint = document.createElement('div');
            controlHint.id = 'control-hint';
            controlHint.style.cssText = `
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #4a90e2;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
            `;
            controlHint.innerHTML = '按空格键开始游戏';
            
            gameContainer.appendChild(controlHint);
        }
    }

    createStars() {
        // 创建简单的星空背景
        for (let i = 0; i < 20; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                1,
                0xffffff
            );
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
        }
        console.log('🚀 星空背景创建完成');
    }

    createPlayer() {
        // 创建玩家 - 放在第一个平台上，无重力
        this.player = this.add.circle(200, 450, 15, 0x4a90e2);
        this.physics.add.existing(this.player);
        this.player.body.setGravityY(0); // 游戏开始前无重力
        this.player.body.setCollideWorldBounds(true);
        
        // 添加玩家边框
        this.player.setStrokeStyle(2, 0xffffff);
        
        console.log('🚀 玩家创建完成，位置:', this.player.x, this.player.y);
    }

    createPlatforms() {
        // 创建平台组
        this.platforms = this.physics.add.staticGroup();
        
        // 创建初始平台
        for (let i = 0; i < 5; i++) {
            const platform = this.add.rectangle(
                200 + i * 150,
                500,
                120,
                20,
                0x2d5aa0
            );
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
            
            // 添加平台边框
            platform.setStrokeStyle(2, 0xffffff);
        }
        console.log('🚀 平台创建完成，数量:', this.platforms.getChildren().length);
    }

    createCrystals() {
        // 创建晶体组
        this.crystals = this.physics.add.group();
        
        // 创建初始晶体
        for (let i = 0; i < 3; i++) {
            const crystal = this.add.rectangle(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(100, 400),
                20,
                20,
                0x00ff88
            );
            this.physics.add.existing(crystal);
            this.crystals.add(crystal);
            
            // 添加晶体边框和发光效果
            crystal.setStrokeStyle(2, 0x00ffaa);
            crystal.setAlpha(0.8);
            
            // 添加浮动动画
            this.tweens.add({
                targets: crystal,
                y: crystal.y - 10,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        console.log('🚀 晶体创建完成，数量:', this.crystals.getChildren().length);
    }

    createObstacles() {
        // 创建障碍物组
        this.obstacles = this.physics.add.group();
        
        // 创建初始障碍物
        for (let i = 0; i < 2; i++) {
            const obstacle = this.add.rectangle(
                Phaser.Math.Between(200, 600),
                Phaser.Math.Between(300, 500),
                30,
                30,
                0xff4444
            );
            this.physics.add.existing(obstacle);
            this.obstacles.add(obstacle);
            
            // 添加障碍物边框
            obstacle.setStrokeStyle(2, 0xff6666);
            
            // 添加旋转动画
            this.tweens.add({
                targets: obstacle,
                angle: 360,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
        }
        console.log('🚀 障碍物创建完成，数量:', this.crystals.getChildren().length);
    }

    createUI() {
        // 创建UI
        this.scoreText = this.add.text(20, 20, '分数: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        this.levelText = this.add.text(20, 60, '等级: 1', {
            fontSize: '20px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // 显示最高分
        this.highScore = localStorage.getItem('spaceRunnerHighScore') || 0;
        this.highScoreText = this.add.text(20, 90, '最高分: ' + this.highScore, {
            fontSize: '18px',
            fill: '#00ff88',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        console.log('🚀 UI创建完成');
    }

    setupCollisions() {
        // 设置碰撞
        this.physics.add.collider(this.player, this.platforms);
        
        // 收集晶体
        this.physics.add.overlap(this.player, this.crystals, this.collectCrystal, null, this);
        
        // 碰到障碍物
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        
        console.log('🚀 碰撞检测设置完成');
    }

    collectCrystal(player, crystal) {
        // 收集晶体
        crystal.destroy();
        this.score += 10;
        this.scoreText.setText('分数: ' + this.score);
        
        // 分数弹出动画
        const scorePopup = this.add.text(crystal.x, crystal.y - 20, '+10', {
            fontSize: '16px',
            fill: '#00ff88'
        });
        
        this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => scorePopup.destroy()
        });
        
        // 检查等级提升
        this.checkLevelUp();
        
        console.log('🚀 收集晶体，分数:', this.score);
    }

    hitObstacle(player, obstacle) {
        // 碰到障碍物
        obstacle.destroy();
        this.score = Math.max(0, this.score - 5);
        this.scoreText.setText('分数: ' + this.score);
        
        // 伤害提示
        const damagePopup = this.add.text(obstacle.x, obstacle.y - 20, '-5', {
            fontSize: '16px',
            fill: '#ff4444'
        });
        
        this.tweens.add({
            targets: damagePopup,
            y: damagePopup.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => damagePopup.destroy()
        });
        
        // 玩家闪烁效果
        this.tweens.add({
            targets: player,
            alpha: 0.5,
            duration: 200,
            yoyo: true,
            repeat: 2
        });
        
        console.log('🚀 碰到障碍物，分数:', this.score);
    }

    checkLevelUp() {
        // 检查等级提升
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelText.setText('等级: ' + this.level);
            
            // 等级提升提示
            const levelUpText = this.add.text(400, 200, '🎉 等级提升！', {
                fontSize: '32px',
                fill: '#00ff88',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: levelUpText,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                repeat: 1,
                onComplete: () => levelUpText.destroy()
            });
            
            // 增加游戏难度
            this.increaseDifficulty();
            
            console.log('🚀 等级提升到:', this.level);
        }
    }

    increaseDifficulty() {
        // 增加游戏难度
        this.platformSpeed += 0.5;
        this.crystalSpawnRate = Math.max(500, this.crystalSpawnRate - 100);
        this.obstacleSpawnRate = Math.max(1000, this.obstacleSpawnRate - 50);
        
        console.log('🚀 难度增加，平台速度:', this.platformSpeed);
    }

    showStartScreen() {
        // 显示开始界面
        this.startScreen = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        
        // 游戏标题
        this.add.text(400, 150, '🚀 太空跑酷', {
            fontSize: '64px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.add.text(400, 220, 'SPACE RUNNER', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 游戏说明
        this.add.text(400, 300, '按空格键开始游戏', {
            fontSize: '28px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.add.text(400, 350, '游戏开始后：按空格键跳跃', {
            fontSize: '20px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 游戏特色
        this.add.text(400, 400, '🎯 收集绿色晶体获得分数', {
            fontSize: '18px',
            fill: '#00ff88',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.add.text(400, 430, '⚠️ 避开红色障碍物', {
            fontSize: '18px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.add.text(400, 460, '🏆 挑战最高分记录', {
            fontSize: '18px',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 最高分显示
        if (this.highScore > 0) {
            this.add.text(400, 500, '最高分: ' + this.highScore, {
                fontSize: '22px',
                fill: '#00ff88',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }
        
        // 设置开始游戏的输入
        this.input.keyboard.once('keydown-SPACE', this.startGame, this);
        this.input.once('pointerdown', this.startGame, this);
        
        console.log('🚀 开始界面显示完成');
    }

    startGame() {
        console.log('🚀 游戏开始');
        
        // 隐藏开始界面
        if (this.startScreen) {
            this.startScreen.destroy();
        }
        
        // 清除开始界面的文本
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child !== this.scoreText) {
                child.destroy();
            }
        });
        
        this.isGameStarted = true;
        
        // 启用重力
        this.player.body.setGravityY(400); // 较小的重力
        console.log('🚀 重力已启用');
        
        // 更新HTML信息面板
        this.updateHTMLOverlay();
        
        // 显示开始提示
        const startMsg = this.add.text(400, 100, '🎮 游戏开始！按空格键跳跃', {
            fontSize: '28px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: startMsg,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => startMsg.destroy()
        });
        
        // 开始生成新的游戏元素
        this.startSpawning();
    }
    
    startSpawning() {
        // 定期生成新的晶体
        this.time.addEvent({
            delay: this.crystalSpawnRate,
            callback: this.spawnCrystal,
            callbackScope: this,
            loop: true
        });
        
        // 定期生成新的障碍物
        this.time.addEvent({
            delay: this.obstacleSpawnRate,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
        
        console.log('🚀 开始生成游戏元素');
    }
    
    spawnCrystal() {
        // 生成新的晶体
        const crystal = this.add.rectangle(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 400),
            20,
            20,
            0x00ff88
        );
        this.physics.add.existing(crystal);
        this.crystals.add(crystal);
        
        // 添加晶体边框和发光效果
        crystal.setStrokeStyle(2, 0x00ffaa);
        crystal.setAlpha(0.8);
        
        // 添加浮动动画
        this.tweens.add({
            targets: crystal,
            y: crystal.y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        console.log('🚀 生成新晶体');
    }
    
    spawnObstacle() {
        // 生成新的障碍物
        const obstacle = this.add.rectangle(
            Phaser.Math.Between(200, 600),
            Phaser.Math.Between(300, 500),
            30,
            30,
            0xff4444
        );
        this.physics.add.existing(obstacle);
        this.obstacles.add(obstacle);
        
        // 添加障碍物边框
        obstacle.setStrokeStyle(2, 0xff6666);
        
        // 添加旋转动画
        this.tweens.add({
            targets: obstacle,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        console.log('🚀 生成新障碍物');
    }
    
    updateHTMLOverlay() {
        // 更新HTML信息面板
        const infoPanel = document.getElementById('game-info-panel');
        const controlHint = document.getElementById('control-hint');
        
        if (infoPanel) {
            infoPanel.innerHTML = `
                <div>🚀 太空跑酷</div>
                <div>状态: ${this.isGameStarted ? '游戏中' : '等待开始'}</div>
                <div>分数: ${this.score}</div>
                <div>操作: 空格键跳跃</div>
            `;
        }
        
        if (controlHint) {
            controlHint.innerHTML = this.isGameStarted ? '游戏中 - 按空格键跳跃' : '按空格键开始游戏';
        }
    }

    update() {
        if (this.isGameOver || !this.isGameStarted) {
            return;
        }
        
        // 检查游戏结束
        this.checkGameOver();
        
        // 处理跳跃
        this.handleJump();
        
        // 更新分数
        this.updateScore();
    }

    handleJump() {
        // 处理跳跃输入
        if (this.input.keyboard.checkDown(this.input.keyboard.addKey('SPACE'), 100)) {
            if (this.player.body.touching.down) {
                this.player.body.setVelocityY(-250); // 较小的跳跃高度
                console.log('🚀 玩家跳跃');
            }
        }
    }

    updateScore() {
        // 简单的分数系统 - 基于时间
        if (this.time.now % 1000 < 16) { // 每秒增加1分
            this.score += 1;
            this.scoreText.setText('分数: ' + this.score);
            
            // 更新HTML信息面板
            this.updateHTMLOverlay();
        }
    }

    checkGameOver() {
        // 给玩家更多容错空间
        if (this.player.y > 800) {
            console.log('🚀 玩家掉出屏幕，游戏结束');
            this.gameOver();
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        
        // 检查并保存最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceRunnerHighScore', this.highScore);
            console.log('🚀 新纪录！最高分更新为:', this.highScore);
        }
        
        console.log('🚀 游戏结束，最终分数:', this.score);
        
        // 创建半透明背景
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        
        // 创建游戏结束弹框
        const gameOverBox = this.add.rectangle(400, 300, 500, 400, 0x2a2a2a);
        gameOverBox.setStrokeStyle(4, 0xff4444);
        
        // 游戏结束标题
        this.add.text(400, 150, '🎮 游戏结束', {
            fontSize: '48px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // 最终分数
        this.add.text(400, 220, '最终分数: ' + this.score, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 最高分显示
        this.add.text(400, 260, '最高分: ' + this.highScore, {
            fontSize: '24px',
            fill: '#00ff88',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 等级显示
        this.add.text(400, 300, '最终等级: ' + this.level, {
            fontSize: '20px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 重新开始提示
        const restartText = this.add.text(400, 360, '按空格键重新开始', {
            fontSize: '24px',
            fill: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 闪烁动画
        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // 重新开始
        this.input.keyboard.once('keydown-SPACE', this.restartGame, this);
        this.input.once('pointerdown', this.restartGame, this);
    }

    restartGame() {
        console.log('🚀 重新开始游戏');
        this.scene.restart();
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#0a0a2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // 初始无重力
            debug: false
        }
    },
    scene: SpaceRunner
};

// 创建游戏实例
console.log('🚀 开始创建游戏实例...');
try {
    const game = new Phaser.Game(config);
    console.log('🚀 游戏启动成功！');
} catch (error) {
    console.error('🚀 游戏启动失败:', error);
    
    const gameContainer = document.getElementById('game');
    if (gameContainer) {
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #ff4444;">
                <h2>❌ 游戏启动失败</h2>
                <p>错误信息: ${error.message}</p>
                <p>请刷新页面重试</p>
                <button onclick="location.reload()" style="
                    background: #4a90e2; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 20px;
                ">刷新页面</button>
            </div>
        `;
    }
}
