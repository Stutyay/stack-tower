import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

export class Tower {
    constructor(physicsWorld) {
        this.physics = physicsWorld;
        this.blocks = [];
        this.baseWidth = 110;
        this.isStableStatus = true;
    }

    addBlock(blockBody) {
        if (!this.blocks.includes(blockBody)) {
            this.blocks.push(blockBody);

            // Freeze all previously settled blocks so they can't jitter
            // from the new block's impact. Give the new block a grace period to settle.
            setTimeout(() => {
                this.freezeSettledBlocks();
            }, 800);
        }
    }

    freezeSettledBlocks() {
        // Freeze every block except the last one (which is still settling).
        // Freezing = make static so position and rotation are fully locked.
        const countToFreeze = this.blocks.length - 1;
        for (let i = 0; i < countToFreeze; i++) {
            const block = this.blocks[i];
            // Only freeze if it's perfectly flat and settled, so teetering blocks can fall
            if (!block.isStatic && Math.abs(block.angle) < 0.05 && block.speed < 0.1) {
                Matter.Body.setStatic(block, true);
            }
        }
    }

    getHeight() {
        return this.blocks.length;
    }
    
    getTopY() {
        if (this.blocks.length === 0) return GAME_HEIGHT - 50;
        let minY = GAME_HEIGHT;
        this.blocks.forEach(block => {
            // Only track settled blocks to prevent camera jitter when a block is falling
            if (block.speed < 0.5) {
                if (block.position.y < minY) {
                    minY = block.position.y;
                }
            }
        });
        return minY;
    }

    isStable() {
        if (this.blocks.length < 2) return true;
        
        const lastBlock = this.blocks[this.blocks.length - 1];
        if (Math.abs(lastBlock.angularVelocity) > 0.05 || Math.abs(lastBlock.angle) > 0.3) {
            return false;
        }
        return true;
    }

    isCollapsing() {
        let collapsed = false;
        const groundY = GAME_HEIGHT;
        const maxAngleRadians = 15 * (Math.PI / 180); // 15 degrees threshold
        
        this.blocks.forEach(block => {
            if (Math.abs(block.angle) > maxAngleRadians) {
                collapsed = true;
            }
            if (block.position.y > groundY + 20) {
                collapsed = true;
            }
        });
        
        return collapsed;
    }
}
