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
        
        if (this.constraint && this.block) {
            // --- EDUCATIONAL PHYSICS: Real-Time Oscillation Angle Arc ---
            const dx = this.block.position.x - this.pivot.x;
            const dy = this.block.position.y - this.pivot.y;
            const angleRad = Math.atan2(dx, dy); // Angle relative to vertical (dy > 0 is 0 rad)
            const degrees = Math.round(Math.abs(angleRad) * (180 / Math.PI));

            // Color coding by potential energy range
            let color = '#2ecc71'; // 0° to 15°: Green (Stable/Low Potential Energy)
            let fillColor = 'rgba(46, 204, 113, 0.25)';
            if (degrees > 30) {
                color = '#e74c3c'; // Greater than 30°: Red (Extreme/High Potential Energy)
                fillColor = 'rgba(231, 76, 60, 0.25)';
            } else if (degrees >= 16) {
                color = '#f1c40f'; // 16° to 30°: Yellow (Moderate Potential Energy)
                fillColor = 'rgba(241, 196, 15, 0.25)';
            }

            const radius = 85;
            const startAngle = Math.PI / 2; // Vertical resting center 0° in canvas coords
            const endAngle = Math.atan2(dy, dx); // Block angle in canvas coords

            ctx.save();
            // Draw semi-transparent sector fill
            ctx.beginPath();
            ctx.moveTo(this.pivot.x, this.pivot.y);
            ctx.arc(this.pivot.x, this.pivot.y, radius, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();

            // Draw outer arc outline
            ctx.beginPath();
            ctx.arc(this.pivot.x, this.pivot.y, radius, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw vertical dashed reference line (true vertical resting center 0°)
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(this.pivot.x, this.pivot.y);
            ctx.lineTo(this.pivot.x, this.pivot.y + radius + 15);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Display current angle dynamically near pivot
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 4;
            ctx.fillText(`Angle: ${degrees}°`, this.pivot.x, this.pivot.y + 110);
            ctx.restore();
        }

        ctx.restore();
    }
}

