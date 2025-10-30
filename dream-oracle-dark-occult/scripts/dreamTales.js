// Dream Tales - AI-powered dream storytelling and visualization

let currentStory = '';
let generatedScenes = [];
let currentCharacter = '';

// Character prompts for random selection
const CHARACTER_PROMPTS = [
    {
        name: 'Dark Sorceress',
        userTitle: 'Mortal',
        prompt: `You are a powerful dark sorceress and dream-seer. Your voice is chilling, seductive, and ominous, as though each word is whispered from the shadows. You interpret dreams with gothic poetic flair, revealing hidden fears and forbidden truths. Emphasize danger, transformation, and the cost of ignoring dark omens. Use vivid sensory detail: blood moons, ravens, bones, ancient curses. Deliver a foreboding prophecy or warning at the end of each interpretation.
Call the user "Mortal".`
    },
    {
        name: 'Friendly Mystic',
        userTitle: 'Seeker of Light',
        prompt: `You are a gentle and wise mystic who interprets dreams through lyrical poetry. Your tone is warm, spiritual, and filled with hope. Compare dream symbols to elements of nature: the moon, flowing water, blooming flowers. Provide emotional insight and uplifting guidance. Always conclude with a soft blessing or affirmation that inspires the user.
Call the user "Seeker of Light".`
    },
    {
        name: 'Playful Witch',
        userTitle: 'Dream Traveler',
        prompt: `You are a comforting but mischievous witch who interprets dreams with humor, charm, and magical curiosity. You speak with delight and sparkle while still offering meaningful emotional guidance. Use imagery like dancing fireflies, talking animals, and enchanted cozy cottages. End each reading with a playful charm or little spell for good luck.
Call the user "Dream Traveler".`
    }
];

// Get random character
function getRandomCharacter() {
    return CHARACTER_PROMPTS[Math.floor(Math.random() * CHARACTER_PROMPTS.length)];
}

// UI Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const dreamInput = document.getElementById('dreamInput');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const storySection = document.getElementById('storySection');
const storyContent = document.getElementById('storyContent');
const storyLoadingAnimation = document.getElementById('storyLoadingAnimation');
const oracleName = document.getElementById('oracleName');
const oracleNameText = document.getElementById('oracleNameText');
const generateImageBtn = document.getElementById('generateImageBtn');
const imagesSection = document.getElementById('imagesSection');
const imageGrid = document.getElementById('imageGrid');

// Event Listeners
generateBtn.addEventListener('click', generateDreamStory);
generateImageBtn.addEventListener('click', generateDreamImages);

// Generate dream story using streaming API
async function generateDreamStory() {
    const dreamPrompt = dreamInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        status.textContent = '⚠️ An API key is required to unlock the Oracle';
        status.style.color = '#f97316';
        return;
    }

    if (!dreamPrompt) {
        status.textContent = '⚠️ The Oracle requires your vision, Seeker';
        status.style.color = '#f97316';
        return;
    }

    // Reset UI
    generateBtn.disabled = true;
    status.textContent = '🔮 Consulting the arcane spirits...';
    status.style.color = '#ba55d3';
    storyContent.textContent = '';
    storyContent.style.display = 'none';
    currentStory = '';
    storySection.classList.add('visible');
    storyLoadingAnimation.classList.add('visible');
    imagesSection.classList.remove('visible');

    // Select random character for this interpretation
    currentCharacter = getRandomCharacter();
    console.log(`🔮 Oracle speaks as: ${currentCharacter.name}`);

    // Show oracle name with appropriate icon
    let icon = '';
    if (currentCharacter.name === 'Dark Sorceress') {
        icon = '🌑';
    } else if (currentCharacter.name === 'Friendly Mystic') {
        icon = '✨';
    } else {
        icon = '🧙';
    }
    oracleNameText.textContent = `${icon} Speaking through the ${currentCharacter.name}`;
    oracleName.style.display = 'block';

    try {
        const promptText = `${currentCharacter.prompt}

Transform this dream into a mystical interpretation (approximately 400-600 words). Weave the narrative with symbolic meaning and mystical wisdom. Address the user directly and reveal the hidden truths within their vision.

Dream: ${dreamPrompt}

Begin your interpretation with a dramatic opening that matches your character, then describe the dream's symbols and their mystical meanings. End with clear guidance and advice befitting your persona.`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: promptText
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let insideThinkTag = false;
        let firstContent = true;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                status.textContent = '✨ The Oracle has spoken. The visions are revealed.';
                status.style.color = '#4ade80';
                generateBtn.disabled = false;
                storyLoadingAnimation.classList.remove('visible');
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6);
                        if (jsonStr.trim() === '[DONE]') continue;

                        const data = JSON.parse(jsonStr);

                        let content = '';
                        if (data.content) {
                            content = data.content;
                        } else if (data.choices && data.choices[0]?.delta?.content) {
                            content = data.choices[0].delta.content;
                        } else if (data.delta?.content) {
                            content = data.delta.content;
                        }

                        if (content) {
                            // Filter out <think> tags
                            let displayContent = '';

                            for (let i = 0; i < content.length; i++) {
                                if (!insideThinkTag && content.substring(i).startsWith('<think>')) {
                                    insideThinkTag = true;
                                    i += 6;
                                    continue;
                                }

                                if (insideThinkTag && content.substring(i).startsWith('</think>')) {
                                    insideThinkTag = false;
                                    i += 7;
                                    continue;
                                }

                                if (!insideThinkTag) {
                                    displayContent += content[i];
                                }
                            }

                            if (displayContent) {
                                // Hide loading animation on first content
                                if (firstContent) {
                                    storyLoadingAnimation.classList.remove('visible');
                                    storyContent.style.display = 'block';
                                    firstContent = false;
                                }

                                currentStory += displayContent;
                                storyContent.textContent = currentStory;
                                storyContent.scrollTop = storyContent.scrollHeight;
                            }
                        }
                    } catch (e) {
                        console.debug('Skipping line:', line);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error generating story:', error);
        status.textContent = '✗ The spirits resist... The veil remains closed: ' + error.message;
        status.style.color = '#f97316';
        generateBtn.disabled = false;
        storyLoadingAnimation.classList.remove('visible');
        storyContent.style.display = 'block';
    }
}

// Extract visual scenes from story for image generation
function extractScenesFromStory() {
    // Split story into sentences and extract key visual moments
    const sentences = currentStory.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Select 3-4 diverse scenes from different parts of the story
    const scenes = [];
    const indices = [
        Math.floor(sentences.length * 0.2),  // Early scene
        Math.floor(sentences.length * 0.5),  // Middle scene
        Math.floor(sentences.length * 0.8)   // Late scene
    ];

    indices.forEach((idx, i) => {
        if (sentences[idx]) {
            scenes.push({
                text: sentences[idx].trim(),
                position: ['beginning', 'middle', 'end'][i]
            });
        }
    });

    return scenes;
}

// Generate images for dream scenes
async function generateDreamImages() {
    if (!currentStory) {
        status.textContent = '⚠️ The Oracle must speak before visions can manifest';
        status.style.color = '#f97316';
        return;
    }

    generateImageBtn.disabled = true;
    status.textContent = '🌙 Invoking the ritual of manifestation...';
    status.style.color = '#ba55d3';

    imagesSection.classList.add('visible');
    imageGrid.innerHTML = '';
    generatedScenes = [];

    // Extract key scenes
    const scenes = extractScenesFromStory();

    if (scenes.length === 0) {
        status.textContent = '⚠️ The visions elude our sight';
        status.style.color = '#f97316';
        generateImageBtn.disabled = false;
        return;
    }

    status.textContent = `🔮 Manifesting ${scenes.length} prophetic visions...`;

    // Generate images for each scene
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        // Create placeholder
        const container = document.createElement('div');
        container.className = 'image-container';
        container.innerHTML = `
            <div class="status">Scene ${i + 1} - ${scene.position}</div>
            <div class="loading">
                <dotlottie-wc
                    src="https://lottie.host/108f7318-0557-4b90-bdee-ab15d6d14d16/Blz7j2Ilhy.lottie"
                    style="width: 150px; height: 150px"
                    autoplay
                    loop>
                </dotlottie-wc>
                <div class="loading-text">Generating image...</div>
            </div>
        `;
        imageGrid.appendChild(container);

        try {
            // Generate image prompt
            const imagePrompt = await generateImagePrompt(scene.text);

            // Generate image
            const imageUrl = await generateImage(imagePrompt, container);

            if (imageUrl) {
                container.innerHTML = `
                    <img src="${imageUrl}" alt="Dream scene ${i + 1}" />
                    <div class="status">✓ ${scene.position} scene</div>
                `;
                generatedScenes.push({ scene: scene.text, imageUrl });
            }

        } catch (error) {
            console.error('Error generating image:', error);
            container.innerHTML = `
                <div class="status">✗ The vision fades...</div>
                <div style="color: #f97316; font-size: 12px;">${error.message}</div>
            `;
        }
    }

    status.textContent = `✨ ${generatedScenes.length} visions have materialized from the ethereal realm`;
    status.style.color = '#4ade80';
    generateImageBtn.disabled = false;
}

// Generate image prompt from scene text
async function generateImagePrompt(sceneText) {
    // Select random character for image aesthetic (can be different from story character for variety)
    const imageCharacter = getRandomCharacter();

    let aestheticGuidance = '';
    if (imageCharacter.name === 'Dark Sorceress') {
        aestheticGuidance = 'Gothic, dark, ominous aesthetic with blood moons, ravens, bones, shadows, ancient curses, and foreboding atmosphere. Colors: deep crimson, black, purple shadows.';
    } else if (imageCharacter.name === 'Friendly Mystic') {
        aestheticGuidance = 'Warm, spiritual, hopeful aesthetic with flowing water, blooming flowers, soft moonlight, natural elements, and uplifting atmosphere. Colors: soft blues, gentle purples, golden light, ethereal whites.';
    } else {
        aestheticGuidance = 'Whimsical, enchanting, cozy aesthetic with dancing fireflies, talking animals, enchanted cottages, playful magic, and charming atmosphere. Colors: warm oranges, magical greens, sparkling golds, cozy browns.';
    }

    const promptText = `You are a mystical artist channeling visions from the dream realm. Create a detailed image generation prompt for this prophetic scene. Return ONLY the image prompt.

Scene: ${sceneText}

Aesthetic Style: ${aestheticGuidance}

Format: Describe the visual scene in detail with the specified aesthetic. Include: subjects, actions, atmosphere, lighting, colors, and mystical elements. Make it dreamlike, cinematic, and visually striking.`;

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        throw new Error('API key is missing');
    }

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [{
                role: 'user',
                content: [{
                    type: 'text',
                    text: promptText
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let prompt = '';
    let insideThinkTag = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const jsonStr = line.slice(6);
                    if (jsonStr.trim() === '[DONE]') continue;

                    const data = JSON.parse(jsonStr);
                    let content = data.content || data.choices?.[0]?.delta?.content || data.delta?.content || '';

                    if (content) {
                        for (let i = 0; i < content.length; i++) {
                            if (!insideThinkTag && content.substring(i).startsWith('<think>')) {
                                insideThinkTag = true;
                                i += 6;
                                continue;
                            }
                            if (insideThinkTag && content.substring(i).startsWith('</think>')) {
                                insideThinkTag = false;
                                i += 7;
                                continue;
                            }
                            if (!insideThinkTag) {
                                prompt += content[i];
                            }
                        }
                    }
                } catch (e) {
                    console.debug('Skipping line');
                }
            }
        }
    }

    return prompt.trim();
}

// Generate image using API
async function generateImage(prompt, statusContainer) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        throw new Error('API key is missing');
    }

    try {
        // Submit image generation request
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const requestId = data.request_id;

        if (!requestId) {
            throw new Error('No request ID returned');
        }

        // Poll for result
        return await pollForImageResult(requestId, statusContainer);

    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

// Poll for image generation result
async function pollForImageResult(requestId, statusContainer) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        throw new Error('API key is missing');
    }
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(
                `/api/image-result?request_id=${requestId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                const imageUrl = data.result_url || data.result_image_url || data.result_video_url;
                if (imageUrl) {
                    return imageUrl;
                } else {
                    throw new Error('No image URL in response');
                }
            } else if (data.status === 'error') {
                throw new Error('Image generation failed');
            } else if (data.status === 'pending' || data.status === 'processing' || data.status === 'queued') {
                // Update status
                if (statusContainer) {
                    const loadingText = statusContainer.querySelector('.loading-text');
                    if (loadingText) {
                        loadingText.textContent = `${data.status}... (${attempts * 5}s)`;
                    }
                }

                // Wait and try again
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
                continue;
            }

        } catch (error) {
            console.error('Polling error:', error);
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('Image generation timed out');
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    throw new Error('Image generation timed out');
}
