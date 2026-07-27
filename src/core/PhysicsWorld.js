import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';

export class PhysicsWorld {
    constructor() {
        this.engine = Matter.Engine.create();
        
        // Optimize for stacking (iterations)
        this.engine.positionIterations = 12; // Increased for better stability
        this.engine.velocityIterations = 12;

        this.runner = Matter.Runner.create();
        this.baseWidth = 100; // 1.0x exact width of a standard 100x100 block
        
        // Setup ground
        this.ground = Matter.Bodies.rectangle(
            GAME_WIDTH / 2, 
            GAME_HEIGHT - 25, 
            this.baseWidth, 
            50, 
            { 
                isStatic: true, 
                friction: 1.0
            }
        );
        
        // Setup pedestal (starting base)
        this.pedestal = Matter.Bodies.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 75, // sits on top of the ground
            this.baseWidth,
            50,
            { 
                isStatic: true, 
                friction: 1.0 
            }
        );

        Matter.World.add(this.engine.world, [this.ground, this.pedestal]);

        // Resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    start() {
        Matter.Runner.run(this.runner, this.engine);
    }

    stop() {
        Matter.Runner.stop(this.runner);
    }

    add(entity) {
        Matter.World.add(this.engine.world, entity);
    }

    remove(entity) {
        Matter.World.remove(this.engine.world, entity);
    }

    handleResize() {
        Matter.Body.setPosition(this.ground, {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 25
        });
        Matter.Body.setPosition(this.pedestal, {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 75
        });
    }
}
