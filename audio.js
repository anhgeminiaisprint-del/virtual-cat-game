// Web Audio API Sound Synthesizer for Virtual Cat Pet Game
class CatAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.isPurring = false;
        this.purrSource = null;
        this.purrGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted && this.isPurring) {
            this.stopPurr();
        }
        return this.muted;
    }

    // Realistic Kawaii Cat Meow using FM synthesis & pitch envelopes
    playMeow(type = 'happy') {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(3.5, now);

        let duration = 0.45;
        let startFreq = 420;
        let peakFreq = 780;
        let endFreq = 450;

        if (type === 'hungry') {
            // Lower, slightly needy meow
            duration = 0.6;
            startFreq = 380;
            peakFreq = 650;
            endFreq = 330;
        } else if (type === 'chirp') {
            // Short playful chirp
            duration = 0.22;
            startFreq = 600;
            peakFreq = 950;
            endFreq = 750;
        } else if (type === 'sleepy') {
            // Soft sleepy groan meow
            duration = 0.5;
            startFreq = 330;
            peakFreq = 480;
            endFreq = 280;
        }

        // Pitch envelope (Meow arc: start -> peak -> fall)
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.35);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        // Filter formant resonance
        filter.frequency.setValueAtTime(startFreq * 1.5, now);
        filter.frequency.exponentialRampToValueAtTime(peakFreq * 1.6, now + duration * 0.35);
        filter.frequency.exponentialRampToValueAtTime(endFreq * 1.2, now + duration);

        // Amplitude envelope
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.28, now + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Purring loop
    startPurr() {
        if (this.muted || this.isPurring) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            this.purrSource = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            this.purrGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            this.purrSource.type = 'sawtooth';
            this.purrSource.frequency.setValueAtTime(28, now); // Low vibration

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(110, now);

            // 22Hz LFO to create rumbling purr texture
            lfo.frequency.setValueAtTime(22, now);
            lfoGain.gain.setValueAtTime(12, now);
            lfo.connect(this.purrSource.frequency);

            this.purrGain.gain.setValueAtTime(0.001, now);
            this.purrGain.gain.linearRampToValueAtTime(0.18, now + 0.3);

            this.purrSource.connect(filter);
            filter.connect(this.purrGain);
            this.purrGain.connect(this.ctx.destination);

            this.purrSource.start(now);
            lfo.start(now);
            this.isPurring = true;
        } catch (e) {
            console.error(e);
        }
    }

    stopPurr() {
        if (!this.isPurring || !this.purrGain || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            this.purrGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
            setTimeout(() => {
                if (this.purrSource) {
                    try { this.purrSource.stop(); } catch(e){}
                    this.purrSource = null;
                }
                this.isPurring = false;
            }, 300);
        } catch (e) {
            this.isPurring = false;
        }
    }

    // Eating crunchy nom sound
    playEat() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [0, 0.09, 0.18].forEach((delay, i) => {
            const t = now + delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320 + i * 40, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.06);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.07);
        });
    }

    // Heart sparkle / pet chime
    playHeart() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [659.25, 880, 1046.5]; // E5, A5, C6 arpeggio
        notes.forEach((freq, idx) => {
            const t = now + idx * 0.05;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.26);
        });
    }

    // Play bounce / toy catch pop
    playPop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    // Gentle click sound for UI buttons
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Level up fanfare
    playFanfare() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        chord.forEach((freq, i) => {
            const t = now + i * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.45);
        });
    }
}

window.catAudio = new CatAudio();
