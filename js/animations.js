// ============================================
// ANIMATIONS — Utility Helpers
// ============================================

const Animations = (() => {
    // Animate a number counting up
    function countUp(element, target, duration = 1200, prefix = '', suffix = '') {
        const start = 0;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.round(start + (target - start) * eased);
            element.textContent = prefix + current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Observe elements for scroll-triggered animations
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.observe-animate').forEach(el => observer.observe(el));
    }

    // Stagger children animation
    function staggerChildren(parent, delay = 50) {
        const children = parent.children;
        Array.from(children).forEach((child, i) => {
            child.style.animationDelay = `${i * delay}ms`;
            child.classList.add('animate-in');
        });
    }

    // Toast notification
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            critical: svgIcons.alertCircle,
            warning: svgIcons.alertTriangle,
            info: svgIcons.info,
            success: svgIcons.check
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
      <span class="toast-icon" style="color:${type === 'critical' ? 'var(--accent-red)' : type === 'warning' ? 'var(--accent-amber)' : type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-cyan)'}">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    return { countUp, initScrollAnimations, staggerChildren, showToast };
})();
