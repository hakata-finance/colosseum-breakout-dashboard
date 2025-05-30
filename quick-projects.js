#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Environment variable validation - REMOVE SOCIAL_API_KEY requirement
const requiredEnvVars = []; // Remove 'SOCIAL_API_KEY' from required vars
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please create a .env file based on env.example');
  process.exit(1);
}

// API Configuration from environment - ADD SOCIAL_API_ENABLED flag
const API_CONFIG = {
  SOCIAL_API_ENABLED: process.env.SOCIAL_API_ENABLED || false,
  SOCIAL_API_KEY: process.env.SOCIAL_API_KEY,
  SOCIAL_API_HOST_1: process.env.SOCIAL_API_HOST_1 || 'api.socialservice.dev',
  SOCIAL_API_HOST_2: process.env.SOCIAL_API_HOST_2 || 'batch.socialservice.dev',
  SOCIAL_API_KEY_HEADER: process.env.SOCIAL_API_KEY_HEADER || 'Bearer',
  SOCIAL_API_HOST_HEADER: process.env.SOCIAL_API_HOST_HEADER || 'Host',
  SOCIAL_USER_DETAILS_API: process.env.SOCIAL_USER_DETAILS_API || 'https://api.socialservice.dev/user/details',
  SOCIAL_BATCH_API: process.env.SOCIAL_BATCH_API || 'https://batch.socialservice.dev/get-users-v2',
  COLOSSEUM_API_URL: process.env.COLOSSEUM_API_URL || 'https://api.colosseum.org/api/projects',
  HACKATHON_ID: process.env.HACKATHON_ID || '4',
  PROJECT_LIMIT: process.env.PROJECT_LIMIT || '1450',
  // Rate limiting configuration
  RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY) || 2000, // 2 seconds between requests
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  RETRY_DELAY_BASE: parseInt(process.env.RETRY_DELAY_BASE) || 5000 // 5 seconds base delay
};

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  limit: 50,
  filter: {},
  export: null,
  trending: '1h',
  cache: false,
  offline: false,
  verbose: false,
  help: false
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];
  
  switch (arg) {
    case '--help':
    case '-h':
      options.help = true;
      break;
    case '--limit':
    case '-l':
      options.limit = parseInt(nextArg) || 100;
      i++;
      break;
    case '--track':
    case '-t':
      options.filter.track = nextArg;
      i++;
      break;
    case '--country':
    case '-c':
      options.filter.country = nextArg;
      i++;
      break;
    case '--search':
    case '-s':
      options.filter.search = nextArg;
      i++;
      break;
    case '--team-size':
      options.filter.teamSize = nextArg;
      i++;
      break;
    case '--min-likes':
      options.filter.minLikes = parseInt(nextArg) || 0;
      i++;
      break;
    case '--export':
    case '-e':
      options.export = nextArg;
      i++;
      break;
    case '--trending':
      options.trending = nextArg || '24h';
      i++;
      break;
    case '--offline':
      options.offline = true;
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
  }
}

// Show help
if (options.help) {
  console.log(`
🚀 Colosseum Projects Quick Viewer

USAGE:
  node quick-projects.js [OPTIONS]

OPTIONS:
  -h, --help              Show this help message
  -l, --limit <number>    Number of projects to show (default: 50)
  -t, --track <name>      Filter by track name
  -c, --country <name>    Filter by country
  -s, --search <term>     Search in project names/descriptions
  --team-size <size>      Filter by team size (1-5, 6-10, 11+)
  --min-likes <number>    Minimum likes required
  -e, --export <format>   Export data (csv, json, markdown)
  --trending <period>     Trending period (1h, 24h, 7d, 30d, all)
  --offline              Use only cached data
  -v, --verbose          Verbose output

SOCIAL MEDIA INTEGRATION:
  Social media data (followers/following) is optional and disabled by default.
  To enable, set SOCIAL_API_KEY in your .env file.

EXAMPLES:
  node quick-projects.js --limit 20 --track "DeFi"
  node quick-projects.js --country "United States" --min-likes 5
  node quick-projects.js --search "AI" --export csv
  node quick-projects.js --trending 7d --verbose
  node quick-projects.js --offline --limit 100
`);
  process.exit(0);
}

// ANSI color codes for nice output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Logging system
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  verbose: (msg) => options.verbose && console.log(`${colors.gray}🔍${colors.reset} ${msg}`),
  debug: (msg) => options.verbose && console.log(`${colors.dim}🐛 ${msg}${colors.reset}`)
};

// Helper functions
function formatTwitterUrl(handle) {
  if (!handle) return 'N/A';
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  return `https://social.platform/${cleanHandle}`;
}

function truncate(text, maxLength = 40) {
  if (!text) return 'N/A';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercentage(num, decimals = 1) {
  return `${num.toFixed(decimals)}%`;
}

function formatChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? `+${current}` : '0';
  const change = current - previous;
  const percentage = (change / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change} (${sign}${percentage.toFixed(1)}%)`;
}

// Simple sparkline generation
function generateSparkline(values, width = 10) {
  if (!values || values.length === 0) return '─'.repeat(width);
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) return '─'.repeat(width);
  
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  
  return values.slice(-width).map(val => {
    const normalized = (val - min) / range;
    const index = Math.floor(normalized * (chars.length - 1));
    return chars[index];
  }).join('');
}

// Database functions
function initializeDatabase() {
  const dbPath = path.join(__dirname, 'projects_tracking.db');
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    // Create projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      tracks TEXT,
      country TEXT,
      twitter_handle TEXT,
      twitter_user_id TEXT,
      twitter_followers INTEGER DEFAULT 0,
      twitter_following INTEGER DEFAULT 0,
      team_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add new columns if they don't exist (migrations)
    db.run(`ALTER TABLE projects ADD COLUMN description TEXT`, () => {});
    db.run(`ALTER TABLE projects ADD COLUMN twitter_user_id TEXT`, () => {});
    db.run(`ALTER TABLE projects ADD COLUMN twitter_followers INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE projects ADD COLUMN twitter_following INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE projects ADD COLUMN twitter_id_failed INTEGER DEFAULT 0`, () => {});
    
    // Create metrics table for tracking likes/comments over time
    db.run(`CREATE TABLE IF NOT EXISTS project_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);
    
    // Create Twitter metrics table for historical tracking
    db.run(`CREATE TABLE IF NOT EXISTS twitter_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      followers INTEGER DEFAULT 0,
      following INTEGER DEFAULT 0,
      tweets INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);
    
    // Create indexes for faster queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_project_date 
            ON project_metrics (project_id, recorded_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_twitter_project_date 
            ON twitter_metrics (project_id, recorded_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_projects_tracks 
            ON projects (tracks)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_projects_country 
            ON projects (country)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_projects_twitter_user_id 
            ON projects (twitter_user_id)`);
  });
  
  return db;
}

// Promisify database methods
function promisifyDb(db) {
  return {
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    run: promisify(db.run.bind(db)),
    close: promisify(db.close.bind(db))
  };
}

async function saveProjectsToDatabase(db, projects) {
  const dbAsync = promisifyDb(db);
  const timestamp = new Date().toISOString();
  let newProjects = 0;
  let updatedMetrics = 0;
  
  log.verbose(`Saving ${projects.length} projects to database`);
  
  for (const project of projects) {
    try {
      const tracks = project.tracks ? project.tracks.join(', ') : null;
      
      // Insert or update project
      await dbAsync.run(`INSERT OR REPLACE INTO projects 
        (id, name, slug, description, tracks, country, twitter_handle, twitter_user_id, twitter_followers, twitter_following, team_size, twitter_id_failed, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        project.id,
        project.name,
        project.slug,
        project.description || null,
        tracks,
        project.country,
        project.twitterHandle,
        project.twitterUserId || null,
        project.twitterFollowers || 0,
        project.twitterFollowing || 0,
        project.teamSize || null,
        project.twitterIdFailed ? 1 : 0,
        timestamp
      ]);
      
      // Insert current metrics
      await dbAsync.run(`INSERT INTO project_metrics 
        (project_id, likes, comments, recorded_at) 
        VALUES (?, ?, ?, ?)`, [
        project.id,
        project.likes || 0,
        project.comments || 0,
        timestamp
      ]);
      
      // Insert Twitter metrics if we have Twitter data
      if (project.twitterFollowers || project.twitterFollowing) {
        await dbAsync.run(`INSERT INTO twitter_metrics 
          (project_id, followers, following, tweets, recorded_at) 
          VALUES (?, ?, ?, ?, ?)`, [
          project.id,
          project.twitterFollowers || 0,
          project.twitterFollowing || 0,
          project.twitterTweets || 0,
          timestamp
        ]);
      }
      
      updatedMetrics++;
    } catch (error) {
      log.error(`Error saving project ${project.name}: ${error.message}`);
    }
  }
  
  return { newProjects, updatedMetrics };
}

async function getProjectTrends(db, period = '1h', limit = 10) {
  const dbAsync = promisifyDb(db);
  
  // Calculate time threshold based on period
  let hoursBack;
  switch (period) {
    case '1h': hoursBack = 1; break;
    case '24h': hoursBack = 24; break;
    case '7d': hoursBack = 24 * 7; break;
    case '30d': hoursBack = 24 * 30; break;
    case 'all': hoursBack = 24 * 365; break;
    default: hoursBack = 1;
  }
  
  const timeThreshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  
  try {
    const query = `
      WITH time_filtered_metrics AS (
        SELECT 
          project_id,
          likes,
          comments,
          recorded_at,
          ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY recorded_at DESC) as rn_desc,
          ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY recorded_at ASC) as rn_asc
        FROM project_metrics 
        WHERE recorded_at >= ?
      ),
      latest_metrics AS (
        SELECT * FROM time_filtered_metrics WHERE rn_desc = 1
      ),
      earliest_metrics AS (
        SELECT * FROM time_filtered_metrics WHERE rn_asc = 1
      )
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.tracks,
        p.country,
        l.likes as current_likes,
        l.comments as current_comments,
        e.likes as start_likes,
        e.comments as start_comments,
        (l.likes - e.likes) as likes_change,
        (l.comments - e.comments) as comments_change,
        l.recorded_at as latest_time,
        e.recorded_at as earliest_time
      FROM projects p
      JOIN latest_metrics l ON p.id = l.project_id
      JOIN earliest_metrics e ON p.id = e.project_id
      WHERE (l.likes - e.likes) > 0 OR (l.comments - e.comments) > 0
      ORDER BY 
        (l.likes - e.likes) DESC, 
        (l.comments - e.comments) DESC, 
        l.likes DESC
      LIMIT ?
    `;
    
    const trends = await dbAsync.all(query, [timeThreshold, limit]);
    
    // Get historical data for sparklines
    for (const trend of trends) {
      const historyQuery = `
        SELECT likes, comments, recorded_at 
        FROM project_metrics 
        WHERE project_id = ? AND recorded_at >= ?
        ORDER BY recorded_at ASC
      `;
      const history = await dbAsync.all(historyQuery, [trend.id, timeThreshold]);
      trend.history = history;
    }
    
    return trends;
  } catch (error) {
    log.error(`Error getting trends: ${error.message}`);
    return [];
  }
}

async function getProjectMetrics(db, projectId) {
  const dbAsync = promisifyDb(db);
  
  try {
    const metrics = await dbAsync.all(`
      SELECT likes, comments, recorded_at 
      FROM project_metrics 
      WHERE project_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 30
    `, [projectId]);
    
    return metrics;
  } catch (error) {
    log.error(`Error getting metrics for project ${projectId}: ${error.message}`);
    return [];
  }
}

// File management
function findMostRecentJsonFile() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) return null;
  
  const files = fs.readdirSync(dataDir)
    .filter(file => file.startsWith('colosseum_all_projects_') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(dataDir, file),
      mtime: fs.statSync(path.join(dataDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  return files.length > 0 ? files[0].path : null;
}

// API functions with retry logic

// Utility function for API calls with retry and exponential backoff
async function apiCallWithRetry(apiCall, maxRetries = API_CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      
      // If we get a rate limit error, wait and retry
      if (result && result.status === 429) {
        const delay = API_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1); // Exponential backoff
        log.warning(`Rate limit hit, waiting ${delay/1000}s before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we get an auth error, don't retry
      if (result && result.status === 401) {
        log.error('Authentication error - check your API key');
        return null;
      }
      
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = API_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      log.warning(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay/1000}s: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// Social Media API functions
// Note: Uses custom social media API service - all endpoints and authentication configurable via environment variables
async function getSocialUserDetails(username) {
  if (!API_CONFIG.SOCIAL_API_ENABLED) {
    log.verbose('Social media API disabled - skipping user details fetch');
    return null;
  }
  
  if (!username) return null;
  
  let cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  // Remove any URL prefixes from social media platforms
  cleanUsername = cleanUsername.replace(/^https?:\/\/[^\/]+\//, '');
  
  // Remove query parameters (everything after ? or &)
  cleanUsername = cleanUsername.split('?')[0].split('&')[0];
  
  // Remove trailing slashes and other junk
  cleanUsername = cleanUsername.replace(/\/$/, '');
  
  // Remove any remaining URL fragments or special characters that aren't valid in social media handles
  cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_]/g, '');
  
  // Social media handles must be 1-15 characters and can't be empty
  if (!cleanUsername || cleanUsername.length === 0 || cleanUsername.length > 15) {
    log.warning(`Invalid social media handle after cleaning: "${username}" -> "${cleanUsername}"`);
    return null;
  }
  
  const url = `${API_CONFIG.SOCIAL_USER_DETAILS_API}?username=${cleanUsername}`;
  
  const options = {
    method: 'GET',
    headers: {
      [API_CONFIG.SOCIAL_API_KEY_HEADER]: API_CONFIG.SOCIAL_API_KEY,
      [API_CONFIG.SOCIAL_API_HOST_HEADER]: API_CONFIG.SOCIAL_API_HOST_1
    }
  };

  try {
    log.verbose(`Fetching social media user ID for @${cleanUsername} (cleaned from: ${username})`);
    
    const result = await apiCallWithRetry(async () => {
      const response = await fetch(url, options);
      return {
        status: response.status,
        ok: response.ok,
        response: response
      };
    });
    
    if (!result || !result.ok) {
      if (result && result.status === 429) {
        log.warning(`Rate limit exceeded for @${cleanUsername} after retries`);
      } else if (result && result.status === 401) {
        log.warning(`Authentication failed for @${cleanUsername}`);
      } else {
        log.warning(`Social media API error for @${cleanUsername}: ${result ? result.status : 'unknown'}`);
      }
      return null;
    }
    
    const resultText = await result.response.text();
    log.verbose(`Social media API response for @${cleanUsername}: ${resultText.substring(0, 200)}...`);
    
    const data = JSON.parse(resultText);
    
    // Handle the nested structure: data.user.result
    if (data && data.data && data.data.user && data.data.user.result) {
      const userResult = data.data.user.result;
      
      // Check if user is suspended or unavailable
      if (userResult.__typename === "UserUnavailable") {
        log.warning(`Social media user @${cleanUsername} is unavailable: ${userResult.message}`);
        return null;
      }
      
      const userData = {
        userId: userResult.rest_id,
        username: userResult.legacy?.screen_name || cleanUsername
      };
      
      log.verbose(`Got social media user ID for @${cleanUsername}: ${userData.userId}`);
      return userData;
    }
    
    log.warning(`No valid data structure found for @${cleanUsername}`);
    return null;
  } catch (error) {
    log.error(`Error fetching social media user ID for @${cleanUsername}: ${error.message}`);
    return null;
  }
}

async function getSocialUsersBatch(userIds) {
  if (!API_CONFIG.SOCIAL_API_ENABLED) {
    log.verbose('Social media API disabled - skipping batch fetch');
    return {};
  }
  
  if (!userIds || userIds.length === 0) return {};
  
  const idsString = userIds.join('%2C');
  const url = `${API_CONFIG.SOCIAL_BATCH_API}?users=${idsString}`;
  
  const options = {
    method: 'GET',
    headers: {
      [API_CONFIG.SOCIAL_API_KEY_HEADER]: API_CONFIG.SOCIAL_API_KEY,
      [API_CONFIG.SOCIAL_API_HOST_HEADER]: API_CONFIG.SOCIAL_API_HOST_2
    }
  };

  try {
    log.verbose(`Fetching batch social media data for ${userIds.length} users`);
    log.verbose(`Batch API URL: ${url}`);
    
    const result = await apiCallWithRetry(async () => {
      const response = await fetch(url, options);
      return {
        status: response.status,
        ok: response.ok,
        response: response
      };
    });
    
    if (!result || !result.ok) {
      if (result && result.status === 429) {
        log.warning(`Batch API rate limit exceeded after retries`);
      } else if (result && result.status === 401) {
        log.warning(`Batch API authentication failed`);
      } else {
        log.warning(`Social media batch API error: ${result ? result.status : 'unknown'}`);
      }
      return {};
    }
    
    const resultText = await result.response.text();
    log.verbose(`Social media batch API response: ${resultText}`);
    
    const data = JSON.parse(resultText);
    const userMap = {};
    
    // Check if we have the expected data structure
    if (!data) {
      log.warning('Batch API returned null/undefined result');
      return {};
    }
    
    // The API returns data in 'result' field, not 'data'
    const users = data.result || data.data;
    
    if (!users) {
      log.warning('Batch API response missing result/data field');
      log.verbose(`Full response structure: ${JSON.stringify(data, null, 2)}`);
      return {};
    }
    
    if (!Array.isArray(users)) {
      log.warning('Batch API users field is not an array');
      log.verbose(`Users field type: ${typeof users}, value: ${JSON.stringify(users)}`);
      return {};
    }
    
    users.forEach(user => {
      if (user && (user.id || user.id_str)) {
        const userId = user.id_str || user.id.toString();
        userMap[userId] = {
          followers: user.followers_count || user.public_metrics?.followers_count || 0,
          following: user.friends_count || user.public_metrics?.following_count || 0,
          tweets: user.statuses_count || user.public_metrics?.tweet_count || 0
        };
        log.verbose(`Mapped user ${userId}: ${userMap[userId].followers} followers, ${userMap[userId].following} following`);
      } else {
        log.warning(`Invalid user object in batch response: ${JSON.stringify(user)}`);
      }
    });
    
    log.verbose(`Batch social media data: ${Object.keys(userMap).length} users updated out of ${userIds.length} requested`);
    
    if (Object.keys(userMap).length === 0 && userIds.length > 0) {
      log.warning('No users were successfully mapped from batch response');
      log.verbose(`Requested IDs: ${userIds.join(', ')}`);
    }
    
    return userMap;
  } catch (error) {
    log.error(`Error fetching batch social media data: ${error.message}`);
    log.verbose(`Error stack: ${error.stack}`);
    return {};
  }
}

async function fetchProjectsFromAPI() {
  log.info('Fetching projects from Colosseum API...');
  
  const apiUrl = `${API_CONFIG.COLOSSEUM_API_URL}?hackathonId=${API_CONFIG.HACKATHON_ID}&limit=${API_CONFIG.PROJECT_LIMIT}&showWinnersOnly=false&sort=RANDOM`;
  
  try {
    log.verbose(`API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result || !result.projects || result.projects.length === 0) {
      throw new Error('No projects found in API response');
    }
    
    log.success(`Successfully fetched ${result.projects.length} projects from API`);
    return result.projects;
    
  } catch (error) {
    log.error(`Failed to fetch from API: ${error.message}`);
    throw error;
  }
}

function loadProjectsFromCache() {
  const jsonFile = findMostRecentJsonFile();
  if (!jsonFile) {
    throw new Error('No cached data found');
  }
  
  log.info(`Using cached data from: ${path.basename(jsonFile)}`);
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  return data.projects || data;
}

// Filtering functions
function applyFilters(projects, filters) {
  let filtered = [...projects];
  
  if (filters.track) {
    filtered = filtered.filter(p => 
      p.tracks && p.tracks.some(track => 
        track.toLowerCase().includes(filters.track.toLowerCase())
      )
    );
    log.verbose(`Filtered by track "${filters.track}": ${filtered.length} projects`);
  }
  
  if (filters.country) {
    filtered = filtered.filter(p => 
      p.country && p.country.toLowerCase().includes(filters.country.toLowerCase())
    );
    log.verbose(`Filtered by country "${filters.country}": ${filtered.length} projects`);
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm))
    );
    log.verbose(`Filtered by search "${filters.search}": ${filtered.length} projects`);
  }
  
  if (filters.teamSize) {
    const size = filters.teamSize;
    filtered = filtered.filter(p => {
      if (!p.teamSize) return false;
      if (size === '1-5') return p.teamSize >= 1 && p.teamSize <= 5;
      if (size === '6-10') return p.teamSize >= 6 && p.teamSize <= 10;
      if (size === '11+') return p.teamSize >= 11;
      return true;
    });
    log.verbose(`Filtered by team size "${filters.teamSize}": ${filtered.length} projects`);
  }
  
  if (filters.minLikes) {
    filtered = filtered.filter(p => (p.likes || 0) >= filters.minLikes);
    log.verbose(`Filtered by min likes ${filters.minLikes}: ${filtered.length} projects`);
  }
  
  return filtered;
}

// Export functions
function exportToCSV(projects, filename) {
  const headers = [
    'Rank', 'Name', 'Likes', 'Comments', 'Tracks', 'Country', 
    'Twitter Handle', 'Followers', 'Following', 'Arena URL'
  ];
  
  const rows = projects.map((project, index) => [
    index + 1,
    `"${project.name || ''}"`,
    project.likes || 0,
    project.comments || 0,
    `"${project.tracks ? project.tracks.join(', ') : ''}"`,
    `"${project.country || ''}"`,
    `"${project.twitterHandle || ''}"`,
    project.twitterFollowers || 0,
    project.twitterFollowing || 0,
    `"https://arena.colosseum.org/projects/explore/${project.slug}"`
  ]);
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  fs.writeFileSync(filename, csv);
  log.success(`Exported to ${filename}`);
}

function exportToJSON(projects, filename) {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_projects: projects.length,
    projects: projects.map((project, index) => ({
      rank: index + 1,
      ...project,
      arena_url: `https://arena.colosseum.org/projects/explore/${project.slug}`
    }))
  };
  
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
  log.success(`Exported to ${filename}`);
}

function exportToMarkdown(projects, filename) {
  const lines = [
    '# Colosseum Projects Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total Projects: ${projects.length}`,
    '',
    '## Top Projects',
    '',
    '| Rank | Name | Likes | Comments | Tracks | Country |',
    '|------|------|-------|----------|--------|---------|'
  ];
  
  projects.slice(0, 50).forEach((project, index) => {
    const name = project.name || 'N/A';
    const likes = project.likes || 0;
    const comments = project.comments || 0;
    const tracks = project.tracks ? project.tracks.join(', ') : 'N/A';
    const country = project.country || 'N/A';
    
    lines.push(`| ${index + 1} | ${name} | ${likes} | ${comments} | ${tracks} | ${country} |`);
  });
  
  fs.writeFileSync(filename, lines.join('\n'));
  log.success(`Exported to ${filename}`);
}

// Display functions
function displayProjectsTable(projects, trends = []) {
  const trendMap = new Map(trends.map(t => [t.id, t]));
  
  console.log(`${colors.bright}${colors.cyan}📊 PROJECTS SORTED BY LIKES${colors.reset}\n`);
  
  // Table header
  const header = `${colors.bright}${colors.white}` +
    `${'RANK'.padEnd(5)} ` +
    `${'LIKES'.padEnd(6)} ` +
    `${'TREND'.padEnd(7)} ` +
    `${'COMMENTS'.padEnd(9)} ` +
    `${'PROJECT NAME'.padEnd(32)} ` +
    `${'TRACKS'.padEnd(20)} ` +
    `${'COUNTRY'.padEnd(12)} ` +
    `${'FOLLOWERS'.padEnd(10)} ` +
    `${'FOLLOWING'.padEnd(10)}` +
    `${colors.reset}`;
  
  console.log(header);
  console.log(`${colors.white}${'─'.repeat(127)}${colors.reset}`);
  
  projects.forEach((project, i) => {
    const rank = (i + 1).toString().padEnd(5);
    const likes = formatNumber(project.likes || 0).padEnd(6);
    
    // Get trending data for this project
    const trendData = trendMap.get(project.id);
    let trendDisplay = '0';
    if (trendData && trendData.likes_change > 0) {
      trendDisplay = `${colors.green}+${trendData.likes_change}${colors.reset}`;
    } else if (trendData && trendData.likes_change < 0) {
      trendDisplay = `${colors.red}${trendData.likes_change}${colors.reset}`;
    }
    const trend = trendDisplay.padEnd(7 + (trendDisplay.includes('\x1b') ? 9 : 0)); // Account for color codes
    
    const comments = formatNumber(project.comments || 0).padEnd(9);
    
    const name = truncate(project.name, 30).padEnd(32);
    const tracks = truncate(project.tracks ? project.tracks.join(', ') : 'N/A', 18).padEnd(20);
    const country = truncate(project.country || 'N/A', 10).padEnd(12);
    const followers = formatNumber(project.twitterFollowers || 0).padEnd(10);
    const following = formatNumber(project.twitterFollowing || 0).padEnd(10);
    
    // Color coding based on likes and special highlighting
    let rankColor = colors.white;
    let isHakata = project.name && project.name.toLowerCase().includes('hakata finance');
    
    if (isHakata) {
      rankColor = colors.bgYellow + colors.bright; // Highlight Hakata Finance
    } else if (i === 0) {
      rankColor = colors.yellow + colors.bright; // Gold for #1
    } else if (i === 1) {
      rankColor = colors.white + colors.bright; // Silver for #2
    } else if (i === 2) {
      rankColor = colors.yellow; // Bronze for #3
    } else if (project.likes >= 20) {
      rankColor = colors.green;
    } else if (project.likes >= 10) {
      rankColor = colors.cyan;
    } else if (project.likes >= 5) {
      rankColor = colors.blue;
    }
    
    console.log(`${rankColor}${rank} ${likes} ${trend} ${comments} ${name} ${tracks} ${country} ${followers} ${following}${colors.reset}`);
  });
  
  console.log(`${colors.white}${'─'.repeat(127)}${colors.reset}\n`);
}

function displaySummaryStats(projects, filtered) {
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = projects.reduce((sum, p) => sum + (p.comments || 0), 0);
  const avgLikes = projects.length > 0 ? (totalLikes / projects.length).toFixed(1) : '0';
  const avgComments = projects.length > 0 ? (totalComments / projects.length).toFixed(1) : '0';
  const projectsWithLikes = projects.filter(p => (p.likes || 0) > 0).length;
  const projectsWithComments = projects.filter(p => (p.comments || 0) > 0).length;
  
  console.log(`${colors.bright}${colors.cyan}📈 SUMMARY STATISTICS${colors.reset}`);
  
  if (filtered.length !== projects.length) {
    console.log(`${colors.green}Showing: ${colors.white}${formatNumber(filtered.length)} of ${formatNumber(projects.length)} projects${colors.reset}`);
  } else {
    console.log(`${colors.green}Total Projects: ${colors.white}${formatNumber(projects.length)}${colors.reset}`);
  }
  
  console.log(`${colors.green}Total Likes: ${colors.white}${formatNumber(totalLikes)}${colors.reset}`);
  console.log(`${colors.green}Total Comments: ${colors.white}${formatNumber(totalComments)}${colors.reset}`);
  console.log(`${colors.green}Average Likes: ${colors.white}${avgLikes}${colors.reset}`);
  console.log(`${colors.green}Average Comments: ${colors.white}${avgComments}${colors.reset}`);
  console.log(`${colors.green}Projects with Likes: ${colors.white}${formatNumber(projectsWithLikes)} (${formatPercentage(projectsWithLikes/projects.length*100)})${colors.reset}`);
  console.log(`${colors.green}Projects with Comments: ${colors.white}${formatNumber(projectsWithComments)} (${formatPercentage(projectsWithComments/projects.length*100)})${colors.reset}`);
}

function displayTopPerformers(projects) {
  const sortedByLikes = [...projects].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  const sortedByComments = [...projects].sort((a, b) => (b.comments || 0) - (a.comments || 0));
  
  console.log(`\n${colors.bright}${colors.magenta}🏆 TOP PERFORMERS${colors.reset}`);
  console.log(`${colors.yellow}Most Liked: ${colors.white}${sortedByLikes[0].name} ${colors.cyan}(${sortedByLikes[0].likes} likes)${colors.reset}`);
  console.log(`${colors.yellow}Most Commented: ${colors.white}${sortedByComments[0].name} ${colors.cyan}(${sortedByComments[0].comments} comments)${colors.reset}`);
}

function displayTrackAnalysis(projects) {
  const trackCounts = {};
  projects.forEach(project => {
    if (project.tracks) {
      project.tracks.forEach(track => {
        if (!trackCounts[track]) trackCounts[track] = { count: 0, likes: 0, comments: 0 };
        trackCounts[track].count++;
        trackCounts[track].likes += (project.likes || 0);
        trackCounts[track].comments += (project.comments || 0);
      });
    }
  });
  
  console.log(`\n${colors.bright}${colors.blue}🎯 TOP TRACKS BY ENGAGEMENT${colors.reset}`);
  Object.entries(trackCounts)
    .sort(([,a], [,b]) => b.likes - a.likes)
    .slice(0, 8)
    .forEach(([track, data]) => {
      const avgLikes = (data.likes / data.count).toFixed(1);
      const avgComments = (data.comments / data.count).toFixed(1);
      console.log(`${colors.cyan}${track}: ${colors.white}${formatNumber(data.likes)} likes, ${formatNumber(data.comments)} comments ${colors.gray}(${data.count} projects, ${avgLikes}/${avgComments} avg)${colors.reset}`);
    });
}

// Progress bar
function showProgress(current, total, message = '') {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${colors.cyan}${message} ${colors.white}[${bar}] ${percentage}%${colors.reset}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

// Main function
async function main() {
  console.log(`${colors.cyan}${colors.bright}🚀 Colosseum Projects Quick Viewer${colors.reset}\n`);
  
  // Initialize database
  log.verbose('Initializing database...');
  const db = initializeDatabase();
  
  let projects;
  
  try {
    if (options.offline) {
      log.info('Running in offline mode');
      projects = loadProjectsFromCache();
    } else {
      try {
        projects = await fetchProjectsFromAPI();
        log.success(`Fetched ${formatNumber(projects.length)} projects from API`);
        
        // Fetch Twitter user IDs for projects that don't have them stored
        log.verbose('Fetching Twitter user IDs...');
        await fetchTwitterDataForProjects(db, projects);
        
        // Save to database (this saves the user IDs we just fetched)
        log.verbose('Saving to database...');
        const dbResult = await saveProjectsToDatabase(db, projects);
        log.verbose(`Database updated: ${dbResult.updatedMetrics} metrics recorded`);
        
      } catch (error) {
        log.warning(`API fetch failed: ${error.message}`);
        log.info('Trying to use cached data...');
        
        projects = loadProjectsFromCache();
        log.success(`Loaded ${formatNumber(projects.length)} projects from cache`);
        
        // Still try to load Twitter user IDs from database for cached data
        await fetchTwitterDataForProjects(db, projects);
      }
    }
    
    // Apply filters
    const filteredProjects = applyFilters(projects, options.filter);
    
    if (filteredProjects.length === 0) {
      log.warning('No projects match the specified filters');
      db.close();
      return;
    }
    
    // Sort projects by likes (descending)
    const sortedProjects = filteredProjects.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    const displayProjects = sortedProjects.slice(0, options.limit);
    
    // Fetch current Twitter follower data ONLY for projects being displayed
    log.verbose('Fetching current Twitter follower data for displayed projects...');
    await fetchTwitterFollowerDataForDisplayedProjects(displayProjects);
    
    // Get trending data
    log.verbose(`Getting trending data for ${options.trending} period...`);
    const trends = await getProjectTrends(db, options.trending, Math.min(20, options.limit));
    
    // Display results
    displayProjectsTable(displayProjects, trends);
    displaySummaryStats(projects, filteredProjects);
    // displayTopPerformers(filteredProjects);
    displayTrackAnalysis(filteredProjects);
    
    // Export if requested
    if (options.export) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `colosseum_export_${timestamp}.${options.export}`;
      
      switch (options.export) {
        case 'csv':
          exportToCSV(displayProjects, filename);
          break;
        case 'json':
          exportToJSON(displayProjects, filename);
          break;
        case 'markdown':
        case 'md':
          exportToMarkdown(displayProjects, filename);
          break;
        default:
          log.error(`Unsupported export format: ${options.export}`);
      }
    }
    
    log.success('Analysis complete!');
    
  } catch (error) {
    log.error(`Failed to load projects: ${error.message}`);
    if (!options.offline) {
      log.info('💡 Try running with --offline flag to use cached data');
    }
    process.exit(1);
  } finally {
    db.close();
  }
}

async function fetchTwitterDataForProjects(db, projects) {
  if (!API_CONFIG.SOCIAL_API_ENABLED) {
    log.info('Social media API disabled - skipping Twitter data fetch');
    return;
  }
  
  const dbAsync = promisifyDb(db);
  
  // Step 1: Load existing Twitter data from database (including failed attempts)
  log.verbose('Loading existing Twitter data from database...');
  const existingTwitterData = await dbAsync.all(`
    SELECT id, twitter_user_id, twitter_handle, twitter_id_failed 
    FROM projects 
    WHERE (twitter_user_id IS NOT NULL AND twitter_user_id != '') OR twitter_id_failed = 1
  `);
  
  const existingUserIdMap = new Map();
  const failedUserIdMap = new Map();
  
  existingTwitterData.forEach(row => {
    if (row.twitter_user_id) {
      existingUserIdMap.set(row.id, row.twitter_user_id);
    }
    if (row.twitter_id_failed === 1) {
      failedUserIdMap.set(row.id, true);
    }
  });
  
  log.verbose(`Found ${existingTwitterData.length} projects with existing Twitter data in database`);
  log.verbose(`Found ${failedUserIdMap.size} projects marked as failed for Twitter ID lookup`);
  
  // Step 2: Identify projects that need Twitter user IDs (excluding failed ones)
  const projectsNeedingUserIds = projects.filter(project => 
    project.twitterHandle && 
    project.twitterHandle.trim() !== '' && 
    !existingUserIdMap.has(project.id) &&
    !failedUserIdMap.has(project.id)  // Skip projects we've already failed on
  );
  
  log.verbose(`Found ${projectsNeedingUserIds.length} projects needing Twitter user IDs (excluding ${failedUserIdMap.size} previously failed)`);
  
  // Step 3: Fetch user IDs for projects that don't have them (rate limited)
  let newUserIdsFetched = 0;
  let newFailures = 0;
  
  if (projectsNeedingUserIds.length > 0) {
    log.info(`Processing ${projectsNeedingUserIds.length} social media profiles with rate limiting...`);
  }
  
  for (let i = 0; i < projectsNeedingUserIds.length; i++) {
    const project = projectsNeedingUserIds[i];
    
    // Show progress for larger batches
    if (projectsNeedingUserIds.length > 5) {
      showProgress(i + 1, projectsNeedingUserIds.length, `Fetching social media data`);
    }
    
    log.verbose(`Fetching social media user ID for: ${project.twitterHandle} (${project.name})`);
    
    const twitterData = await getSocialUserDetails(project.twitterHandle);
    if (twitterData && twitterData.userId) {
      // Store the user ID in database
      await dbAsync.run(`UPDATE projects SET twitter_user_id = ?, twitter_id_failed = 0 WHERE id = ?`, [
        twitterData.userId, 
        project.id
      ]);
      
      // Add to our map for immediate use
      existingUserIdMap.set(project.id, twitterData.userId);
      newUserIdsFetched++;
      
      log.verbose(`Stored social media user ID ${twitterData.userId} for ${project.name}`);
    } else {
      // Mark as failed so we don't try again
      await dbAsync.run(`UPDATE projects SET twitter_id_failed = 1 WHERE id = ?`, [project.id]);
      failedUserIdMap.set(project.id, true);
      project.twitterIdFailed = true;
      newFailures++;
      
      log.warning(`Could not get social media user ID for ${project.twitterHandle} (${project.name}) - marked as failed`);
    }
    
    // Rate limiting delay between requests
    if (i < projectsNeedingUserIds.length - 1) {
      log.verbose(`Rate limiting: waiting ${API_CONFIG.RATE_LIMIT_DELAY/1000}s before next request`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMIT_DELAY));
    }
  }
  
  log.success(`Fetched ${newUserIdsFetched} new Twitter user IDs, marked ${newFailures} as failed`);
  
  // Step 4: Set user IDs and failed flags on all projects from our maps
  projects.forEach(project => {
    if (existingUserIdMap.has(project.id)) {
      project.twitterUserId = existingUserIdMap.get(project.id);
    }
    if (failedUserIdMap.has(project.id)) {
      project.twitterIdFailed = true;
    }
  });
  
  log.verbose(`Set Twitter user IDs on ${projects.filter(p => p.twitterUserId).length} projects`);
  log.verbose(`Marked ${projects.filter(p => p.twitterIdFailed).length} projects as failed for Twitter lookup`);
}

async function fetchTwitterFollowerDataForDisplayedProjects(projects) {
  if (!API_CONFIG.SOCIAL_API_ENABLED) {
    log.verbose('Social media API disabled - skipping follower data fetch');
    return;
  }
  
  // Get all projects that have Twitter user IDs
  const projectsWithUserIds = projects.filter(p => p.twitterUserId);
  
  if (projectsWithUserIds.length === 0) {
    log.verbose('No projects with Twitter user IDs to fetch follower data for');
    return;
  }
  
  log.verbose(`Fetching current Twitter follower data for ${projectsWithUserIds.length} projects`);
  
  // Batch fetch Twitter data in chunks of 100 (API limit)
  const chunkSize = 100;
  let totalUpdated = 0;
  
  for (let i = 0; i < projectsWithUserIds.length; i += chunkSize) {
    const chunk = projectsWithUserIds.slice(i, i + chunkSize);
    const userIds = chunk.map(p => p.twitterUserId);
    
    log.verbose(`Fetching batch ${Math.floor(i/chunkSize) + 1}/${Math.ceil(projectsWithUserIds.length/chunkSize)} (${userIds.length} users)`);
    
    const batchData = await getSocialUsersBatch(userIds);
    
    // Update projects with fresh Twitter data
    chunk.forEach(project => {
      const twitterData = batchData[project.twitterUserId];
      if (twitterData) {
        project.twitterFollowers = twitterData.followers;
        project.twitterFollowing = twitterData.following;
        project.twitterTweets = twitterData.tweets;
        totalUpdated++;
        
        log.verbose(`Updated ${project.name}: ${twitterData.followers} followers, ${twitterData.following} following`);
      } else {
        // Set defaults if no data returned
        project.twitterFollowers = 0;
        project.twitterFollowing = 0;
        project.twitterTweets = 0;
        log.warning(`No Twitter data returned for ${project.name} (ID: ${project.twitterUserId})`);
      }
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + chunkSize < projectsWithUserIds.length) {
      log.verbose(`Rate limiting: waiting ${API_CONFIG.RATE_LIMIT_DELAY/1000}s before next batch`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMIT_DELAY));
    }
  }
  
  log.success(`Updated Twitter follower data for ${totalUpdated} projects`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down gracefully...${colors.reset}`);
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run the script
main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});