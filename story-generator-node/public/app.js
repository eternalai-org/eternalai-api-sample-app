// Frontend logic for chips, limits, advanced toggle, and save
const CONTENT_LEVELS = ['Safe / All ages','Mild mature','Explicit / 18+','Violent / Graphic','Harassment content'];
const GENRES = ['Action','Adventure','Thriller','Mystery','Comedy','Psychological','Tragedy','Survival'];
const CHARS = ['Hero','Villain','Antihero','Child','Teen','Adult','Alien','Ordinary person','Chosen one'];

// Load API config
let apiConfig = { apiKey: '', apiEndpoint: '', agent: '' };

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      // just get apiEndpoint and agent
      apiConfig.apiEndpoint = config.apiEndpoint;
      apiConfig.agent = config.agent;
    }
  } catch (err) {
    console.error('Failed to load API config:', err);
  }

  // Remove localStorage handling for apiKey everywhere (do not set, do not get, do not check storedApiKey)
  // When making an API request (e.g., in generateStory or generateImagePrompt), get the key from document.getElementById('apiKeyInput').value ONLY
  // If the API key is empty when attempting to make a request, display an error and do not send the request
}

loadConfig();

const contentLevelEl = document.getElementById('contentLevel');
const genresEl = document.getElementById('genres');
const charsEl = document.getElementById('chars');

function makeChips(list, container, maxSelect){
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'chip';
    el.textContent = item;
    el.dataset.value = item;
    el.addEventListener('click', () => {
      const selected = container.querySelectorAll('.chip.selected');
      if (!el.classList.contains('selected')) {
        if (selected.length >= maxSelect) {
          el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
          return;
        }
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    container.appendChild(el);
  });
}

makeChips(CONTENT_LEVELS, contentLevelEl, 2);
makeChips(GENRES, genresEl, 3);
makeChips(CHARS, charsEl, 4);

function getSelected(container){
  return Array.from(container.querySelectorAll('.chip.selected')).map(c => c.dataset.value);
}

// Advanced toggle
const toggle = document.getElementById('toggleAdvanced');
const adv = document.getElementById('advanced');
let advShown = false;
toggle.addEventListener('click', () => {
  advShown = !advShown;
  adv.style.display = advShown ? 'block' : 'none';
  toggle.textContent = advShown ? 'Hide Advanced Options' : 'Show Advanced Options';
});

// Save
async function saveStory(){
  const idea = document.getElementById('idea').value.trim();
  if (!idea) { document.getElementById('status').textContent = 'Please enter your main idea.'; return; }

  const config = {
    created_at: new Date().toISOString(),
    content_level: getSelected(contentLevelEl),
    theme: document.getElementById('theme').value,
    genres: getSelected(genresEl),
    main_character_types: getSelected(charsEl),
    narration_style: document.getElementById('narration').value,
    ending_type: document.getElementById('ending').value,
    // advanced (single-select)
    tone: document.getElementById('tone').value,
    perspective_focus: document.getElementById('perspective').value,
    length: document.getElementById('length').value,
    twist_option: document.getElementById('twist').value
  };

  const prompt = { created_at: new Date().toISOString(), prompt_text: idea };

  document.getElementById('status').textContent = 'Saving...';

  try {
    const resp = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, prompt })
    });
    const json = await resp.json();
    if (resp.ok) {
      const statusEl = document.getElementById('status');
      statusEl.textContent = '✓ Configuration saved, generating story...';
      statusEl.style.color = '#4ade80';

      // Navigate to page 2
      showPage2(config, prompt, json.storyFolder);
    } else {
      document.getElementById('status').textContent = json.error || 'Error saving';
      document.getElementById('status').style.color = '#f97316';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('status').textContent = 'Network or server error';
    document.getElementById('status').style.color = '#f97316';
  }
}

document.getElementById('saveBtn').addEventListener('click', saveStory);

// Page navigation
let currentConfig = null;
let currentPrompt = null;
let currentStoryFolder = null;

function showPage2(config, prompt, storyFolder) {
  currentConfig = config;
  currentPrompt = prompt;
  currentStoryFolder = storyFolder;

  document.getElementById('page1').style.display = 'none';
  document.getElementById('page2').style.display = 'flex';

  // Display config in sidebar
  const configDisplay = document.getElementById('storyConfig');
  configDisplay.innerHTML = `
    <div><strong>Prompt</strong>${prompt.prompt_text}</div>
    <div><strong>Theme</strong>${config.theme}</div>
    <div><strong>Genres</strong>${config.genres.length > 0 ? config.genres.join(', ') : 'None'}</div>
    <div><strong>Characters</strong>${config.main_character_types.length > 0 ? config.main_character_types.join(', ') : 'None'}</div>
    <div><strong>Content Level</strong>${config.content_level.length > 0 ? config.content_level.join(', ') : 'None'}</div>
    <div><strong>Narration</strong>${config.narration_style}</div>
    <div><strong>Ending</strong>${config.ending_type}</div>
    <div><strong>Length</strong>${config.length}</div>
    <div><strong>Tone</strong>${config.tone}</div>
    <div><strong>Perspective</strong>${config.perspective_focus}</div>
    <div><strong>Twist</strong>${config.twist_option}</div>
  `;

  // Initialize publish button now that page2 is visible
  initializePublishButton();

  generateStory();

  // Removed customBackBtn creation; use the existing back button in HTML
}

function showPage1() {
  document.getElementById('page2').style.display = 'none';
  document.getElementById('page1').style.display = 'block';
}

document.getElementById('backBtn').addEventListener('click', showPage1);

// Toggle config display
document.getElementById('toggleConfig').addEventListener('click', function() {
  const configDisplay = document.getElementById('storyConfig');
  const toggleBtn = this;

  if (configDisplay.style.display === 'none') {
    configDisplay.style.display = 'block';
    toggleBtn.classList.add('expanded');
  } else {
    configDisplay.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
});

// Word count (excluding think sections)
const storyEditor = document.getElementById('storyEditor');
storyEditor.addEventListener('input', () => {
  // Clone editor and remove think sections
  const clone = storyEditor.cloneNode(true);
  const thinkSections = clone.querySelectorAll('.think-section');
  thinkSections.forEach(section => section.remove());

  const text = clone.textContent || clone.innerText;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = `${words} words`;
});

// Text selection and image generation functionality
let selectedText = '';
let selectedRange = null;
let imageGenerationButton = null;

// Track multiple image generations
let activeImageGenerations = new Map(); // requestId -> { status, progress, queueInfo, element }
let imageGenerationCounter = 0;

// Create image generation button
function createImageGenerationButton() {
  console.log('Creating image generation button...');
  
  if (imageGenerationButton) {
    console.log('Removing existing button');
    imageGenerationButton.remove();
  }
  
  imageGenerationButton = document.createElement('div');
  imageGenerationButton.className = 'image-generation-toolbar';
  imageGenerationButton.innerHTML = `
    <div class="image-toolbar-content">
      <span class="selected-text-preview">"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"</span>
      <div class="image-toolbar-buttons">
        <button id="generateImageBtn" class="btn-image-generate">🎨 Create Image Prompt</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(imageGenerationButton);
  console.log('Button added to DOM');
  
  // Position the button near the selection
  positionImageButton();
  
  // Add event listeners
  document.getElementById('generateImageBtn').addEventListener('click', generateImage);
  
  console.log('Image generation button created successfully');
}

// Position the image generation button
function positionImageButton() {
  if (!selectedRange || !imageGenerationButton) return;
  
  const rect = selectedRange.getBoundingClientRect();
  const buttonRect = imageGenerationButton.getBoundingClientRect();
  
  let top = rect.top - buttonRect.height - 10;
  let left = rect.left + (rect.width / 2) - (buttonRect.width / 2);
  
  // Ensure button stays within viewport
  if (top < 10) top = rect.bottom + 10;
  if (left < 10) left = 10;
  if (left + buttonRect.width > window.innerWidth - 10) {
    left = window.innerWidth - buttonRect.width - 10;
  }
  
  imageGenerationButton.style.position = 'fixed';
  imageGenerationButton.style.top = `${top}px`;
  imageGenerationButton.style.left = `${left}px`;
  imageGenerationButton.style.zIndex = '1000';
}

// Handle text selection
storyEditor.addEventListener('mouseup', handleTextSelection);
storyEditor.addEventListener('keyup', handleTextSelection);

// Add debugging for image generation flow
console.log('Image generation system initialized');

function handleTextSelection() {
  const selection = window.getSelection();
  
  console.log('Selection event triggered');
  console.log('Selection text:', selection.toString());
  console.log('Selection length:', selection.toString().length);
  
  if (selection.toString().trim().length > 0) {
    selectedText = selection.toString().trim();
    selectedRange = selection.getRangeAt(0);
    
    console.log('Text selected:', selectedText.substring(0, 50) + '...');
    console.log('Selected text length:', selectedText.length);
    
    // Only show button for substantial text selections
    if (selectedText.length > 10) {
      console.log('Creating image generation button');
      createImageGenerationButton();
    } else {
      console.log('Text too short, hiding button');
      hideImageGenerationButton();
    }
  } else {
    console.log('No text selected, hiding button');
    hideImageGenerationButton();
  }
}

// Hide image generation button
function hideImageGenerationButton() {
  if (imageGenerationButton) {
    imageGenerationButton.remove();
    imageGenerationButton = null;
  }
  selectedText = '';
  selectedRange = null;
}

// Click outside to hide button
document.addEventListener('click', (e) => {
  if (!storyEditor.contains(e.target) && !imageGenerationButton?.contains(e.target)) {
    hideImageGenerationButton();
  }
});

// Capture context (full story from beginning to selected text)
function getContextBeforeSelection() {
  if (!selectedRange) return '';
  
  const textContent = storyEditor.textContent || storyEditor.innerText;
  const selectedStart = getTextPosition(selectedRange.startContainer, selectedRange.startOffset);
  
  // Get text before selection, removing line breaks and extra whitespace
  const textBeforeSelection = textContent.substring(0, selectedStart)
    .replace(/\n+/g, ' ')  // Replace line breaks with spaces
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();
  
  console.log('Full story context length:', textBeforeSelection.length);
  console.log('Context preview:', textBeforeSelection.substring(0, 200) + '...');
  
  return textBeforeSelection;
}

// Helper function to get text position
function getTextPosition(node, offset) {
  let position = 0;
  const walker = document.createTreeWalker(
    storyEditor,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentNode;
  while (currentNode = walker.nextNode()) {
    if (currentNode === node) {
      return position + offset;
    }
    position += currentNode.textContent.length;
  }
  return position;
}

// Generate image prompt using API
async function generateImagePrompt(context, selectedText) {
  // Truncate context if it's too long to avoid API limits
  const maxContextLength = 2000; // Reasonable limit for context
  const truncatedContext = context.length > maxContextLength 
    ? context.substring(context.length - maxContextLength) + '...'
    : context;
  
  const promptText = `Create ONLY an image generation prompt for this story scene. Do not include any reasoning, analysis, or explanation.

Story Context: ${truncatedContext}

Selected text to illustrate: "${selectedText}"

Return ONLY the image prompt in this format: Subject + Action + Style + Context
Make it detailed and cinematic. Focus on visual elements only.`;

  try {
    const response = await fetch(apiConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': document.getElementById('apiKeyInput').value // Get key from input field
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              }
            ]
          }
        ],
        agent: 'uncensored-chat',
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let prompt = '';
    let insideThinkTag = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr.trim() === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            // Extract content from streaming response
            let content = '';
            if (data.content) {
              content = data.content;
            } else if (data.choices && data.choices[0]?.delta?.content) {
              content = data.choices[0].delta.content;
            } else if (data.delta?.content) {
              content = data.delta.content;
            }

            if (content) {
              // Process content and handle <think> tags
              let displayContent = '';

              for (let i = 0; i < content.length; i++) {
                const char = content[i];

                // Check for <think> tag opening
                if (!insideThinkTag && content.substring(i).startsWith('<think>')) {
                  insideThinkTag = true;
                  i += 6; // Skip '<think>'
                  continue;
                }

                // Check for </think> tag closing
                if (insideThinkTag && content.substring(i).startsWith('</think>')) {
                  insideThinkTag = false;
                  i += 7; // Skip '</think>'
                  continue;
                }

                // Only accumulate content outside think tags
                if (!insideThinkTag) {
                  displayContent += char;
                }
              }

              prompt += displayContent;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.debug('Skipping line:', line);
          }
        }
      }
    }
    
    // Clean up the prompt - remove any reasoning or analysis text
    let cleanPrompt = prompt.trim();
    
    // Remove common AI reasoning patterns and unwanted text
    const unwantedPatterns = [
      /^.*?(?=A [a-z]|The [a-z]|An [a-z]|Cinematic|Gritty|Realistic|Detailed)/i,
      /^.*?(?=Subject:|Action:|Style:|Context:)/i,
      /^.*?(?=First,|Let me|I need to|The task is|Since no)/i,
      /^.*?(?=Okay,|Alright,|Let's)/i,
      /^.*?(?=Here's|This is|The prompt)/i,
      /^.*?(?=I should|I need|I must|I will)/i,
      /^.*?(?=The key|The scene|The image)/i,
      /^.*?(?=No tools|Therefore|So my job)/i,
      /^.*?(?=I should focus|I need to focus)/i,
      /^.*?(?=The user wants|The user mentioned)/i
    ];
    
    for (const pattern of unwantedPatterns) {
      const match = cleanPrompt.match(pattern);
      if (match && match[0].length > 0) {
        cleanPrompt = cleanPrompt.substring(match[0].length).trim();
      }
    }
    
    // Additional cleanup - remove any remaining reasoning text
    cleanPrompt = cleanPrompt.replace(/^[^A-Za-z]*/, ''); // Remove non-letter characters at start
    cleanPrompt = cleanPrompt.replace(/\s+/g, ' '); // Normalize whitespace
    
    // If the prompt is too short or seems incomplete, try to extract the main part
    if (cleanPrompt.length < 50) {
      // Look for the actual image description
      const imageMatch = prompt.match(/(A [^.]*\.|The [^.]*\.|An [^.]*\.|Cinematic[^.]*\.|Gritty[^.]*\.|Realistic[^.]*\.|Detailed[^.]*\.)/i);
      if (imageMatch) {
        cleanPrompt = imageMatch[0].trim();
      }
    }
    
    return cleanPrompt;
  } catch (error) {
    console.error('Error generating image prompt:', error);
    throw error;
  }
}

// Generate image using API with async polling (like playground)
async function generateImageFromPrompt(prompt) {
  try {
    // Use the same endpoints as playground
    const POST_URL = "https://agent-api.eternalai.org/prompt";
    
    // Submit image generation request
    const response = await fetch(POST_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': document.getElementById('apiKeyInput').value, // Get key from input field
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        agent: 'uncensored-imagine'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const requestId = data.request_id;
    
    if (!requestId) {
      throw new Error('No request ID returned from API');
    }

    // Poll for results
    return await pollForImageResult(requestId);
    
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Poll for image generation result with real-time updates (matching playground)
async function pollForImageResult(requestId, progressElement) {
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  let attempts = 0;
  
  // Store generation info
  activeImageGenerations.set(requestId, {
    status: 'pending',
    progress: 0,
    queueInfo: null,
    element: progressElement,
    attempts: 0
  });
  
  // Show initial request ID
  updateImageProgress(requestId, 'pending', 0, null);
  
  while (attempts < maxAttempts) {
    try {
      // Use the same result endpoint as playground
      const GET_URL = "https://agent-api.eternalai.org/result";
      const response = await fetch(`${GET_URL}?agent=uncensored-imagine&request_id=${requestId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': document.getElementById('apiKeyInput').value, // Get key from input field
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        // Extract image URL from successful response (matching playground logic)
        const imageUrl = data.result_url || data.result_image_url || data.result_video_url || '';
        console.log('API Response data:', data);
        console.log('Extracted image URL:', imageUrl);
        
        if (imageUrl) {
          updateImageProgress(requestId, 'success', 100, null);
          activeImageGenerations.delete(requestId);
          return imageUrl;
        } else {
          console.error('No image URL found in response:', data);
          throw new Error('No image URL found in successful response');
        }
      } else if (data.status === 'error') {
        updateImageProgress(requestId, 'error', 0, null);
        activeImageGenerations.delete(requestId);
        throw new Error('Image generation failed');
      } else if (data.status === 'pending' || data.status === 'processing' || data.status === 'queued') {
        // Extract actual progress from log field
        let actualProgress = 0;
        let actualStatus = data.status;
        
        try {
          if (data.log) {
            console.log('Parsing log field:', data.log);
            
            // Try to extract JSON from log field
            const jsonMatch = data.log.match(/\{.*\}/);
            if (jsonMatch) {
              try {
                const logData = JSON.parse(jsonMatch[0]);
                console.log('Parsed log data:', logData);
                
                // Extract progress from nested structure
                if (logData.status && logData.status.progress !== undefined) {
                  actualProgress = logData.status.progress;
                }
                if (logData.status && logData.status.status) {
                  actualStatus = logData.status.status;
                }
              } catch (parseError) {
                console.warn('Failed to parse JSON from log:', parseError);
                
                // Fallback to regex parsing
                const logMatch = data.log.match(/"progress":(\d+)/);
                if (logMatch) {
                  actualProgress = parseInt(logMatch[1]);
                }
                
                const statusMatch = data.log.match(/"status":"([^"]+)"/);
                if (statusMatch) {
                  actualStatus = statusMatch[1];
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to parse log field:', error);
        }
        
        // Fallback to basic progress calculation if log parsing fails
        if (actualProgress === 0) {
          if (data.progress !== undefined && data.progress !== null) {
            actualProgress = data.progress;
          } else if (actualStatus === 'processing') {
            actualProgress = Math.max(5, attempts * 2);
          } else if (actualStatus === 'queued') {
            actualProgress = 10;
          } else if (actualStatus === 'pending') {
            actualProgress = 5;
          }
        }
        
        console.log(`Progress update: ${actualStatus} - ${actualProgress}% (attempt ${attempts})`);
        
        // Update progress with queue info
        updateImageProgress(requestId, actualStatus, actualProgress, data.queue_info);
        
        // Wait and try again (matching playground timing)
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds like playground
        attempts++;
        continue;
      } else {
        // Unknown status, wait and try again
        updateImageProgress(requestId, 'unknown', attempts * 2, null);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        continue;
      }
      
    } catch (error) {
      console.error('Polling error:', error);
      updateImageProgress(requestId, 'error', 0, null);
      attempts++;
      if (attempts >= maxAttempts) {
        activeImageGenerations.delete(requestId);
        throw new Error('Image generation timed out');
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  updateImageProgress(requestId, 'timeout', 0, null);
  activeImageGenerations.delete(requestId);
  throw new Error('Image generation timed out after maximum attempts');
}

// Generate image with individual progress tracking
async function generateImageFromPromptWithProgress(prompt, progressElement) {
  try {
    // Use the same endpoints as playground
    const POST_URL = "https://agent-api.eternalai.org/prompt";
    
    // Submit image generation request
    const response = await fetch(POST_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': document.getElementById('apiKeyInput').value, // Get key from input field
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        agent: 'uncensored-imagine'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const requestId = data.request_id;
    
    if (!requestId) {
      throw new Error('No request ID returned from API');
    }

    // Poll for results with individual progress tracking
    return await pollForImageResult(requestId, progressElement);
    
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Main image generation function
async function generateImage() {
  if (!selectedText || !selectedRange) return;
  
  const generateBtn = document.getElementById('generateImageBtn');
  const originalText = generateBtn.textContent;
  generateBtn.textContent = '🎨 Generating...';
  generateBtn.disabled = true;
  
  try {
    console.log('Starting image generation for text:', selectedText.substring(0, 50) + '...');
    
    // Get context
    const context = getContextBeforeSelection();
    console.log('Context:', context.substring(0, 100) + '...');
    
    // Generate image prompt
    showImageProgress(null, 'prompt_generation', 0, null);
    const imagePrompt = await generateImagePrompt(context, selectedText);
    console.log('Generated prompt:', imagePrompt);
    
    // Show the prompt inline first (no auto-generation)
    showInlinePrompt(imagePrompt);
    
    // Show success message for prompt generation
      showImageProgress(null, 'success', 100, null);
    showImageStatus('✓ Image prompt generated successfully! Click "Generate Image" to create the image.', 'success');
    
  } catch (error) {
    console.error('Image generation failed:', error);
    showImageProgress(null, 'error', 0, null);
    
    // Provide more specific error messages
    let errorMessage = 'Image generation failed';
    if (error.message.includes('HTTP error')) {
      errorMessage = 'API request failed - check your connection and API key';
    } else if (error.message.includes('No request ID')) {
      errorMessage = 'API did not return a request ID - check API configuration';
    } else if (error.message.includes('timed out')) {
      errorMessage = 'Image generation timed out - try again later';
    } else if (error.message.includes('No image URL')) {
      errorMessage = 'API returned success but no image URL';
    } else {
      errorMessage = 'Image generation failed: ' + error.message;
    }
    
    showImageStatus('✗ ' + errorMessage, 'error');
  } finally {
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }
}


// Show prompt inline in the story editor
function showInlinePrompt(prompt) {
  if (!selectedRange) return;
  
  // Create prompt display element with progress tracking
  const promptContainer = document.createElement('div');
  promptContainer.className = 'inline-prompt-container';
  promptContainer.innerHTML = `
    <div class="inline-prompt-content">
      <div class="prompt-header">
        <span class="prompt-icon">📝</span>
        <span class="prompt-title">Generated Image Prompt:</span>
        <button onclick="removeInlinePrompt(this)" class="btn-close-inline">✕</button>
      </div>
      <div class="prompt-text">${prompt}</div>
      <div class="prompt-actions">
        <button onclick="generateImageFromInlinePrompt(this)" class="btn-generate-from-prompt">🎨 Generate Image</button>
      </div>
      <div class="prompt-hint">
        <small>💡 Click "Generate Image" to create the image from this prompt</small>
      </div>
      <div class="image-progress-section" style="display: none;">
        <div class="image-status-text">Ready to generate</div>
        <div class="image-progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      </div>
    </div>
  `;
  
  // Insert after the selected text
  selectedRange.collapse(false);
  selectedRange.insertNode(promptContainer);
  
  // Clear selection
  window.getSelection().removeAllRanges();
  hideImageGenerationButton();
}

// Remove inline prompt
function removeInlinePrompt(button) {
  const container = button.closest('.inline-prompt-container');
  if (container) {
    container.remove();
  }
}

// Generate image from inline prompt with individual progress tracking
async function generateImageFromInlinePrompt(button) {
  const container = button.closest('.inline-prompt-container');
  const promptText = container.querySelector('.prompt-text').textContent;
  const progressSection = container.querySelector('.image-progress-section');
  
  button.textContent = '🎨 Generating...';
  button.disabled = true;
  
  // Show progress section
  progressSection.style.display = 'block';
  
  try {
    // Generate image with progress tracking
    const imageUrl = await generateImageFromPromptWithProgress(promptText, progressSection);
    
    if (imageUrl) {
      // Insert image after the prompt container
      insertImageAfterPromptContainer(container, imageUrl, promptText);
      container.remove();
      showImageStatus('✓ Image generated successfully!', 'success');
    } else {
      throw new Error('No image URL returned');
    }
  } catch (error) {
    console.error('Image generation failed:', error);
    // Update progress to show error
    updateProgressElement(progressSection, null, 'error', 0, null);
  } finally {
    button.textContent = '🎨 Generate Image';
    button.disabled = false;
  }
}


// Insert image after a prompt container
function insertImageAfterPromptContainer(promptContainer, imageUrl, prompt) {
  console.log('Inserting image after prompt container:', imageUrl);
  console.log('Prompt container:', promptContainer);
  console.log('Prompt container parent:', promptContainer.parentNode);
  
  // Create image element
  const imageContainer = document.createElement('div');
  imageContainer.className = 'story-image-container';
  imageContainer.innerHTML = `
    <div class="story-image-wrapper">
      <img src="${imageUrl}" alt="Generated story image" class="story-image" loading="lazy" />
      <div class="image-caption">
        <details>
          <summary>📝 Image Prompt</summary>
          <p>${prompt}</p>
        </details>
        <div class="image-actions">
          <button onclick="regenerateImageForContainer(this)" class="btn-regenerate-image">🔄 Regenerate</button>
          <button onclick="removeImageContainer(this)" class="btn-remove-image">🗑️ Remove</button>
        </div>
      </div>
    </div>
  `;
  
  try {
    // Insert after the prompt container
    if (promptContainer.parentNode) {
      promptContainer.parentNode.insertBefore(imageContainer, promptContainer.nextSibling);
      
      // Add a line break after the image for better spacing
      const lineBreak = document.createElement('br');
      promptContainer.parentNode.insertBefore(lineBreak, imageContainer.nextSibling);
      
      console.log('Image successfully inserted after prompt container');
    } else {
      // Fallback: append to story editor
      console.log('Fallback: inserting image at end of story editor');
      storyEditor.appendChild(imageContainer);
      storyEditor.appendChild(document.createElement('br'));
    }
    
    // Show success message
    showImageStatus('✓ Image generated and inserted successfully!', 'success');
    
  } catch (error) {
    console.error('Error inserting image after prompt container:', error);
    
    // Fallback: try to insert at end of story editor
    try {
      console.log('Fallback: inserting image at end of story editor');
      storyEditor.appendChild(imageContainer);
      storyEditor.appendChild(document.createElement('br'));
      showImageStatus('✓ Image generated and inserted successfully!', 'success');
    } catch (fallbackError) {
      console.error('Fallback insertion also failed:', fallbackError);
      showImageStatus('✗ Failed to insert image into story', 'error');
      return;
    }
  }
  
  // Update word count
  storyEditor.dispatchEvent(new Event('input'));
}

// Insert image into story
function insertImageIntoStory(imageUrl, prompt) {
  if (!selectedRange) {
    console.error('No selected range available for image insertion');
    return;
  }
  
  console.log('Inserting image into story:', imageUrl);
  
  // Create image element
  const imageContainer = document.createElement('div');
  imageContainer.className = 'story-image-container';
  imageContainer.innerHTML = `
    <div class="story-image-wrapper">
      <img src="${imageUrl}" alt="Generated story image" class="story-image" loading="lazy" />
      <div class="image-caption">
        <details>
          <summary>📝 Image Prompt</summary>
          <p>${prompt}</p>
        </details>
        <div class="image-actions">
          <button onclick="regenerateImageForContainer(this)" class="btn-regenerate-image">🔄 Regenerate</button>
          <button onclick="removeImageContainer(this)" class="btn-remove-image">🗑️ Remove</button>
        </div>
      </div>
    </div>
  `;
  
  try {
  // Insert after the selected text
  selectedRange.collapse(false);
  selectedRange.insertNode(imageContainer);
    
    // Add a line break after the image for better spacing
    const lineBreak = document.createElement('br');
    selectedRange.insertNode(lineBreak);
    
    console.log('Image successfully inserted into story');
    
    // Show success message
    showImageStatus('✓ Image generated and inserted successfully!', 'success');
    
  } catch (error) {
    console.error('Error inserting image into story:', error);
    showImageStatus('✗ Failed to insert image into story', 'error');
    return;
  }
  
  // Clear selection
  window.getSelection().removeAllRanges();
  hideImageGenerationButton();
  
  // Update word count
  storyEditor.dispatchEvent(new Event('input'));
}

// Regenerate image for a specific container
async function regenerateImageForContainer(button) {
  const container = button.closest('.story-image-container');
  const img = container.querySelector('.story-image');
  const promptDetails = container.querySelector('.image-caption details p');
  
  if (!img || !promptDetails) return;
  
  const originalPrompt = promptDetails.textContent;
  button.textContent = '🔄 Generating...';
  button.disabled = true;
  
  try {
    const imageUrl = await generateImageFromPrompt(originalPrompt);
    if (imageUrl) {
      img.src = imageUrl;
      showImageStatus('✓ Image regenerated successfully!', 'success');
    } else {
      throw new Error('No image URL returned');
    }
  } catch (error) {
    console.error('Image regeneration failed:', error);
    showImageStatus('✗ Failed to regenerate image: ' + error.message, 'error');
  } finally {
    button.textContent = '🔄 Regenerate';
    button.disabled = false;
  }
}

// Remove image container
function removeImageContainer(button) {
  const container = button.closest('.story-image-container');
  if (container) {
    container.remove();
    showImageStatus('✓ Image removed', 'success');
  }
}

// Show image prompt
function showImagePrompt(prompt) {
  const promptContainer = document.createElement('div');
  promptContainer.className = 'image-prompt-display';
  promptContainer.innerHTML = `
    <div class="prompt-content">
      <h4>Generated Image Prompt:</h4>
      <p>${prompt}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="btn-close-prompt">Close</button>
    </div>
  `;
  
  document.body.appendChild(promptContainer);
}

// Update progress for specific image generation
function updateImageProgress(requestId, status, progress, queueInfo) {
  const generationInfo = activeImageGenerations.get(requestId);
  if (!generationInfo) return;
  
  // Update stored info
  generationInfo.status = status;
  generationInfo.progress = progress;
  generationInfo.queueInfo = queueInfo;
  
  // Update the specific progress element
  const progressElement = generationInfo.element;
  if (progressElement) {
    updateProgressElement(progressElement, requestId, status, progress, queueInfo);
  }
}

// Show image progress status (global status)
function showImageProgress(requestId, status, progress, queueInfo) {
  // This function shows global image generation status
  // For now, we'll just log it since the main progress is shown inline
  console.log(`Image generation ${status}: ${progress}%`);
}

// Show image status message
function showImageStatus(message, type) {
  // Create a temporary status message
  const statusEl = document.createElement('div');
  statusEl.className = 'image-status-message';
  statusEl.textContent = message;
  statusEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--green)' : 'var(--orange)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#image-status-styles')) {
    const style = document.createElement('style');
    style.id = 'image-status-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(statusEl);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (statusEl.parentNode) {
      statusEl.remove();
    }
  }, 3000);
}

// Update individual progress element
function updateProgressElement(element, requestId, status, progress, queueInfo) {
  // Format wait time from seconds
  function formatWaitTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
  
  console.log(`Updating progress element: ${status} - ${progress}%`, { requestId, queueInfo });
  
  // Get status emoji and color
  let statusEmoji = '⏳';
  let statusColor = 'var(--muted)';
  
  switch (status) {
    case 'prompt_generation':
      statusEmoji = '📝';
      statusColor = 'var(--accent)';
      break;
    case 'pending':
      statusEmoji = '⏳';
      statusColor = 'var(--accent)';
      break;
    case 'queued':
      statusEmoji = '📋';
      statusColor = 'var(--orange)';
      break;
    case 'processing':
      statusEmoji = '⚙️';
      statusColor = 'var(--accent)';
      break;
    case 'success':
      statusEmoji = '✅';
      statusColor = 'var(--green)';
      break;
    case 'error':
      statusEmoji = '❌';
      statusColor = 'var(--orange)';
      break;
    case 'timeout':
      statusEmoji = '⏰';
      statusColor = 'var(--orange)';
      break;
  }
  
  // Build status message
  let statusMessage = `${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  
  // Handle special cases
  if (status === 'prompt_generation') {
    statusMessage = '📝 Generating prompt...';
  }
  
  // Add request ID (shortened)
  const shortId = requestId ? requestId.substring(0, 8) + '...' : '';
  if (shortId) {
    statusMessage += ` (ID: ${shortId})`;
  }
  
  // Add progress percentage
  if (progress > 0 && status !== 'success') {
    statusMessage += ` - ${progress}%`;
  }
  
  // Add queue information
  if (queueInfo) {
    const { queue_position, total_queue_size, estimated_wait_time } = queueInfo;
    statusMessage += ` | Queue: ${queue_position}/${total_queue_size}`;
    if (estimated_wait_time) {
      statusMessage += ` (~${formatWaitTime(estimated_wait_time)})`;
    }
  }
  
  // Update element content
  const statusText = element.querySelector('.image-status-text');
  if (statusText) {
    statusText.textContent = statusMessage;
    statusText.style.color = statusColor;
  }
  
  // Update progress bar
  const progressBar = element.querySelector('.image-progress-bar');
  const progressFill = element.querySelector('.progress-fill');
  
  if (progressBar && progressFill) {
    if (status === 'success' || status === 'error') {
      progressBar.style.display = 'none';
    } else if (progress > 0) {
      progressBar.style.display = 'block';
      progressFill.style.width = `${progress}%`;
    }
  }
}

// Generate story using API with streaming
async function generateStory() {
  const statusEl = document.getElementById('generationStatus');
  statusEl.textContent = 'Generating your story...';
  statusEl.style.color = 'var(--accent)';

  // Clear editor
  storyEditor.innerHTML = '';
  document.getElementById('wordCount').textContent = '0 words';

  try {
    // Calculate target word count
    const targetWords = currentConfig.length === 'short' ? 600 : currentConfig.length === 'medium' ? 1200 : 2500;

    // Build prompt from config
    const promptText = `Write a ${currentConfig.length} story (approximately ${targetWords} words) based on the following:

Main Idea: ${currentPrompt.prompt_text}

Story Configuration:
- Theme: ${currentConfig.theme}
- Genres: ${currentConfig.genres.join(', ')}
- Main Characters: ${currentConfig.main_character_types.join(', ')}
- Content Level: ${currentConfig.content_level.join(', ')}
- Narration Style: ${currentConfig.narration_style}
- Ending Type: ${currentConfig.ending_type}
- Tone: ${currentConfig.tone}
- Perspective: ${currentConfig.perspective_focus}

Please write a complete, engaging story that follows these parameters.`;

    const response = await fetch(apiConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': document.getElementById('apiKeyInput').value // Get key from input field
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              }
            ]
          }
        ],
        agent: apiConfig.agent,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let insideThinkTag = false;
    let thinkContent = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        statusEl.textContent = '✓ Story generated successfully';
        statusEl.style.color = 'var(--green)';
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr.trim() === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            // Extract content from different response formats
            let content = '';
            if (data.content) {
              content = data.content;
            } else if (data.choices && data.choices[0]?.delta?.content) {
              content = data.choices[0].delta.content;
            } else if (data.delta?.content) {
              content = data.delta.content;
            }

            // Process content and handle <think> tags
            if (content) {
              let displayContent = '';

              for (let i = 0; i < content.length; i++) {
                const char = content[i];

                // Check for <think> tag opening
                if (!insideThinkTag && content.substring(i).startsWith('<think>')) {
                  insideThinkTag = true;
                  thinkContent = '';
                  i += 6; // Skip '<think>'
                  continue;
                }

                // Check for </think> tag closing
                if (insideThinkTag && content.substring(i).startsWith('</think>')) {
                  insideThinkTag = false;
                  // Create collapsible section
                  displayContent += `<details class="think-section"><summary>💭 Thinking process (click to expand)</summary><pre>${thinkContent}</pre></details>\n\n`;
                  thinkContent = '';
                  i += 7; // Skip '</think>'
                  continue;
                }

                // Accumulate content
                if (insideThinkTag) {
                  thinkContent += char;
                } else {
                  displayContent += char;
                }
              }

              // Append to editor
              if (displayContent) {
                // Check if content contains HTML (think sections)
                if (displayContent.includes('<details')) {
                  // Contains HTML, insert as innerHTML
                  const tempContainer = document.createElement('span');
                  tempContainer.innerHTML = displayContent;
                  storyEditor.appendChild(tempContainer);
                } else {
                  // Plain text, append as text node
                  const textNode = document.createTextNode(displayContent);
                  storyEditor.appendChild(textNode);
                }
              }

              // Update word count
              storyEditor.dispatchEvent(new Event('input'));

              // Auto-scroll to bottom
              storyEditor.scrollTop = storyEditor.scrollHeight;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.debug('Skipping line:', line);
          }
        }
      }
    }

  } catch (error) {
    console.error('Generation error:', error);
    statusEl.textContent = '✗ Error generating story: ' + error.message;
    statusEl.style.color = 'var(--orange)';
  }
}

document.getElementById('regenerateBtn').addEventListener('click', generateStory);

document.getElementById('exportBtn').addEventListener('click', exportToPDF);

// Export story to new tab and save as markdown
async function exportToPDF() {
  const text = storyEditor.textContent || storyEditor.innerText;
  if (!text.trim()) {
    alert('No story to export');
    return;
  }

  if (!currentStoryFolder) {
    alert('No story folder found. Please save the configuration first.');
    return;
  }

  try {
    // Create markdown content
    const markdown = createMarkdownExport();

    if (!markdown || markdown.trim().length < 100) {
      throw new Error('No valid content found to export');
    }

    // Save markdown to server
    const saveResp = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyFolder: currentStoryFolder,
        markdown: markdown
      })
    });

    if (!saveResp.ok) {
      throw new Error('Failed to save markdown file');
    }

    // Create clean HTML for preview
    const cleanHTML = createCleanHTMLForPDF();

    // Open new tab to show the HTML content
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Unable to open new tab. Please check your browser popup settings.');
      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Story Export</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }
        </style>
      </head>
      <body>
        ${cleanHTML}
      </body>
      </html>
    `);
    newWindow.document.close();

    // Show success message
    showImageStatus(`✓ Story saved to data/${currentStoryFolder}/story.md`, 'success');

  } catch (error) {
    console.error('Export failed:', error);
    showImageStatus('✗ Export failed: ' + error.message, 'error');
  }
}

// Create markdown export
function createMarkdownExport() {
  console.log('Creating markdown export...');

  // Clone the story editor to work with a copy
  const editorClone = storyEditor.cloneNode(true);

  // Remove all think sections from the clone
  const thinkSections = editorClone.querySelectorAll('.think-section, details.think-section');
  thinkSections.forEach(section => section.remove());

  // Remove inline prompt containers (not yet generated images)
  const inlinePrompts = editorClone.querySelectorAll('.inline-prompt-container');
  inlinePrompts.forEach(prompt => prompt.remove());

  // Get all child nodes from the cleaned clone
  const childNodes = Array.from(editorClone.childNodes);

  // Build markdown content
  let markdown = `# Generated Story\n\n`;
  markdown += `**Created on:** ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  // Process nodes to build the story with images in correct positions
  let textBuffer = '';

  for (const node of childNodes) {
    // Check if this is an image container
    if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('story-image-container')) {
      // Flush any accumulated text as paragraphs
      if (textBuffer.trim()) {
        const paragraphs = textBuffer.trim().split(/\n\s*\n+/);
        paragraphs.forEach(para => {
          const cleanPara = para.replace(/\s+/g, ' ').trim();
          if (cleanPara) {
            markdown += `${cleanPara}\n\n`;
          }
        });
        textBuffer = '';
      }

      // Add the image in markdown format
      const img = node.querySelector('.story-image');
      if (img && img.src) {
        const caption = node.querySelector('.image-caption details p');
        const imageCaption = caption ? caption.textContent : 'Generated image';

        markdown += `![${imageCaption}](${img.src})\n\n`;

        if (caption) {
          markdown += `*Image prompt: ${caption.textContent}*\n\n`;
        }
      }
    } else {
      // Accumulate text content from text nodes and spans
      let nodeText = '';

      if (node.nodeType === Node.TEXT_NODE) {
        nodeText = node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip BR tags and other non-content elements
        if (node.tagName === 'BR') {
          nodeText = '\n';
        } else if (node.tagName === 'SPAN') {
          nodeText = node.textContent;
        } else {
          nodeText = node.textContent;
        }
      }

      textBuffer += nodeText;
    }
  }

  // Flush any remaining text
  if (textBuffer.trim()) {
    const paragraphs = textBuffer.trim().split(/\n\s*\n+/);
    paragraphs.forEach(para => {
      const cleanPara = para.replace(/\s+/g, ' ').trim();
      if (cleanPara) {
        markdown += `${cleanPara}\n\n`;
      }
    });
  }

  console.log('Generated markdown length:', markdown.length);

  return markdown;
}

// Create clean HTML content for PDF export
function createCleanHTMLForPDF() {
  console.log('Creating clean HTML for PDF...');

  // Clone the story editor to work with a copy
  const editorClone = storyEditor.cloneNode(true);

  // Remove all think sections from the clone
  const thinkSections = editorClone.querySelectorAll('.think-section, details.think-section');
  thinkSections.forEach(section => section.remove());

  // Remove inline prompt containers (not yet generated images)
  const inlinePrompts = editorClone.querySelectorAll('.inline-prompt-container');
  inlinePrompts.forEach(prompt => prompt.remove());

  console.log('Removed', thinkSections.length, 'think sections and', inlinePrompts.length, 'inline prompts');

  // Get all child nodes from the cleaned clone
  const childNodes = Array.from(editorClone.childNodes);

  // Build clean HTML by processing each node in order
  let html = `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #000000; background-color: #ffffff; padding: 20px;">
      <h1 style="text-align: center; margin-bottom: 20px; font-size: 18px; color: #000000;">Generated Story</h1>
      <p style="text-align: center; font-size: 10px; color: #666666; margin-bottom: 30px;">
        Created on: ${new Date().toLocaleString()}
      </p>
      <div style="font-size: 12px; line-height: 1.8;">
  `;

  // Process nodes to build the story with images in correct positions
  let textBuffer = '';

  for (const node of childNodes) {
    // Check if this is an image container
    if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('story-image-container')) {
      // Flush any accumulated text as a paragraph
      if (textBuffer.trim()) {
        const paragraphs = textBuffer.trim().split(/\n\s*\n+/);
        paragraphs.forEach(para => {
          const cleanPara = para.replace(/\s+/g, ' ').trim();
          if (cleanPara) {
            html += `<p style="margin-bottom: 12px; text-align: justify; color: #000000;">${cleanPara}</p>`;
          }
        });
        textBuffer = '';
      }

      // Add the image
      const img = node.querySelector('.story-image');
      if (img && img.src) {
        const caption = node.querySelector('.image-caption details p');
        html += `
          <div style="text-align: center; margin: 20px 0; page-break-inside: avoid;">
            <img src="${img.src}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
            ${caption ? `<p style="font-size: 10px; color: #666; margin-top: 8px; font-style: italic;">Prompt: ${caption.textContent}</p>` : ''}
          </div>
        `;
      }
    } else {
      // Accumulate text content from text nodes and spans
      let nodeText = '';

      if (node.nodeType === Node.TEXT_NODE) {
        nodeText = node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip BR tags and other non-content elements
        if (node.tagName === 'BR') {
          nodeText = '\n';
        } else if (node.tagName === 'SPAN') {
          nodeText = node.textContent;
        } else {
          nodeText = node.textContent;
        }
      }

      textBuffer += nodeText;
    }
  }

  // Flush any remaining text
  if (textBuffer.trim()) {
    const paragraphs = textBuffer.trim().split(/\n\s*\n+/);
    paragraphs.forEach(para => {
      const cleanPara = para.replace(/\s+/g, ' ').trim();
      if (cleanPara) {
        html += `<p style="margin-bottom: 12px; text-align: justify; color: #000000;">${cleanPara}</p>`;
      }
    });
  }

  html += '</div></div>';

  console.log('Generated HTML length:', html.length);

  return html;
}

// Frontend logic for opening story in a new tab
function openInNewTab() {
  const newTab = window.open('', '_blank');
  if (!newTab) {
    alert('Unable to open a new tab. Please check your browser settings.');
    return;
  }

  const storyContent = storyEditor.innerHTML;
  const imageContent = document.querySelector('.image-generation-toolbar img')?.outerHTML || '<p>No image available</p>';

  newTab.document.write(`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Full Story</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
        .story { margin-bottom: 20px; }
        .image { text-align: center; }
      </style>
    </head>
    <body>
      <div class="story">
        <h1>Full Story</h1>
        ${storyContent}
      </div>
      <div class="image">
        <h2>Generated Image</h2>
        ${imageContent}
      </div>
    </body>
    </html>
  `);
  newTab.document.close();
}

document.getElementById('openTabBtn').addEventListener('click', openInNewTab);

// Publish Story Functionality
function initializePublishButton() {
  console.log('Initializing publish functionality...');

  const publishBtn = document.getElementById('publishBtn');
  const publishModal = document.getElementById('publishModal');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelPublishBtn = document.getElementById('cancelPublish');
  const confirmPublishBtn = document.getElementById('confirmPublish');

  console.log('Publish button found:', !!publishBtn);
  console.log('Publish modal found:', !!publishModal);

  if (publishBtn) {
    console.log('Adding click listener to publish button');

    // Remove any existing listeners by cloning and replacing
    const newPublishBtn = publishBtn.cloneNode(true);
    publishBtn.parentNode.replaceChild(newPublishBtn, publishBtn);

    newPublishBtn.addEventListener('click', (e) => {
      console.log('Publish button clicked!');
      e.preventDefault();
      e.stopPropagation();

      if (publishModal) {
        console.log('Showing modal');
        publishModal.style.display = 'flex';
      } else {
        console.error('Modal not found!');
      }
    });
  } else {
    console.warn('Publish button not found in DOM');
  }

  if (closeModalBtn) {
    const newCloseBtn = closeModalBtn.cloneNode(true);
    closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);

    newCloseBtn.addEventListener('click', () => {
      if (publishModal) {
        publishModal.style.display = 'none';
      }
    });
  }

  if (cancelPublishBtn) {
    const newCancelBtn = cancelPublishBtn.cloneNode(true);
    cancelPublishBtn.parentNode.replaceChild(newCancelBtn, cancelPublishBtn);

    newCancelBtn.addEventListener('click', () => {
      if (publishModal) {
        publishModal.style.display = 'none';
      }
    });
  }

  if (confirmPublishBtn) {
    const newConfirmBtn = confirmPublishBtn.cloneNode(true);
    confirmPublishBtn.parentNode.replaceChild(newConfirmBtn, confirmPublishBtn);

    newConfirmBtn.addEventListener('click', publishStory);
  }
}

async function publishStory() {
  const title = document.getElementById('storyTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('storyDescription').value.trim();
  const coverImage = document.getElementById('coverImageUrl').value.trim();

  const statusEl = document.getElementById('publishStatus');

  if (!title) {
    statusEl.textContent = 'Please enter a story title';
    statusEl.style.color = 'var(--orange)';
    return;
  }

  if (!author) {
    statusEl.textContent = 'Please enter your name';
    statusEl.style.color = 'var(--orange)';
    return;
  }

  if (!description) {
    statusEl.textContent = 'Please enter a short description';
    statusEl.style.color = 'var(--orange)';
    return;
  }

  if (!currentStoryFolder) {
    statusEl.textContent = 'No story folder found';
    statusEl.style.color = 'var(--orange)';
    return;
  }

  try {
    statusEl.textContent = 'Publishing...';
    statusEl.style.color = 'var(--accent)';

    // Generate markdown export
    const markdown = createMarkdownExport();

    // First save the markdown file
    const exportResponse = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyFolder: currentStoryFolder,
        markdown: markdown
      })
    });

    if (!exportResponse.ok) {
      throw new Error('Failed to save markdown file');
    }

    // Then publish the story
    const response = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyFolder: currentStoryFolder,
        title: title,
        author: author,
        description: description,
        coverImage: coverImage
      })
    });

    const result = await response.json();

    if (response.ok) {
      statusEl.textContent = '✓ Story published successfully!';
      statusEl.style.color = 'var(--green)';

      setTimeout(() => {
        document.getElementById('publishModal').style.display = 'none';
        showImageStatus('✓ Story published! View it on the homepage.', 'success');
      }, 1500);
    } else {
      throw new Error(result.error || 'Failed to publish');
    }

  } catch (error) {
    console.error('Publish error:', error);
    statusEl.textContent = '✗ ' + error.message;
    statusEl.style.color = 'var(--orange)';
  }
}

// when init /creator, if there is a saved state in localStorage, restore it into the form
window.addEventListener('DOMContentLoaded', function() {
  const saved = localStorage.getItem('savedStoryForm');
  if (saved) {
    try {
      const { config, prompt } = JSON.parse(saved);
      // assign the value to the corresponding input fields (by id)
      if (prompt && prompt.prompt_text)
        document.getElementById('idea').value = prompt.prompt_text;
      if (config) {
        if (config.theme) document.getElementById('theme').value = config.theme;
        if (config.narration_style) document.getElementById('narration').value = config.narration_style;
        if (config.ending_type) document.getElementById('ending').value = config.ending_type;
        if (config.tone) document.getElementById('tone').value = config.tone;
        if (config.perspective_focus) document.getElementById('perspective').value = config.perspective_focus;
        if (config.length) document.getElementById('length').value = config.length;
        if (config.twist_option) document.getElementById('twist').value = config.twist_option;
        // genres, chars, content_level are chips, need to select again
        function restoreChips(container, values) {
          Array.from(container.querySelectorAll('.chip')).forEach(c => {
            if (values && values.includes(c.dataset.value)) c.classList.add('selected');
            else c.classList.remove('selected');
          });
        }
        restoreChips(document.getElementById('genres'), config.genres);
        restoreChips(document.getElementById('chars'), config.main_character_types);
        restoreChips(document.getElementById('contentLevel'), config.content_level);
      }
    } catch(_e) {}
    // remove the saved state to avoid bugs after reload
    localStorage.removeItem('savedStoryForm');
  }
});

