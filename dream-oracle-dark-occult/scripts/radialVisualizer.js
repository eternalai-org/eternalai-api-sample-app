// Radial Visualizer for Dark Occult Dream Oracle
class RadialVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.time = 0;
        this.particles = [];
        this.maxParticles = 100;

        this.initParticles();
        this.animate();

        window.addEventListener('resize', () => this.handleResize());
    }

    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: Math.random() * 200 + 50,
                speed: Math.random() * 0.02 + 0.01,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.3
            });
        }
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    drawRadialPattern() {
        this.ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 + Math.sin(this.time * 0.5) * 0.2})`;
        this.ctx.lineWidth = 2;

        const spokes = 12;
        const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2 - 50;

        for (let i = 0; i < spokes; i++) {
            const angle = (Math.PI * 2 / spokes) * i + this.time * 0.1;
            const x = this.centerX + Math.cos(angle) * maxRadius;
            const y = this.centerY + Math.sin(angle) * maxRadius;

            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }

        // Draw concentric circles
        for (let r = 50; r < maxRadius; r += 50) {
            const pulseRadius = r + Math.sin(this.time + r * 0.01) * 10;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            particle.angle += particle.speed;

            const x = this.centerX + Math.cos(particle.angle) * particle.radius;
            const y = this.centerY + Math.sin(particle.angle) * particle.radius;

            this.ctx.fillStyle = `rgba(186, 85, 211, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawRadialPattern();
        this.updateParticles();

        this.time += 0.01;
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.radialVis = new RadialVisualizer('radialVis');
    });
} else {
    window.radialVis = new RadialVisualizer('radialVis');
}
