// Cat Character Controller & SVG Renderer
class CatController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.state = 'happy'; // 'happy', 'hungry', 'sleepy', 'sleeping', 'eating', 'petted', 'playing'
        this.furColor = 'orange'; // 'orange', 'white', 'black', 'calico', 'pink'
        this.accessory = 'bow'; // 'none', 'bow', 'party', 'crown', 'chef', 'glasses'
        this.isBlinking = false;
        this.blinkInterval = null;
        this.thoughtTimer = null;

        this.palettes = {
            orange: {
                main: '#FFB067',
                shadow: '#F09238',
                stripe: '#DE751C',
                belly: '#FFF1E0',
                earInner: '#FF94B8',
                nose: '#FF6B8B',
                eyes: '#2D3142',
                eyeSparkle: '#FFFFFF',
                blush: 'rgba(255, 107, 139, 0.4)'
            },
            white: {
                main: '#FFFFFF',
                shadow: '#E2E8F0',
                stripe: '#CBD5E1',
                belly: '#F8FAFC',
                earInner: '#FFB6C1',
                nose: '#FF8DA1',
                eyes: '#3B82F6', // Blue eyes
                eyeSparkle: '#FFFFFF',
                blush: 'rgba(255, 141, 161, 0.35)'
            },
            black: {
                main: '#334155',
                shadow: '#1E293B',
                stripe: '#0F172A',
                belly: '#FFFFFF', // Tuxedo white chest
                earInner: '#FDA4AF',
                nose: '#F43F5E',
                eyes: '#FACC15', // Golden eyes
                eyeSparkle: '#FFFFFF',
                blush: 'rgba(244, 63, 94, 0.45)'
            },
            calico: {
                main: '#FFFBF5',
                shadow: '#E5DFD5',
                stripe: '#EA580C',
                belly: '#FFFFFF',
                earInner: '#FB7185',
                nose: '#F43F5E',
                eyes: '#10B981', // Emerald eyes
                eyeSparkle: '#FFFFFF',
                blush: 'rgba(251, 113, 133, 0.4)'
            },
            pink: {
                main: '#FFC6D9',
                shadow: '#FF99B8',
                stripe: '#FF7096',
                belly: '#FFF0F5',
                earInner: '#FF5C8A',
                nose: '#D90429',
                eyes: '#6D28D9',
                eyeSparkle: '#FFFFFF',
                blush: 'rgba(255, 92, 138, 0.5)'
            }
        };

        this.init();
    }

    init() {
        this.render();
        this.startBlinkingLoop();
    }

    setFurColor(color) {
        if (this.palettes[color]) {
            this.furColor = color;
            this.render();
        }
    }

    setAccessory(accessory) {
        this.accessory = accessory;
        this.render();
    }

    setState(newState) {
        this.state = newState;
        this.render();
        this.updateThoughtBubble();
    }

    startBlinkingLoop() {
        if (this.blinkInterval) clearInterval(this.blinkInterval);
        this.blinkInterval = setInterval(() => {
            if (this.state !== 'sleeping' && !this.isBlinking) {
                this.isBlinking = true;
                this.updateEyes();
                setTimeout(() => {
                    this.isBlinking = false;
                    this.updateEyes();
                }, 180);
            }
        }, 3600);
    }

    render() {
        if (!this.container) return;
        const p = this.palettes[this.furColor] || this.palettes.orange;
        const isSleeping = this.state === 'sleeping';

        this.container.innerHTML = `
            <div class="cat-wrapper relative flex flex-col items-center justify-center select-none cursor-pointer ${this.getAnimationClass()}">
                <!-- Thought / Speech Bubble -->
                <div id="catThought" class="thought-bubble absolute -top-16 opacity-0 transition-all duration-300 pointer-events-none z-30">
                    <span id="thoughtText" class="bg-white/95 backdrop-blur text-pink-600 font-bold px-4 py-2 rounded-2xl shadow-lg border-2 border-pink-200 text-sm flex items-center gap-1.5 whitespace-nowrap">
                        Meo meo! 🐾
                    </span>
                    <div class="thought-tail w-3 h-3 bg-white border-r-2 border-b-2 border-pink-200 rotate-45 mx-auto -mt-1.5"></div>
                </div>

                <!-- SVG Cat -->
                <svg id="catSvg" viewBox="0 0 320 320" class="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-xl transition-transform duration-300">
                    <defs>
                        <!-- Gradients -->
                        <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
                            <stop offset="0%" stop-color="${p.main}" />
                            <stop offset="100%" stop-color="${p.shadow}" />
                        </radialGradient>
                        <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
                            <stop offset="0%" stop-color="${p.belly}" />
                            <stop offset="100%" stop-color="${p.shadow}" stop-opacity="0.2"/>
                        </radialGradient>
                        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.15" />
                        </filter>
                    </defs>

                    <!-- Shadow on ground -->
                    <ellipse cx="160" cy="290" rx="${isSleeping ? '100' : '85'}" ry="18" fill="rgba(0,0,0,0.12)" class="transition-all duration-500" />

                    <!-- Cat Group -->
                    <g id="catBodyGroup">
                        <!-- Tail -->
                        <g class="cat-tail origin-[105px_240px]">
                            <path d="M110,240 Q60,250 50,210 Q40,165 75,155 Q88,150 82,168 Q65,190 85,220 Q95,235 125,245 Z" 
                                  fill="${p.main}" stroke="${p.shadow}" stroke-width="2" />
                            ${this.furColor === 'calico' ? `<path d="M52,185 Q40,165 75,155 Q88,150 82,168 Z" fill="#0F172A" />` : ''}
                        </g>

                        <!-- Sleeping Curled Body vs Upright Body -->
                        ${isSleeping ? this.renderSleepingBody(p) : this.renderUprightBody(p)}

                        <!-- Head & Face -->
                        <g id="headGroup" class="transition-transform duration-300 origin-[160px_160px]">
                            ${this.renderHead(p)}
                        </g>

                        <!-- Accessory -->
                        <g id="accessoryGroup">
                            ${this.renderAccessory(p)}
                        </g>
                    </g>
                </svg>

                <!-- Heart and Particle Spawner Layer -->
                <div id="particleLayer" class="absolute inset-0 pointer-events-none overflow-visible"></div>
            </div>
        `;

        this.bindEvents();
    }

    renderUprightBody(p) {
        return `
            <!-- Back Body -->
            <path d="M100,245 C90,190 120,150 160,150 C200,150 230,190 220,245 C215,275 105,275 100,245 Z" 
                  fill="url(#bodyGrad)" stroke="${p.shadow}" stroke-width="2" filter="url(#shadowFilter)" />

            <!-- Calico spots if applicable -->
            ${this.furColor === 'calico' ? `
                <path d="M105,200 Q130,220 120,250 Q95,245 105,200 Z" fill="#EA580C" opacity="0.9" />
                <path d="M210,180 Q225,210 205,240 Q190,220 210,180 Z" fill="#334155" opacity="0.9" />
            ` : ''}

            <!-- Fluffy Belly -->
            <path d="M125,190 C130,170 190,170 195,190 C200,225 190,255 160,255 C130,255 120,225 125,190 Z" 
                  fill="url(#bellyGrad)" />

            <!-- Front Paws -->
            <g class="paws">
                <ellipse cx="135" cy="265" rx="16" ry="12" fill="${p.belly}" stroke="${p.shadow}" stroke-width="1.5" />
                <line x1="130" y1="262" x2="130" y2="274" stroke="${p.shadow}" stroke-width="1.5" stroke-linecap="round" />
                <line x1="138" y1="262" x2="138" y2="274" stroke="${p.shadow}" stroke-width="1.5" stroke-linecap="round" />

                <ellipse cx="185" cy="265" rx="16" ry="12" fill="${p.belly}" stroke="${p.shadow}" stroke-width="1.5" />
                <line x1="180" y1="262" x2="180" y2="274" stroke="${p.shadow}" stroke-width="1.5" stroke-linecap="round" />
                <line x1="188" y1="262" x2="188" y2="274" stroke="${p.shadow}" stroke-width="1.5" stroke-linecap="round" />
            </g>
        `;
    }

    renderSleepingBody(p) {
        return `
            <!-- Curled up sleeping body -->
            <ellipse cx="160" cy="235" rx="85" ry="55" fill="url(#bodyGrad)" stroke="${p.shadow}" stroke-width="2" />
            <ellipse cx="160" cy="245" rx="50" ry="32" fill="${p.belly}" opacity="0.9" />

            <!-- Tucked Paws -->
            <ellipse cx="125" cy="260" rx="14" ry="10" fill="${p.belly}" stroke="${p.shadow}" stroke-width="1.5" />
            <ellipse cx="195" cy="260" rx="14" ry="10" fill="${p.belly}" stroke="${p.shadow}" stroke-width="1.5" />
        `;
    }

    renderHead(p) {
        const isSleeping = this.state === 'sleeping';
        const headY = isSleeping ? 200 : 135;

        return `
            <!-- Ears -->
            <g class="cat-ears">
                <!-- Left Ear -->
                <g class="cat-ear-left origin-[110px_${headY - 20}px]">
                    <path d="M105,${headY - 20} Q100,${headY - 75} 125,${headY - 70} Q150,${headY - 35} 140,${headY - 15} Z" 
                          fill="url(#bodyGrad)" stroke="${p.shadow}" stroke-width="2" />
                    <!-- Inner Left Ear -->
                    <path d="M112,${headY - 25} Q110,${headY - 60} 126,${headY - 58} Q138,${headY - 35} 134,${headY - 20} Z" 
                          fill="${p.earInner}" opacity="0.85" />
                </g>
                <!-- Right Ear -->
                <g class="cat-ear-right origin-[210px_${headY - 20}px]">
                    <path d="M215,${headY - 20} Q220,${headY - 75} 195,${headY - 70} Q170,${headY - 35} 180,${headY - 15} Z" 
                          fill="url(#bodyGrad)" stroke="${p.shadow}" stroke-width="2" />
                    <!-- Inner Right Ear -->
                    <path d="M208,${headY - 25} Q210,${headY - 60} 194,${headY - 58} Q182,${headY - 35} 186,${headY - 20} Z" 
                          fill="${p.earInner}" opacity="0.85" />
                </g>
            </g>

            <!-- Head Base -->
            <ellipse cx="160" cy="${headY}" rx="65" ry="52" fill="url(#bodyGrad)" stroke="${p.shadow}" stroke-width="2" />

            <!-- Calico Head Patch -->
            ${this.furColor === 'calico' ? `
                <path d="M100,${headY - 20} Q130,${headY - 10} 125,${headY + 25} Q98,${headY + 10} 100,${headY - 20} Z" fill="#EA580C" opacity="0.9" />
                <path d="M210,${headY - 30} Q225,${headY + 15} 190,${headY + 20} Q195,${headY - 20} 210,${headY - 30} Z" fill="#334155" opacity="0.9" />
            ` : ''}

            <!-- Cheeks Fluff -->
            <path d="M92,${headY + 10} Q80,${headY + 15} 90,${headY + 25} Q80,${headY + 30} 98,${headY + 35}" fill="none" stroke="${p.shadow}" stroke-width="2" stroke-linecap="round"/>
            <path d="M228,${headY + 10} Q240,${headY + 15} 230,${headY + 25} Q240,${headY + 30} 222,${headY + 35}" fill="none" stroke="${p.shadow}" stroke-width="2" stroke-linecap="round"/>

            <!-- Blush -->
            <ellipse cx="122" cy="${headY + 18}" rx="11" ry="6" fill="${p.blush}" />
            <ellipse cx="198" cy="${headY + 18}" rx="11" ry="6" fill="${p.blush}" />

            <!-- Whiskers -->
            <g stroke="#718096" stroke-width="1.8" stroke-linecap="round" opacity="0.6">
                <line x1="95" y1="${headY + 12}" x2="60" y2="${headY + 6}" />
                <line x1="95" y1="${headY + 20}" x2="58" y2="${headY + 22}" />
                <line x1="225" y1="${headY + 12}" x2="260" y2="${headY + 6}" />
                <line x1="225" y1="${headY + 20}" x2="262" y2="${headY + 22}" />
            </g>

            <!-- Eyes & Eyebrows -->
            <g id="eyesContainer">
                ${this.renderEyes(p, headY)}
            </g>

            <!-- Cute Nose -->
            <polygon points="156,${headY + 10} 164,${headY + 10} 160,${headY + 15}" fill="${p.nose}" rx="2" />

            <!-- Mouth -->
            <g id="mouthContainer">
                ${this.renderMouth(p, headY)}
            </g>
        `;
    }

    renderEyes(p, headY) {
        if (this.isBlinking) {
            // Blink slit
            return `
                <path d="M125,${headY} Q135,${headY + 4} 145,${headY}" fill="none" stroke="${p.eyes}" stroke-width="3" stroke-linecap="round" />
                <path d="M175,${headY} Q185,${headY + 4} 195,${headY}" fill="none" stroke="${p.eyes}" stroke-width="3" stroke-linecap="round" />
            `;
        }

        switch (this.state) {
            case 'sleeping':
                // Peaceful closed curved eyes (u _ u)
                return `
                    <path d="M125,${headY} Q135,${headY + 8} 145,${headY}" fill="none" stroke="${p.eyes}" stroke-width="3.5" stroke-linecap="round" />
                    <path d="M175,${headY} Q185,${headY + 8} 195,${headY}" fill="none" stroke="${p.eyes}" stroke-width="3.5" stroke-linecap="round" />
                `;
            case 'petted':
            case 'eating':
                // Happy squint eyes (^ _ ^)
                return `
                    <path d="M124,${headY + 4} Q135,${headY - 8} 146,${headY + 4}" fill="none" stroke="${p.eyes}" stroke-width="3.5" stroke-linecap="round" />
                    <path d="M174,${headY + 4} Q185,${headY - 8} 196,${headY + 4}" fill="none" stroke="${p.eyes}" stroke-width="3.5" stroke-linecap="round" />
                `;
            case 'hungry':
                // Pleading droopy teary eyes (o _ o)
                return `
                    <!-- Left Eye -->
                    <ellipse cx="135" cy="${headY}" rx="11" ry="14" fill="${p.eyes}" />
                    <circle cx="132" cy="${headY - 4}" r="5" fill="#FFFFFF" />
                    <circle cx="139" cy="${headY + 4}" r="2.5" fill="#FFFFFF" />
                    <!-- Teardrop sparkle -->
                    <circle cx="128" cy="${headY + 8}" r="2" fill="#60A5FA" opacity="0.9" />

                    <!-- Right Eye -->
                    <ellipse cx="185" cy="${headY}" rx="11" ry="14" fill="${p.eyes}" />
                    <circle cx="182" cy="${headY - 4}" r="5" fill="#FFFFFF" />
                    <circle cx="189" cy="${headY + 4}" r="2.5" fill="#FFFFFF" />
                    <circle cx="178" cy="${headY + 8}" r="2" fill="#60A5FA" opacity="0.9" />
                `;
            case 'sleepy':
                // Half closed eyes (- _ -)
                return `
                    <ellipse cx="135" cy="${headY + 2}" rx="11" ry="8" fill="${p.eyes}" />
                    <circle cx="134" cy="${headY}" r="3.5" fill="#FFFFFF" />
                    <path d="M123,${headY - 2} Q135,${headY + 1} 147,${headY - 2}" fill="${p.main}" stroke="${p.shadow}" stroke-width="1.5" />

                    <ellipse cx="185" cy="${headY + 2}" rx="11" ry="8" fill="${p.eyes}" />
                    <circle cx="184" cy="${headY}" r="3.5" fill="#FFFFFF" />
                    <path d="M173,${headY - 2} Q185,${headY + 1} 197,${headY - 2}" fill="${p.main}" stroke="${p.shadow}" stroke-width="1.5" />
                `;
            case 'playing':
                // Big excited anime sparkle eyes
                return `
                    <ellipse cx="135" cy="${headY - 1}" rx="12" ry="15" fill="${p.eyes}" />
                    <circle cx="132" cy="${headY - 6}" r="6" fill="#FFFFFF" />
                    <circle cx="140" cy="${headY + 5}" r="3" fill="#FFFFFF" />
                    <polygon points="135,${headY-1} 137,${headY+1} 135,${headY+3} 133,${headY+1}" fill="#FDE047" />

                    <ellipse cx="185" cy="${headY - 1}" rx="12" ry="15" fill="${p.eyes}" />
                    <circle cx="182" cy="${headY - 6}" r="6" fill="#FFFFFF" />
                    <circle cx="190" cy="${headY + 5}" r="3" fill="#FFFFFF" />
                    <polygon points="185,${headY-1} 187,${headY+1} 185,${headY+3} 183,${headY+1}" fill="#FDE047" />
                `;
            default: // Happy / Normal
                return `
                    <!-- Left Eye -->
                    <ellipse cx="135" cy="${headY}" rx="11" ry="13" fill="${p.eyes}" />
                    <circle cx="132" cy="${headY - 4}" r="4.5" fill="#FFFFFF" />
                    <circle cx="139" cy="${headY + 3}" r="2" fill="#FFFFFF" />

                    <!-- Right Eye -->
                    <ellipse cx="185" cy="${headY}" rx="11" ry="13" fill="${p.eyes}" />
                    <circle cx="182" cy="${headY - 4}" r="4.5" fill="#FFFFFF" />
                    <circle cx="189" cy="${headY + 3}" r="2" fill="#FFFFFF" />
                `;
        }
    }

    renderMouth(p, headY) {
        if (this.state === 'eating') {
            // Open chewing mouth (O)
            return `
                <ellipse cx="160" cy="${headY + 22}" rx="7" ry="6" fill="#DC2626" />
                <path d="M157,${headY + 24} Q160,${headY + 27} 163,${headY + 24}" fill="#FFA5B5" />
            `;
        }

        if (this.state === 'hungry') {
            // Sad wobbly pout
            return `
                <path d="M154,${headY + 22} Q160,${headY + 17} 166,${headY + 22}" fill="none" stroke="${p.eyes}" stroke-width="2" stroke-linecap="round" />
            `;
        }

        if (this.state === 'playing' || this.state === 'petted') {
            // Open joyful smile :D
            return `
                <path d="M152,${headY + 17} Q160,${headY + 28} 168,${headY + 17} Z" fill="#EF4444" stroke="${p.eyes}" stroke-width="1.8" />
                <path d="M155,${headY + 23} Q160,${headY + 26} 165,${headY + 23}" fill="#FDA4AF" />
            `;
        }

        // Cute classic cat w-mouth (=^w^=)
        return `
            <path d="M153,${headY + 16} Q160,${headY + 22} 160,${headY + 16} Q160,${headY + 22} 167,${headY + 16}" 
                  fill="none" stroke="${p.eyes}" stroke-width="2.2" stroke-linecap="round" />
        `;
    }

    renderAccessory(p) {
        const isSleeping = this.state === 'sleeping';
        const headY = isSleeping ? 200 : 135;

        switch (this.accessory) {
            case 'bow':
                // Cute Collar with Red Ribbon & Golden Bell
                return `
                    <g transform="translate(0, ${isSleeping ? 40 : 0})">
                        <!-- Collar Band -->
                        <path d="M125,200 Q160,215 195,200" fill="none" stroke="#EF4444" stroke-width="5" stroke-linecap="round" />
                        <!-- Red Ribbon Wings -->
                        <path d="M160,205 L145,195 L145,215 Z" fill="#DC2626" />
                        <path d="M160,205 L175,195 L175,215 Z" fill="#DC2626" />
                        <!-- Golden Bell -->
                        <circle cx="160" cy="207" r="6" fill="#FACC15" stroke="#CA8A04" stroke-width="1" />
                        <circle cx="160" cy="208" r="1.5" fill="#78350F" />
                    </g>
                `;
            case 'party':
                // Colorful Party Hat
                return `
                    <g transform="translate(160, ${headY - 65})">
                        <!-- Cone -->
                        <polygon points="0,-45 -22,12 22,12" fill="#8B5CF6" stroke="#7C3AED" stroke-width="1.5" />
                        <polygon points="0,-45 -12,12 12,12" fill="#EC4899" />
                        <!-- Dots -->
                        <circle cx="-5" cy="-8" r="3" fill="#FACC15" />
                        <circle cx="7" cy="-20" r="2.5" fill="#38BDF8" />
                        <!-- Fluffy Pom pom -->
                        <circle cx="0" cy="-47" r="7" fill="#FACC15" />
                    </g>
                `;
            case 'crown':
                // Royal Golden Crown
                return `
                    <g transform="translate(160, ${headY - 58})">
                        <path d="M-24,8 L-28,-14 L-10,-4 L0,-20 L10,-4 L28,-14 L24,8 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5" />
                        <!-- Jewels -->
                        <circle cx="0" cy="-18" r="3" fill="#EF4444" />
                        <circle cx="-26" cy="-12" r="2.5" fill="#3B82F6" />
                        <circle cx="26" cy="-12" r="2.5" fill="#10B981" />
                    </g>
                `;
            case 'chef':
                // Cute Chef Hat
                return `
                    <g transform="translate(160, ${headY - 60})">
                        <ellipse cx="0" cy="-15" rx="30" ry="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
                        <circle cx="-16" cy="-20" r="15" fill="#FFFFFF" />
                        <circle cx="16" cy="-20" r="15" fill="#FFFFFF" />
                        <circle cx="0" cy="-28" r="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
                        <!-- Hat rim -->
                        <rect x="-24" y="-3" width="48" height="12" rx="3" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
                    </g>
                `;
            case 'glasses':
                // Cool Retro Sunglasses
                return `
                    <g transform="translate(160, ${headY})">
                        <!-- Left Lens -->
                        <path d="M-38,-6 L-12,-6 Q-12,14 -25,14 Q-38,14 -38,-6 Z" fill="#0F172A" stroke="#475569" stroke-width="1.5" />
                        <!-- Right Lens -->
                        <path d="M12,-6 L38,-6 Q38,14 25,14 Q12,14 12,-6 Z" fill="#0F172A" stroke="#475569" stroke-width="1.5" />
                        <!-- Bridge -->
                        <line x1="-12" y1="-2" x2="12" y2="-2" stroke="#0F172A" stroke-width="3" />
                        <!-- Lens Highlights -->
                        <line x1="-32" y1="-2" x2="-26" y2="8" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7" stroke-linecap="round" />
                        <line x1="18" y1="-2" x2="24" y2="8" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7" stroke-linecap="round" />
                    </g>
                `;
            default:
                return '';
        }
    }

    updateEyes() {
        const eyesContainer = document.getElementById('eyesContainer');
        if (eyesContainer) {
            const p = this.palettes[this.furColor] || this.palettes.orange;
            const isSleeping = this.state === 'sleeping';
            const headY = isSleeping ? 200 : 135;
            eyesContainer.innerHTML = this.renderEyes(p, headY);
        }
    }

    getAnimationClass() {
        switch (this.state) {
            case 'sleeping': return 'animate-cat-sleep';
            case 'eating': return 'animate-cat-eat';
            case 'petted': return 'animate-cat-purr';
            case 'playing': return 'animate-cat-play';
            case 'hungry': return 'animate-cat-hungry';
            default: return 'animate-cat-breathe';
        }
    }

    updateThoughtBubble() {
        const thought = document.getElementById('catThought');
        const text = document.getElementById('thoughtText');
        if (!thought || !text) return;

        let message = 'Meo meo! 🐾';
        let show = true;

        switch (this.state) {
            case 'hungry':
                message = 'Bụng cồn cào rồi, đói quá meo meo! 🐟';
                break;
            case 'sleepy':
                message = 'Buồn ngủ díu cả mắt rồi... Oáp... 💤';
                break;
            case 'sleeping':
                message = 'Khò khò... Đang mơ bắt cá... 🌙';
                break;
            case 'eating':
                message = 'Nhoàm nhoàm... Món này ngon tuyệt cú mèo! 😋';
                break;
            case 'petted':
                message = 'Thích quá... Rừ rừ... Vuốt nữa đi sen! ❤️';
                break;
            case 'playing':
                message = 'Bắt lấy cuộn len nào! Vui quá đi! 🧶';
                break;
            default:
                message = 'Hôm nay trời đẹp quá meo meo! ✨';
                break;
        }

        text.innerText = message;
        thought.classList.remove('opacity-0');
        thought.classList.add('opacity-100');

        if (this.thoughtTimer) clearTimeout(this.thoughtTimer);
        this.thoughtTimer = setTimeout(() => {
            if (this.state !== 'hungry' && this.state !== 'sleeping') {
                thought.classList.remove('opacity-100');
                thought.classList.add('opacity-0');
            }
        }, 4000);
    }

    // Spawn floating heart or sparkle particle on click / pet
    spawnHeart(x, y) {
        const layer = document.getElementById('particleLayer');
        if (!layer) return;

        const emojis = ['❤️', '💖', '✨', '🐾', '🌸', '💕'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        const particle = document.createElement('div');
        particle.className = 'absolute pointer-events-none select-none text-xl sm:text-2xl transition-all duration-1000';
        particle.style.left = `${x || 160 + (Math.random() * 80 - 40)}px`;
        particle.style.top = `${y || 120 + (Math.random() * 40 - 20)}px`;
        particle.style.transform = `translate(-50%, -50%) scale(${0.8 + Math.random() * 0.5})`;
        particle.innerText = emoji;

        layer.appendChild(particle);

        requestAnimationFrame(() => {
            const destY = parseFloat(particle.style.top) - (80 + Math.random() * 60);
            const destX = parseFloat(particle.style.left) + (Math.random() * 60 - 30);
            particle.style.top = `${destY}px`;
            particle.style.left = `${destX}px`;
            particle.style.opacity = '0';
            particle.style.transform += ` rotate(${Math.random() * 40 - 20}deg) scale(1.4)`;
        });

        setTimeout(() => particle.remove(), 1050);
    }

    // Spawn floating Zzz when sleeping
    spawnZzz() {
        if (this.state !== 'sleeping') return;
        const layer = document.getElementById('particleLayer');
        if (!layer) return;

        const zzz = document.createElement('div');
        zzz.className = 'absolute pointer-events-none select-none font-bold text-indigo-400 dark:text-purple-300 transition-all duration-2000 text-lg sm:text-xl';
        zzz.style.left = `${190 + (Math.random() * 20 - 10)}px`;
        zzz.style.top = `160px`;
        zzz.innerText = 'Zzz';

        layer.appendChild(zzz);

        requestAnimationFrame(() => {
            zzz.style.top = `60px`;
            zzz.style.left = `${220 + Math.random() * 30}px`;
            zzz.style.opacity = '0';
            zzz.style.transform = 'scale(1.6) rotate(15deg)';
        });

        setTimeout(() => zzz.remove(), 2100);
    }

    bindEvents() {
        const svg = document.getElementById('catSvg');
        if (!svg) return;

        // Hover tracking
        svg.addEventListener('mousemove', (e) => {
            if (this.state === 'sleeping') return;
            const rect = svg.getBoundingClientRect();
            const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
            const head = document.getElementById('headGroup');
            if (head) {
                head.style.transform = `rotate(${relX * 6}deg)`;
            }
        });

        svg.addEventListener('mouseleave', () => {
            const head = document.getElementById('headGroup');
            if (head) head.style.transform = `rotate(0deg)`;
        });
    }
}

window.CatController = CatController;
