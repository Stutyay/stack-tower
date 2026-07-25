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

        if (game && game.state === 'PLAYING') {
            this.drawIntegratedAngleGauge(ctx, game);
        }

        ctx.restore();
    }

    drawIntegratedAngleGauge(ctx, game) {
        const cx = this.pivot.x;
        const cy = this.pivot.y;
        const radius = 96;
        const innerRadius = 40;

        let currentAngleRad = 0;
        let degrees = 0;
        if (this.constraint && this.block) {
            const dx = this.block.position.x - this.pivot.x;
            const dy = this.block.position.y - this.pivot.y;
            currentAngleRad = Math.atan2(dx, dy); // 0 rad is vertical down
            degrees = Math.round(Math.abs(currentAngleRad) * (180 / Math.PI));
        }

        // Color coding by potential energy range
        // Green: 0 to 15 degrees. Yellow: 16 to 45 degrees. Red: 46 degrees and above.
        let color = '#2ecc71'; // Green
        if (degrees >= 46) {
            color = '#e74c3c'; // Red
        } else if (degrees >= 16) {
            color = '#f1c40f'; // Yellow
        }

        ctx.save();
        
        // Smart Opacity / Proximity Fade: Fade down if tower top or falling block gets close
        let targetAlpha = 1.0;
        if (game && game.state === 'PLAYING' && game.tower && !game.tower.isCollapsing()) {
            let highestWorldY = game.tower.getTopY();
            if (this.block) {
                highestWorldY = Math.min(highestWorldY, this.block.position.y);
            }
            if (game.activeFallingBlock) {
                highestWorldY = Math.min(highestWorldY, game.activeFallingBlock.position.y);
            }
            // If the top of the tower/block gets within 160px of pivot Y in world space
            if (highestWorldY < cy + 160) {
                targetAlpha = 0.35; // Smoothly fade to 35% opacity
            }
        }
        if (typeof this.gaugeOpacity !== 'number') this.gaugeOpacity = 1.0;
        this.gaugeOpacity += (targetAlpha - this.gaugeOpacity) * 0.15;
        ctx.globalAlpha = this.gaugeOpacity;

        // --- 1. Protractor Background Interface ---
        // Semi-circle arch from -70° to +70° (pointing downwards from pivot)
        const startRad = Math.PI / 2 - (70 * Math.PI / 180);
        const endRad = Math.PI / 2 + (70 * Math.PI / 180);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startRad, endRad, false);
        ctx.arc(cx, cy, innerRadius, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 35, 0.82)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // --- 2. Color-Coded Zone Bands along the Outer Rim ---
        // Green zone (0° to 15° left and right)
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, Math.PI/2 - (15*Math.PI/180), Math.PI/2 + (15*Math.PI/180));
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.65)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Yellow zone (16° to 45°)
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, Math.PI/2 - (45*Math.PI/180), Math.PI/2 - (15*Math.PI/180));
        ctx.arc(cx, cy, radius - 4, Math.PI/2 + (15*Math.PI/180), Math.PI/2 + (45*Math.PI/180));
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.65)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Red zone (46° to 70°)
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, startRad, Math.PI/2 - (45*Math.PI/180));
        ctx.arc(cx, cy, radius - 4, Math.PI/2 + (45*Math.PI/180), endRad);
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.65)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // --- 3. Highlighted Arc Segment ---
        // Highlights the arc from 0° (Math.PI/2) to currentAngleRad (Math.PI/2 - currentAngleRad)
        if (degrees > 0) {
            const targetRad = Math.PI / 2 - currentAngleRad;
            ctx.beginPath();
            if (currentAngleRad > 0) {
                ctx.arc(cx, cy, radius - 14, targetRad, Math.PI / 2);
            } else {
                ctx.arc(cx, cy, radius - 14, Math.PI / 2, targetRad);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 8;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // --- 4. Numbered Degree Labels (0, 15, 30, 45, 60, -15, -30, -45, -60) ---
        ctx.font = '900 14px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;

        const increments = [0, 15, 30, 45, 60, -15, -30, -45, -60];
        increments.forEach(deg => {
            const rad = Math.PI / 2 - (deg * Math.PI / 180);
            
            // Draw tick mark
            const tx1 = cx + Math.cos(rad) * (radius - 8);
            const ty1 = cy + Math.sin(rad) * (radius - 8);
            const tx2 = cx + Math.cos(rad) * radius;
            const ty2 = cy + Math.sin(rad) * radius;
            ctx.beginPath();
            ctx.moveTo(tx1, ty1);
            ctx.lineTo(tx2, ty2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            const lx = cx + Math.cos(rad) * (radius - 24);
            const ly = cy + Math.sin(rad) * (radius - 24);
            ctx.fillText(deg === 0 ? "0" : `${deg}`, lx, ly);
        });
        ctx.shadowBlur = 0;

        // --- 5. The Pointer Arm of the Protractor (Measuring Arm) ---
        const needleRad = Math.PI / 2 - currentAngleRad;
        const tipX = cx + Math.cos(needleRad) * (radius + 4);
        const tipY = cy + Math.sin(needleRad) * (radius + 4);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Glowing tip dot
        ctx.beginPath();
        ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- 6. Large, Bold Digital Text Display ("ANGLE: XX°") ---
        // Placed centered over the track / within the protractor center arch
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textStr = `ANGLE: ${degrees}°`;
        const textMetrics = ctx.measureText(textStr);
        const badgeW = textMetrics.width + 24;
        const badgeH = 28;
        const badgeX = cx - badgeW / 2;
        const badgeY = cy + 20 - badgeH / 2;

        ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
        } else {
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillText(textStr, cx, cy + 20);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

