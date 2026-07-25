import Matter from 'matter-js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { Renderer } from '../render/Renderer.js';
import { Crane } from '../entities/Crane.js';
import { Block } from '../entities/Block.js';
import { Tower } from '../entities/Tower.js';
import { UIManager } from '../ui/UIManager.js';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.physics = new PhysicsWorld();
        this.renderer = new Renderer(this);
        this.ui = new UIManager(this);
        
        this.crane = null;
        this.tower = null;
        this.currentBlock = null;
        this.currentBlockInstance = null;

        this.state = 'START';
        this.inputState = 'IDLE';
        this.goldCoins = 0;          // coins earned this run
        this.totalGoldCoins = 0;     // lifetime persistent total
        this.combo = 1;
        this.gameStartTime = null;
        this.elapsedSeconds = 0;
        
        // Load persistent coin total from localStorage
        this._loadTotalCoins();
        
        this.bindEvents();
        // Start rendering the background immediately
        this.renderer.start();
        this.physics.start();
    }

    /** Load lifetime coin total from localStorage */
    _loadTotalCoins() {
        const saved = parseInt(localStorage.getItem('stackTowerTotalCoins') || '0', 10);
        this.totalGoldCoins = isNaN(saved) ? 0 : saved;
        this.goldCoins = 0; // Explicitly set to 0 to avoid session leaking
    }

    /** Persist lifetime coin total to localStorage */
    _saveTotalCoins() {
        localStorage.setItem('stackTowerTotalCoins', String(this.totalGoldCoins));
    }

    init() {
        this.ui.showStartScreen();
    }

    bindEvents() {
        document.body.addEventListener('pointerdown', (e) => {
            // Failsafe: Reject any clicks originating from UI elements or Modals
            if (e.target.closest('.modal') || e.target.closest('#settings-modal') || e.target.closest('#shop-modal')) return;
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
            // The cleanest validation: Ensure the click hit the canvas (the game world)
            if (e.target.tagName !== 'CANVAS' && e.target.id !== 'game-container') return;

            if (this.state === 'PLAYING') {
                this.handleTap();
            }
        });



        Matter.Events.on(this.physics.engine, 'collisionStart', (event) => {
            if (this.state !== 'PLAYING') return;
            
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                // If any block hits the ground, it's game over.
                // It should only land on the pedestal or other blocks!
                if ((bodyA === this.physics.ground || bodyB === this.physics.ground)) {
                    const otherBody = bodyA === this.physics.ground ? bodyB : bodyA;
                    if (this.tower.blocks.includes(otherBody)) {
                        this.gameOver();
                    }
                }
            }
        });
        
        Matter.Events.on(this.physics.engine, 'beforeUpdate', () => {
            if (this.state === 'PLAYING') {
                this.update();
            }
        });
    }

    start() {
        if (this.spawnTimer) clearTimeout(this.spawnTimer);
        
        const worldBodies = Matter.Composite.allBodies(this.physics.engine.world);
        worldBodies.forEach(body => {
            if (body !== this.physics.ground && body !== this.physics.pedestal) {
                this.physics.remove(body);
            }
        });
        const worldConstraints = Matter.Composite.allConstraints(this.physics.engine.world);
        worldConstraints.forEach(constraint => {
            this.physics.remove(constraint);
        });

        // Reset per-run counters; do NOT reset totalGoldCoins
        this.goldCoins = 0;
        this.combo = 1;
        this.gameStartTime = null;
        this.elapsedSeconds = 0;
        this.ui.updateHUD(this.goldCoins, 0, this.combo);
        
        this.state = 'PLAYING';
        this.inputState = 'IDLE'; // Reset input state machine
        this.renderer.cameraY = 0;
        
        // Fetch equipped skins from persistent storage
        const equippedCrane = localStorage.getItem('equippedCrane') || 'crane_yellow';
        this.equippedBlock  = localStorage.getItem('equippedBlock') || 'block_concrete';
        this.equippedBase   = localStorage.getItem('equippedBase') || 'base_standard';
        this.equippedDecoration = localStorage.getItem('equippedDecoration') || 'deco_plain';
        
        this.tower = new Tower(this.physics);
        this.crane = new Crane(this.physics, equippedCrane);
        this.crane.setDifficulty(0);
        
        this.spawnBlock();
    }

    /**
     * Resets the game board (clears physics bodies, resets state to START)
     * WITHOUT starting a new round. Used by "Try Again" to route back to
     * the Main Menu so the player can visit the Shop first.
     */
    resetForMenu() {
        if (this.spawnTimer) clearTimeout(this.spawnTimer);

        // Clear all physics bodies except ground/pedestal
        const worldBodies = Matter.Composite.allBodies(this.physics.engine.world);
        worldBodies.forEach(body => {
            if (body !== this.physics.ground && body !== this.physics.pedestal) {
                this.physics.remove(body);
            }
        });
        const worldConstraints = Matter.Composite.allConstraints(this.physics.engine.world);
        worldConstraints.forEach(c => this.physics.remove(c));

        // Reset run-level state but keep totalGoldCoins intact
        this.goldCoins = 0;
        this.combo = 1;
        this.gameStartTime = null;
        this.elapsedSeconds = 0;
        this.currentBlock = null;
        this.currentBlockInstance = null;
        this.crane = null;
        this.tower = null;

        this.state = 'START';
        this.inputState = 'IDLE';
        this.renderer.cameraY = 0;
    }

    handleTap() {
        // Strict gate: only accept input when the state machine is in IDLE
        if (this.state !== 'PLAYING' || this.inputState !== 'IDLE') return;
        if (!this.currentBlock || !this.crane.isHolding(this.currentBlock)) return;

        // Start the game timer on the very first drop
        if (!this.gameStartTime) {
            this.gameStartTime = Date.now();
        }

        // --- LOCK INPUT IMMEDIATELY ---
        this.inputState = 'DROPPING';

        // Zero out velocity for a clean, straight drop
        Matter.Body.setVelocity(this.currentBlock, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.currentBlock, 0);

        this.crane.release();

        if (this.currentBlockInstance) {
            this.currentBlockInstance.dampImpact();
        }

        if (this.settings && this.settings.accessibility && this.settings.accessibility.screenShake) {
            this.renderer.shakeAmount = 15;
        }

        this.tower.addBlock(this.currentBlock);
        // Update difficulty on every drop (not just stable ones) so speed never plateaus
        this.crane.setDifficulty(this.tower.blocks.length);
        this.currentBlock = null;
        this.currentBlockInstance = null;

        // Move to SPAWNING state after block settle delay
        this.inputState = 'SPAWNING';
        this.spawnTimer = setTimeout(() => {
            if (this.state === 'PLAYING') {
                this.checkTowerStability();
                if (this.state === 'PLAYING') {
                    this.goldCoins += 1;
                    this.ui.updateHUD(this.goldCoins, this.tower.getHeight(), this.combo);
                    this.spawnBlock(); // spawn and attach block
                    // Unlock input AFTER block is on crane — closes the exploit window
                    setTimeout(() => {
                        if (this.state === 'PLAYING') {
                            this.inputState = 'IDLE';
                        }
                    }, 400);
                }
            }
        }, 1500);
    }

    spawnBlock() {
        const spawnOffsetY = 260;
        const blockInstance = new Block(GAME_WIDTH / 2, this.crane.pivot.y + spawnOffsetY, this.equippedBlock);
        this.currentBlock = blockInstance.body;
        this.currentBlockInstance = blockInstance;
        this.crane.attach(this.currentBlock);

        // DEBUG: Log current crane speed to verify step-based scaling
        const stackCount = this.tower ? this.tower.blocks.length : 0;
        console.log(
            `[SpeedDebug] Block Landed - Stack #${stackCount} | ` +
            `New Speed: ${this.crane.swingSpeed.toFixed(6)}`
        );
    }

    update() {
        this.crane.update(this.physics.engine);
        
        if (this.tower.isCollapsing()) {
            this.gameOver();
        }
        
        // Cleanup fallen blocks to prevent infinite falling bugs
        this.tower.blocks.forEach(block => {
            if (block.position.y > GAME_HEIGHT + 500) {
                this.physics.remove(block);
            }
        });
        
        const towerTop = this.tower.getTopY();
        const targetPivotY = towerTop - 550;
        
        // Smoothly move crane
        this.crane.setPivotY(this.crane.pivot.y + (targetPivotY - this.crane.pivot.y) * 0.05);
        
        // Smoothly move camera to keep crane at y=50 on screen
        const targetCameraY = this.crane.pivot.y - 50;
        if (targetCameraY < 0) {
            this.renderer.setCameraY(targetCameraY);
        }
    }

    checkTowerStability() {
        if (this.tower.isStable()) {
            this.combo++;
            this.crane.setDifficulty(this.tower.blocks.length);
        } else {
            this.combo = 1;
        }
    }

    gameOver() {
        if (this.state === 'GAMEOVER') return;
        this.state = 'GAMEOVER';

        // Stop the timer
        this.elapsedSeconds = this.gameStartTime
            ? Math.floor((Date.now() - this.gameStartTime) / 1000)
            : 0;

        // ── Persistent Coin Accumulation ─────────────────────────────────────
        // Always read directly from localStorage to get the TRUE saved balance.
        // Never rely on the in-memory totalGoldCoins — it can drift across runs.
        const savedBalance   = parseInt(localStorage.getItem('stackTowerTotalCoins') || '0', 10);
        const runCoinsEarned = this.goldCoins;                       // only THIS run
        const newTotal       = (isNaN(savedBalance) ? 0 : savedBalance) + runCoinsEarned;

        // Persist the new combined total immediately
        localStorage.setItem('stackTowerTotalCoins', String(newTotal));

        // Sync in-memory fields so the Shop reads the right lifetime balance
        this.totalGoldCoins = newTotal;
        // ─────────────────────────────────────────────────────────────────────

        // Progressive score is based on coins earned THIS run only
        const baseScore        = runCoinsEarned * 50;
        const heightMult       = 1 + (runCoinsEarned / 10);
        const progressiveScore = Math.round(baseScore * heightMult);

        // Pass runCoinsEarned to the results screen (NOT the lifetime total)
        this.ui.showGameOver(runCoinsEarned, progressiveScore, this.elapsedSeconds);

        if (window.CrazinosGameSDK) {
            window.CrazinosGameSDK.submitScore(progressiveScore).then(res => {
                if (res.success) { console.log("Score verified!"); }
            });
        }
    }

}
