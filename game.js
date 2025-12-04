// Storage Manager
const StorageManager = {
    STORAGE_KEYS: {
        SCORE_HISTORY: 'kiro_score_history',
        HIGH_SCORE: 'kiro_high_score'
    },
    MAX_HISTORY_ENTRIES: 50,

    // Save a score to history
    saveScore(score, won, timestamp = Date.now()) {
        try {
            const history = this.getScoreHistory();
            const entry = {
                score: score,
                won: won,
                timestamp: timestamp,
                date: new Date(timestamp).toLocaleString()
            };
            
            history.push(entry);
            
            // Enforce 50-entry limit, remove oldest entries
            while (history.length > this.MAX_HISTORY_ENTRIES) {
                history.shift();
            }
            
            localStorage.setItem(this.STORAGE_KEYS.SCORE_HISTORY, JSON.stringify(history));
            
            // Update high score if needed
            this.updateHighScore(score);
        } catch (e) {
            console.warn('Storage unavailable:', e);
            // Continue gameplay without persistence
        }
    },

    // Get score history
    getScoreHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SCORE_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Storage unavailable:', e);
            return [];
        }
    },

    // Get high score
    getHighScore() {
        try {
            const highScore = localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORE);
            return highScore ? parseInt(highScore, 10) : 0;
        } catch (e) {
            console.warn('Storage unavailable:', e);
            return 0;
        }
    },

    // Update high score if new score is higher
    updateHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            if (score > currentHighScore) {
                localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORE, score.toString());
                return true; // New high score achieved
            }
            return false;
        } catch (e) {
            console.warn('Storage unavailable:', e);
            return false;
        }
    },

    // Clear all stored data (for testing/reset)
    clearHistory() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.SCORE_HISTORY);
            localStorage.removeItem(this.STORAGE_KEYS.HIGH_SCORE);
        } catch (e) {
            console.warn('Storage unavailable:', e);
        }
    }
};

// Particle System
const ParticleSystem = {
    particles: [],
    MAX_TRAIL_PARTICLES: 50,
    
    // Create trail particle
    createTrailParticle(x, y) {
        // Count current trail particles
        const trailCount = this.particles.filter(p => p.type === 'trail').length;
        
        // Enforce 50-particle limit for trail particles
        if (trailCount >= this.MAX_TRAIL_PARTICLES) {
            return;
        }
        
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: 1.0,
            maxLife: 1.0,
            size: Math.random() * 2 + 3, // 3-5px
            color: '#790ECB', // Purple-500
            type: 'trail',
            rotation: 0,
            rotationSpeed: 0
        });
    },
    
    // Create confetti particles for high score celebration
    createConfetti(count = 100) {
        const kiroColors = ['#790ECB', '#9b3fd9', '#b565e8', '#00FFFF', '#FFD700'];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: -20 - Math.random() * 100, // Start above screen
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2 + 1, // Falling speed
                life: 1.0,
                maxLife: 1.0,
                size: Math.random() * 4 + 6, // 6-10px
                color: kiroColors[Math.floor(Math.random() * kiroColors.length)],
                type: 'confetti',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    },
    
    // Create double jump particles
    createDoubleJumpParticles(x, y) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1.0,
                maxLife: 1.0,
                size: 5,
                color: '#9b3fd9',
                type: 'doubleJump',
                rotation: 0,
                rotationSpeed: 0
            });
        }
    },
    
    // Update all particles
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Update rotation for confetti
            if (p.type === 'confetti') {
                p.rotation += p.rotationSpeed;
                p.vy += 0.1; // Gravity effect
            }
            
            // Update double jump particles
            if (p.type === 'doubleJump') {
                p.vx *= 0.95; // Slow down
                p.vy *= 0.95;
            }
            
            // Update trail particles
            if (p.type === 'trail') {
                p.vx *= 0.95; // Slow down
                p.vy *= 0.95;
            }
            
            // Decrease life based on particle type
            if (p.type === 'trail') {
                p.life -= 0.02; // 0.5 second lifetime (1.0 / 50 frames)
            } else {
                p.life -= 0.02;
            }
            
            // Remove particles that are dead or off-screen
            if (p.life <= 0 || (p.type === 'confetti' && p.y > CANVAS_HEIGHT + 50)) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    // Draw all particles
    draw(ctx, camera) {
        this.particles.forEach(p => {
            ctx.save();
            
            if (p.type === 'confetti') {
                // Confetti particles don't use camera offset (screen-space effect)
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                const opacity = p.life;
                ctx.fillStyle = p.color.includes('rgba') ? p.color : p.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
                
                // Draw rectangular confetti
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
            } else if (p.type === 'doubleJump') {
                // Double jump particles use camera offset (world-space effect)
                const opacity = p.life;
                ctx.fillStyle = `rgba(155, 63, 217, ${opacity})`;
                ctx.beginPath();
                ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'trail') {
                // Trail particles use camera offset (world-space effect)
                // Opacity decreases proportionally as life decreases
                const opacity = p.life;
                ctx.fillStyle = `rgba(121, 14, 203, ${opacity})`; // Purple-500 with fade
                ctx.beginPath();
                ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
};

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_POWER = -12;
const MOVE_SPEED = 5;
const FRICTION = 0.8;

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    won: false,
    highScore: StorageManager.getHighScore(),
    isNewHighScore: false
};

// Player object
const player = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    image: null,
    doubleJumpAvailable: true,
    hasDoubleJumped: false,
    facingRight: true
};

// Camera
const camera = {
    x: 0,
    y: 0
};

// Load player image
player.image = new Image();
player.image.src = 'kiro-logo.png';

// Keyboard state
const keys = {};

// Level design - platforms
const platforms = [
    // Ground level
    { x: 0, y: 550, width: 400, height: 50, color: '#790ECB' },
    { x: 500, y: 550, width: 400, height: 50, color: '#790ECB' },
    { x: 1000, y: 550, width: 400, height: 50, color: '#790ECB' },
    { x: 1500, y: 550, width: 400, height: 50, color: '#790ECB' },
    { x: 2000, y: 550, width: 600, height: 50, color: '#790ECB' },
    
    // Mid-level platforms
    { x: 300, y: 450, width: 150, height: 20, color: '#9b3fd9' },
    { x: 600, y: 400, width: 150, height: 20, color: '#9b3fd9' },
    { x: 900, y: 350, width: 150, height: 20, color: '#9b3fd9' },
    { x: 1200, y: 400, width: 150, height: 20, color: '#9b3fd9' },
    { x: 1500, y: 450, width: 150, height: 20, color: '#9b3fd9' },
    { x: 1800, y: 400, width: 150, height: 20, color: '#9b3fd9' },
    
    // Higher platforms
    { x: 450, y: 300, width: 120, height: 20, color: '#b565e8' },
    { x: 750, y: 250, width: 120, height: 20, color: '#b565e8' },
    { x: 1050, y: 200, width: 120, height: 20, color: '#b565e8' },
    { x: 1350, y: 250, width: 120, height: 20, color: '#b565e8' },
    { x: 1650, y: 300, width: 120, height: 20, color: '#b565e8' },
    
    // Final platform
    { x: 2300, y: 450, width: 200, height: 20, color: '#790ECB' }
];

// Collectibles
const collectibles = [
    // Pink Coins (10 points)
    { x: 350, y: 420, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 650, y: 370, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 950, y: 320, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 1250, y: 370, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 1550, y: 420, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 1850, y: 370, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    
    // Gems (25 points)
    { x: 500, y: 270, width: 25, height: 25, type: 'gem', collected: false, value: 25 },
    { x: 800, y: 220, width: 25, height: 25, type: 'gem', collected: false, value: 25 },
    { x: 1100, y: 170, width: 25, height: 25, type: 'gem', collected: false, value: 25 },
    { x: 1400, y: 220, width: 25, height: 25, type: 'gem', collected: false, value: 25 },
    { x: 1700, y: 270, width: 25, height: 25, type: 'gem', collected: false, value: 25 },
    
    // Bonus coins on ground
    { x: 200, y: 520, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 700, y: 520, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 1100, y: 520, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    { x: 1700, y: 520, width: 20, height: 20, type: 'coin', collected: false, value: 10 },
    
    // Black Bombs (damage: -0.5 life)
    { x: 400, y: 520, width: 25, height: 25, type: 'bomb', collected: false, damage: 0.5 },
    { x: 850, y: 320, width: 25, height: 25, type: 'bomb', collected: false, damage: 0.5 },
    { x: 1150, y: 370, width: 25, height: 25, type: 'bomb', collected: false, damage: 0.5 },
    { x: 1600, y: 420, width: 25, height: 25, type: 'bomb', collected: false, damage: 0.5 },
    { x: 2100, y: 520, width: 25, height: 25, type: 'bomb', collected: false, damage: 0.5 },
    
    // Final gem
    { x: 2400, y: 420, width: 30, height: 30, type: 'gem', collected: false, value: 50 }
];

// Goal
const goal = {
    x: 2450,
    y: 400,
    width: 50,
    height: 50
};

// Monsters that pop up from gaps
const monsters = [];
const monsterSpawnPoints = [
    { x: 425, y: 550 },  // Gap between first two ground platforms
    { x: 925, y: 550 },  // Gap between ground platforms
    { x: 1425, y: 550 }, // Gap between ground platforms
    { x: 1925, y: 550 }  // Gap before final platform
];

let monsterSpawnTimer = 0;
const MONSTER_SPAWN_INTERVAL = 180; // Frames between spawn attempts (3 seconds at 60fps)
const MONSTER_SPAWN_CHANCE = 0.75;  // 75% chance to spawn when timer triggers

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Jump handling with double jump support
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !gameState.gameOver) {
        // First jump (on ground)
        if (player.onGround) {
            player.velocityY = JUMP_POWER;
            player.onGround = false;
            player.doubleJumpAvailable = true;
            player.hasDoubleJumped = false;
        }
        // Double jump (in air, not used yet)
        else if (player.doubleJumpAvailable && !player.hasDoubleJumped) {
            player.velocityY = JUMP_POWER;
            player.hasDoubleJumped = true;
            player.doubleJumpAvailable = false;
            
            // Create visual feedback particles
            ParticleSystem.createDoubleJumpParticles(
                player.x + player.width / 2,
                player.y + player.height / 2
            );
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update player
function updatePlayer() {
    if (gameState.gameOver) return;
    
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = -MOVE_SPEED;
        player.facingRight = false;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = MOVE_SPEED;
        player.facingRight = true;
    } else {
        player.velocityX *= FRICTION;
    }
    
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Generate trail particles when moving horizontally
    // Only generate if player has significant horizontal velocity (not stationary)
    if (Math.abs(player.velocityX) > 0.5) {
        // Create trail particle at player's center position
        ParticleSystem.createTrailParticle(
            player.x + player.width / 2,
            player.y + player.height / 2
        );
    }
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Reset ground state
    player.onGround = false;
    
    // Platform collision
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Landing on top
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                // Reset double jump when landing
                player.doubleJumpAvailable = true;
                player.hasDoubleJumped = false;
            }
            // Hitting from below
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collision
            else {
                if (player.velocityX > 0) {
                    player.x = platform.x - player.width;
                } else if (player.velocityX < 0) {
                    player.x = platform.x + platform.width;
                }
                player.velocityX = 0;
            }
        }
    });
    
    // Check collectibles
    collectibles.forEach(item => {
        if (!item.collected && checkCollision(player, item)) {
            item.collected = true;
            
            if (item.type === 'bomb') {
                // Bomb damages player (removes half a heart)
                gameState.lives -= item.damage;
                updateUI();
                
                // Check if player died from bomb
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                    updateMessage();
                }
            } else {
                // Coins and gems add to score
                gameState.score += item.value;
                updateUI();
            }
        }
    });
    
    // Check goal
    if (checkCollision(player, goal)) {
        gameState.won = true;
        gameState.gameOver = true;
        updateMessage();
    }
    
    // Fall off map - lose a life
    if (player.y > CANVAS_HEIGHT + 100) {
        loseLife();
    }
    
    // Check monster collisions
    monsters.forEach(monster => {
        if (monster.active && checkCollision(player, monster)) {
            // Monster damages player
            gameState.lives -= 1;
            updateUI();
            
            // Remove monster after hit
            monster.active = false;
            
            // Check if player died
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
                updateMessage();
            }
        }
    });
    
    // Update camera
    updateCamera();
}

// Update monsters
function updateMonsters() {
    if (gameState.gameOver) return;
    
    // Update spawn timer
    monsterSpawnTimer++;
    
    // Try to spawn a monster at random intervals
    if (monsterSpawnTimer >= MONSTER_SPAWN_INTERVAL) {
        monsterSpawnTimer = 0;
        
        if (Math.random() < MONSTER_SPAWN_CHANCE) {
            // Pick a random spawn point
            const spawnPoint = monsterSpawnPoints[Math.floor(Math.random() * monsterSpawnPoints.length)];
            
            // Create new monster
            monsters.push({
                x: spawnPoint.x,
                y: spawnPoint.y,
                startY: spawnPoint.y,
                width: 40,
                height: 50,
                active: true,
                phase: 'rising',  // rising, waiting, falling
                phaseTimer: 0,
                riseSpeed: 2
            });
        }
    }
    
    // Update each monster
    for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];
        
        if (!monster.active) {
            monsters.splice(i, 1);
            continue;
        }
        
        monster.phaseTimer++;
        
        if (monster.phase === 'rising') {
            // Rise up from the ground
            monster.y -= monster.riseSpeed;
            
            // Stop when fully emerged (50 pixels above ground)
            if (monster.y <= monster.startY - 50) {
                monster.phase = 'waiting';
                monster.phaseTimer = 0;
            }
        } else if (monster.phase === 'waiting') {
            // Wait for 2 seconds (120 frames)
            if (monster.phaseTimer >= 120) {
                monster.phase = 'falling';
                monster.phaseTimer = 0;
            }
        } else if (monster.phase === 'falling') {
            // Sink back down
            monster.y += monster.riseSpeed;
            
            // Remove when back underground
            if (monster.y >= monster.startY) {
                monster.active = false;
            }
        }
    }
}

// Check collision
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update camera
function updateCamera() {
    // Smooth follow
    const targetX = player.x - CANVAS_WIDTH / 3;
    camera.x += (targetX - camera.x) * 0.1;
    
    // Keep camera in bounds
    camera.x = Math.max(0, camera.x);
    camera.x = Math.min(camera.x, 2600 - CANVAS_WIDTH);
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameState.gameOver = true;
        updateMessage();
    } else {
        // Respawn
        player.x = 100;
        player.y = 100;
        player.velocityX = 0;
        player.velocityY = 0;
        player.doubleJumpAvailable = true;
        player.hasDoubleJumped = false;
        camera.x = 0;
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Save context
    ctx.save();
    
    // Apply camera transform
    ctx.translate(-camera.x, -camera.y);
    
    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height / 3);
    });
    
    // Draw collectibles
    collectibles.forEach(item => {
        if (!item.collected) {
            if (item.type === 'coin') {
                // Draw yellow coin
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Shine
                ctx.fillStyle = '#FFF8DC';
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2 - 3, item.y + item.height / 2 - 3, item.width / 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.type === 'gem') {
                // Draw gem
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.moveTo(item.x + item.width / 2, item.y);
                ctx.lineTo(item.x + item.width, item.y + item.height / 2);
                ctx.lineTo(item.x + item.width / 2, item.y + item.height);
                ctx.lineTo(item.x, item.y + item.height / 2);
                ctx.closePath();
                ctx.fill();
                
                // Shine
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2, item.y + item.height / 3, item.width / 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.type === 'bomb') {
                // Draw black bomb
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw fuse
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(item.x + item.width / 2, item.y);
                ctx.lineTo(item.x + item.width / 2 + 5, item.y - 8);
                ctx.stroke();
                
                // Draw spark at fuse tip
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2 + 5, item.y - 8, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    // Draw dungeon exit door
    // Door frame (stone)
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    
    // Door (wooden)
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(goal.x + 5, goal.y + 5, goal.width - 10, goal.height - 5);
    
    // Door planks (horizontal lines)
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const y = goal.y + 15 + i * 12;
        ctx.beginPath();
        ctx.moveTo(goal.x + 5, y);
        ctx.lineTo(goal.x + goal.width - 5, y);
        ctx.stroke();
    }
    
    // Door handle
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(goal.x + goal.width - 15, goal.y + goal.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Arch top
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(goal.x + goal.width / 2, goal.y + 5, goal.width / 2 - 5, Math.PI, 0);
    ctx.fill();
    
    // Draw monsters
    monsters.forEach(monster => {
        if (monster.active) {
            // Monster body (green slime-like creature)
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(
                monster.x + monster.width / 2,
                monster.y + monster.height - 15,
                monster.width / 2,
                15,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Monster head
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2, monster.y + 20, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes (white)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2 - 8, monster.y + 18, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2 + 8, monster.y + 18, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils (red)
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2 - 8, monster.y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2 + 8, monster.y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth (angry)
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(monster.x + monster.width / 2, monster.y + 25, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    });
    
    // Draw player
    if (player.image.complete) {
        ctx.save();
        
        // Flip sprite based on direction
        if (!player.facingRight) {
            // Flip horizontally for left-facing
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(player.image, 0, 0, player.width, player.height);
        } else {
            // Normal right-facing
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        }
        
        ctx.restore();
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#790ECB';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Restore context
    ctx.restore();
    
    // Draw particles (in screen space, after camera restore)
    ParticleSystem.draw(ctx, camera);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    const highScoreEl = document.getElementById('highScore');
    highScoreEl.textContent = `High Score: ${gameState.highScore}`;
    
    // Add visual indicator for new high score
    if (gameState.isNewHighScore) {
        highScoreEl.classList.add('new-high-score');
    } else {
        highScoreEl.classList.remove('new-high-score');
    }
    
    let heartsHTML = '';
    const fullHearts = Math.floor(gameState.lives);
    const hasHalfHeart = gameState.lives % 1 !== 0;
    
    for (let i = 0; i < fullHearts; i++) {
        heartsHTML += '<span class="heart">❤️</span>';
    }
    if (hasHalfHeart) {
        heartsHTML += '<span class="heart">💔</span>';
    }
    document.getElementById('lives').innerHTML = heartsHTML;
}

// Update message
function updateMessage() {
    const messageEl = document.getElementById('message');
    if (gameState.won) {
        // Save score to local storage
        StorageManager.saveScore(gameState.score, true);
        
        // Check if new high score
        if (gameState.score > gameState.highScore) {
            gameState.isNewHighScore = true;
            gameState.highScore = gameState.score;
            updateUI();
            
            // Trigger confetti effect for new high score
            ParticleSystem.createConfetti(100);
            
            messageEl.textContent = '🎉 NEW HIGH SCORE! You Win! Press R to restart';
        } else {
            messageEl.textContent = '🎉 You Win! Press R to restart';
        }
        messageEl.className = 'win';
    } else if (gameState.gameOver) {
        // Save score to local storage
        StorageManager.saveScore(gameState.score, false);
        
        messageEl.textContent = '💀 Game Over! Press R to restart';
        messageEl.className = 'lose';
    }
}

// Restart game
function restartGame() {
    gameState = {
        score: 0,
        lives: 3,
        gameOver: false,
        won: false,
        highScore: StorageManager.getHighScore(),
        isNewHighScore: false
    };
    
    player.x = 100;
    player.y = 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.doubleJumpAvailable = true;
    player.hasDoubleJumped = false;
    camera.x = 0;
    
    collectibles.forEach(item => item.collected = false);
    
    // Reset monsters
    monsters.length = 0;
    monsterSpawnTimer = 0;
    
    updateUI();
    document.getElementById('message').textContent = 'Use Arrow Keys or WASD to move and jump (double jump in air!)';
    document.getElementById('message').className = '';
}

// Listen for restart
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.gameOver) {
            restartGame();
        }
    }
});

// Game loop
function gameLoop() {
    updatePlayer();
    updateMonsters();
    ParticleSystem.update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateUI();
gameLoop();
