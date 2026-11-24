class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, gainVal = 0.15) {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch {
            // Foydalanuvchi hali ekranga bosmagan bo'lsa xato bermaydi
        }
    }

    click() { this.playTone(600, 'sine', 0.08, 0.1); }
    heartbeat() { this.playTone(90, 'triangle', 0.25, 0.25); }
    cardFlip() { this.playTone(320, 'sawtooth', 0.3, 0.12); }
    revealEvil() { this.playTone(110, 'sawtooth', 0.8, 0.25); }
    revealGood() { this.playTone(523.25, 'sine', 0.6, 0.15); }
}

export const sound = new SoundEngine();