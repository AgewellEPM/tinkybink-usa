class UIEffectsService {
      initialize() {
        console.log('UI Effects Service ready');
        this.createStarBackground();
      }
      
      createStarBackground() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;
        
        for (let i = 0; i < 100; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.width = Math.random() * 3 + 'px';
          star.style.height = star.style.width;
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          star.style.animationDelay = Math.random() * 3 + 's';
          star.style.animationDuration = (Math.random() * 3 + 2) + 's';
          starsContainer.appendChild(star);
        }
      }
    }