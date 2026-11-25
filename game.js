// Game Engine & State Management for Virtual Cat Pet Game

class CatGame {
    constructor() {
        this.cat = null;
        this.stats = {
            hunger: 80,
            happiness: 85,
            energy: 90,
            coins: 50,
            level: 1,
            exp: 0,
            name: 'Mochi',
            furColor: 'orange',
            accessory: 'bow',
            isSleeping: false,
            lastTick: Date.now()
        };

        this.selectedFood = 'salmon';
        this.miniGameActive = false;
        this.miniGameScore = 0;
        this.miniGameTimer = null;
        this.yarnPos = { x: 150, y: 150, vx: 5, vy: 4 };

        this.STORAGE_KEY = 'kawaii_virtual_cat_save_v1';
        this.init();
    }

    init() {
        this.loadSave();
        this.cat = new CatController('catContainer');
        this.cat.setFurColor(this.stats.furColor);
        this.cat.setAccessory(this.stats.accessory);

        if (this.stats.isSleeping) {
            this.setNightMode(true);
            this.cat.setState('sleeping');
        } else {
            this.updateMood();
        }

        this.bindUI();
        this.updateUI();
        this.startLoops();
        this.showToast(`Chào mừng trở lại! ${this.stats.name} đang vẫy đuôi chờ bạn kìa! 🐾`, 'info');
    }

    // Load LocalStorage Save
    loadSave() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.stats = { ...this.stats, ...data };

                // Calculate offline stat degradation
                const elapsedSeconds = Math.min(Date.now() - (data.lastTick || Date.now()), 12 * 3600 * 1000) / 1000;
                if (elapsedSeconds > 10) {
                    if (this.stats.isSleeping) {
                        this.stats.energy = Math.min(100, this.stats.energy + (elapsedSeconds / 15) * 5);
                        this.stats.hunger = Math.max(10, this.stats.hunger - (elapsedSeconds / 60) * 2);
                    } else {
                        this.stats.hunger = Math.max(10, this.stats.hunger - (elapsedSeconds / 60) * 3);
                        this.stats.happiness = Math.max(10, this.stats.happiness - (elapsedSeconds / 60) * 2);
                        this.stats.energy = Math.max(10, this.stats.energy - (elapsedSeconds / 60) * 2);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        this.stats.lastTick = Date.now();
    }

    // Save Game State
    save() {
        try {
            this.stats.lastTick = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    // Game Loops
    startLoops() {
        // Main stat decay & recovery tick (Every 2.5 seconds)
        setInterval(() => {
            if (this.stats.isSleeping) {
                // Recover energy while sleeping
                this.stats.energy = Math.min(100, this.stats.energy + 2.5);
                this.stats.hunger = Math.max(0, this.stats.hunger - 0.25);
                this.cat.spawnZzz();

                if (this.stats.energy >= 100 && Math.random() < 0.2) {
                    this.showToast(`${this.stats.name} đã tràn đầy năng lượng rồi! Hãy đánh thức mèo dậy nhé! ✨`, 'success');
                }
            } else {
                // Real-time stat decay
                this.stats.hunger = Math.max(0, this.stats.hunger - 0.7);
                this.stats.happiness = Math.max(0, this.stats.happiness - 0.5);
                this.stats.energy = Math.max(0, this.stats.energy - 0.4);

                // Check critical states
                if (this.stats.hunger <= 20 && Math.random() < 0.15) {
                    window.catAudio.playMeow('hungry');
                }

                this.updateMood();
            }

            this.updateUI();
            this.save();
        }, 2500);

        // Random ambient meow/purr loop
        setInterval(() => {
            if (!this.stats.isSleeping && !this.miniGameActive) {
                const rand = Math.random();
                if (rand < 0.25) {
                    if (this.stats.hunger < 30) {
                        window.catAudio.playMeow('hungry');
                    } else if (this.stats.happiness > 70) {
                        window.catAudio.playMeow('chirp');
                    } else {
                        window.catAudio.playMeow('happy');
                    }
                }
            }
        }, 14000);
    }

    // Update Cat mood based on stats
    updateMood() {
        if (this.stats.isSleeping) return;

        if (this.stats.hunger < 25) {
            this.cat.setState('hungry');
        } else if (this.stats.energy < 25) {
            this.cat.setState('sleepy');
        } else if (this.stats.happiness > 60) {
            this.cat.setState('happy');
        } else {
            this.cat.setState('happy');
        }
    }

    // Add EXP and Level Up
    addExp(amount) {
        this.stats.exp += amount;
        const requiredExp = this.stats.level * 60;
        if (this.stats.exp >= requiredExp) {
            this.stats.exp -= requiredExp;
            this.stats.level += 1;
            this.stats.coins += 25;
            window.catAudio.playFanfare();
            this.showToast(`🎉 CHÚC MỪNG! ${this.stats.name} đã lên Cấp ${this.stats.level}! Bạn nhận được +25 Vàng!`, 'level');
            this.spawnConfetti();
        }
    }

    // Feed Cat
    feed(foodType) {
        if (this.stats.isSleeping) {
            this.showToast(`${this.stats.name} đang ngủ ngon, hãy đánh thức mèo dậy trước khi cho ăn nhé! 💤`, 'warning');
            return;
        }

        if (this.stats.hunger >= 98) {
            this.showToast(`${this.stats.name} đã no căng bụng rồi, không thể ăn thêm nữa đâu! 🐱`, 'info');
            return;
        }

        const foods = {
            salmon: { name: 'Cá hồi tươi 🐟', hunger: 28, happy: 8, cost: 0 },
            milk: { name: 'Sữa tươi béo 🥛', hunger: 18, happy: 12, cost: 0 },
            treat: { name: 'Bánh donut cá 🍩', hunger: 20, happy: 25, cost: 10 },
            chicken: { name: 'Đùi gà thơm lừng 🍗', hunger: 42, happy: 20, cost: 20 }
        };

        const item = foods[foodType] || foods.salmon;

        if (item.cost > 0) {
            if (this.stats.coins < item.cost) {
                this.showToast(`Bạn không đủ Vàng để mua ${item.name}! Chơi đùa để kiếm thêm vàng nhé!`, 'warning');
                return;
            }
            this.stats.coins -= item.cost;
        }

        // Apply stats
        this.stats.hunger = Math.min(100, this.stats.hunger + item.hunger);
        this.stats.happiness = Math.min(100, this.stats.happiness + item.happy);
        this.addExp(15);

        // Sound & Animation
        window.catAudio.playEat();
        this.cat.setState('eating');
        this.showFoodAnimation(foodType);

        setTimeout(() => {
            window.catAudio.playMeow('happy');
            this.updateMood();
            this.showToast(`Đã cho ${this.stats.name} ăn ${item.name}! Độ no +${item.hunger}% ✨`, 'success');
        }, 2200);

        this.updateUI();
        this.save();
    }

    // Pet Cat
    pet(e) {
        if (this.stats.isSleeping) {
            this.showToast(`${this.stats.name} đang ngủ rừ rừ trong mơ... 💤`, 'info');
            window.catAudio.startPurr();
            setTimeout(() => window.catAudio.stopPurr(), 1500);
            return;
        }

        this.stats.happiness = Math.min(100, this.stats.happiness + 6);
        this.addExp(4);

        window.catAudio.playHeart();
        window.catAudio.startPurr();
        setTimeout(() => window.catAudio.stopPurr(), 2000);

        this.cat.setState('petted');

        let clientX = e ? e.clientX : undefined;
        let clientY = e ? e.clientY : undefined;
        if (e && e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const catSvg = document.getElementById('catSvg');
        if (catSvg) {
            const rect = catSvg.getBoundingClientRect();
            const x = clientX ? clientX - rect.left : 160;
            const y = clientY ? clientY - rect.top : 140;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this.cat.spawnHeart(x + (Math.random()*40-20), y + (Math.random()*30-15)), i * 150);
            }
        }

        setTimeout(() => {
            this.updateMood();
        }, 1800);

        this.updateUI();
        this.save();
    }

    // Sleep / Wake up Toggle
    toggleSleep() {
        this.stats.isSleeping = !this.stats.isSleeping;

        if (this.stats.isSleeping) {
            this.setNightMode(true);
            this.cat.setState('sleeping');
            window.catAudio.playMeow('sleepy');
            this.showToast(`Đã tắt đèn phòng! Chúc ${this.stats.name} ngủ ngon và hồi phục năng lượng nhé! 🌙`, 'info');
        } else {
            this.setNightMode(false);
            window.catAudio.playMeow('happy');
            this.updateMood();
            this.showToast(`Chào buổi sáng! ${this.stats.name} đã thức dậy đầy năng động! ☀️`, 'success');
        }

        this.updateUI();
        this.save();
    }

    setNightMode(isNight) {
        if (isNight) {
            document.body.classList.add('night-mode');
            const btnSleep = document.getElementById('btnSleep');
            if (btnSleep) {
                btnSleep.innerHTML = `
                    <div class="w-12 h-12 rounded-2xl bg-amber-400 text-amber-900 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                        ☀️
                    </div>
                    <span class="text-xs font-bold text-amber-300">Thức dậy</span>
                `;
            }
        } else {
            document.body.classList.remove('night-mode');
            const btnSleep = document.getElementById('btnSleep');
            if (btnSleep) {
                btnSleep.innerHTML = `
                    <div class="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                        🌙
                    </div>
                    <span class="text-xs font-bold text-slate-600">Đi ngủ</span>
                `;
            }
        }
    }

    // Mini-game: Bắt Cuộn Len (Yarn Ball Chase)
    startYarnMiniGame() {
        if (this.stats.isSleeping) {
            this.showToast(`${this.stats.name} đang ngủ say, hãy đánh thức mèo dậy để cùng chơi đùa nhé! 💤`, 'warning');
            return;
        }

        if (this.stats.energy < 15) {
            this.showToast(`${this.stats.name} đang mệt lả và cạn năng lượng rồi, hãy cho mèo đi ngủ trước nhé! 😴`, 'warning');
            return;
        }

        this.miniGameActive = true;
        this.miniGameScore = 0;
        let timeLeft = 12;

        const overlay = document.getElementById('miniGameOverlay');
        const scoreElem = document.getElementById('miniGameScore');
        const timerElem = document.getElementById('miniGameTimer');
        const yarnBall = document.getElementById('yarnBall');

        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        scoreElem.innerText = `Điểm: 0`;
        timerElem.innerText = `Thời gian: ${timeLeft}s`;

        this.cat.setState('playing');
        window.catAudio.playMeow('chirp');

        // Bouncing Yarn Ball Animation Loop
        const stage = document.getElementById('gameStage');
        const bounds = stage.getBoundingClientRect();
        this.yarnPos = {
            x: bounds.width / 2,
            y: bounds.height / 2,
            vx: (Math.random() > 0.5 ? 6 : -6),
            vy: (Math.random() > 0.5 ? 5 : -5)
        };

        const moveLoop = () => {
            if (!this.miniGameActive) return;

            const rect = stage.getBoundingClientRect();
            this.yarnPos.x += this.yarnPos.vx;
            this.yarnPos.y += this.yarnPos.vy;

            // Bounce on boundaries
            if (this.yarnPos.x <= 30 || this.yarnPos.x >= rect.width - 30) {
                this.yarnPos.vx *= -1;
            }
            if (this.yarnPos.y <= 60 || this.yarnPos.y >= rect.height - 40) {
                this.yarnPos.vy *= -1;
            }

            yarnBall.style.left = `${this.yarnPos.x}px`;
            yarnBall.style.top = `${this.yarnPos.y}px`;

            // Cat follows yarn ball with head tilt
            const catSvg = document.getElementById('catSvg');
            if (catSvg) {
                const catRect = catSvg.getBoundingClientRect();
                const diffX = (this.yarnPos.x + rect.left) - (catRect.left + catRect.width / 2);
                const head = document.getElementById('headGroup');
                if (head) head.style.transform = `rotate(${Math.max(-15, Math.min(15, diffX * 0.08))}deg)`;
            }

            requestAnimationFrame(moveLoop);
        };
        requestAnimationFrame(moveLoop);

        // Timer Countdown
        this.miniGameTimer = setInterval(() => {
            timeLeft--;
            timerElem.innerText = `Thời gian: ${timeLeft}s`;
            if (timeLeft <= 0) {
                this.endYarnMiniGame();
            }
        }, 1000);
    }

    // Clicked yarn ball
    hitYarnBall() {
        if (!this.miniGameActive) return;
        this.miniGameScore += 1;
        window.catAudio.playPop();

        const scoreElem = document.getElementById('miniGameScore');
        scoreElem.innerText = `Điểm: ${this.miniGameScore}`;
        scoreElem.classList.add('scale-125', 'text-yellow-400');
        setTimeout(() => scoreElem.classList.remove('scale-125', 'text-yellow-400'), 150);

        // Speed up ball slightly
        this.yarnPos.vx = (this.yarnPos.vx > 0 ? 1 : -1) * (6 + Math.min(6, this.miniGameScore * 0.8));
        this.yarnPos.vy = (this.yarnPos.vy > 0 ? 1 : -1) * (5 + Math.min(5, this.miniGameScore * 0.8));

        this.cat.spawnHeart(this.yarnPos.x, this.yarnPos.y);
    }

    endYarnMiniGame() {
        this.miniGameActive = false;
        clearInterval(this.miniGameTimer);

        const overlay = document.getElementById('miniGameOverlay');
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');

        const earnedCoins = this.miniGameScore * 3 + 5;
        const happinessBoost = Math.min(40, this.miniGameScore * 6 + 10);

        this.stats.happiness = Math.min(100, this.stats.happiness + happinessBoost);
        this.stats.energy = Math.max(5, this.stats.energy - 18);
        this.stats.coins += earnedCoins;
        this.addExp(20 + this.miniGameScore * 3);

        window.catAudio.playFanfare();
        this.showToast(`🎉 Trò chơi kết thúc! Bạn ghi được ${this.miniGameScore} điểm và nhận thưởng +${earnedCoins} Vàng!`, 'success');
        this.spawnConfetti();

        this.updateMood();
        this.updateUI();
        this.save();
    }

    // UI Updating
    updateUI() {
        // Name & Level
        const nameDisplay = document.getElementById('catNameDisplay');
        if (nameDisplay) nameDisplay.innerText = this.stats.name;

        const levelBadge = document.getElementById('levelBadge');
        if (levelBadge) levelBadge.innerText = `Cấp ${this.stats.level}`;

        const coinsDisplay = document.getElementById('coinsDisplay');
        if (coinsDisplay) coinsDisplay.innerText = `${this.stats.coins}`;

        const expBar = document.getElementById('expBar');
        if (expBar) {
            const req = this.stats.level * 60;
            const pct = Math.min(100, (this.stats.exp / req) * 100);
            expBar.style.width = `${pct}%`;
        }

        // Stats Progress Bars
        this.setBar('hungerBar', 'hungerValue', this.stats.hunger, '#F97316');
        this.setBar('happinessBar', 'happinessValue', this.stats.happiness, '#EC4899');
        this.setBar('energyBar', 'energyValue', this.stats.energy, '#EAB308');
    }

    setBar(barId, valId, value, defaultColor) {
        const bar = document.getElementById(barId);
        const val = document.getElementById(valId);
        const rounded = Math.round(Math.max(0, Math.min(100, value)));

        if (bar) {
            bar.style.width = `${rounded}%`;
            // Color dynamics when low
            if (rounded <= 20) {
                bar.style.backgroundColor = '#EF4444'; // Red alert
            } else if (rounded <= 45) {
                bar.style.backgroundColor = '#F59E0B'; // Amber warning
            } else {
                bar.style.backgroundColor = defaultColor;
            }
        }
        if (val) {
            val.innerText = `${rounded}%`;
        }
    }

    // Food Dropping Visual
    showFoodAnimation(foodType) {
        const stage = document.getElementById('gameStage');
        if (!stage) return;

        const foodIcons = {
            salmon: '🐟',
            milk: '🥛',
            treat: '🍩',
            chicken: '🍗'
        };

        const foodEl = document.createElement('div');
        foodEl.className = 'absolute text-5xl sm:text-6xl animate-food-drop z-20 pointer-events-none drop-shadow-lg';
        foodEl.style.left = 'calc(50% - 28px)';
        foodEl.style.bottom = '70px';
        foodEl.innerText = foodIcons[foodType] || '🐟';

        stage.appendChild(foodEl);

        setTimeout(() => {
            foodEl.style.transition = 'all 0.6s ease';
            foodEl.style.transform = 'scale(0) translateY(15px)';
            foodEl.style.opacity = '0';
            setTimeout(() => foodEl.remove(), 600);
        }, 1600);
    }

    // Confetti Effect
    spawnConfetti() {
        const container = document.getElementById('gameStage');
        if (!container) return;

        const colors = ['#F43F5E', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#FBBF24'];
        for (let i = 0; i < 35; i++) {
            const c = document.createElement('div');
            c.className = 'absolute w-2.5 h-2.5 rounded-sm pointer-events-none z-50';
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            c.style.left = `${50 + (Math.random() * 60 - 30)}%`;
            c.style.top = `40%`;
            c.style.transform = `rotate(${Math.random() * 360}deg)`;
            c.style.transition = `all ${1 + Math.random() * 1.5}s cubic-bezier(0.25, 1, 0.5, 1)`;

            container.appendChild(c);

            requestAnimationFrame(() => {
                const dx = (Math.random() - 0.5) * 320;
                const dy = (Math.random() - 0.5) * 260 - 50;
                c.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 720}deg) scale(0)`;
                c.style.opacity = '0';
            });

            setTimeout(() => c.remove(), 2600);
        }
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toast = document.getElementById('gameToast');
        if (!toast) return;

        const iconMap = {
            success: '✨',
            warning: '⚠️',
            level: '🏆',
            info: '🐾'
        };

        toast.innerHTML = `
            <span class="text-xl">${iconMap[type] || '🐾'}</span>
            <span class="text-sm font-semibold">${message}</span>
        `;
        toast.classList.remove('translate-y-24', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-24', 'opacity-0');
        }, 3400);
    }

    // Rename Cat
    renameCat() {
        const newName = prompt(`Hãy đặt một cái tên thật dễ thương cho chú mèo của bạn:`, this.stats.name);
        if (newName && newName.trim().length > 0) {
            this.stats.name = newName.trim().slice(0, 16);
            window.catAudio.playClick();
            this.updateUI();
            this.save();
            this.showToast(`Tuyệt vời! Chú mèo của bạn nay có tên là ${this.stats.name}! ❤️`, 'success');
        }
    }

    // Wardrobe & Customization Modal
    openWardrobe() {
        const modal = document.getElementById('wardrobeModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            window.catAudio.playClick();
        }
    }

    closeWardrobe() {
        const modal = document.getElementById('wardrobeModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            window.catAudio.playClick();
        }
    }

    selectFur(color) {
        this.stats.furColor = color;
        this.cat.setFurColor(color);
        window.catAudio.playClick();
        this.save();
        this.highlightSelectedCustoms();
    }

    selectAccessory(acc) {
        this.stats.accessory = acc;
        this.cat.setAccessory(acc);
        window.catAudio.playClick();
        this.save();
        this.highlightSelectedCustoms();
    }

    highlightSelectedCustoms() {
        document.querySelectorAll('.fur-btn').forEach(btn => {
            if (btn.dataset.color === this.stats.furColor) {
                btn.classList.add('ring-4', 'ring-pink-400', 'scale-105');
            } else {
                btn.classList.remove('ring-4', 'ring-pink-400', 'scale-105');
            }
        });

        document.querySelectorAll('.acc-btn').forEach(btn => {
            if (btn.dataset.acc === this.stats.accessory) {
                btn.classList.add('ring-4', 'ring-pink-400', 'scale-105');
            } else {
                btn.classList.remove('ring-4', 'ring-pink-400', 'scale-105');
            }
        });
    }

    // Reset Progress
    resetGame() {
        if (confirm(`Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình chơi và nuôi một chú mèo mới không?`)) {
            localStorage.removeItem(this.STORAGE_KEY);
            window.location.reload();
        }
    }

    // Bind UI Event Listeners
    bindUI() {
        // Pet interaction on cat click
        const catContainer = document.getElementById('catContainer');
        if (catContainer) {
            catContainer.addEventListener('click', (e) => this.pet(e));
        }

        // Action Buttons
        document.getElementById('btnFeed')?.addEventListener('click', () => {
            const tray = document.getElementById('foodTray');
            tray.classList.toggle('hidden');
            window.catAudio.playClick();
        });

        document.querySelectorAll('.food-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const food = btn.dataset.food;
                this.feed(food);
                document.getElementById('foodTray').classList.add('hidden');
            });
        });

        document.getElementById('btnPlay')?.addEventListener('click', () => {
            window.catAudio.playClick();
            this.startYarnMiniGame();
        });

        document.getElementById('btnPet')?.addEventListener('click', (e) => {
            this.pet(e);
        });

        document.getElementById('btnSleep')?.addEventListener('click', () => {
            window.catAudio.playClick();
            this.toggleSleep();
        });

        // Mini game yarn click
        document.getElementById('yarnBall')?.addEventListener('click', () => {
            this.hitYarnBall();
        });

        // Audio Mute Toggle
        const audioBtn = document.getElementById('btnAudioToggle');
        audioBtn?.addEventListener('click', () => {
            const isMuted = window.catAudio.toggleMute();
            audioBtn.innerHTML = isMuted ? '🔇' : '🔊';
            this.showToast(isMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh tiếng mèo', 'info');
        });

        // Cat Rename
        document.getElementById('btnEditName')?.addEventListener('click', () => this.renameCat());

        // Wardrobe
        document.getElementById('btnWardrobe')?.addEventListener('click', () => {
            this.openWardrobe();
            this.highlightSelectedCustoms();
        });
        document.getElementById('btnCloseWardrobe')?.addEventListener('click', () => this.closeWardrobe());

        document.querySelectorAll('.fur-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectFur(btn.dataset.color));
        });

        document.querySelectorAll('.acc-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectAccessory(btn.dataset.acc));
        });

        // Reset
        document.getElementById('btnReset')?.addEventListener('click', () => this.resetGame());
    }
}

// Launch Game on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CatGame();
});
