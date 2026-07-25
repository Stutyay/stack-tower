import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function lerpColor(c1, c2, t) {
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

export class Renderer {
    constructor(game) {
        this.game = game;
        this.canvas = document.querySelector('canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            document.getElementById('game-container').insertBefore(this.canvas, document.getElementById('ui-layer'));
        }
        this.ctx = this.canvas.getContext('2d');
        this.shakeAmount = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.cameraY = 0;
        
        this.currentPhase = 0;
        this.transitionProgress = 1.0;
    }
    
    resize() {
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
    }
    
    start() {
        this.running = true;
        this.loop();
    }
    
    stop() {
        this.running = false;
    }
    
    setCameraY(y) {
        // Smooth camera follow
        this.cameraY += (y - this.cameraY) * 0.1;
    }
    
    loop() {
        if (!this.running) return;
        
        this.render();
        requestAnimationFrame(() => this.loop());
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.shakeAmount > 0) {
            this.shakeAmount -= 0.5;
            if (this.shakeAmount < 0) this.shakeAmount = 0;
        }

        this.ctx.save();
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(dx, dy);
        }
        
        // 1. Draw Background (Sky)
        const deco = this.game.equippedDecoration || 'deco_plain';
        
        if (deco === 'deco_stars' || deco === 'deco_fireworks') {
            // Permanent Night Sky
            const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            skyGradient.addColorStop(0, '#020111');
            skyGradient.addColorStop(0.5, '#20124d');
            skyGradient.addColorStop(1, '#000022');
            this.ctx.fillStyle = skyGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw Stars
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
            for (let i = 0; i < 60; i++) {
                const sx = Math.abs(Math.sin(i * 12345)) * this.canvas.width;
                const sy = Math.abs(Math.cos(i * 54321)) * (this.canvas.height * 0.8);
                const size = Math.abs(Math.sin(i)) * 1.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            if (deco === 'deco_stars') {
                // Draw a few small UFOs flying slowly
                const time = Date.now() / 2000;
                for(let i=0; i<3; i++) {
                    const ufoX = (Math.sin(time + i * 100) * 0.5 + 0.5) * this.canvas.width;
                    const ufoY = 100 + i * 50 + Math.sin(time * 3 + i) * 20;
                    this.ctx.fillStyle = '#7f8c8d';
                    this.ctx.beginPath();
                    this.ctx.ellipse(ufoX, ufoY, 15, 5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
                    this.ctx.beginPath();
                    this.ctx.arc(ufoX, ufoY - 2, 5, Math.PI, 0);
                    this.ctx.fill();
                }
            } else if (deco === 'deco_fireworks') {
                // Procedural Fireworks
                const time = Date.now();
                for(let f=0; f<4; f++) {
                    const phase = (time + f * 1500) % 3000 / 3000; // 0 to 1
                    if (phase < 0.1) continue; // exploding
                    const fwX = Math.abs(Math.sin(f * 99)) * this.canvas.width;
                    const fwY = 150 + Math.abs(Math.cos(f * 88)) * 150;
                    const alpha = Math.max(0, 1 - (phase * 1.2));
                    
                    this.ctx.fillStyle = `hsla(${f * 90}, 100%, 70%, ${alpha})`;
                    for(let p=0; p<12; p++) {
                        const angle = (p / 12) * Math.PI * 2;
                        const dist = phase * 80;
                        this.ctx.beginPath();
                        this.ctx.arc(fwX + Math.cos(angle)*dist, fwY + Math.sin(angle)*dist, 2, 0, Math.PI*2);
                        this.ctx.fill();
                    }
                }
            }

        } else {
            // Dynamic Time of Day Sky
            const MORNING = { top: '#FF9A9E', mid: '#FECFEF', bot: '#FDFBFB' };
            const NOON    = { top: '#4A90E2', mid: '#87CEFA', bot: '#E0F6FF' };
            const EVENING = { top: '#1a2a6c', mid: '#b21f1f', bot: '#fdbb2d' };
            const NIGHT   = { top: '#020111', mid: '#20124d', bot: '#000022' };
            const PALETTES = [MORNING, NOON, EVENING, NIGHT];
            
            const towerHeight = this.game.tower ? this.game.tower.blocks.length : 0;
            const targetPhase = Math.floor((towerHeight % 16) / 4);
            
            if (targetPhase !== this.currentPhase) {
                this.currentPhase = targetPhase;
                this.transitionProgress = 0.0;
            }
            
            if (this.transitionProgress < 1.0) {
                this.transitionProgress += 0.02; 
                if (this.transitionProgress > 1.0) this.transitionProgress = 1.0;
            }
            
            const prevPhase = (this.currentPhase + 3) % 4;
            const fromPalette = PALETTES[prevPhase];
            const toPalette = PALETTES[this.currentPhase];
            
            const cTop = lerpColor(fromPalette.top, toPalette.top, this.transitionProgress);
            const cMid = lerpColor(fromPalette.mid, toPalette.mid, this.transitionProgress);
            const cBot = lerpColor(fromPalette.bot, toPalette.bot, this.transitionProgress);
            
            let nightOpacity = 0;
            if (this.currentPhase === 3) {
                nightOpacity = this.transitionProgress;
            } else if (prevPhase === 3 && this.transitionProgress < 1.0) {
                nightOpacity = 1.0 - this.transitionProgress;
            }

            const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            skyGradient.addColorStop(0, cTop);
            skyGradient.addColorStop(0.5, cMid);
            skyGradient.addColorStop(1, cBot);
            
            this.ctx.fillStyle = skyGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (nightOpacity > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${nightOpacity * 0.8})`;
                for (let i = 0; i < 40; i++) {
                    const sx = Math.abs(Math.sin(i * 12345)) * this.canvas.width;
                    const sy = Math.abs(Math.cos(i * 54321)) * (this.canvas.height * 0.6);
                    const size = Math.abs(Math.sin(i)) * 1.5 + 0.5;
                    this.ctx.beginPath();
                    this.ctx.arc(sx, sy, size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            if (deco === 'deco_city') {
                const parallaxOffset = this.cameraY * 0.5;
                const skylineBase = this.canvas.height - parallaxOffset;
                
                // Detailed City Skyline
                for (let i = 0; i < 20; i++) {
                    const h = 80 + (Math.sin(i * 123) * 120);
                    const w = 40 + (Math.cos(i * 321) * 30);
                    const x = i * 45;
                    // Building
                    this.ctx.fillStyle = 'rgba(20, 25, 40, 0.9)';
                    this.ctx.fillRect(x, skylineBase - h, w, h);
                    
                    // Windows if it's getting dark
                    const windowAlpha = (this.currentPhase === 2) ? this.transitionProgress : (this.currentPhase === 3 ? 1 : 0);
                    if (windowAlpha > 0) {
                        this.ctx.fillStyle = `rgba(241, 196, 15, ${windowAlpha * 0.7})`;
                        for(let wx = x + 5; wx < x + w - 10; wx += 15) {
                            for(let wy = skylineBase - h + 10; wy < skylineBase - 20; wy += 20) {
                                if (Math.random() > 0.3) this.ctx.fillRect(wx, wy, 8, 12);
                            }
                        }
                    }
                }
            }
        }
        
        // Apply Camera Transform
        this.ctx.save();
        
        if (this.screenshotMode && this.game.tower) {
            // Calculate total bounding box of the entire standing or collapsed tower
            let minX = GAME_WIDTH / 2 - 140; // Base width
            let maxX = GAME_WIDTH / 2 + 140;
            let minY = GAME_HEIGHT;
            
            this.game.tower.blocks.forEach(block => {
                if (block.position.x - 50 < minX) minX = block.position.x - 50;
                if (block.position.x + 50 > maxX) maxX = block.position.x + 50;
                if (block.position.y - 50 < minY) minY = block.position.y - 50;
            });

            // Add padding to the bounding box
            const bboxWidth = maxX - minX + 100;
            const bboxHeight = (GAME_HEIGHT - minY) + 150; 
            
            // Adjust zoom level to frame this bounding box perfectly
            const scaleX = GAME_WIDTH / bboxWidth;
            const scaleY = GAME_HEIGHT / bboxHeight;
            const scaleFactor = Math.min(scaleX, scaleY, 1.0); // Only zoom out, never in past 1x
            
            // Center the camera on the bounding box
            const centerX = (minX + maxX) / 2;
            
            this.ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT);
            this.ctx.scale(scaleFactor, scaleFactor);
            this.ctx.translate(-centerX, -GAME_HEIGHT);
        } else {
            // Normal game view: Zoom out to keep the crane on screen
            const highestPoint = this.game.crane ? this.game.crane.pivot.y - 50 : GAME_HEIGHT;
            if (highestPoint < 0) {
                const totalHeightNeeded = GAME_HEIGHT + Math.abs(highestPoint);
                const scaleFactor = GAME_HEIGHT / totalHeightNeeded;
                
                // Scale from the bottom center of the screen
                this.ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT);
                this.ctx.scale(scaleFactor, scaleFactor);
                this.ctx.translate(-GAME_WIDTH / 2, -GAME_HEIGHT);
            }
        }
        
        // 3. Draw Ground
        if (this.game.physics && this.game.physics.ground) {
            const ground = this.game.physics.ground;
            const ped = this.game.physics.pedestal;
            const baseType = this.game.equippedBase || 'base_standard';
            
            this.ctx.save();
            this.ctx.translate(ground.position.x, ground.position.y);
            
            if (baseType === 'base_neon') {
                // Neon Grid Ground
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.fillRect(-this.canvas.width/2, -25, this.canvas.width, 50);
                
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                for (let i = -this.canvas.width/2; i < this.canvas.width/2; i += 40) {
                    this.ctx.moveTo(i, -25);
                    this.ctx.lineTo(i + 20, 25);
                }
                this.ctx.stroke();
                
                this.ctx.restore();
                this.ctx.save();
                this.ctx.translate(ped.position.x, ped.position.y);
                
                // Neon Pedestal
                this.ctx.fillStyle = '#111';
                this.ctx.fillRect(-this.game.physics.baseWidth/2, -25, this.game.physics.baseWidth, 50);
                
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeRect(-this.game.physics.baseWidth/2, -25, this.game.physics.baseWidth, 50);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 0;
                this.ctx.fillText("NEON", 0, 7);
                
            } else if (baseType === 'base_cloud') {
                // Cloud Ground
                this.ctx.fillStyle = '#e0f7fa';
                this.ctx.beginPath();
                for (let i = -this.canvas.width/2 - 50; i < this.canvas.width/2 + 50; i += 60) {
                    this.ctx.arc(i, 0, 40 + Math.sin(i)*10, 0, Math.PI*2);
                }
                this.ctx.fill();
                
                this.ctx.restore();
                this.ctx.save();
                this.ctx.translate(ped.position.x, ped.position.y);
                
                // Cloud Pedestal
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(-40, -10, 30, 0, Math.PI*2);
                this.ctx.arc(0, -20, 40, 0, Math.PI*2);
                this.ctx.arc(40, -10, 30, 0, Math.PI*2);
                this.ctx.fill();
                
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#3498db';
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("DREAM", 0, 5);
                
            } else if (baseType === 'base_ruins') {
                // Ruins Ground
                this.ctx.fillStyle = '#3e4a42'; // mossy green-gray
                this.ctx.fillRect(-this.canvas.width/2, -25, this.canvas.width, 50);
                
                this.ctx.strokeStyle = '#27302a';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                for (let i = -this.canvas.width/2; i < this.canvas.width/2; i += 80) {
                    this.ctx.moveTo(i, -25);
                    this.ctx.lineTo(i - 10, 25);
                    this.ctx.moveTo(i, 0);
                    this.ctx.lineTo(i + 40, 5);
                }
                this.ctx.stroke();
                
                this.ctx.restore();
                this.ctx.save();
                this.ctx.translate(ped.position.x, ped.position.y);
                
                // Ruins Pedestal
                this.ctx.fillStyle = '#bdc3c7';
                this.ctx.fillRect(-this.game.physics.baseWidth/2, -25, this.game.physics.baseWidth, 50);
                
                // Cracks
                this.ctx.strokeStyle = '#7f8c8d';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-20, -25);
                this.ctx.lineTo(-10, -5);
                this.ctx.lineTo(-25, 10);
                this.ctx.moveTo(30, 25);
                this.ctx.lineTo(20, 0);
                this.ctx.stroke();
                
                // Vines
                this.ctx.fillStyle = '#2ecc71';
                this.ctx.fillRect(-this.game.physics.baseWidth/2, -25, 15, 30);
                this.ctx.fillRect(this.game.physics.baseWidth/2 - 20, -25, 10, 40);
                
                this.ctx.fillStyle = '#2c3e50';
                this.ctx.font = 'bold 20px serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("RUIN", 0, 7);
                
            } else {
                // Default Concrete
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(-this.canvas.width/2, -25, this.canvas.width, 50);
                
                this.ctx.fillStyle = '#F1C40F';
                for (let i = -this.canvas.width/2; i < this.canvas.width/2; i += 40) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(i, -25);
                    this.ctx.lineTo(i + 20, -25);
                    this.ctx.lineTo(i - 10, 25);
                    this.ctx.lineTo(i - 30, 25);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
                this.ctx.save();
                this.ctx.translate(ped.position.x, ped.position.y);
                
                this.ctx.fillStyle = '#7f8c8d';
                this.ctx.fillRect(-this.game.physics.baseWidth/2, -25, this.game.physics.baseWidth, 50);
                
                this.ctx.strokeStyle = '#2c3e50';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(-this.game.physics.baseWidth/2, -25, this.game.physics.baseWidth, 50);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("BASE", 0, 7);
            }
            
            this.ctx.restore();
        }
        
        // --- EDUCATIONAL PHYSICS: Dynamic Geometric String Visualization (Pendulum) ---
        // Rendered strictly BEFORE drawing tower blocks and falling blocks so it sits behind them!
        if (this.game.crane && !this.screenshotMode && this.game.state === 'PLAYING') {
            this.game.crane.drawAngleVisualization(this.ctx, this.game);
        }

        // 4. Draw Blocks
        if (this.game.tower) {
            this.game.tower.blocks.forEach(blockBody => {
                // Find block instance attached to body if possible, or just draw basic
                // Since we need block instance to call draw(), let's assume body.plugin.blockInstance is set
                if (blockBody.plugin && blockBody.plugin.blockInstance) {
                    blockBody.plugin.blockInstance.draw(this.ctx);
                }
            });
        }
        
        // Current block hanging from crane
        if (this.game.currentBlock && this.game.currentBlock.plugin && this.game.currentBlock.plugin.blockInstance) {
            this.game.currentBlock.plugin.blockInstance.draw(this.ctx);
        }
        
        // 5. Draw Crane (Hide in screenshot mode so only the tower is captured)
        if (this.game.crane && !this.screenshotMode) {
            this.game.crane.draw(this.ctx, this.game);
        }
        
        this.ctx.restore();

        // --- EDUCATIONAL PHYSICS: Free Fall Velocity Meter (Kinematics) ---
        if (!this.screenshotMode && this.game && this.game.state === 'PLAYING') {
            this.drawVelocityMeter();
        }

        // 6. Draw Screenshot-Specific UI Overlay (Watermark)
        if (this.screenshotMode && this.screenshotOverlay) {
            this.ctx.save();
            
            // Text styling for top stats base
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textBaseline = 'top';
            
            // --- TOP LEFT: STACKS ---
            this.ctx.textAlign = 'left';
            this.ctx.fillText("STACKS", 30, 30);
            
            // Draw Starburst background for Stack Count
            const cx = 75;
            const cy = 110;
            const spikes = 12;
            const outerRadius = 45;
            const innerRadius = 28;
            
            this.ctx.save();
            this.ctx.beginPath();
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;
            this.ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                let x = cx + Math.cos(rot) * outerRadius;
                let y = cy + Math.sin(rot) * outerRadius;
                this.ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                this.ctx.lineTo(x, y);
                rot += step;
            }
            this.ctx.lineTo(cx, cy - outerRadius);
            this.ctx.closePath();
            
            // Outer red burst
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
            this.ctx.fill();
            
            // Inner yellow burst
            this.ctx.beginPath();
            rot = Math.PI / 2 * 3;
            this.ctx.moveTo(cx, cy - (outerRadius - 8));
            for (let i = 0; i < spikes; i++) {
                let x = cx + Math.cos(rot) * (outerRadius - 8);
                let y = cy + Math.sin(rot) * (outerRadius - 8);
                this.ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * (innerRadius - 5);
                y = cy + Math.sin(rot) * (innerRadius - 5);
                this.ctx.lineTo(x, y);
                rot += step;
            }
            this.ctx.closePath();
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.fill();
            this.ctx.restore();
            
            // Draw Stack Number inside Starburst
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '900 42px sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillText(`${this.screenshotOverlay.stacks}`, cx, cy);
            this.ctx.restore();
            
            // --- TOP RIGHT: SCORE ---
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top'; // Header is drawn from the top
            this.ctx.fillText("SCORE", this.canvas.width - 55, 30);
            
            // Vertical Score Digits
            const scoreStr = this.screenshotOverlay.score.replace(/,/g, ''); // Remove commas for vertical flow
            
            // Layout variables for mathematically perfect centering
            const digitSpacing = 32;
            const startY = 95;  // Pushed down to create a ~20px gap between the 'SCORE' text and the pill container
            const bannerWidth = 46;
            const radius = 23; // Fully rounded pill shape (exactly half width)
            
            // Height perfectly wraps the exact centers of the first and last digits + a full radius on top and bottom
            const bannerHeight = ((scoreStr.length - 1) * digitSpacing) + (radius * 2);
            
            const bannerX = this.canvas.width - 55 - radius;
            const bannerY = startY - radius;
            
            this.ctx.save();
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, radius);
            } else {
                // Fallback for older browsers
                this.ctx.moveTo(bannerX + radius, bannerY);
                this.ctx.lineTo(bannerX + bannerWidth - radius, bannerY);
                this.ctx.quadraticCurveTo(bannerX + bannerWidth, bannerY, bannerX + bannerWidth, bannerY + radius);
                this.ctx.lineTo(bannerX + bannerWidth, bannerY + bannerHeight - radius);
                this.ctx.quadraticCurveTo(bannerX + bannerWidth, bannerY + bannerHeight, bannerX + bannerWidth - radius, bannerY + bannerHeight);
                this.ctx.lineTo(bannerX + radius, bannerY + bannerHeight);
                this.ctx.quadraticCurveTo(bannerX, bannerY + bannerHeight, bannerX, bannerY + bannerHeight - radius);
                this.ctx.lineTo(bannerX, bannerY + radius);
                this.ctx.quadraticCurveTo(bannerX, bannerY, bannerX + radius, bannerY);
            }
            this.ctx.closePath();
            
            this.ctx.fillStyle = 'rgba(20, 20, 30, 0.85)'; // Dark backing plate
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = '#f39c12'; // Glowing orange/gold outline
            this.ctx.stroke();
            this.ctx.restore();
            
            // Draw digits exactly centered inside the pill sections
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.fillStyle = '#FFD700'; // Gold color to make it pop against the dark plate
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle'; // Crucial for perfect vertical alignment within the pill bounds
            
            for (let i = 0; i < scoreStr.length; i++) {
                // Stack each digit downwards over the banner
                this.ctx.fillText(scoreStr[i], this.canvas.width - 55, startY + (i * digitSpacing));
            }
            
            // --- BOTTOM RIGHT: AFFIRMATION ---
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.ctx.font = 'italic bold 42px sans-serif';
            
            // 3D/Slanted effect for Affirmation
            this.ctx.fillStyle = '#d35400'; // Darker orange/brown for 3D shadow depth
            this.ctx.fillText(this.screenshotOverlay.affirmation, this.canvas.width - 27, this.canvas.height - 27);
            
            this.ctx.fillStyle = '#FFD700'; // Gold color for affirmation main text
            this.ctx.fillText(this.screenshotOverlay.affirmation, this.canvas.width - 30, this.canvas.height - 30);
            
            this.ctx.restore();
        }
        this.ctx.restore(); // Restore global camera shake transform
    }

    drawVelocityMeter() {
        const barWidth = 24;
        const barHeight = 220;
        const barX = this.canvas.width - barWidth - 20;
        const barY = 120;
        
        const speed = (this.game && typeof this.game.currentDisplayVelocity === 'number') ? this.game.currentDisplayVelocity : 0;
        const fillRatio = Math.min(1, Math.max(0, speed / 11.0));
        
        // Helper to get heat color from Cyan (cool) to Yellow to Red (hot)
        let glowColor = '#00ffff';
        if (fillRatio > 0.5) {
            glowColor = lerpColor('#ffff00', '#ff0000', (fillRatio - 0.5) * 2);
        } else {
            glowColor = lerpColor('#00ffff', '#ffff00', fillRatio * 2);
        }

        this.ctx.save();
        
        // Background container
        this.ctx.fillStyle = 'rgba(10, 15, 25, 0.82)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(barX, barY, barWidth, barHeight, 8);
        } else {
            this.ctx.rect(barX, barY, barWidth, barHeight);
        }
        this.ctx.fill();
        this.ctx.stroke();

        // Filled kinetic energy gauge
        if (fillRatio > 0.01) {
            const fillH = fillRatio * (barHeight - 4);
            const fillY = barY + barHeight - 2 - fillH;
            
            this.ctx.fillStyle = glowColor;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 12;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(barX + 2, fillY, barWidth - 4, fillH, 6);
            } else {
                this.ctx.fillRect(barX + 2, fillY, barWidth - 4, fillH);
            }
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Top Header: "VELOCITY"
        this.ctx.font = '900 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = fillRatio > 0.01 ? glowColor : '#cccccc';
        this.ctx.shadowColor = fillRatio > 0.01 ? glowColor : 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = fillRatio > 0.01 ? 8 : 4;
        this.ctx.fillText("VELOCITY", barX + barWidth / 2, barY - 8);
        this.ctx.shadowBlur = 0;

        // Bottom Value: simulated m/s kinematics (rounded to 1 decimal place)
        const speedVal = speed.toFixed(1);
        this.ctx.font = '900 16px sans-serif';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = fillRatio > 0.01 ? glowColor : '#ffffff';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(`${speedVal} m/s`, barX + barWidth / 2, barY + barHeight + 8);
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    drawAngleGauge() {
        // Obsolete: Angle gauge is now integrated into the swinging crane assembly in Crane.js
    }
}
