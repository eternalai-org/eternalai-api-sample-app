// Get story ID from URL
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');

if (!storyId) {
  document.getElementById('storyContent').innerHTML = `
    <div class="error">
      <h2>Story not found</h2>
      <p>No story ID provided.</p>
      <a href="/" class="btn-primary">Back to Stories</a>
    </div>
  `;
} else {
  loadStory(storyId);
}

async function loadStory(storyFolder) {
  try {
    // Fetch story data
    const dataResponse = await fetch(`/api/story/${storyFolder}`);
    if (!dataResponse.ok) {
      throw new Error('Story not found');
    }

    const storyData = await dataResponse.json();

    // Display metadata
    const publishDate = new Date(storyData.publishedAt || storyData.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    document.getElementById('storyMeta').innerHTML = `
      <h1 class="story-title">${escapeHtml(storyData.title)}</h1>
      <p class="story-author">By ${escapeHtml(storyData.author)}</p>
      <p class="story-date">${publishDate}</p>
    `;

    // Update page title
    document.title = `${storyData.title} - Storyteller`;

    // Fetch and render markdown
    const mdResponse = await fetch(`/api/story/${storyFolder}/content`);
    if (!mdResponse.ok) {
      throw new Error('Story content not found');
    }

    const markdown = await mdResponse.text();

    // Parse markdown to HTML using marked.js
    const html = marked.parse(markdown);

    // Display content
    document.getElementById('storyContent').innerHTML = html;

  } catch (error) {
    console.error('Error loading story:', error);
    document.getElementById('storyContent').innerHTML = `
      <div class="error">
        <h2>Failed to load story</h2>
        <p>${error.message}</p>
        <a href="/" class="btn-primary">Back to Stories</a>
      </div>
    `;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
