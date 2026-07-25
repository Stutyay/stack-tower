import { Game } from './core/Game.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get session token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('token');

    // 2. Initialize the SDK
    if (sessionToken && window.CrazinosGameSDK) {
        window.CrazinosGameSDK.init({ token: sessionToken });
    }

    const game = new Game();
    game.init();
});
