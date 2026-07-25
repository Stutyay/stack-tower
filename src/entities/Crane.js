import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

export class Crane {
    constructor(physicsWorld, type = 'crane_yellow') {
        this.physics = physicsWorld;
        this.pivot = { x: GAME_WIDTH / 2, y: 50 };
        this.constraint = null;
        this.block = null;
        this.type = type;
        
        this.angle = 0;
        this.baseSwingSpeed = 0.0008; // Increased initial base speed
        this.speedIncrement = 0.0004; // Speed increase per tier
        this.swingSpeed = this.baseSwingSpeed;
        this.targetSwingSpeed = this.baseSwingSpeed;
        this.swingAmplitude = GAME_WIDTH * 0.35;
    }

    setDifficulty(stackCount) {
        this.targetSwingSpeed = this.baseSwingSpeed + (Math.floor(stackCount / 4) * this.speedIncrement);
        this.swingSpeed = this.targetSwingSpeed;
    }

    setPivotY(y) {
        this.pivot.y = y;
        if (this.constraint) {
            this.constraint.pointA = { x: this.pivot.x, y: this.pivot.y };
        }
    }

    attach(blockBody) {
        this.block = blockBody;
        Matter.Body.setPosition(this.block, { x: this.pivot.x, y: this.pivot.y + 200 });
        Matter.Body.setAngularVelocity(this.block, 0);

        this.constraint = Matter.Constraint.create({
            pointA: this.pivot,
            bodyB: this.block,
            stiffness: 1,
            damping: 0.1,
            length: 200,
            render: { visible: false }
        });
        
        this.physics.add(this.block);
        this.physics.add(this.constraint);
    }

    isHolding(blockBody) {
        return this.block === blockBody && this.constraint !== null;
    }

    release() {
        if (this.constraint) {
            this.physics.remove(this.constraint);
            this.constraint = null;
            this.block = null;
        }
    }

    update(engine) {
        if (this.block && this.constraint) {
            const delta = engine ? engine.timing.lastDelta : 16.666;
            this.angle += this.swingSpeed * delta;
            const targetX = (GAME_WIDTH / 2) + Math.sin(this.angle) * this.swingAmplitude;
            this.pivot.x = targetX;
            this.constraint.pointA = { x: this.pivot.x, y: this.pivot.y };
        }
    }
    
    draw(ctx) {
        const boomY = this.pivot.y - 20;
        ctx.save();
        
        if (this.type === 'crane_ufo') {
            // UFO Tractor Beam Crane
            
            // Draw UFO body
            ctx.fillStyle = '#7f8c8d';
            ctx.beginPath();
            ctx.ellipse(this.pivot.x, boomY, 60, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // UFO Dome
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.beginPath();
            ctx.ellipse(this.pivot.x, boomY - 10, 30, 15, 0, 0, Math.PI, true);
            ctx.fill();
            
            // UFO lights
            ctx.fillStyle = '#f1c40f';
            for(let dx = -40; dx <= 40; dx+=20) {
                ctx.beginPath();
                ctx.arc(this.pivot.x + dx, boomY + 5, 4, 0, Math.PI*2);
                ctx.fill();
            }

            if (this.constraint && this.block) {
                // Tractor Beam
                ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
                ctx.beginPath();
                ctx.moveTo(this.pivot.x - 20, boomY + 10);
                ctx.lineTo(this.block.position.x - 50, this.block.position.y);
                ctx.lineTo(this.block.position.x + 50, this.block.position.y);
                ctx.lineTo(this.pivot.x + 20, boomY + 10);
                ctx.fill();
            }
            
        } else if (this.type === 'crane_robotic') {
            // Sleek Robotic Arm
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(0, boomY - 10, GAME_WIDTH, 20);
            
            // Blue LED strip
            ctx.fillStyle = '#3498db';
            ctx.fillRect(0, boomY - 2, GAME_WIDTH, 4);

            if (this.constraint && this.block) {
                // Robot claw base
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(this.pivot.x - 15, boomY - 5, 30, 20);
                
                // Laser wire
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.pivot.x, this.pivot.y);
                ctx.lineTo(this.block.position.x, this.block.position.y - 50);
                ctx.stroke();
                
                // Claw grips
                ctx.strokeStyle = '#ecf0f1';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(this.block.position.x - 20, this.block.position.y - 50);
                ctx.lineTo(this.block.position.x - 20, this.block.position.y - 10);
                ctx.moveTo(this.block.position.x + 20, this.block.position.y - 50);
                ctx.lineTo(this.block.position.x + 20, this.block.position.y - 10);
                ctx.stroke();
            }
        } else if (this.type === 'crane_steam') {
            // Steampunk Pulley
            ctx.fillStyle = '#8e44ad'; // dark purple/brass base
            ctx.fillRect(0, boomY - 15, GAME_WIDTH, 30);
            
            ctx.strokeStyle = '#d35400'; // copper/bronze accents
            ctx.lineWidth = 6;
            ctx.beginPath();
            for (let i = 0; i < GAME_WIDTH; i += 50) {
                ctx.arc(i, boomY, 10, 0, Math.PI * 2);
            }
            ctx.stroke();

            if (this.constraint && this.block) {
                // Steampunk Gear cart
                ctx.fillStyle = '#d35400';
                ctx.beginPath();
                ctx.arc(this.pivot.x, boomY, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Chain wire
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 4;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(this.pivot.x, this.pivot.y);
                ctx.lineTo(this.block.position.x, this.block.position.y);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Hook attachment
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(this.block.position.x - 10, this.block.position.y - 60, 20, 15);
            }
        } else {
            // Default Industrial Yellow
            ctx.fillStyle = '#F39C12';
            ctx.fillRect(0, boomY - 15, GAME_WIDTH, 30);
            
            ctx.strokeStyle = '#D68910';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < GAME_WIDTH; i += 40) {
                ctx.moveTo(i, boomY - 15);
                ctx.lineTo(i + 20, boomY + 15);
                ctx.lineTo(i + 40, boomY - 15);
            }
            ctx.stroke();

            if (this.constraint && this.block) {
                // Pulley cart
                ctx.fillStyle = '#333';
                ctx.fillRect(this.pivot.x - 20, boomY - 5, 40, 20);
                
                // Wire (cable)
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.pivot.x, this.pivot.y);
                ctx.lineTo(this.block.position.x, this.block.position.y);
                ctx.stroke();
                
                // Hook attachment point
                ctx.fillStyle = '#C0392B';
                ctx.beginPath();
                ctx.arc(this.block.position.x, this.block.position.y - 50, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}
