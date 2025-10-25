import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3030;
const __dirname = path.resolve();

// Load config
let appConfig = { apiKey: '', apiEndpoint: '', agent: '' };
try {
  const configPath = path.join(__dirname, 'app_config.json');
  if (fs.existsSync(configPath)) {
    appConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.error('Failed to load app_config.json:', err.message);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function pad(n){ return String(n).padStart(2, '0'); }
function isoDatetime(){
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

app.post('/save', async (req, res) => {
  try {
    const { config, prompt } = req.body;
    if (!prompt || !prompt.prompt_text) {
      return res.status(400).json({ error: 'Missing prompt_text' });
    }

    const dt = isoDatetime();
    const folderName = `story_${dt}`;
    const storyDir = path.join(dataDir, folderName);

    // Create story folder
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    config.created_at = config.created_at || new Date().toISOString();
    prompt.created_at = prompt.created_at || new Date().toISOString();

    // Merge config and prompt into one file
    const mergedData = {
      prompt: prompt,
      config: config,
      created_at: new Date().toISOString()
    };

    const dataPath = path.join(storyDir, 'story_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(mergedData, null, 2));

    return res.json({
      message: 'Saved successfully',
      storyFolder: folderName,
      dataFile: 'story_data.json'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save markdown export
app.post('/export', async (req, res) => {
  try {
    const { storyFolder, markdown } = req.body;
    if (!storyFolder || !markdown) {
      return res.status(400).json({ error: 'Missing storyFolder or markdown' });
    }

    const storyDir = path.join(dataDir, storyFolder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    const mdPath = path.join(storyDir, 'story.md');
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    return res.json({
      message: 'Markdown saved successfully',
      file: 'story.md'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish story
app.post('/api/publish', async (req, res) => {
  try {
    const { storyFolder, title, author, description, coverImage } = req.body;

    if (!storyFolder || !title || !author || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const storyDir = path.join(dataDir, storyFolder);
    const dataPath = path.join(storyDir, 'story_data.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'Story data not found' });
    }

    // Read existing data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Add publish info
    data.published = true;
    data.title = title;
    data.author = author;
    data.description = description;
    data.coverImage = coverImage || '';
    data.publishedAt = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return res.json({
      message: 'Story published successfully',
      folder: storyFolder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all published stories
app.get('/api/stories', async (req, res) => {
  try {
    const folders = fs.readdirSync(dataDir).filter(f => {
      const stat = fs.statSync(path.join(dataDir, f));
      return stat.isDirectory();
    });

    const stories = [];

    for (const folder of folders) {
      const dataPath = path.join(dataDir, folder, 'story_data.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Only include published stories
        if (data.published) {
          stories.push({
            folder: folder,
            title: data.title || 'Untitled Story',
            author: data.author || 'Anonymous',
            description: data.description || 'No description',
            coverImage: data.coverImage || '',
            publishedAt: data.publishedAt || data.created_at,
            createdAt: data.created_at
          });
        }
      }
    }

    // Sort by published date, newest first
    stories.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return res.json(stories);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single story data
app.get('/api/story/:folder', async (req, res) => {
  try {
    const { folder } = req.params;
    const dataPath = path.join(dataDir, folder, 'story_data.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    if (!data.published) {
      return res.status(403).json({ error: 'Story not published' });
    }

    return res.json({
      title: data.title,
      author: data.author,
      description: data.description,
      coverImage: data.coverImage,
      publishedAt: data.publishedAt,
      createdAt: data.created_at
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get story markdown content
app.get('/api/story/:folder/content', async (req, res) => {
  try {
    const { folder } = req.params;
    const mdPath = path.join(dataDir, folder, 'story.md');

    if (!fs.existsSync(mdPath)) {
      return res.status(404).send('Story content not found');
    }

    const markdown = fs.readFileSync(mdPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    return res.send(markdown);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Serve config to frontend
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: appConfig.apiKey,
    apiEndpoint: appConfig.apiEndpoint,
    agent: appConfig.agent
  });
});

// Serve the creator page at /creator
app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'creator.html'));
});

// Serve the story viewer at /story
app.get('/story', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'story.html'));
});

// Serve generated files
app.use('/data', express.static(dataDir));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
