# Technology Stack

## Core Technologies
- **HTML5 Canvas**: Rendering engine for all game graphics
- **Vanilla JavaScript**: No frameworks or build tools required
- **CSS3**: UI styling with Kiro brand colors

## Architecture
- Single-page application with no dependencies
- Game loop using `requestAnimationFrame` for 60 FPS target
- Event-driven input handling with keyboard state tracking
- Object-based entity system (player, platforms, collectibles)

## Key Systems
- **Physics Engine**: Custom gravity, friction, and collision detection
- **Camera System**: Smooth scrolling follow camera with bounds
- **State Management**: Simple object-based game state
- **Asset Loading**: Image loading for player sprite (kiro-logo.png)

## Running the Game
1. Open `index.html` in a modern web browser
2. No build step or compilation required
3. No server needed - runs directly from file system

## Development Workflow
- Edit `game.js` for game logic and mechanics
- Edit `index.html` for UI and styling
- Refresh browser to see changes
- Use browser DevTools console for debugging

## Browser Compatibility
Requires modern browser with HTML5 Canvas and ES6 support (Chrome, Firefox, Safari, Edge).
