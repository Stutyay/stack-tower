import Matter from 'matter-js';

export class Block {
    constructor(x, y, type = 'block_concrete') {
        const size = 100; // Perfect square
        
        this.body = Matter.Bodies.rectangle(x, y, size, size, {
            friction: 0.1,
            restitution: 0.02,
            density: 0.05,
            frictionAir: 0.01,
            frictionStatic: 0.1,
            sleepThreshold: -1
        });
        
        this.body.plugin = { blockInstance: this };
        this.size = size;
        this.type = type;
        
        // Theme-specific random properties
        if (this.type === 'block_glass') {
            this.color = this.getRandomColor(['#3498db', '#2980b9', '#85c1e9', '#5dade2']);
            this.windowColor = '#ffffff';
        } else if (this.type === 'block_urban') {
            this.color = this.getRandomColor(['#e67e22', '#e74c3c', '#9b59b6', '#1abc9c']);
            this.windowColor = '#2c3e50';
        } else if (this.type === 'block_neon') {
            this.color = '#111111'; // Dark base
            this.windowColor = this.getRandomColor(['#00ff00', '#ff00ff', '#00ffff', '#ffff00']); // Neon borders
        } else {
            // Default concrete
            this.color = this.getRandomColor(['#2c3e50', '#7f8c8d', '#34495e', '#95a5a6', '#bdc3c7']);
            this.windowColor = Math.random() > 0.5 ? '#fff9c4' : '#2c3e50';
        }
    }
    
    dampImpact() {
        const MAX_Y_VELOCITY = 8;
        const vel = this.body.velocity;
        if (vel.y > MAX_Y_VELOCITY) {
            Matter.Body.setVelocity(this.body, { x: 0, y: MAX_Y_VELOCITY });
        } else {
            Matter.Body.setVelocity(this.body, { x: 0, y: vel.y });
        }
        Matter.Body.setAngularVelocity(this.body, 0);
    }

    getRandomColor(palette) {
        return palette[Math.floor(Math.random() * palette.length)];
    }
    
    draw(ctx) {
        const x = this.body.position.x;
        const y = this.body.position.y;
        const angle = this.body.angle;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Base building
        ctx.fillStyle = this.color;
        if (this.type === 'block_glass') ctx.globalAlpha = 0.85;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.globalAlpha = 1.0;
        
        // Border / Wall outline
        ctx.strokeStyle = this.type === 'block_neon' ? this.windowColor : '#222';
        ctx.lineWidth = this.type === 'block_neon' ? 4 : 2;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Windows (grid)
        ctx.fillStyle = this.windowColor;
        const windowSize = 15;
        const gap = 10;
        const startOffset = -this.size/2 + gap;
        
        for (let wx = startOffset; wx < this.size/2 - gap; wx += windowSize + gap) {
            for (let wy = startOffset + gap; wy < this.size/2 - gap; wy += windowSize + gap) {
                if (this.type === 'block_neon') {
                    // Neon wireframe grid instead of filled windows
                    ctx.strokeStyle = this.windowColor;
                    ctx.lineWidth = 1;
                    if (Math.random() > 0.2) ctx.strokeRect(wx, wy, windowSize, windowSize);
                } else {
                    // Normal filled windows
                    if (Math.random() > 0.15) ctx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
        
        // Roof detail
        ctx.fillStyle = this.type === 'block_neon' ? this.windowColor : '#111';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, 10);
        
        ctx.restore();
    }
}
