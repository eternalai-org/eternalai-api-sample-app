// Load and display published stories
async function loadPublishedStories() {
  try {
    const response = await fetch('/api/stories');
    if (!response.ok) {
      throw new Error('Failed to fetch stories');
    }

    const stories = await response.json();
    const cardsContainer = document.getElementById('cards');

    if (stories.length === 0) {
      cardsContainer.innerHTML = `
        <div class="no-stories">
          <h2>No stories published yet</h2>
          <p>Be the first to create and publish a story!</p>
          <a href="/creator" class="btn-create">Create Your First Story</a>
        </div>
      `;
      return;
    }

    // Create card elements
    cardsContainer.innerHTML = stories.map((story, index) => {
      const imageUrl = story.coverImage || '/placeholder-story.jpg';
      const publishDate = new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const marginY = 40; // Gap between cards
      return `
        <div class="card js-stack-card" data-index="${index}" data-margin-y="${marginY}">
          <div class="card__content" onclick="viewStory('${story.folder}')">
            <img src="${imageUrl}" alt="${story.title}" class="card__image" onerror="this.src='/placeholder-story.jpg'">
            <div class="card__body">
              <h2 class="card__title">${escapeHtml(story.title)}</h2>
              <p class="card__description">${escapeHtml(story.description)}</p>
              <div class="card__meta">
                <span class="card__author">By ${escapeHtml(story.author)}</span>
                <span class="card__date">${publishDate}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Initialize stacking effect
    initStackingCards();

  } catch (error) {
    console.error('Error loading stories:', error);
    document.getElementById('cards').innerHTML = `
      <div class="no-stories">
        <h2>Failed to load stories</h2>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// Stacking cards effect using Intersection Observer
function initStackingCards() {
  const cardsContainer = document.getElementById('cards');
  const cards = document.querySelectorAll('.js-stack-card');

  if (cards.length === 0) return;

  // Check for Intersection Observer support and reduced motion
  const intersectionObserverSupported = 'IntersectionObserver' in window &&
                                        'IntersectionObserverEntry' in window &&
                                        'intersectionRatio' in window.IntersectionObserverEntry.prototype;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!intersectionObserverSupported || reducedMotion) {
    // Fallback: just set initial positions
    cards.forEach((card, index) => {
      const marginY = parseInt(card.dataset.marginY);
      card.querySelector('.card__content').style.transform = `translateY(${marginY * index}px)`;
    });
    return;
  }

  // Get card dimensions
  const cardHeight = cards[0].querySelector('.card__content').offsetHeight;
  const marginY = parseInt(cards[0].dataset.marginY);

  let scrolling = false;
  let scrollListener = null;

  // Intersection Observer to detect when cards are in viewport
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!scrollListener) {
        scrollListener = () => {
          if (scrolling) return;
          scrolling = true;
          window.requestAnimationFrame(animateStackCards);
        };
        window.addEventListener('scroll', scrollListener, { passive: true });
      }
    } else {
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener);
        scrollListener = null;
      }
    }
  }, { threshold: 0 });

  observer.observe(cardsContainer);

  function animateStackCards() {
    const containerTop = cardsContainer.getBoundingClientRect().top;

    cards.forEach((card, index) => {
      const cardTop = 24; // Same as CSS sticky top value
      const scrollDistance = cardTop - containerTop - index * (cardHeight + marginY);

      if (scrollDistance > 0) {
        // Card is fixed - scale it down
        const scale = Math.max(0.85, (cardHeight - scrollDistance * 0.05) / cardHeight);
        const translateY = marginY * index;
        card.querySelector('.card__content').style.transform = `translateY(${translateY}px) scale(${scale})`;
      } else {
        // Card is not fixed yet - just apply offset
        const translateY = marginY * index;
        card.querySelector('.card__content').style.transform = `translateY(${translateY}px) scale(1)`;
      }
    });

    scrolling = false;
  }

  // Initial animation
  animateStackCards();
}

// Navigate to story viewer
function viewStory(folder) {
  window.location.href = `/story?id=${folder}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load stories on page load
loadPublishedStories();
