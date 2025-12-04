# Project Structure

## File Organization

```
/
├── .kiro/steering/          # AI assistant steering rules
│   ├── app-building-rules.md
│   ├── game-style-guide.md
│   ├── user-context.md
│   ├── product.md
│   ├── tech.md
│   └── structure.md
├── game.js                  # Main game logic and engine
├── index.html               # Game UI and canvas container
└── kiro-logo.png           # Player character sprite
```

## Code Organization (game.js)

### Constants Section
- Canvas dimensions (800x600)
- Physics values (gravity, jump power, movement speed, friction)

### Game Objects
- **player**: Position, velocity, dimensions, sprite, ground state
- **camera**: Viewport position for scrolling
- **platforms**: Array of platform objects with position, size, color
- **collectibles**: Array of coins and gems with type, value, collected state
- **goal**: End-of-level target position
- **gameState**: Score, lives, game over/win flags

### Core Functions
- `updatePlayer()`: Physics, movement, collision detection
- `updateCamera()`: Smooth camera follow logic
- `draw()`: Render all game entities with camera transform
- `checkCollision()`: AABB collision detection
- `loseLife()`: Life management and respawn
- `updateUI()`: Score and lives display
- `restartGame()`: Reset game state
- `gameLoop()`: Main update/render loop

### Event Handlers
- Keyboard input (keydown/keyup)
- Restart key (R)

## Styling (index.html)
- Inline CSS using Kiro brand colors
- Dark theme (#0a0a0a background)
- Purple accents (#790ECB)
- Flexbox layout for centering
- UI panel with score and lives display
