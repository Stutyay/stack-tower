export class UIManager {
    constructor(game) {
        this.game = game;
        
        this.hud = document.getElementById('hud');
        this.scoreEl = document.getElementById('score');
        this.heightEl = document.getElementById('height');
        this.angleContainer = document.getElementById('angle-display');
        this.angleEl = document.getElementById('angle-value');
        this.comboContainer = document.getElementById('combo-display');
        this.comboEl = document.getElementById('combo');
        
        this.hubScreen = document.getElementById('hub-screen');
        this.splashScreen = document.getElementById('splash-screen');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        this.shopModal = document.getElementById('shop-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.shopGrid = document.getElementById('shop-grid');
        this.shopCoinsEl = document.getElementById('shop-coins');

        // ── Shop Data Catalogue ──────────────────────────────────────────
        this.shopCatalogue = {
            cranes: [
                { id: 'crane_yellow',   name: 'Industrial Yellow',  icon: '🏗️',  price: 0,    unlocked: true,  equipped: true  },
                { id: 'crane_steam',    name: 'Steampunk Pulley',   icon: '⚙️',  price: 120,  unlocked: false, equipped: false },
                { id: 'crane_robotic',  name: 'Sleek Robotic Arm',  icon: '🦾',  price: 200,  unlocked: false, equipped: false },
                { id: 'crane_ufo',      name: 'UFO Tractor Beam',   icon: '🛸',  price: 350,  unlocked: false, equipped: false },
            ],
            blocks: [
                { id: 'block_concrete', name: 'Standard Concrete',  icon: '🧱',  price: 0,    unlocked: true,  equipped: true  },
                { id: 'block_glass',    name: 'Glass Skyscraper',   icon: '🪟',  price: 100,  unlocked: false, equipped: false },
                { id: 'block_urban',    name: 'Zing Urban Matte',   icon: '🏙️',  price: 180,  unlocked: false, equipped: false },
                { id: 'block_neon',     name: 'Neon Wireframe',     icon: '🌈',  price: 300,  unlocked: false, equipped: false },
            ],
            bases: [
                { id: 'base_standard', name: 'Standard Pad',   icon: '🟫', price: 0,   unlocked: true,  equipped: true  },
                { id: 'base_neon',     name: 'Neon Grid',      icon: '🟩', price: 150, unlocked: false, equipped: false },
                { id: 'base_cloud',    name: 'Cloud Bed',      icon: '☁️', price: 250, unlocked: false, equipped: false },
                { id: 'base_ruins',    name: 'Ancient Ruins',  icon: '🏛️', price: 400, unlocked: false, equipped: false },
            ],
            decorations: [
                { id: 'deco_plain',    name: 'Plain Sky',          icon: '🌤️', price: 0,   unlocked: true,  equipped: true  },
                { id: 'deco_city',     name: 'City Skyline',       icon: '🏙️', price: 150, unlocked: false, equipped: false },
                { id: 'deco_stars',    name: 'Starry Night & UFO', icon: '🌌', price: 250, unlocked: false, equipped: false },
                { id: 'deco_fireworks',name: 'Fireworks Show',     icon: '🎆', price: 400, unlocked: false, equipped: false },
            ]
        };
        this.activeShopTab = 'cranes';
        this._loadShopState();
        
        this.bgMusic = document.getElementById('bg-music');
        this.quickMuteBtn = document.getElementById('quick-mute-btn');
        
        // ── Settings Data ───────────────────────────────────────────────
        this.settings = {
            audio: { master: 100, music: 50, sfx: 100, muted: false, savedMaster: 100 },
            video: { brightness: 100, contrast: 100, fullscreen: false },
            controls: { dropKey: 'Space' },
            accessibility: { skipSplash: false, screenShake: true }
        };
        this._loadSettings();
        
        this.finalHeightEl = document.getElementById('final-height');
        this.finalCoinsEl = document.getElementById('final-coins');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalTimeEl = document.getElementById('final-time');
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Hub -> Splash -> Main Menu Flow
        document.getElementById('hub-stack-tower').addEventListener('click', () => {
            this.hubScreen.classList.add('hidden');
            
            // Try to start global background music
            if (this.bgMusic) {
                this.bgMusic.volume = (this.settings.audio.master / 100) * (this.settings.audio.music / 100);
                this.bgMusic.play().catch(e => console.warn('Audio play failed:', e));
            }
            
            this.splashScreen.classList.remove('hidden');
            setTimeout(() => {
                this.splashScreen.classList.add('hidden');
                this.startScreen.classList.remove('hidden');
            }, 2000);
        });

        // Main Menu -> Game
        document.getElementById('start-btn').addEventListener('click', () => {
            this.hideScreens();
            this.showHUD();
            this.clearToast();
            this.game.start();
        });
        
        // Shop modal — open with live data
        document.getElementById('shop-btn').addEventListener('click', () => {
            this.openShop();
        });

        // Shop tabs
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeShopTab = tab.dataset.tab;
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShopGrid();
            });
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.settingsModal.classList.remove('hidden');
        });
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
                this.clearToast();
            });
        });
        
        // ── Event Isolation for Modals ───────────────────────────────
        const stopProp = (e) => e.stopPropagation();
        ['settings-modal', 'shop-modal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('pointerdown', stopProp);
                el.addEventListener('mousedown', stopProp);
                el.addEventListener('touchstart', stopProp, { passive: false });
                el.addEventListener('click', stopProp);
            }
        });
        
        // ── Settings UI Interaction ────────────────────────────────────
        
        if (this.quickMuteBtn) {
            // Also catch pointerdown so it doesn't bubble to Game.js
            this.quickMuteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
            
            this.quickMuteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (this.settings.audio.muted) {
                    this.settings.audio.master = this.settings.audio.savedMaster || 100;
                    this.settings.audio.muted = false;
                } else {
                    this.settings.audio.savedMaster = this.settings.audio.master;
                    this.settings.audio.master = 0;
                    this.settings.audio.muted = true;
                }
                
                const volMaster = document.getElementById('vol-master');
                if (volMaster) volMaster.value = this.settings.audio.master;

                this._updateMuteButtonVisuals();
                this._applySettings();
                this._saveSettings();
            });
        }
        
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.dataset.tab;
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden', 'active'));
                
                e.target.classList.add('active');
                document.getElementById(`settings-${target}`).classList.remove('hidden');
            });
        });
        
        // Audio Sliders
        const volMaster = document.getElementById('vol-master');
        const volMusic = document.getElementById('vol-music');
        const volSfx = document.getElementById('vol-sfx');
        
        const updateAudio = () => {
            this.settings.audio.master = parseInt(volMaster.value, 10);
            this.settings.audio.music = parseInt(volMusic.value, 10);
            this.settings.audio.sfx = parseInt(volSfx.value, 10);
            
            if (this.settings.audio.master > 0 && this.settings.audio.muted) {
                this.settings.audio.muted = false;
                this._updateMuteButtonVisuals();
            } else if (this.settings.audio.master === 0 && !this.settings.audio.muted) {
                this.settings.audio.muted = true;
                this._updateMuteButtonVisuals();
            }

            this._applySettings();
            this._saveSettings();
        };
        volMaster.addEventListener('input', updateAudio);
        volMusic.addEventListener('input', updateAudio);
        volSfx.addEventListener('input', updateAudio);

        // Video Sliders
        const dispBrightness = document.getElementById('disp-brightness');
        const dispContrast = document.getElementById('disp-contrast');
        
        const updateVideo = () => {
            this.settings.video.brightness = parseInt(dispBrightness.value, 10);
            this.settings.video.contrast = parseInt(dispContrast.value, 10);
            this._applySettings();
            this._saveSettings();
        };
        dispBrightness.addEventListener('input', updateVideo);
        dispContrast.addEventListener('input', updateVideo);
        


        // Accessibility Toggles
        const toggleShake = document.getElementById('toggle-shake');
        
        const updateAccess = () => {
            this.settings.accessibility.screenShake = toggleShake.checked;
            this._saveSettings();
        };
        toggleShake.addEventListener('change', updateAccess);
        
        // "Try Again" — instant replay!
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.hideScreens();
            this.showHUD();
            this.clearToast();
            this.game.restartGame();
        });

        // "Home" — return to Main Menu from Game Over!
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.returnToMainMenu();
            });
        }

        document.getElementById('save-btn').addEventListener('click', () => {
            this.captureAndDownload();
        });

        document.getElementById('share-btn').addEventListener('click', () => {
            this.captureAndShare();
        });
    }

    // ─── Shop System ────────────────────────────────────────────────────────

    /** Load persisted shop state from localStorage */
    _loadShopState() {
        try {
            const saved = JSON.parse(localStorage.getItem('stackTowerShop') || '{}');
            ['cranes', 'blocks', 'bases', 'decorations'].forEach(cat => {
                this.shopCatalogue[cat].forEach(item => {
                    if (saved[item.id]) {
                        item.unlocked = saved[item.id].unlocked ?? item.unlocked;
                        item.equipped  = saved[item.id].equipped  ?? item.equipped;
                    }
                });
            });
        } catch (e) { /* ignore corrupt data */ }
    }

    /** Persist shop state to localStorage */
    _saveShopState() {
        const out = {};
        let activeCrane = 'crane_yellow';
        let activeBlock = 'block_concrete';
        let activeBase  = 'base_standard';
        let activeDeco  = 'deco_plain';
        
        ['cranes', 'blocks', 'bases', 'decorations'].forEach(cat => {
            this.shopCatalogue[cat].forEach(item => {
                out[item.id] = { unlocked: item.unlocked, equipped: item.equipped };
                if (item.equipped) {
                    if (cat === 'cranes') activeCrane = item.id;
                    if (cat === 'blocks') activeBlock = item.id;
                    if (cat === 'bases') activeBase = item.id;
                    if (cat === 'decorations') activeDeco = item.id;
                }
            });
        });
        
        localStorage.setItem('stackTowerShop', JSON.stringify(out));
        localStorage.setItem('equippedCrane', activeCrane);
        localStorage.setItem('equippedBlock', activeBlock);
        localStorage.setItem('equippedBase', activeBase);
        localStorage.setItem('equippedDecoration', activeDeco);
    }

    /** Open the shop modal, refresh coin display and grid */
    openShop() {
        this.shopModal.classList.remove('hidden');
        // Always read from totalGoldCoins (the persistent balance)
        const balance = this.game.totalGoldCoins ?? this.game.goldCoins ?? 0;
        this.shopCoinsEl.textContent = balance;
        this.renderShopGrid();
    }

    /** Render item cards for the active tab */
    renderShopGrid() {
        const items = this.shopCatalogue[this.activeShopTab];
        this.shopGrid.innerHTML = '';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-item' + (item.equipped ? ' equipped' : '');
            card.dataset.id = item.id;

            const priceLabel = item.price === 0
                ? `<span class="shop-item-price free">✅ Default</span>`
                : `<span class="shop-item-price">🪙 ${item.price}</span>`;

            let btnClass, btnLabel;
            if (item.equipped) {
                btnClass = 'btn-equipped'; btnLabel = '✔ Equipped';
            } else if (item.unlocked) {
                btnClass = 'btn-equip';   btnLabel = 'Equip';
            } else {
                btnClass = 'btn-buy';     btnLabel = `Buy · ${item.price} 🪙`;
            }

            card.innerHTML = `
                <span class="shop-item-icon">${item.icon}</span>
                <span class="shop-item-name">${item.name}</span>
                ${priceLabel}
                <button class="shop-item-btn ${btnClass}" data-id="${item.id}" data-cat="${this.activeShopTab}">${btnLabel}</button>
            `;

            this.shopGrid.appendChild(card);
        });

        // Bind action buttons
        this.shopGrid.querySelectorAll('.shop-item-btn').forEach(btn => {
            if (btn.classList.contains('btn-equipped')) return; // no-op
            btn.addEventListener('click', () => {
                const id  = btn.dataset.id;
                const cat = btn.dataset.cat;
                if (btn.classList.contains('btn-buy')) {
                    this._buyItem(id, cat, btn);
                } else {
                    this._equipItem(id, cat);
                }
            });
        });
    }

    /** Purchase an item; deduct coins and unlock it */
    _buyItem(id, cat, btn) {
        const item   = this.shopCatalogue[cat].find(i => i.id === id);
        
        // Use the persistent lifetime total, safely parsed as an integer
        const coins = parseInt(this.game.totalGoldCoins || 0, 10);
        const price = parseInt(item.price || 0, 10);
        
        if (coins < price) {
            // Not enough coins — shake the button
            btn.classList.add('shake');
            btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
            this.showInsufficientFundsAlert();
            return;
        }
        
        // Deduct coins and persist immediately
        const newBalance = coins - price;
        this.game.totalGoldCoins = newBalance;
        localStorage.setItem('stackTowerTotalCoins', String(newBalance));
        
        // Update UI
        this.shopCoinsEl.textContent = newBalance;

        item.unlocked = true;
        this._saveShopState();
        this._equipItem(id, cat);  // auto-equip after buying
    }

    clearToast() {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toastTimeout = null;
        }
        if (this.currentToast && this.currentToast.parentNode) {
            this.currentToast.parentNode.removeChild(this.currentToast);
        }
        this.currentToast = null;
    }

    showInsufficientFundsAlert() {
        this.clearToast();

        const toast = document.createElement('div');
        toast.className = 'insufficient-funds-toast';
        toast.textContent = 'Not enough gold coins';
        document.getElementById('ui-layer').appendChild(toast);
        
        this.currentToast = toast;

        this.toastTimeout = setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
                if (this.currentToast === toast) this.currentToast = null;
            }, 300); // Wait for fade-out animation to complete
        }, 2000);
    }

    /** Equip an item; un-equip others in same category */
    _equipItem(id, cat) {
        this.shopCatalogue[cat].forEach(i => { i.equipped = (i.id === id); });
        this._saveShopState();

        // Notify the game renderer of the active skin
        if (this.game.renderer) {
            this.game.renderer.activeSkins = this.getActiveSkins();
        }

        this.renderShopGrid();  // refresh cards
    }

    /** Returns the currently equipped skin IDs for use by the renderer */
    getActiveSkins() {
        const active = {};
        ['cranes', 'blocks'].forEach(cat => {
            const eq = this.shopCatalogue[cat].find(i => i.equipped);
            if (eq) active[cat] = eq.id;
        });
        return active;
    }

    showStartScreen() {
        this.hubScreen.classList.remove('hidden');
        this.splashScreen.classList.add('hidden');
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
    }
    
    showHUD() {
        this.hud.classList.remove('hidden');
    }
    
    hideScreens() {
        this.hubScreen.classList.add('hidden');
        this.splashScreen.classList.add('hidden');
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    returnToMainMenu() {
        this.hideScreens();
        this.hud.classList.add('hidden');
        this.clearToast();
        this.startScreen.classList.remove('hidden');
        if (this.game && this.game.resetToMenu) {
            this.game.resetToMenu();
        }
    }

    returnToHome() {
        this.returnToMainMenu();
    }

    returnToMenu() {
        this.returnToMainMenu();
    }

    showMainMenu() {
        this.returnToMainMenu();
    }

    goToMainMenu() {
        this.returnToMainMenu();
    }

    goToHome() {
        this.returnToMainMenu();
    }

    returnToStartScreen() {
        this.returnToMainMenu();
    }
    
    updateHUD(coins, height, combo) {
        this.scoreEl.innerText = coins;
        this.heightEl.innerText = height;
        
        if (combo > 1) {
            this.comboContainer.classList.remove('hidden');
            this.comboEl.innerText = combo;
        } else {
            this.comboContainer.classList.add('hidden');
        }
    }

    updateAngleDisplay(degrees) {
        if (!this.angleEl || !this.angleContainer) return;
        this.angleEl.innerText = `${degrees}°`;

        // Color coding: Green for safe angles (0° to 15°), Yellow for moderate (16° to 30°), Red for extreme (> 30°)
        this.angleContainer.classList.remove('angle-safe', 'angle-warn', 'angle-danger');
        if (degrees > 30) {
            this.angleContainer.classList.add('angle-danger');
        } else if (degrees >= 16) {
            this.angleContainer.classList.add('angle-warn');
        } else {
            this.angleContainer.classList.add('angle-safe');
        }
    }

    /** Format seconds as MM:SS */
    formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    
    showGameOver(runCoinsEarned, progressiveScore, elapsedSeconds, stats) {
        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        // Since 1 block = 1 coin, runCoinsEarned acts as both the tower height metric and the coin reward
        if (this.finalHeightEl) this.finalHeightEl.innerText = runCoinsEarned;
        if (this.finalCoinsEl) this.finalCoinsEl.innerText = runCoinsEarned;
        
        this.finalScoreEl.innerText = progressiveScore.toLocaleString();
        this.finalTimeEl.innerText = this.formatTime(elapsedSeconds);

        // Refresh shop coin counter so it's ready when player opens shop next
        if (this.shopCoinsEl) {
            this.shopCoinsEl.textContent = this.game ? (this.game.totalGoldCoins || 0) : 0;
        }
    }

    // ─── Screenshot / Share Logic ───────────────────────────────────────────

    /**
     * Renders the entire tower zoomed-out on the game canvas,
     * hides the UI overlay, captures, then restores everything.
     * Returns a data URL of the captured image.
     */
    async captureScreenshot() {
        const renderer = this.game.renderer;
        const canvas = renderer.canvas;
        const ctx = renderer.ctx;
        const uiLayer = document.getElementById('ui-layer');

        // 1. Hide main UI overlay so it doesn't appear in the capture
        uiLayer.style.visibility = 'hidden';

        // 2. Enable screenshot mode on the renderer
        renderer.screenshotMode = true;

        // --- NEW: Generate Screenshot UI Overlay Data ---
        const affirmations = ["Amazing!", "Wonderful!", "Epic!", "Incredible!", "Unstoppable!"];
        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        
        // Calculate progressive score identically to Game Over logic
        const coins = this.game.goldCoins || 0;
        const baseScore = coins * 50;
        const heightMultiplier = 1 + (coins / 10);
        const progressiveScore = Math.round(baseScore * heightMultiplier);

        renderer.screenshotOverlay = {
            stacks: coins,
            score: progressiveScore.toLocaleString(),
            affirmation: randomAffirmation
        };

        // 3. Force a render to apply the custom framing and draw the overlay
        renderer.render();

        // Yield for one frame to ensure it's fully rendered (per requirements)
        await new Promise(resolve => requestAnimationFrame(resolve));

        // 4. Capture pixel data as PNG data URL
        const dataUrl = canvas.toDataURL('image/png');

        // 5. Restore everything and immediately deactivate screenshot UI
        renderer.screenshotMode = false;
        renderer.screenshotOverlay = null;
        uiLayer.style.visibility = '';

        // Trigger one normal render to restore visual state
        renderer.render();

        return dataUrl;
    }

    /** Save button: download the screenshot as a PNG file */
    async captureAndDownload() {
        const dataUrl = await this.captureScreenshot();
        const link = document.createElement('a');
        link.download = `stack-tower-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    }

    /** Share button: use Web Share API if available, else fall back to download */
    async captureAndShare() {
        const dataUrl = await this.captureScreenshot();

        if (navigator.share && navigator.canShare) {
            try {
                // Convert data URL to a File for the Web Share API
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], 'stack-tower.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Stack Tower',
                        text: `I built a ${this.game.goldCoins}-stack tower! 🪙`,
                        files: [file],
                    });
                    return;
                }
            } catch (err) {
                console.warn('[Share] Web Share failed, falling back to download.', err);
            }
        }

        // Fallback: just download
        const link = document.createElement('a');
        link.download = `stack-tower-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    }
    // ─── Settings System ────────────────────────────────────────────────────────

    _loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('stackTowerSettings'));
            if (saved) {
                // Deep merge
                this.settings.audio = { ...this.settings.audio, ...saved.audio };
                this.settings.video = { ...this.settings.video, ...saved.video };
                this.settings.controls = { ...this.settings.controls, ...saved.controls };
                this.settings.accessibility = { ...this.settings.accessibility, ...saved.accessibility };
            }
        } catch (e) { /* use defaults */ }
        
        this._updateMuteButtonVisuals();

        // Sync UI
        setTimeout(() => {
            if(document.getElementById('vol-master')) document.getElementById('vol-master').value = this.settings.audio.master;
            if(document.getElementById('vol-music')) document.getElementById('vol-music').value = this.settings.audio.music;
            if(document.getElementById('vol-sfx')) document.getElementById('vol-sfx').value = this.settings.audio.sfx;
            if(document.getElementById('disp-brightness')) document.getElementById('disp-brightness').value = this.settings.video.brightness;
            if(document.getElementById('disp-contrast')) document.getElementById('disp-contrast').value = this.settings.video.contrast;
            if(document.getElementById('toggle-shake')) document.getElementById('toggle-shake').checked = this.settings.accessibility.screenShake;
            this._applySettings();
        }, 100);
    }
    
    _saveSettings() {
        localStorage.setItem('stackTowerSettings', JSON.stringify(this.settings));
        if (this.game) {
            this.game.settings = this.settings; // Push to game instantly
        }
    }
    
    _applySettings() {
        if (this.bgMusic) {
            this.bgMusic.volume = (this.settings.audio.master / 100) * (this.settings.audio.music / 100);
        }
        
        const b = this.settings.video.brightness;
        const c = this.settings.video.contrast;
        const container = document.getElementById('game-container');
        if (container) {
            container.style.filter = `brightness(${b}%) contrast(${c}%)`;
        }
    }

    _updateMuteButtonVisuals() {
        if (!this.quickMuteBtn) return;
        if (this.settings.audio.muted) {
            this.quickMuteBtn.classList.add('muted');
            this.quickMuteBtn.innerText = '🔇';
        } else {
            this.quickMuteBtn.classList.remove('muted');
            this.quickMuteBtn.innerText = '🔊';
        }
    }
}
