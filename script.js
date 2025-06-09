document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score-display');
    const healthDisplay = document.getElementById('health-display');
    const player = document.getElementById('player');

    const gameBounds = gameContainer.getBoundingClientRect();

    let playerState = {
        x: gameBounds.width / 2 - 15, // center horizontally
        y: gameBounds.height / 2 - 15, // center vertically
        speed: 3,
        width: 30,
        height: 30,
        health: 100 // Initial health
    };

    const bullets = [];
    const zombies = [];
    let gameOver = false;
    let score = 0;

    const keysPressed = {};

    document.addEventListener('keydown', (event) => {
        keysPressed[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });


    function spawnZombie() {
        const zombieElement = document.createElement('div');
        zombieElement.className = 'zombie-enemy'; // Use class for styling

        const zombieState = {
            x: Math.random() * (gameBounds.width - 30), // Random x
            y: Math.random() * (gameBounds.height - 30), // Random y
            speed: 0.5 + Math.random() * 0.5, // Random speed between 0.5 and 1.0
            width: 30,
            height: 30,
            health: 30, // Zombies now have 30 health (e.g., 3 hits from a 10-damage bullet)
            isActive: true,
            element: zombieElement
        };

        // Ensure zombie doesn't spawn too close to player (simple check)
        const dx = playerState.x - zombieState.x;
        const dy = playerState.y - zombieState.y;
        if (Math.sqrt(dx*dx + dy*dy) < 100) { // If too close, try spawning again (recursive, be careful)
             // For simplicity, we'll just let it spawn. A better way would be to find a new spot.
        }

        zombieElement.style.left = zombieState.x + 'px';
        zombieElement.style.top = zombieState.y + 'px';
        gameContainer.appendChild(zombieElement);
        zombies.push(zombieState);
    }

    gameContainer.addEventListener('click', (event) => {
        if (gameOver) {
            resetGame();
            return;
        }

        const rect = gameContainer.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const angle = Math.atan2(mouseY - (playerState.y + playerState.height / 2), mouseX - (playerState.x + playerState.width / 2));

        const bullet = {
            x: playerState.x + playerState.width / 2 - 5, // Start at player center
            y: playerState.y + playerState.height / 2 - 5, // Start at player center
            dx: Math.cos(angle) * 5, // Speed and direction
            dy: Math.sin(angle) * 5, // Speed and direction
            element: document.createElement('div')
        };

        bullet.element.className = 'bullet';
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        gameContainer.appendChild(bullet.element);
        bullets.push(bullet);
    });

    // updatePlayerPosition remains the same
    function updatePlayerPosition() {
        if (gameOver) return;

        let newX = playerState.x;
        let newY = playerState.y;

        if (keysPressed['w'] || keysPressed['arrowup']) {
            newY -= playerState.speed;
        }
        if (keysPressed['s'] || keysPressed['arrowdown']) {
            newY += playerState.speed;
        }
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            newX -= playerState.speed;
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            newX += playerState.speed;
        }

        // Boundary checks
        playerState.x = Math.max(0, Math.min(newX, gameBounds.width - playerState.width));
        playerState.y = Math.max(0, Math.min(newY, gameBounds.height - playerState.height));

        player.style.left = playerState.x + 'px';
        player.style.top = playerState.y + 'px';
    }

    function updateZombies() {
        if (gameOver) return;
        zombies.forEach(zombie => {
            // The 'return' inside forEach only exits the current iteration, not the function
            if (!zombie.isActive) return;

            const dx = playerState.x - zombie.x;
            const dy = playerState.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) { // To avoid jittering
                let moveX = (dx / distance) * zombie.speed;
                let moveY = (dy / distance) * zombie.speed;

                let newX = zombie.x + moveX;
                let newY = zombie.y + moveY;

                zombie.x = Math.max(0, Math.min(newX, gameBounds.width - zombie.width));
                zombie.y = Math.max(0, Math.min(newY, gameBounds.height - zombie.height));
            }

            zombie.element.style.left = zombie.x + 'px';
            zombie.element.style.top = zombie.y + 'px';
        });
    }

    function updateBullets() {
        if (gameOver) return;
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            bullet.x += bullet.dx;
            bullet.y += bullet.dy;

            bullet.element.style.left = bullet.x + 'px';
            bullet.element.style.top = bullet.y + 'px';

            // Remove bullet if it goes out of bounds
            if (bullet.x < 0 || bullet.x > gameBounds.width || bullet.y < 0 || bullet.y > gameBounds.height) {
                bullet.element.remove();
                bullets.splice(i, 1);
                continue; // Skip to next bullet
            }

            // Bullet-Zombie collision for each zombie
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                if (zombie.isActive) {
                    const bulletRadius = 5;
                    const zombieRadius = zombie.width / 2;

                    const distXBZ = (bullet.x + bulletRadius) - (zombie.x + zombieRadius);
                    const distYBZ = (bullet.y + bulletRadius) - (zombie.y + zombieRadius);
                    const distanceBZ = Math.sqrt(distXBZ * distXBZ + distYBZ * distYBZ);

                    if (distanceBZ < bulletRadius + zombieRadius) {
                        // Collision!
                        bullet.element.remove();
                        bullets.splice(i, 1);

                        zombie.health -= 10; // Bullet deals 10 damage

                        if (zombie.health <= 0) {
                            zombie.isActive = false;
                            zombie.element.remove();
                            // zombies.splice(j, 1); // Optional: remove from array or just mark inactive
                            updateScore(10); // Use the updateScore function
                            // score += 10; // This line is now handled by updateScore

                            spawnZombie(); // Spawn a new zombie when one is killed
                        }
                        break; // Bullet hits one zombie and is consumed
                    }
                }
            }
        }
    }

    function updateScore(points) {
        score += points;
        scoreDisplay.textContent = `Score: ${score}`;
    }

    function updatePlayerHealthDisplay() {
        healthDisplay.textContent = `Health: ${playerState.health}`;
        healthDisplay.style.color = playerState.health > 30 ? 'lightgreen' : 'red';
    }

    function displayGameOver() {
        const gameOverText = document.createElement('div');
        gameOverText.id = 'game-over-message'; // To potentially remove it later if needed
        gameOverText.textContent = `GAME OVER! Score: ${score}. Click to Restart.`;
        gameOverText.style.position = 'absolute';
        gameOverText.style.top = '50%';
        gameOverText.style.left = '50%';
        gameOverText.style.transform = 'translate(-50%, -50%)';
        gameOverText.style.color = 'white';
        gameOverText.style.fontSize = '30px';
        gameOverText.style.backgroundColor = 'rgba(0,0,0,0.7)';
        gameOverText.style.padding = '20px';
        gameOverText.style.borderRadius = '10px';
        gameContainer.appendChild(gameOverText);
    }

    function gameLoop() {
        if (gameOver) return; // Stop the game loop if game is over

        // Basic collision detection (placeholder)
        // Check collision between player and each active zombie
        zombies.forEach(zombie => {
            if (zombie.isActive) {
                const dx = playerState.x - zombie.x;
                const dy = playerState.y - zombie.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < (playerState.width / 2 + zombie.width / 2)) {
                    playerState.health -= 20; // Zombie deals 20 damage
                    updatePlayerHealthDisplay();
                    zombie.isActive = false; // Make zombie inactive after attack
                    zombie.element.remove(); // Remove the zombie
                    spawnZombie(); // Spawn a new one

                    if (playerState.health <= 0) {
                        playerState.health = 0; // Ensure health doesn't go negative in display
                        updatePlayerHealthDisplay();
                        gameOver = true;
                        displayGameOver();
                        return; // Exit gameLoop as game is over
                    }
                }
            }
        });

        updatePlayerPosition();
        updateZombies();
        updateBullets();

        requestAnimationFrame(gameLoop);
    }

    function initializeGame() {
        // Reset game state variables
        gameOver = false;
        score = 0;
        playerState.health = 100;
        updateScore(0); // Resets display to "Score: 0"
        updatePlayerHealthDisplay();

        // Clear existing bullets and zombies from arrays and DOM
        bullets.forEach(bullet => bullet.element.remove());
        bullets.length = 0; // Clear array

        zombies.forEach(zombie => zombie.element.remove());
        zombies.length = 0; // Clear array

        // Remove game over message if it exists
        const gameOverMessage = document.getElementById('game-over-message');
        if (gameOverMessage) {
            gameOverMessage.remove();
        }

        // Reset player position
        playerState.x = gameBounds.width / 2 - playerState.width / 2;
        playerState.y = gameBounds.height / 2 - playerState.height / 2;
        player.style.left = playerState.x + 'px';
        player.style.top = playerState.y + 'px';

        // Spawn initial zombies
        for (let i = 0; i < 3; i++) {
            spawnZombie();
        }

        // Start the game loop if it's not already running (or restart it)
        // To prevent multiple loops, we can cancel the previous one if we had its ID
        // For simplicity here, gameLoop checks 'gameOver' flag.
        // If gameLoop was stopped, we need to call it again.
        // If it's the very first run, this starts it.
        // If it's a restart, this ensures it continues.
        if (gameOver) { // This check is a bit redundant if gameLoop already stopped, but safe
            // The gameLoop will be started by the click event after gameOver is set to false
        } else {
             gameLoop(); // Start game on initial load
        }
    }

    function resetGame() {
        initializeGame();
        // The game loop will be started by the click handler setting gameOver to false
        // and then the main game loop will pick up.
        // However, to ensure it starts immediately after reset if it was fully stopped:
        if (gameOver) { // This will be true when resetGame is called from click
            gameOver = false; // Set it here so the next gameLoop call runs
            gameLoop();
        }
    }

    // Call this to set up everything initially
    initializeGame();
});