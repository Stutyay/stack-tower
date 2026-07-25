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
    
    draw(ctx, game) {
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

    drawAngleVisualization(ctx, game) {
        if (!this.constraint || !this.block) return;

        const cx = this.pivot.x;
        const cy = this.pivot.y;
        const bx = this.block.position.x;
        const by = this.block.position.y;
        
        const dx = bx - cx;
        const dy = by - cy;
        const currentAngleRad = Math.atan2(dx, dy); // 0 rad is vertical down
        const degrees = Math.round(Math.abs(currentAngleRad) * (180 / Math.PI));

        // 4. Retain Color-Coding
        // Green: 0° to 15°, Yellow: 16° to 30°, Red: > 30°
        let strokeColor = '#2ecc71';
        let fillColor = 'rgba(46, 204, 113, 0.22)';
        if (degrees > 30) {
            strokeColor = '#e74c3c';
            fillColor = 'rgba(231, 76, 60, 0.22)';
        } else if (degrees >= 16) {
            strokeColor = '#f1c40f';
            fillColor = 'rgba(241, 196, 15, 0.22)';
        }

        ctx.save();

        // Smart opacity / proximity fade if tower gets close
        let targetAlpha = 1.0;
        if (game && game.state === 'PLAYING' && game.tower && !game.tower.isCollapsing()) {
            let highestWorldY = game.tower.getTopY();
            highestWorldY = Math.min(highestWorldY, by);
            if (game.activeFallingBlock) {
                highestWorldY = Math.min(highestWorldY, game.activeFallingBlock.position.y);
            }
            if (highestWorldY < cy + 160) {
                targetAlpha = 0.35;
            }
        }
        if (typeof this.visualOpacity !== 'number') this.visualOpacity = 1.0;
        this.visualOpacity += (targetAlpha - this.visualOpacity) * 0.15;
        ctx.globalAlpha = this.visualOpacity;

        // --- 1. The Vertical Reference ---
        // Dashed vertical line originating from crane's pivot point pointing straight down (0°).
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + dy);
        ctx.stroke();
        ctx.setLineDash([]); // reset dash

        // --- 2. The Angle Wedge ---
        // Semi-transparent colored geometric shape connecting dashed vertical line to swinging string.
        // In canvas coordinates, 0 radians is along +X (right), Math.PI/2 is straight down (+Y).
        const startRad = Math.min(Math.PI / 2, Math.PI / 2 - currentAngleRad);
        const endRad = Math.max(Math.PI / 2, Math.PI / 2 - currentAngleRad);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, dy, startRad, endRad, false);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- 3. The Floating Text ---
        // Dynamic text floating alongside/inside the moving geometric wedge, following string swing.
        const midAngleRad = currentAngleRad / 2;
        const midCanvasRad = Math.PI / 2 - midAngleRad;
        const dist = dy * 0.58; // 58% down along the middle of the wedge
        const textX = cx + Math.cos(midCanvasRad) * dist;
        const textY = cy + Math.sin(midCanvasRad) * dist;

        const textStr = `Angle: ${degrees}°`;
        ctx.font = 'bold 13px sans-serif';
        const textMetrics = ctx.measureText(textStr);
        const badgeW = textMetrics.width + 16;
        const badgeH = 22;

        // Compact rounded badge behind floating text for contrast against background
        ctx.fillStyle = 'rgba(10, 15, 25, 0.8)';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(textX - badgeW / 2, textY - badgeH / 2, badgeW, badgeH, 6);
        } else {
            ctx.fillRect(textX - badgeW / 2, textY - badgeH / 2, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 6;
        ctx.fillText(textStr, textX, textY);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

