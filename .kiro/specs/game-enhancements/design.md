# Design Document: Game Enhancements

## Overview

This design document outlines the implementation of score persistence, high score tracking, visual particle effects, and double jump mechanics for Super Kiro World. The enhancements will use browser local storage for data persistence and a custom particle system for visual effects. All features are designed to integrate seamlessly with the existing vanilla JavaScript codebase without external dependencies.

## Architecture

### High-Level Structure

The enhancements follow the existing game architecture pattern:

1. **Storage Layer**: LocalStorage wrapper for score persistence
2. **Particle System**: Centralized particle manager for all visual effects
3. **Game State Extension**: Additional properties for high scores and double jump tracking
4. **UI Extension**: New UI elements for high score display

### Component Interaction

```
Game Loop
    ├── Update Phase
    │   ├── Player Update (includes double jump logic)
    │   ├── Particle System Update
    │   └── Score Management
    └── Draw Phase
        ├── Existing Game Rendering
        ├── Particle Rendering
        └── UI Rendering (with high score)
```

## Components and Interfaces

### 1. Storage Manager

**Purpose**: Handle all local storage operations for score history and high scores.

**Interface**:
```javascript
const StorageManager = {
    saveScore(score, won, timestamp),
    getScoreHistory(),
    getHighScore(),
    updateHighScore(score),
    clearHistory()
}
```

**Key Methods**:
- `saveScore()`: Saves a game result to history with timestamp
- `getScoreHistory()`: Retrieves array of past scores (max 50)
- `getHighScore()`: Returns the highest score achieved
- `updateHighScore()`: Updates high score if new score is higher
- `clearHistory()`: Removes all stored data (for testing/reset)

**Storage Keys**:
- `kiro_score_history`: Array of score objects
- `kiro_high_score`: Single number value

### 2. Particle System

**Purpose**: Manage creation, update, and rendering of all particle effects.

**Particle Base Structure**:
```javascript
{
    x, y,              // Position
    vx, vy,            // Velocity
    life, maxLife,     // Lifespan tracking
    size,              // Particle size
    color,             // Particle color
    type,              // Particle type identifier
    rotation,          // Current rotation (for confetti)
    rotationSpeed      // Rotation velocity (for confetti)
}
```

**Interface**:
```javascript
const ParticleSystem = {
    particles: [],
    createTrailParticle(x, y),
    createExplosion(x, y, count),
    createSparkles(x, y, color, count),
    createConfetti(count),
    update(),
    draw(ctx, camera)
}
```

**Particle Types**:
- **Trail**: Small, fading particles behind player
- **Explosion**: Burst particles on collision
- **Sparkle**: Shimmering particles for collectibles
- **Confetti**: Falling, rotating celebration particles

### 3. Double Jump System

**Purpose**: Track and manage double jump state for the player.

**Player State Extension**:
```javascript
player.doubleJumpAvailable = true;
player.hasDoubleJumped = false;
```

**Logic Flow**:
1. On ground landing: Reset double jump availability
2. On first jump: Mark as airborne, keep double jump available
3. On second jump (while airborne): Use double jump, mark as unavailable
4. Prevent further jumps until landing

## Data Models

### Score History Entry
```javascript
{
    score: Number,        // Final score
    won: Boolean,         // Game completion status
    timestamp: Number,    // Unix timestamp
    date: String          // Human-readable date
}
```

### Game State Extension
```javascript
gameState = {
    score: Number,
    lives: Number,
    gameOver: Boolean,
    won: Boolean,
    highScore: Number,           // NEW: Current high score
    isNewHighScore: Boolean      // NEW: Flag for current session
}
```

### Particle Object
```javascript
{
    x: Number,
    y: Number,
    vx: Number,
    vy: Number,
    life: Number,
    maxLife: Number,
    size: Number,
    color: String,
    type: String,
    rotation: Number,
    rotationSpeed: Number
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Storage and Score Management Properties

**Property 1: Score persistence round-trip**
*For any* game session that ends with a score, saving and then loading the score history should contain an entry with that score value and timestamp.
**Validates: Requirements 1.1, 1.4**

**Property 2: History entry completeness**
*For any* saved score entry in local storage, the entry should contain all required fields: score (number), won (boolean), and timestamp (number).
**Validates: Requirements 1.2**

**Property 3: History size constraint**
*For any* score history after adding entries, the total number of entries should never exceed 50, with oldest entries removed first.
**Validates: Requirements 1.5**

**Property 4: High score monotonicity**
*For any* sequence of game scores, the high score should always be greater than or equal to all previously recorded scores.
**Validates: Requirements 2.3**

**Property 5: High score UI consistency**
*For any* game state, the displayed high score value in the UI should match the value stored in local storage.
**Validates: Requirements 2.5**

### Particle System Properties

**Property 6: Trail particle generation on movement**
*For any* game frame where the player has non-zero horizontal velocity, trail particles should be added to the particle system.
**Validates: Requirements 3.1**

**Property 7: Trail particle opacity decay**
*For any* trail particle, the opacity should decrease proportionally as life decreases, reaching zero when life reaches zero.
**Validates: Requirements 3.2**

**Property 8: Particle cleanup**
*For any* particle with life less than or equal to zero, that particle should be removed from the active particles array.
**Validates: Requirements 3.3, 4.4, 5.4**

**Property 9: Stationary no-trail generation**
*For any* game frame where the player velocity is zero, no new trail particles should be added to the particle system.
**Validates: Requirements 3.4**

**Property 10: Trail particle count limit**
*For any* game state, the number of active trail-type particles should never exceed 50.
**Validates: Requirements 3.5**

**Property 11: Collision generates explosion**
*For any* collision event between the player and a platform, explosion particles should be created at the collision point.
**Validates: Requirements 4.1**

**Property 12: Explosion particle directionality**
*For any* explosion effect, the generated particles should have velocity vectors pointing in multiple different directions from the origin.
**Validates: Requirements 4.2**

**Property 13: Explosion particle physics**
*For any* explosion particle over time, both velocity magnitude and opacity should decrease as life decreases.
**Validates: Requirements 4.3**

**Property 14: Collection generates sparkles**
*For any* collectible item that is collected, sparkle particles should be created at the item's position.
**Validates: Requirements 5.1**

**Property 15: Sparkle upward motion**
*For any* sparkle particle, the vertical velocity should be negative (upward) and rotation value should change over time.
**Validates: Requirements 5.3**

**Property 16: Sparkle color matching**
*For any* sparkle particles created from a coin collection, particles should be gold colored; for gem collections, particles should be cyan colored.
**Validates: Requirements 5.5**

**Property 17: High score triggers confetti**
*For any* game ending where the final score exceeds the previous high score, confetti particles should be generated.
**Validates: Requirements 6.1**

**Property 18: Confetti color variety**
*For any* batch of confetti particles, the particles should include multiple different colors from the Kiro brand color palette.
**Validates: Requirements 6.2**

**Property 19: Confetti falling motion**
*For any* confetti particle, the vertical velocity should be positive (downward) and rotation value should change over time.
**Validates: Requirements 6.3**

**Property 20: Confetti screen bounds cleanup**
*For any* confetti particle with y-position greater than the canvas height, that particle should be removed from the active particles array.
**Validates: Requirements 6.4**

**Property 21: Confetti minimum count**
*For any* confetti generation event, at least 100 confetti particles should be created.
**Validates: Requirements 6.5**

### Double Jump Properties

**Property 22: Double jump availability in air**
*For any* game state where the player is airborne and has not used double jump, pressing the jump key should apply jump velocity to the player.
**Validates: Requirements 7.1**

**Property 23: Landing resets double jump**
*For any* landing event where the player touches a platform, the double jump availability flag should be set to true.
**Validates: Requirements 7.2**

**Property 24: Double jump single use**
*For any* game state where the player has used double jump, pressing the jump key should not change the player's velocity until landing.
**Validates: Requirements 7.3**

**Property 25: Double jump power consistency**
*For any* double jump execution, the applied velocity change should equal the JUMP_POWER constant used for initial jumps.
**Validates: Requirements 7.4**

**Property 26: Double jump visual feedback**
*For any* double jump event, particles should be added to the particle system to provide visual feedback.
**Validates: Requirements 7.5**

## Error Handling

### Local Storage Errors

**Scenarios**:
- Storage quota exceeded
- Storage disabled by user
- Private browsing mode
- Storage corruption

**Handling Strategy**:
```javascript
try {
    localStorage.setItem(key, value);
} catch (e) {
    console.warn('Storage unavailable:', e);
    // Continue gameplay without persistence
    // Show optional warning to user
}
```

**Graceful Degradation**:
- Game continues to function without save features
- High score tracking works in-memory for current session
- No crashes or blocking errors

### Particle System Performance

**Scenarios**:
- Too many particles active simultaneously
- Particle creation in tight loops
- Memory leaks from particles not being cleaned up

**Handling Strategy**:
- Hard limits on particle counts per type
- Efficient particle removal using array filtering
- Performance monitoring and automatic particle reduction if FPS drops

### Double Jump Edge Cases

**Scenarios**:
- Rapid jump key presses
- Jump input during collision resolution
- Landing and jumping in same frame

**Handling Strategy**:
- State machine for jump tracking (grounded → first jump → double jump → grounded)
- Clear flag management with explicit state transitions
- Input buffering to handle frame-perfect inputs

## Testing Strategy

### Unit Testing

**Storage Manager Tests**:
- Test saving and retrieving single score
- Test history limit enforcement
- Test high score update logic
- Test graceful handling of storage errors
- Test data format validation

**Particle System Tests**:
- Test particle creation for each type
- Test particle update logic (position, life, opacity)
- Test particle removal conditions
- Test particle count limits
- Test particle rendering with camera offset

**Double Jump Tests**:
- Test double jump availability after landing
- Test double jump consumption
- Test jump prevention after double jump used
- Test velocity application matches JUMP_POWER

### Property-Based Testing

We will use **fast-check** (JavaScript property-based testing library) to verify the correctness properties defined above.

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: game-enhancements, Property {number}: {property_text}**`
- Tests integrated into existing test suite structure

**Generator Strategies**:

1. **Score Generator**: Random integers 0-1000
2. **Game State Generator**: Random valid game states with varying scores, lives, win/lose status
3. **Particle Generator**: Random particles with valid ranges for position, velocity, life
4. **Player State Generator**: Random player positions, velocities, ground states
5. **Collision Generator**: Random collision scenarios with platforms

**Key Property Tests**:
- Score persistence round-trip (Property 1)
- High score monotonicity (Property 4)
- Particle lifecycle (Properties 6-10)
- Double jump state machine (Properties 22-24)

### Integration Testing

**End-to-End Scenarios**:
1. Complete game → verify score saved → reload → verify score retrieved
2. Beat high score → verify confetti → verify high score updated → verify UI shows new high score
3. Move player → verify trail particles → stop player → verify trail stops
4. Collide with platform → verify explosion particles
5. Collect items → verify sparkle particles with correct colors
6. Jump → double jump → land → verify state resets

### Performance Testing

**Metrics to Monitor**:
- Frame rate with maximum particles active
- Memory usage over extended gameplay
- Local storage read/write times
- Particle system update time per frame

**Acceptance Criteria**:
- Maintain 60 FPS with 200+ active particles
- No memory leaks over 10-minute gameplay session
- Storage operations complete in <10ms
- Particle updates complete in <5ms per frame

## Implementation Notes

### Browser Compatibility

**Local Storage**:
- Supported in all modern browsers
- Fallback: In-memory storage for session
- Check availability before use

**Canvas Performance**:
- Use `requestAnimationFrame` for smooth rendering
- Batch particle rendering operations
- Consider using `OffscreenCanvas` for particle pre-rendering if performance issues arise

### Code Organization

**File Structure** (additions to existing game.js):
```javascript
// Storage Manager (lines ~1-50)
const StorageManager = { ... };

// Particle System (lines ~51-200)
const ParticleSystem = { ... };

// Existing game code with modifications
// - gameState extended with highScore
// - player extended with doubleJump flags
// - updatePlayer() modified for double jump
// - draw() modified to render particles
// - Event handlers modified for double jump input
```

### Performance Optimizations

1. **Particle Pooling**: Reuse particle objects instead of creating new ones
2. **Batch Rendering**: Group particles by type for efficient rendering
3. **Spatial Culling**: Only update/render particles visible in camera view
4. **Throttled Storage**: Debounce storage writes to avoid excessive I/O

### Visual Design Considerations

**Particle Colors** (using Kiro brand palette):
- Trail: `rgba(121, 14, 203, opacity)` - Purple-500 with fade
- Explosion: `#790ECB`, `#9b3fd9`, `#b565e8` - Purple gradient
- Sparkles (coin): `#FFD700`, `#FFF8DC` - Gold tones
- Sparkles (gem): `#00FFFF`, `#FFFFFF` - Cyan/white
- Confetti: `#790ECB`, `#9b3fd9`, `#00FFFF`, `#FFD700` - Mixed brand colors

**Particle Sizes**:
- Trail: 3-5px
- Explosion: 4-8px
- Sparkles: 3-6px
- Confetti: 6-10px (rectangular)

**Animation Timing**:
- Trail lifetime: 0.5 seconds
- Explosion lifetime: 0.8 seconds
- Sparkles lifetime: 1.0 seconds
- Confetti lifetime: 3.0 seconds (or until off-screen)

## Future Enhancements

Potential additions not in current scope:
- Score leaderboard with multiple player profiles
- Replay system to watch previous runs
- Particle effect customization options
- Sound effects synchronized with particle effects
- Achievement system with special particle effects
- Particle effect intensity settings for performance tuning
