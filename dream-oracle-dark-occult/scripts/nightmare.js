// Nightmare Mode - Dark Occult Dream Oracle Logic
class NightmareOracle {
    constructor() {
        this.symbols = [
            'The Void', 'The Shadow', 'The Abyss', 'The Serpent',
            'The Moon', 'The Raven', 'The Mirror', 'The Key',
            'The Gate', 'The Eye', 'The Flame', 'The Crown'
        ];

        this.prophecies = [
            'speaks of hidden truths beneath still waters',
            'warns of transformation through darkness',
            'reveals paths between worlds',
            'guards secrets of the ancient ones',
            'beckons you toward forgotten knowledge',
            'whispers of power yet unclaimed',
            'portends a crossing of veils',
            'signals the awakening of dormant forces'
        ];

        this.elements = [
            'blood moon', 'midnight oil', 'shadow essence',
            'starlight', 'void dust', 'nightmare flame',
            'astral wind', 'spectral mist'
        ];

        this.initNightmareMode();
    }

    initNightmareMode() {
        console.log('🌙 Nightmare Oracle Initialized');
        this.generateProphecy();

        // Generate new prophecy every 10 seconds
        setInterval(() => this.generateProphecy(), 10000);

        // Add click handler for on-demand prophecy
        document.body.addEventListener('click', (e) => {
            if (e.target.tagName !== 'CANVAS') return;
            this.generateProphecy();
        });
    }

    generateProphecy() {
        const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        const prophecy = this.prophecies[Math.floor(Math.random() * this.prophecies.length)];
        const element = this.elements[Math.floor(Math.random() * this.elements.length)];

        const message = `${symbol} ${prophecy}, carried by ${element}`;

        console.log(`✨ Oracle Speaks: ${message}`);
        this.displayProphecy(message);

        return message;
    }

    displayProphecy(message) {
        // Remove existing prophecy if present
        const existing = document.getElementById('prophecy-display');
        if (existing) existing.remove();

        // Create prophecy display element
        const display = document.createElement('div');
        display.id = 'prophecy-display';
        display.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 0, 40, 0.9);
            color: #ba55d3;
            padding: 15px 30px;
            border: 2px solid #8a2be2;
            border-radius: 10px;
            font-family: 'Georgia', serif;
            font-size: 18px;
            max-width: 80%;
            text-align: center;
            box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
            z-index: 1000;
            animation: fadeIn 1s ease-in;
        `;
        display.textContent = message;

        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        if (!document.getElementById('prophecy-styles')) {
            style.id = 'prophecy-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(display);

        // Fade out after 8 seconds
        setTimeout(() => {
            display.style.transition = 'opacity 1s';
            display.style.opacity = '0';
            setTimeout(() => display.remove(), 1000);
        }, 8000);
    }

    getNightmareLevel() {
        const hour = new Date().getHours();
        // Nightmare intensity based on time of day
        if (hour >= 0 && hour < 4) return 'PEAK';
        if (hour >= 22 || hour < 6) return 'HIGH';
        if (hour >= 18 || hour < 8) return 'MODERATE';
        return 'LOW';
    }
}

// Initialize Nightmare Oracle
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nightmareOracle = new NightmareOracle();
    });
} else {
    window.nightmareOracle = new NightmareOracle();
}
