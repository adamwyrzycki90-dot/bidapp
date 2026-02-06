// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000',
  dashboardUrl: 'http://localhost:5173'
};

// State
let config = { ...DEFAULT_CONFIG };
let authToken = null;
let currentUser = null;
let currentJd = null;
let currentJdLink = null;

// DOM Elements
const authView = document.getElementById('authView');
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const settingsForm = document.getElementById('settingsForm');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await checkAuth();
  setupEventListeners();
});

// Load configuration from storage
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['config', 'authToken', 'currentUser']);
    if (result.config) config = { ...DEFAULT_CONFIG, ...result.config };
    if (result.authToken) authToken = result.authToken;
    if (result.currentUser) currentUser = result.currentUser;
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Save configuration to storage
async function saveConfig() {
  try {
    await chrome.storage.local.set({ config });
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Save auth data
async function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  try {
    await chrome.storage.local.set({ authToken, currentUser });
  } catch (error) {
    console.error('Error saving auth:', error);
  }
}

// Clear auth data
async function clearAuth() {
  authToken = null;
  currentUser = null;
  try {
    await chrome.storage.local.remove(['authToken', 'currentUser']);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

// Check authentication status
async function checkAuth() {
  if (authToken && currentUser) {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        showMainView();
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    await clearAuth();
  }
  showAuthView();
}

// View management
function showAuthView() {
  authView.classList.remove('hidden');
  mainView.classList.add('hidden');
  settingsView.classList.add('hidden');
}

function showMainView() {
  authView.classList.add('hidden');
  mainView.classList.remove('hidden');
  settingsView.classList.add('hidden');
  document.getElementById('userName').textContent = currentUser?.full_name || 'User';
}

function showSettingsView() {
  authView.classList.add('hidden');
  mainView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  document.getElementById('apiUrl').value = config.apiUrl;
  document.getElementById('dashboardUrl').value = config.dashboardUrl;
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tab.dataset.tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      }
    });
  });

  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Register form
  registerForm.addEventListener('submit', handleRegister);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', showSettingsView);
  document.getElementById('cancelSettings').addEventListener('click', () => {
    if (authToken) showMainView();
    else showAuthView();
  });
  settingsForm.addEventListener('submit', handleSaveSettings);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Scrape button
  document.getElementById('scrapeBtn').addEventListener('click', handleScrape);

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', handleGenerate);

  // Manual JD input
  document.getElementById('manualJd').addEventListener('input', (e) => {
    currentJd = e.target.value;
    updateGenerateButton();
  });

  document.getElementById('manualJdLink').addEventListener('input', (e) => {
    currentJdLink = e.target.value;
  });

  // Quick links
  document.getElementById('openDashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: config.dashboardUrl });
  });

  document.getElementById('viewHistoryLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${config.dashboardUrl}/history` });
  });

  document.getElementById('editProfileLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${config.dashboardUrl}/profile` });
  });

  document.getElementById('dashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: config.dashboardUrl });
  });
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    await saveAuth(data.token, data.user);
    showMainView();
  } catch (error) {
    alert(error.message);
  }
}

// Handle register
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const full_name = document.getElementById('regName').value;

  try {
    const response = await fetch(`${config.apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');

    await saveAuth(data.token, data.user);
    showMainView();
    alert('Registration successful! Please complete your profile in the dashboard for best results.');
    chrome.tabs.create({ url: `${config.dashboardUrl}/profile` });
  } catch (error) {
    alert(error.message);
  }
}

// Handle logout
async function handleLogout() {
  await clearAuth();
  showAuthView();
}

// Handle save settings
async function handleSaveSettings(e) {
  e.preventDefault();
  config.apiUrl = document.getElementById('apiUrl').value || DEFAULT_CONFIG.apiUrl;
  config.dashboardUrl = document.getElementById('dashboardUrl').value || DEFAULT_CONFIG.dashboardUrl;
  await saveConfig();
  alert('Settings saved!');
  if (authToken) showMainView();
  else showAuthView();
}

// Handle scrape
async function handleScrape() {
  const btn = document.getElementById('scrapeBtn');
  btn.disabled = true;
  btn.textContent = 'Scraping...';

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentJdLink = tab.url;

    // Inject content script and get JD
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeJobDescription
    });

    if (results && results[0] && results[0].result) {
      const { jobDescription, jobTitle } = results[0].result;
      currentJd = jobDescription;

      document.getElementById('scrapedInfo').classList.remove('hidden');
      document.getElementById('detectedJob').textContent = jobTitle || 'Job posting detected';
      document.getElementById('jdContent').value = jobDescription;

      updateGenerateButton();
    } else {
      throw new Error('Could not detect job description on this page');
    }
  } catch (error) {
    alert(error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      Scrape Job Description
    `;
  }
}

// Scrape function to be injected into the page
function scrapeJobDescription() {
  // Common job description selectors for various job sites
  const selectors = [
    // LinkedIn
    '.jobs-description__content',
    '.jobs-box__html-content',
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    // Glassdoor
    '.jobDescriptionContent',
    '#JobDescriptionContainer',
    // Monster
    '.job-description',
    // ZipRecruiter
    '.job_description',
    // Workday
    '[data-automation-id="jobPostingDescription"]',
    // Greenhouse
    '#content .content',
    // Lever
    '.posting-page .content',
    // Generic
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    'article.job',
    '.job-details',
    '.description'
  ];

  let jobDescription = '';
  let jobTitle = '';

  // Try to find job title
  const titleSelectors = [
    '.jobs-unified-top-card__job-title',
    '.jobsearch-JobInfoHeader-title',
    '.job-title',
    '[class*="job-title"]',
    'h1'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      jobTitle = el.textContent.trim();
      break;
    }
  }

  // Try to find job description
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > 100) {
      jobDescription = el.textContent.trim();
      break;
    }
  }

  // Fallback: get main content
  if (!jobDescription) {
    const main = document.querySelector('main') || document.querySelector('article') || document.body;
    jobDescription = main.textContent.trim().substring(0, 10000);
  }

  // Clean up whitespace
  jobDescription = jobDescription.replace(/\s+/g, ' ').trim();

  return { jobDescription, jobTitle };
}

// Update generate button state
function updateGenerateButton() {
  const btn = document.getElementById('generateBtn');
  const jdContent = document.getElementById('jdContent')?.value || '';
  const manualJd = document.getElementById('manualJd')?.value || '';
  
  btn.disabled = !(currentJd || jdContent || manualJd);
}

// Handle generate
async function handleGenerate() {
  const btn = document.getElementById('generateBtn');
  const statusSection = document.getElementById('statusSection');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultSection = document.getElementById('resultSection');
  const errorSection = document.getElementById('errorSection');

  // Get JD content
  const jdContent = document.getElementById('jdContent')?.value || 
                    document.getElementById('manualJd')?.value || 
                    currentJd;

  if (!jdContent) {
    alert('Please scrape or enter a job description first');
    return;
  }

  // Show loading
  btn.disabled = true;
  statusSection.classList.remove('hidden');
  loadingIndicator.classList.remove('hidden');
  resultSection.classList.add('hidden');
  errorSection.classList.add('hidden');

  try {
    const response = await fetch(`${config.apiUrl}/api/cv/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        jobDescription: jdContent,
        jdLink: currentJdLink || document.getElementById('manualJdLink')?.value || ''
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate CV');

    // Show result
    loadingIndicator.classList.add('hidden');
    resultSection.classList.remove('hidden');

    document.getElementById('downloadDoc').href = `${config.apiUrl}${data.application.cvDocUrl}`;
    document.getElementById('downloadPdf').href = `${config.apiUrl}${data.application.cvPdfUrl}`;

  } catch (error) {
    loadingIndicator.classList.add('hidden');
    errorSection.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = error.message;
  } finally {
    btn.disabled = false;
  }
}
