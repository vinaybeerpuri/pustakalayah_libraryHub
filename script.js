// --- CONFIG ---
// Set API_BASE to the backend server URL for production.
// Main frontend script for Pustakalayah LibraryHub
// Clean, consolidated version with API and demo fallback

// --- CONFIG ---
// Set API_BASE to the backend server URL for production.
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000'
  : '';

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (API_BASE) return API_BASE.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
  return path.startsWith('/') ? path.slice(1) : path;
}

// Make buildUrl globally accessible
window.buildUrl = buildUrl;

function navigateTo(filename) {
  if (window.location.pathname.includes('/pages/')) {
    window.location.href = `./${filename}`;
  } else {
    window.location.href = `pages/${filename}`;
  }
}


const DEFAULT_AVATARS = ['book1.svg','book2.svg','book3.svg','book4.svg','book5.svg','book6.svg','book7.svg','book8.svg'];

// Demo API fallback when API_BASE is empty
async function api(path, options = {}) {
  // Debug: log API calls to help diagnose 'Failed to fetch' issues when running from file://
  try { console.debug('api()', { path, apiBase: API_BASE, method: (options.method || 'GET') }); } catch (e) {}

  // Treat explicit empty string (or all-whitespace) as "no backend" (demo mode)
  if (typeof API_BASE === 'string' && API_BASE.trim() === '') {
    // Prevent automatic persistent login in demo mode
    // (we only authenticate when user submits the login form)
    const method = (options.method || 'GET').toUpperCase();
    let body;
    if (options.body && !(options.body instanceof FormData)) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (e) {
        body = undefined;
      }
    }
    function loadDemoUsers() {
      try {
        let users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        if (!Array.isArray(users)) users = [];

        // Ensure a default admin user exists in demo mode
        const hasAdmin = users.some(u => u && u.username === 'admin');
        if (!hasAdmin) {
          users.unshift({
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin',
            role: 'admin',
            member_since: new Date().toISOString()
          });
        }

        localStorage.setItem('demo_users', JSON.stringify(users));
        return users;
      } catch(e) {
        return [];
      }
    }
    function saveDemoUsers(list) { localStorage.setItem('demo_users', JSON.stringify(list)); }
    function getCurrentDemoUser() {
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        return u && u.id ? u : null;
      } catch (e) {
        return null;
      }
    }
    function loadDemoWishlist(userId) {
      if (!userId) return [];
      try {
        return JSON.parse(localStorage.getItem('demo_wishlist_' + userId) || '[]');
      } catch (e) {
        return [];
      }
    }
    function saveDemoWishlist(userId, list) {
      if (!userId) return;
      localStorage.setItem('demo_wishlist_' + userId, JSON.stringify(list));
    }
    function loadDemoBooks() {
      try {
        const books = JSON.parse(localStorage.getItem('demo_books') || '[]');
        if (!books.length) {
          const defaultBooks = [
            { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'fiction', description: 'A story of decadence and excess.', image: 'https://m.media-amazon.com/images/I/71a7t1okN0L._SX331_BO1,204,203,200_.jpg' },
            { id: 2, title: 'Harry Potter', author: 'J.K. Rowling', category: 'fiction', description: 'A young wizard\'s adventures.', image: 'https://m.media-amazon.com/images/I/51UoqRAxwEL._SX331_BO1,204,203,200_.jpg' },
            { id: 3, title: 'Clean Code', author: 'Robert C. Martin', category: 'technology', description: 'A handbook of agile software craftsmanship.', image: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX331_BO1,204,203,200_.jpg' },
            { id: 4, title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'fiction', description: 'A fantasy adventure about a hobbit\'s journey.', image: 'https://m.media-amazon.com/images/I/51eqN1QeQUL._SX331_BO1,204,203,200_.jpg' },
            { id: 5, title: 'Action Heroes', author: 'John Smith', category: 'action', description: 'An thrilling action-packed adventure.', image: 'https://m.media-amazon.com/images/I/51wvB4aJLAL._SX331_BO1,204,203,200_.jpg' },
            { id: 6, title: 'Love Story', author: 'Jane Doe', category: 'romance', description: 'A heartwarming tale of romance and destiny.', image: 'https://m.media-amazon.com/images/I/51gI0bGq4IL._SX331_BO1,204,203,200_.jpg' },
            { id: 7, title: 'Mystery Mansion', author: 'Detective Brown', category: 'mystery', description: 'A puzzling mystery that will keep you guessing.', image: 'https://m.media-amazon.com/images/I/51U0qLSq1NL._SX331_BO1,204,203,200_.jpg' },
            { id: 8, title: 'Super Adventures', author: 'Comic Writer', category: 'comic', description: 'An exciting comic book adventure.', image: 'https://m.media-amazon.com/images/I/51kPZ8jFTAL._SX331_BO1,204,203,200_.jpg' }
          ];
          localStorage.setItem('demo_books', JSON.stringify(defaultBooks));
          return defaultBooks;
        }
        return books;
      } catch(e) { return []; }
    }
    function saveDemoBooks(list) { localStorage.setItem('demo_books', JSON.stringify(list)); }
    function loadDemoBorrowings() { try { return JSON.parse(localStorage.getItem('demo_borrowings') || '[]'); } catch(e) { return []; } }
    function saveDemoBorrowings(list) { localStorage.setItem('demo_borrowings', JSON.stringify(list)); }

    if (path.includes('/api/users/login') && method === 'POST') {
      let username, password;
      
      // Handle both JSON body and FormData
      if (options.body instanceof FormData) {
        username = options.body.get('username');
        password = options.body.get('password');
      } else {
        const { username: u, password: p } = body || {};
        username = u;
        password = p;
      }
      
      console.log('Demo login attempt:', { username, password: '***' });
      
      const users = loadDemoUsers();
      console.log('Available users:', users.map(u => ({ username: u.username, hasPassword: !!u.password })));
      
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) {
        console.log('User not found or password mismatch');
        throw new Error('Invalid username or password');
      }
      
      const respUser = { ...user }; delete respUser.password;
      console.log('Login successful for user:', respUser.username);
      return { token: 'demo-token', user: respUser };
    }

    if (path.includes('/api/users/register') && method === 'POST') {
      let username, email, password, avatar;

      // Handle both JSON body and FormData
      if (options.body instanceof FormData) {
        username = options.body.get('username');
        email = options.body.get('email');
        password = options.body.get('password');
        avatar = options.body.get('avatar');
      } else {
        ({ username, email, password, avatar } = body || {});
      }
      if (!username || !email || !password) throw new Error('Missing fields');
      const users = loadDemoUsers();
      if (users.find(u => u.username === username)) throw new Error('Username already exists');
      if (users.find(u => u.email === email)) throw new Error('Email already exists');

      // Get pending avatar if exists
      const pendingAvatar = localStorage.getItem('pendingAvatarFile') || localStorage.getItem('pendingAvatarChoice');

      const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        avatar: pendingAvatar || avatar || null,
        role: 'member',
        member_since: new Date().toISOString()
      };
      users.push(newUser);
      saveDemoUsers(users);

      // Clear pending avatars after successful registration
      localStorage.removeItem('pendingAvatarFile');
      localStorage.removeItem('pendingAvatarChoice');

      const { password: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword, token: 'demo-token-' + Date.now() };
    }

    if (path.includes('/api/users') && method === 'GET') {
      return loadDemoUsers().map(u => { const { password, ...rest } = u; return rest; });
    }

    if (path.match(/\/api\/users\/\d+\/avatar/) && method === 'POST') {
      const userId = path.match(/\/api\/users\/(\d+)\/avatar/)[1];
      const { avatarUrl } = body || {};
      if (!avatarUrl) throw new Error('Avatar URL is required');

      const users = loadDemoUsers();
      const userIndex = users.findIndex(u => u.id === parseInt(userId));
      if (userIndex === -1) throw new Error('User not found');

      users[userIndex].avatar = avatarUrl;
      saveDemoUsers(users);

      const user = users[userIndex];
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    }

    // Demo: support PUT /api/users/:id to update profile (name, email, avatar)
    if (path.match(/\/api\/users\/\d+(?:$|\?)/) && method === 'PUT') {
      const userId = path.match(/\/api\/users\/(\d+)/)[1];
      const { name, email, avatar } = body || {};
      const users = loadDemoUsers();
      const idx = users.findIndex(u => u.id === parseInt(userId));
      if (idx === -1) throw new Error('User not found');
      if (name !== undefined) users[idx].name = name;
      if (email !== undefined) users[idx].email = email;
      if (avatar !== undefined) users[idx].avatar = avatar;
      saveDemoUsers(users);
      const { password: _, ...userWithoutPassword } = users[idx];
      return userWithoutPassword;
    }
    // Demo: current user profile
    if (path === '/api/users/me' && method === 'GET') {
      const current = getCurrentDemoUser();
      if (!current) throw new Error('Not logged in');
      const { password: _, ...userWithoutPassword } = current;
      return userWithoutPassword;
    }
    // Demo: wishlist list/load
    if (path === '/api/users/wishlist' && method === 'GET') {
      const current = getCurrentDemoUser();
      if (!current) throw new Error('Not logged in');
      const list = loadDemoWishlist(current.id);
      return { success: true, wishlist: list };
    }
    // Demo: add to wishlist
    if (path === '/api/users/wishlist' && method === 'POST') {
      const current = getCurrentDemoUser();
      if (!current) throw new Error('Not logged in');
      let book_id, book_title, book_author;
      if (options.body instanceof FormData) {
        book_id = parseInt(options.body.get('book_id'));
        book_title = options.body.get('book_title');
        book_author = options.body.get('book_author');
      } else {
        ({ book_id, book_title, book_author } = body || {});
      }
      if (!book_id) throw new Error('Missing book_id');
      const list = loadDemoWishlist(current.id);
      if (list.some(it => it.book_id === book_id)) {
        return { success: true, wishlist_item: list.find(it => it.book_id === book_id) };
      }
      const item = {
        id: Date.now(),
        user_id: current.id,
        book_id,
        book_title,
        book_author,
        added_date: new Date().toISOString()
      };
      list.push(item);
      saveDemoWishlist(current.id, list);
      return { success: true, wishlist_item: item };
    }
    // Demo: remove from wishlist
    if (path.match(/\/api\/users\/wishlist\/\d+$/) && method === 'DELETE') {
      const current = getCurrentDemoUser();
      if (!current) throw new Error('Not logged in');
      const bookId = parseInt(path.split('/').pop());
      let list = loadDemoWishlist(current.id);
      list = list.filter(it => it.book_id !== bookId);
      saveDemoWishlist(current.id, list);
      return { success: true };
    }
    // Demo: check wishlist status
    if (path.match(/\/api\/users\/wishlist\/check\/\d+$/) && method === 'GET') {
      const current = getCurrentDemoUser();
      if (!current) return { in_wishlist: false };
      const bookId = parseInt(path.split('/').pop());
      const list = loadDemoWishlist(current.id);
      return { in_wishlist: list.some(it => it.book_id === bookId) };
    }
    // Demo book catalog
    if (path === '/api/books' && method === 'GET') {
      return loadDemoBooks();
    }

    // Demo borrowing system
    if (path === '/api/borrowing/borrow' && method === 'POST') {
      const { user_id, book_id, book_title, book_author } = body || {};
      const borrowings = loadDemoBorrowings();
      const newBorrowing = {
        id: Date.now(),
        user_id,
        book_id,
        book_title,
        book_author,
        status: 'borrowed',
        borrow_date: new Date().toISOString(),
        return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };
      borrowings.push(newBorrowing);
      saveDemoBorrowings(borrowings);
      return newBorrowing;
    }

    if (path.startsWith('/api/borrowing/return/') && method === 'PUT') {
      const borrowId = parseInt(path.split('/').pop());
      const borrowings = loadDemoBorrowings();
      const index = borrowings.findIndex(b => b.id === borrowId);
      if (index === -1) throw new Error('Borrow record not found');
      if (borrowings[index].status === 'returned') throw new Error('Book already returned');
      borrowings[index].status = 'returned';
      borrowings[index].return_date = new Date().toISOString();
      saveDemoBorrowings(borrowings);
      return { success: true, ...borrowings[index] };
    }

    if (path.includes('/api/borrowing/user/') && method === 'GET') {
      const userId = parseInt(path.split('/').pop());
      const borrowings = loadDemoBorrowings();
      return borrowings.filter(b => b.user_id === userId);
    }

    throw new Error('No backend configured for this endpoint in demo mode');
  }

  // Real backend path
  try {
    const token = localStorage.getItem('token');
    const url = buildUrl(path);
    console.debug('api -> fetch', { url });
    let headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) , ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, {
      headers,
      ...options
    });
    if (!res.ok) {
      let data; 
      try { 
        data = await res.json(); 
        console.error('API Error Response:', data);
      } catch(e) { 
        console.error('Failed to parse error response:', e);
        throw new Error('Request failed'); 
      }
      let errorMsg = data.error;
      if (!errorMsg && data.detail) {
        if (typeof data.detail === 'string') errorMsg = data.detail;
        else if (Array.isArray(data.detail)) errorMsg = data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        else errorMsg = JSON.stringify(data.detail);
      }
      if (!errorMsg) errorMsg = JSON.stringify(data);
      console.error('Extracted error message:', errorMsg);
      throw new Error(errorMsg);
    }
    try { return await res.json(); } catch { return null; }
  } catch (err) {
    console.error('API error', err);
    // Normalize network errors so UI shows clearer message
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Network error: failed to reach backend. If you intended to run without a backend, ensure API_BASE is empty.');
    }
    throw err;
  }
}

// --- STATE ---
let activeUser = null;
// books array is now defined inside DOMContentLoaded to avoid conflicts
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let borrowRecords = [];

// Generate a circular initials avatar as data URL
function generateInitialsAvatar(name, size = 64) {
  try {
    const initials = (name || '').split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('') || 'U';
    // deterministic background color from name
    let hash = 0; for (let i=0;i<name.length;i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    const bg = `hsl(${hue} 60% 65%)`;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = bg; ctx.fillRect(0,0,size,size);
    // circle mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // draw initials
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.floor(size*0.45)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initials, size/2, size/2);
    return canvas.toDataURL('image/png');
  } catch (e) {
    return 'https://via.placeholder.com/48?text=U';
  }
}

// Update profile fields with user data
function updateProfileFields(user) {
  if (!user) return;
  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  
  if (profileNameInput) profileNameInput.value = user.name || user.username || '';
  if (profileEmailInput) profileEmailInput.value = user.email || '';
  // Always use avatar from user object (stored in backend per user)
  // Clear the image first to force refresh and avoid showing wrong avatar
  if (profileAvatar) {
    if (user.avatar) {
      // Build full URL for avatar if it's a relative path
      let avatarUrl = user.avatar;
      if (avatarUrl.startsWith('/uploads/')) {
        avatarUrl = buildUrl(avatarUrl);
      }
      // Add cache-busting parameter to force browser to reload the image
      const separator = avatarUrl.includes('?') ? '&' : '?';
      profileAvatar.src = avatarUrl + separator + '_t=' + Date.now();
    } else {
      // Reset to default if no avatar
      profileAvatar.src = profileAvatar.src.split('?')[0].split('&')[0]; // Clear any cache params
    }
  }
}

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  ensureFloatingActions();

  // Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const mainContent = document.getElementById('mainContent');
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');

  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const profileAvatar = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const chooseFromGalleryBtn = document.getElementById('chooseFromGalleryBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const avatarGalleryOverlay = document.getElementById('avatarGalleryOverlay');
  const avatarGallery = document.getElementById('avatarGallery');
  const closeAvatarGallery = document.getElementById('closeAvatarGallery');
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');

  function updateLocalStorage() { localStorage.setItem('cart', JSON.stringify(cart)); }

  // Hydrate active user from localStorage on load so profile shows data after login
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser && storedUser.id) {
      activeUser = storedUser;
      updateProfileFields(activeUser);
      if (mainContent) mainContent.classList.remove('hidden');
      if (loginSection) loginSection.classList.add('hidden');
    }
  } catch (e) {
    console.debug('Could not hydrate user from localStorage:', e);
  }

  // Minimal helper UI functions used by auth flows
  function showMainForUser(user) {
    activeUser = user;
    if (loginSection) loginSection.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    updateProfileFields(user);
    // Apply any avatar the user picked while logged-out (persist to backend)
    applyPendingAvatarForUser(user).catch(e => console.debug('applyPendingAvatarForUser:', e));
    // If the user has no avatar, optionally persist a generated initials image so it's consistent across devices
    (async function ensureInitials() {
      try {
        if (user && !user.avatar) {
          const initialsDataUrl = generateInitialsAvatar(user.name || user.username || 'U', 128);
          // Persist generated initials to backend so all devices show same placeholder
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: initialsDataUrl }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            updateProfileFields(activeUser);
          }
        }
      } catch (err) {
        // non-fatal
        console.debug('Could not persist initials avatar:', err);
      }
    })();
  }

  // Convert repo-relative or manifest-relative paths to a stable absolute URL
  function toAbsoluteAvatarUrl(src) {
    try {
      // If it's already an absolute URL (http/https/data), return as-is
      if (/^data:|^https?:\/\//i.test(src)) return src;
      // Use current document location as base so hosting under a subpath resolves correctly
      return new URL(src, window.location.href).href;
    } catch (e) {
      return src;
    }
  }

  // Convert a dataURL -> Blob (used for uploading pending avatar file after login)
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }



  // Resize an image File to a max dimension and return a dataURL
  function resizeImageFile(file, maxDim = 512, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((resolve, reject) => {
      // SVGs: keep original as dataURL
      if (file.type === 'image/svg+xml') {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w <= maxDim && h <= maxDim) {
            // No resize needed
            resolve(reader.result);
            return;
          }
          const ratio = Math.max(w, h) / maxDim;
          const nw = Math.round(w / ratio);
          const nh = Math.round(h / ratio);
          const canvas = document.createElement('canvas');
          canvas.width = nw;
          canvas.height = nh;
          const ctx = canvas.getContext('2d');
          // draw with smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, nw, nh);
          try {
            const out = canvas.toDataURL(mime, quality);
            resolve(out);
          } catch (err) {
            // Fallback: return original
            resolve(reader.result);
          }
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Centralized handler for avatar file inputs (resizes, stores pending or uploads)
  async function handleAvatarFile(file) {
    if (!file) return;
    try {
      console.log('handleAvatarFile: Processing file', file.name);
      const resizedDataUrl = await resizeImageFile(file, 512, 'image/jpeg', 0.85);
      profileAvatar.src = resizedDataUrl;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('handleAvatarFile: Current user', user);
      
      if (user && user.id) {
        // Upload resized image as multipart to backend
        const blob = dataURLtoBlob(resizedDataUrl);
        const form = new FormData();
        form.append('avatar', blob, file.name || `avatar-${Date.now()}.jpg`);
        const token = localStorage.getItem('token');
        
        console.log('handleAvatarFile: Uploading to backend with token:', token ? 'Present' : 'Missing');
        
        const res = await fetch(buildUrl(`/api/users/me/avatar`), { 
          method: 'POST', 
          body: form, 
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } 
        });
        
        console.log('handleAvatarFile: Response status', res.status);
        
        if (res.ok) {
          const updated = await res.json();
          console.log('handleAvatarFile: Avatar uploaded successfully', updated);
          
          activeUser = updated;
          try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
          
          // Update avatar from backend response (user-specific) with cache-busting
          if (updated.avatar) {
            let avatarUrl = updated.avatar;
            if (avatarUrl.startsWith('/uploads/')) {
              avatarUrl = buildUrl(avatarUrl);
            }
            const separator = avatarUrl.includes('?') ? '&' : '?';
            profileAvatar.src = avatarUrl + separator + '_t=' + Date.now();
            console.log('handleAvatarFile: Avatar URL updated to', avatarUrl);
          }
          
          // Update profile fields to reflect the new avatar
          updateProfileFields(activeUser);
          
          alert('Avatar updated successfully!');
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error('handleAvatarFile: Upload failed', res.status, errorData);
          alert('Failed to upload avatar: ' + (errorData.detail || 'Unknown error'));
        }
      } else {
        // Not logged in: save the resized data URL and apply on next login
        console.log('handleAvatarFile: User not logged in, saving for later');
        try { localStorage.setItem('pendingAvatarFile', resizedDataUrl); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('handleAvatarFile: Error processing avatar', err);
      alert('Failed to process avatar: ' + err.message);
    }
  }

  // Apply any avatar the user picked while logged-out (gallery or uploaded file)
  async function applyPendingAvatarForUser(user) {
    if (!user || !user.id) return;
    const pendingChoice = localStorage.getItem('pendingAvatarChoice');
    const pendingFile = localStorage.getItem('pendingAvatarFile');
    const token = localStorage.getItem('token');
    try {
      // If user uploaded a file while logged out, upload it now as multipart/form-data
      if (pendingFile) {
        try {
          // Use the PUT user route to persist dataURL avatars (works in demo & real backends)
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: pendingFile }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            localStorage.removeItem('pendingAvatarFile');
            localStorage.removeItem('profileAvatar');
            localStorage.removeItem('userAvatar');
          }
        } catch (err) {
          console.warn('Failed to persist pending avatar file after login', err);
        }
      }

      // If user picked a gallery choice while logged out, persist it now
      if (pendingChoice) {
        try {
          // Use PUT /api/users/:id to set avatar to the stable absolute URL or data URL
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: pendingChoice }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            localStorage.removeItem('pendingAvatarChoice');
            localStorage.removeItem('profileAvatar');
            localStorage.removeItem('userAvatar');
          }
        } catch (err) {
          console.warn('Failed to persist pending gallery avatar after login', err);
        }
      }
    } catch (err) {
      console.warn('Error applying pending avatar for user', err);
    }
  }

  // Login
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (loginError) loginError.classList.add('hidden');

    // Hide any verification message
    const verificationMessage = document.getElementById('verificationMessage');
    const resendVerificationBtn = document.getElementById('resendVerificationBtn');
    if (verificationMessage) verificationMessage.classList.add('hidden');
    if (resendVerificationBtn) resendVerificationBtn.classList.add('hidden');

    try {
      // Send as FormData to match backend expectations
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await api('/api/users/login', { method: 'POST', body: formData });
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        showMainForUser(res.user);
      } else if (res && res.user) {
        showMainForUser(res.user);
      }
    } catch (err) {
      // Check if error is due to unverified email
      if (err.message && err.message.includes('Email not verified')) {
        if (loginError) {
          loginError.textContent = err.message;
          loginError.classList.remove('hidden');
        }

        // Show verification message and resend button
        if (verificationMessage) {
          verificationMessage.textContent = 'Please verify your email before logging in.';
          verificationMessage.classList.remove('hidden');
        }
        if (resendVerificationBtn) {
          resendVerificationBtn.classList.remove('hidden');
          // Store username for resend
          resendVerificationBtn.dataset.username = username;
        }
      } else {
        if (loginError) {
          loginError.textContent = err.message || 'Login failed';
          loginError.classList.remove('hidden');
        }
      }
    }
  });

  // Signup
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameEl = document.getElementById('newUsername');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('newPassword');
    const mobileEl = document.getElementById('mobile');
    const username = usernameEl.value.trim();
    const email = (emailEl && emailEl.value || '').trim();
    const password = passwordEl && passwordEl.value;
    const mobile = mobileEl ? mobileEl.value.trim() : '';
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const mobileError = document.getElementById('mobileError');
    const signupError = document.getElementById('signupError');
    const signupSpinner = document.getElementById('signupSpinner');
    // clear errors
    [usernameError, emailError, passwordError, mobileError, signupError].forEach(el => { if (el) el.classList.add('hidden'); el && (el.textContent = ''); });

  // Basic client-side validation with relaxed password rules
  let hasErr = false;
  if (!username) { usernameError && (usernameError.textContent = 'Please enter a username'); usernameError && usernameError.classList.remove('hidden'); hasErr = true; }
  if (!email || !email.includes('@') || email.length < 6) { emailError && (emailError.textContent = 'Please enter a valid email'); emailError && emailError.classList.remove('hidden'); hasErr = true; }
  // Relaxed password rules: min 6 characters
  if (!password || password.length < 6) { 
    passwordError && (passwordError.textContent = 'Password must be at least 6 characters'); 
    passwordError && passwordError.classList.remove('hidden'); 
    hasErr = true; 
  }
  if (!mobile || mobile.length < 10) { 
    mobileError && (mobileError.textContent = 'Please enter a valid 10-digit mobile number'); 
    mobileError && mobileError.classList.remove('hidden'); 
    hasErr = true; 
  }
  if (hasErr) return;

    try {
      signupSpinner && signupSpinner.classList.remove('hidden');
      // If running in demo mode, check local demo_users for uniqueness first
      if (!API_BASE) {
        try {
          const demoList = JSON.parse(localStorage.getItem('demo_users') || '[]');
          if (demoList.find(u=>u.username && u.username.toLowerCase()===username.toLowerCase())) {
            throw new Error('Username already exists (demo)');
          }
          if (demoList.find(u=>u.email && u.email.toLowerCase()===email.toLowerCase())) {
            throw new Error('Email already exists (demo)');
          }
        } catch (e) { throw e; }
      }

      // Get mobile number if available
      const mobileEl = document.getElementById('mobile');
      const mobile = mobileEl ? mobileEl.value.trim() : '';

      // Call register endpoint (backend will hash the password)
      // Send as FormData to match backend expectations
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (mobile) formData.append('mobile', mobile);
      
      // Add avatar if uploaded
      const signupAvatarInput = document.getElementById('signupAvatarInput');
      if (signupAvatarInput && signupAvatarInput.files && signupAvatarInput.files[0]) {
        formData.append('avatar', signupAvatarInput.files[0]);
      }
      
      const reg = await api('/api/users/register', { method: 'POST', body: formData });
      
      // Registration successful - auto login with returned token
      if (reg && reg.success && reg.token) {
        alert(reg.message || 'Registration successful! You are now logged in.');
        
        // Store token and user
        localStorage.setItem('token', reg.token);
        localStorage.setItem('user', JSON.stringify(reg.user));
        
        // Clear form
        if (usernameEl) usernameEl.value = '';
        if (emailEl) emailEl.value = '';
        if (passwordEl) passwordEl.value = '';
        if (mobileEl) mobileEl.value = '';
        
        // Redirect to main app (index.html contains the full app with all pages)
        window.location.href = '../index.html';
        return;
      }
      
      // Fallback: redirect to login page
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    } catch (err) {
      signupSpinner && signupSpinner.classList.add('hidden');
      const signupError = document.getElementById('signupError');
      if (signupError) { signupError.textContent = err.message || 'Signup failed'; signupError.classList.remove('hidden'); }
      else alert(err.message || 'Signup failed');
    } finally {
      signupSpinner && signupSpinner.classList.add('hidden');
    }
  });

  // Avatar gallery handlers (uses manifest or fallback)
  chooseFromGalleryBtn?.addEventListener('click', async () => {
    if (!avatarGallery || !avatarGalleryOverlay) return;
    avatarGalleryOverlay.classList.remove('hidden');
    try {
      const manifestPath = window.location.pathname.includes('/pages/') ? './assets/avatars.json' : 'pages/assets/avatars.json';
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      const list = res.ok ? await res.json() : DEFAULT_AVATARS;
      avatarGallery.innerHTML = '';
      const avatarBase = manifestPath.replace(/avatars\.json$/, '');
      list.forEach(file => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.className = 'w-20 h-20 rounded-full cursor-pointer';
        img.addEventListener('click', async () => {
          const selected = toAbsoluteAvatarUrl(img.src);
          profileAvatar.src = selected;
          // persist to backend if user logged in; otherwise store pending choice for next login
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.id) {
              const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: selected }) });
              if (updated) {
                // update activeUser and local copy - avatar is now stored per user in backend
                activeUser = updated;
                try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
                // Update avatar from backend response (user-specific) with cache-busting
                if (updated.avatar) {
                  let avatarUrl = updated.avatar;
                  if (avatarUrl.startsWith('/uploads/')) {
                    avatarUrl = buildUrl(avatarUrl);
                  }
                  const separator = avatarUrl.includes('?') ? '&' : '?';
                  profileAvatar.src = avatarUrl + separator + '_t=' + Date.now();
                }
              }
            } else {
              try { localStorage.setItem('pendingAvatarChoice', selected); } catch (e) { /* ignore */ }
            }
          } catch (err) {
            console.warn('Failed to persist chosen avatar to backend, stored locally only', err);
          }
          avatarGalleryOverlay.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar gallery failed', err);
    }
  });
  closeAvatarGallery?.addEventListener('click', () => avatarGalleryOverlay?.classList.add('hidden'));
  uploadAvatarBtn?.addEventListener('click', () => avatarInput?.click());
  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await handleAvatarFile(file);
  });

  // Signup avatar preview handler
  const signupAvatarInput = document.getElementById('signupAvatarInput');
  const signupAvatarImage = document.getElementById('signupAvatarImage');
  const signupAvatarInitials = document.getElementById('signupAvatarInitials');
  
  signupAvatarInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (signupAvatarImage && signupAvatarInitials) {
        signupAvatarImage.src = event.target.result;
        signupAvatarImage.classList.remove('hidden');
        signupAvatarInitials.classList.add('hidden');
      }
    };
    reader.readAsDataURL(file);
  });

  // Initial UI state: show login, hide main content
  if (mainContent) mainContent.classList.add('hidden');
  if (loginSection) loginSection.classList.remove('hidden');

  // Mobile menu: slide-in drawer with overlay, focus trap and accessibility
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuButtons = mobileMenu ? Array.from(mobileMenu.querySelectorAll('[data-target]')) : [];
  let _lastFocused = null;

  function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    _lastFocused = document.activeElement;
    mobileMenu.classList.add('open');
    mobileMenu.classList.remove('-translate-x-full');
    mobileMenuOverlay?.classList.add('show');
    mobileMenuOverlay?.classList.remove('hidden');
    mobileMenu.classList.remove('hidden');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');

    // focus trap setup
    const focusable = getFocusableElements(mobileMenu);
    if (focusable.length) focusable[0].focus();

    document.addEventListener('keydown', trapKeyDown);
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.classList.add('-translate-x-full');
    mobileMenuOverlay?.classList.remove('show');
    mobileMenuOverlay?.classList.add('hidden');
    // add a small timeout to allow animation to complete then hide
    setTimeout(() => { mobileMenu.classList.add('hidden'); }, 300);
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trapKeyDown);
    if (_lastFocused) try { _lastFocused.focus(); } catch (e) {}
  }

  function trapKeyDown(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements(mobileMenu);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileMenu);
  }
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
  if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);

  // wire menu buttons (data-target) to navigation and close menu
  mobileMenuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.getAttribute('data-target');
      if (target) showPage(target);
      closeMobileMenu();
    });
  });

  // Logout mobile button
  const logoutBtnMobile = document.getElementById('logoutBtnMobile');
  if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', () => { closeMobileMenu(); logoutBtn?.click(); });

  // Keep mobile cart count in sync
  function syncMobileCartCount() {
    const navCountMobile = document.getElementById('navCartCountMobile');
    const navCount = document.getElementById('navCartCount');
    if (navCount && navCountMobile) {
      navCountMobile.textContent = navCount.textContent;
      navCountMobile.classList.toggle('hidden', navCount.classList.contains('hidden'));
    }
  }
  // initial sync
  syncMobileCartCount();
  // watch cart changes via existing functions by calling sync after cart updates
  const originalUpdateLocalStorage = updateLocalStorage;
  updateLocalStorage = function () { originalUpdateLocalStorage(); syncMobileCartCount(); };

  // Back-to-top button behavior
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (!backToTop) return;
    if (window.scrollY > 300) backToTop.classList.add('show'); else backToTop.classList.remove('show');
  });
  backToTop?.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Handle signup page initialization and submission
  if (document.getElementById('signupForm')) {
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    const avatarInput = document.getElementById('avatarInput');
    const signupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    const signupSpinner = document.getElementById('signupSpinner');

    // Handle avatar preview click
    if (avatarPreview) {
      avatarPreview.addEventListener('click', () => avatarInput.click());
    }

    // Handle avatar file selection
    if (avatarInput) {
      avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const resizedDataUrl = await resizeImageFile(file, 512, 'image/jpeg', 0.85);
            avatarImage.src = resizedDataUrl;
            avatarImage.classList.remove('hidden');
            avatarInitials.classList.add('hidden');
            localStorage.setItem('pendingAvatarFile', resizedDataUrl);
          } catch (err) {
            console.warn('Failed to process avatar image', err);
            signupError.textContent = 'Failed to process avatar image. Please try a different image.';
            signupError.classList.remove('hidden');
          }
        }
      });
    }

    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('newUsername').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('newPassword').value;
      
      // Clear previous errors
      signupError.classList.add('hidden');
      document.getElementById('usernameError').classList.add('hidden');
      document.getElementById('emailError').classList.add('hidden');
      document.getElementById('passwordError').classList.add('hidden');
      
      // Validate fields
      let hasError = false;
      if (!username) {
        document.getElementById('usernameError').textContent = 'Username is required';
        document.getElementById('usernameError').classList.remove('hidden');
        hasError = true;
      }
      if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        document.getElementById('emailError').classList.remove('hidden');
        hasError = true;
      }
      if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        document.getElementById('passwordError').classList.remove('hidden');
        hasError = true;
      }
      
      if (hasError) return;
      
      // Show loading spinner
      signupSpinner.classList.remove('hidden');
      
      try {
        // Get the pending avatar if exists
        const pendingAvatar = localStorage.getItem('pendingAvatarFile');
        
        // Get mobile number
        const mobileEl = document.getElementById('mobile');
        const mobile = mobileEl ? mobileEl.value.trim() : '';
        
        // Register user
        const response = await api('/api/users/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email,
            password,
            mobile,
            avatar: pendingAvatar || null
          })
        });
        
        if (response.success) {
          // Store user data and token
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          activeUser = response.user;
          
          // Clear any pending avatar data
          localStorage.removeItem('pendingAvatarFile');
          localStorage.removeItem('pendingAvatarChoice');
          
          // Redirect to dashboard
          navigateTo('dashboard.html');
        }
      } catch (err) {
        console.error('Signup error:', err);
        signupError.textContent = err.message || 'Failed to register user. Please try again.';
        signupError.classList.remove('hidden');
      } finally {
        signupSpinner.classList.add('hidden');
      }
    });
  }
});




window.addEventListener('DOMContentLoaded', () => {
  // --- CONFIG ---
  // API_BASE is already defined at the top level

  // --- STATE ---
  let activeUser = null;
  let books = [];
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  let borrowRecords = [];

  // --- ELEMENTS ---
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const mainContent = document.getElementById('mainContent');
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');
  const logoutBtn = document.getElementById('logoutBtn');
  const cartItems = document.getElementById('cartItems');
  const borrowList = document.getElementById('borrowList');
  const memberListTable = document.getElementById('memberList');

  // Profile elements
  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const profileAvatar = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const avatarGalleryOverlay = document.getElementById('avatarGalleryOverlay');
  const avatarGallery = document.getElementById('avatarGallery');
  const closeAvatarGallery = document.getElementById('closeAvatarGallery');
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
  const chooseFromGalleryBtn = document.getElementById('chooseFromGalleryBtn');

  let originalProfile = {};

  // --- HELPERS ---
  const updateLocalStorage = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  // Use the top-level `api()` defined earlier which handles demo mode and logging.

  async function loadBooks() {
    // Clear old data to ensure fresh load with new images
    localStorage.removeItem('demo_books');
    console.log('Cleared demo_books from localStorage to load new images');
    
    books = await api('/api/books');
    console.log('Loaded books:', books);
    console.log('Books length:', books.length);
    
    // Ensure we have books with proper data
    if (!books || books.length === 0) {
      console.error('No books loaded!');
    } else {
      console.log('First book details:', books[0]);
      console.log('Book IDs:', books.map(b => b.id));
      console.log('Book images:', books.map(b => ({title: b.title, image: b.image})));
    }
  }

  async function loadBorrowRecords() {
    if (!activeUser) { borrowRecords = []; return; }
    borrowRecords = await api(`/api/borrowing/user/${activeUser.id}`);
  }

  async function loadMembers() {
    const users = await api('/api/users');
    memberListTable.innerHTML = '';
    users.forEach(user => {
      const memberSince = user.member_since ? new Date(user.member_since).toLocaleDateString('en-US') : 'N/A';
      let avatarUrl = user.avatar || user.profileAvatar || null;
      
      // Build full URL for avatar if it's a relative path from backend
      if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
        avatarUrl = buildUrl(avatarUrl);
      }
      
      // We'll use data-src for lazy loading and a small inline placeholder
      const placeholder = generateInitialsAvatar(user.name || user.username || 'U', 48);
      const dataSrc = avatarUrl || placeholder;
      memberListTable.innerHTML += `
        <tr class='border-b hover:bg-gray-50 items-center'>
          <td class='p-4'>
            <img data-src="${dataSrc}" src="${placeholder}" alt="${(user.name||user.username)||'User'} avatar" class="member-avatar w-12 h-12 rounded-full object-cover inline-block cursor-pointer" data-full="${avatarUrl || placeholder}">
          </td>
          <td class='p-4 font-semibold text-gray-800'>${user.name || user.username}</td>
          <td class='p-4 text-gray-600'>${user.email || ''}</td>
          <td class='p-4 text-gray-500'>${memberSince}</td>
        </tr>
      `;
    });

    // After rendering, setup lazy-loading and click handlers
    setupLazyAvatars();
  }

  // Lazy-load avatars using IntersectionObserver with fallback to loading=lazy
  function setupLazyAvatars() {
    const avatars = Array.from(document.querySelectorAll('img.member-avatar'));
    if (!avatars.length) return;
    // If browser supports loading=lazy, set it as well
    avatars.forEach(img => img.setAttribute('loading','lazy'));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src && img.src !== src) img.src = src;
          obs.unobserve(img);
        });
      }, { rootMargin: '100px 0px' });
      avatars.forEach(img => io.observe(img));
    } else {
      // Fallback: load all
      avatars.forEach(img => { const src = img.getAttribute('data-src'); if (src) img.src = src; });
    }

    // click handler to open lightbox
    avatars.forEach(img => img.addEventListener('click', () => {
      const full = img.getAttribute('data-full') || img.src;
      openLightbox(full);
    }));
  }

  // Lightbox functions
  function openLightbox(src) {
    let overlay = document.getElementById('avatarLightbox');
    if (!overlay) return;
    const img = overlay.querySelector('img');
    img.src = src;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    // focus trap
    const closeBtn = overlay.querySelector('[data-close]');
    closeBtn.focus();
    // close on overlay click
    overlay.addEventListener('click', function onOverlayClick(e) {
      if (e.target === overlay) { closeLightbox(); overlay.removeEventListener('click', onOverlayClick); }
    });
    // close on escape
    function escHandler(e) { if (e.key === 'Escape') { closeLightbox(); document.removeEventListener('keydown', escHandler); } }
    document.addEventListener('keydown', escHandler);
  }
  function closeLightbox() {
    const overlay = document.getElementById('avatarLightbox');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    const img = overlay.querySelector('img'); img.src = '';
    // return focus to previously focused element
    if (_lastFocused) try { _lastFocused.focus(); } catch(e) {}
  }

  function updateCartCountDisplay() {
    const count = cart.length;
    const navCount = document.getElementById('navCartCount');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
    if (navCount) {
      navCount.textContent = count;
      navCount.classList.toggle('hidden', count === 0);
    }
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    if (emptyCartMessage) emptyCartMessage.classList.toggle('hidden', count > 0);
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = '';
    cart.forEach((item, i) => {
      cartItems.innerHTML += `
        <tr class='border-b hover:bg-gray-50'>
          <td class='p-4 font-semibold text-gray-800'>${item.title}</td>
          <td class='p-4 text-gray-600'>${item.author}</td>
          <td class='p-4'>
            <button class='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md' onclick='borrowBook(${i})'>
              Borrow ✅
            </button>
          </td>
        </tr>
      `;
    });
    updateCartCountDisplay();
  }

  function updateBorrowCountDisplay() {
    const countEl = document.getElementById('borrowCountDisplay');
    const emptyMsg = document.getElementById('emptyBorrowMessage');
    const activeBorrows = borrowRecords.filter(b => b.status !== 'returned');
    if (countEl) countEl.textContent = activeBorrows.length;
    if (emptyMsg) emptyMsg.classList.toggle('hidden', activeBorrows.length > 0);
  }

  function renderBorrowList() {
    if (!borrowList) return;
    console.log('Rendering borrow list with records:', borrowRecords);
    borrowList.innerHTML = '';
    const activeBorrows = borrowRecords.filter(b => b.status !== 'returned');
    console.log('Active borrows after filtering:', activeBorrows);
    activeBorrows.forEach((b) => {
      borrowList.innerHTML += `
        <tr class='border-b hover:bg-gray-50'>
          <td class='p-4 font-semibold text-gray-800'>${b.book_title}</td>
          <td class='p-4 text-gray-600'>${b.book_author}</td>
          <td class='p-4'>
            <button class='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md' onclick='returnBook(${b.id})'>
              Return ↩️
            </button>
          </td>
        </tr>
      `;
    });
    updateBorrowCountDisplay();
  }

  function toggleEditMode(isEditing) {
    profileNameInput.readOnly = !isEditing;
    profileEmailInput.readOnly = !isEditing;
    profileNameInput.classList.toggle('bg-white', isEditing);
    profileEmailInput.classList.toggle('bg-white', isEditing);
    profileNameInput.classList.toggle('bg-gray-50', !isEditing);
    profileEmailInput.classList.toggle('bg-gray-50', !isEditing);

    editProfileBtn.classList.toggle('hidden', isEditing);
    saveProfileBtn.classList.toggle('hidden', !isEditing);
    cancelProfileBtn.classList.toggle('hidden', !isEditing);
    changeAvatarBtn.disabled = !isEditing;
  }

  // Refresh user profile from backend to ensure avatar and other data are up-to-date
  async function refreshUserProfile() {
    try {
      const token = localStorage.getItem('token');
      if (!token || !activeUser) return;
      
      // Fetch fresh user data from backend
      const updatedUser = await api('/api/users/me');
      if (updatedUser) {
        activeUser = updatedUser;
        localStorage.setItem('user', JSON.stringify(activeUser));
        updateProfileFields(activeUser);
        console.log('User profile refreshed from backend', updatedUser);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      // If refresh fails, use cached data
      updateProfileFields(activeUser);
    }
  }

  // --- NAVIGATION LOGIC ---
  window.showPage = function (id) {
    console.log('🔄 Navigating to page:', id);
    const pages = ['home', 'dashboard', 'catalog', 'bookDetails', 'borrowing', 'cart', 'wishlist', 'members', 'profile'];
    pages.forEach(p => {
      const el = document.getElementById(p);
      if (el) {
        el.classList.add('hidden');
        console.log('📦 Hidden page:', p);
      } else {
        console.log('⚠️ Page element not found:', p);
      }
    });
    const current = document.getElementById(id);
    if (current) {
      current.classList.remove('hidden');
      current.classList.add('page-section');
      console.log('✅ Showing page:', id);
    } else {
      console.error('❌ Page element not found:', id);
      return;
    }
    window.scrollTo(0, 0);

    if (id === 'catalog') showAddBookForAdmin(); // <-- Ensure admin sees Add Book on Catalog page

    if (id === 'cart') renderCart();
    if (id === 'borrowing') renderBorrowList();
    if (id === 'wishlist') {
      console.log('📋 Loading wishlist for page display');
      loadWishlist(); // Load wishlist when page is shown
    }
    if (id === 'members') loadMembers();
    if (id === 'profile' && activeUser) {
      // Immediately populate profile fields from current activeUser
      updateProfileFields(activeUser);
      // Then try to refresh from backend/demo for latest data
      refreshUserProfile();
    }
  };

  // --- AUTH ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Password length:', password.length);
    console.log('API_BASE:', API_BASE);
    
    // Validate inputs
    if (!username) {
      loginError.textContent = 'Username is required';
      loginError.classList.remove('hidden');
      return;
    }
    if (!password) {
      loginError.textContent = 'Password is required';
      loginError.classList.remove('hidden');
      return;
    }
    
    try {
      // Send as FormData to match backend expectations
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const res = await api('/api/users/login', {
        method: 'POST',
        body: formData
      });
      
      console.log('Login response:', res);
      console.log('User object:', res.user);
      console.log('User role:', res.user?.role);
      
      // Handle both JWT-style response ({ token, user }) and legacy user object
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        // IMPORTANT: Save user to localStorage to ensure avatar is stored per user
        localStorage.setItem('user', JSON.stringify(res.user));
        activeUser = res.user;
        console.log('Stored user in localStorage:', res.user);
      } else if (res && res.user) {
        // If response has user object
        localStorage.setItem('user', JSON.stringify(res.user));
        activeUser = res.user;
      } else {
        // legacy: entire user object returned
        localStorage.setItem('user', JSON.stringify(res));
        activeUser = res;
      }
      loginSection.classList.add('hidden');
      mainContent.classList.remove('hidden');
      loginError.classList.add('hidden');
      await loadBooks();
      await loadBorrowRecords();
      renderCart();
      renderBorrowList();
      await loadMembers();
      await loadWishlist(); // Load user's wishlist
      // Force update profile fields with fresh user data from backend
      updateProfileFields(activeUser);
      showAddBookForAdmin(); // <-- Call directly after login
      showPage('home');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      loginError.textContent = err.message || 'Login failed. Please try again.';
      loginError.classList.remove('hidden');
    }
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('=== SIGNUP ATTEMPT ===');
    
    const mobileInput = document.getElementById('mobile');
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = mobileInput ? mobileInput.value.trim() : '';
    const name = username;
    
    console.log('Signup data:', { username, email, passwordLength: password.length, mobile, name });
    
    // Validate required fields
    if (!username) {
      alert('Username is required');
      return;
    }
    if (!email) {
      alert('Email is required');
      return;
    }
    if (!password) {
      alert('Password is required');
      return;
    }
    
    try {
      // Send as FormData to match backend expectations
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      if (mobile) {
        formData.append('mobile', mobile);
      }
      
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const res = await api('/api/users/register', {
        method: 'POST',
        body: formData
      });
      
      console.log('Signup response:', res);
      
      alert('Signup successful! You can login now');
      document.getElementById('newUsername').value = '';
      document.getElementById('email').value = '';
      if (mobileInput) mobileInput.value = '';
      document.getElementById('newPassword').value = '';
      signupSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      showAddBookForAdmin();
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      alert((err && err.message) || 'Signup failed');
    }
  });

  logoutBtn?.addEventListener('click', () => {
    activeUser = null;
    // Clear user data from localStorage to prevent avatar caching
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear avatar image to prevent showing previous user's avatar
    if (profileAvatar) {
      profileAvatar.src = '';
    }
    mainContent.classList.add('hidden');
    loginSection.classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showAddBookForAdmin();
  });

  document.getElementById('showSignup')?.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
  });

  document.getElementById('showLogin')?.addEventListener('click', () => {
    signupSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
  });

  // --- FORGOT PASSWORD FLOW ---
  let forgotPasswordUsername = '';
  let forgotPasswordOtp = '';

  // Show forgot password section
  document.getElementById('showForgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    signupSection.classList.add('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) {
      forgotPasswordSection.classList.remove('hidden');
      // Reset to step 1
      document.getElementById('forgotPasswordStep1').classList.remove('hidden');
      document.getElementById('forgotPasswordStep2').classList.add('hidden');
      document.getElementById('forgotPasswordStep3').classList.add('hidden');
      document.getElementById('forgotUsername').value = '';
      forgotPasswordUsername = '';
      forgotPasswordOtp = '';
    }
  });

  // Back to login from forgot password
  [document.getElementById('backToLogin'), document.getElementById('backToLogin2'), document.getElementById('backToLogin3')].forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      const forgotPasswordSection = document.getElementById('forgotPassword');
      if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      // Reset forms
      document.getElementById('forgotPasswordStep1').classList.remove('hidden');
      document.getElementById('forgotPasswordStep2').classList.add('hidden');
      document.getElementById('forgotPasswordStep3').classList.add('hidden');
    });
  });

  // Step 1: Request OTP
  document.getElementById('forgotPasswordForm1')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('forgotUsername').value.trim();
    const errorEl = document.getElementById('forgotPasswordError1');
    
    if (!username) {
      if (errorEl) {
        errorEl.textContent = 'Please enter your username or email';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      if (res.success) {
        forgotPasswordUsername = username;
        // Show OTP in development (remove in production)
        if (res.otp) {
          alert(`OTP sent! (Development mode - OTP: ${res.otp})`);
        } else {
          alert('OTP sent to your registered mobile number');
        }
        // Move to step 2
        document.getElementById('forgotPasswordStep1').classList.add('hidden');
        document.getElementById('forgotPasswordStep2').classList.remove('hidden');
        document.getElementById('otpCode').value = '';
        document.getElementById('otpCode').focus();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to send OTP';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // OTP input - only allow numbers
  const otpInput = document.getElementById('otpCode');
  otpInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });

  // Step 2: Verify OTP
  document.getElementById('forgotPasswordForm2')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otpCode').value.trim();
    const errorEl = document.getElementById('forgotPasswordError2');
    
    if (!otp || otp.length !== 6) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a valid 6-digit OTP';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername, otp })
      });

      if (res.success) {
        forgotPasswordOtp = otp;
        // Move to step 3
        document.getElementById('forgotPasswordStep2').classList.add('hidden');
        document.getElementById('forgotPasswordStep3').classList.remove('hidden');
        document.getElementById('newPasswordReset').value = '';
        document.getElementById('confirmPasswordReset').value = '';
        document.getElementById('newPasswordReset').focus();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Invalid OTP';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // Resend OTP
  document.getElementById('resendOtp')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!forgotPasswordUsername) return;
    
    try {
      const res = await api('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername })
      });

      if (res.success) {
        if (res.otp) {
          alert(`OTP resent! (Development mode - OTP: ${res.otp})`);
        } else {
          alert('OTP resent to your registered mobile number');
        }
        document.getElementById('otpCode').value = '';
      }
    } catch (err) {
      alert(err.message || 'Failed to resend OTP');
    }
  });

  // Step 3: Reset Password
  document.getElementById('forgotPasswordForm3')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPasswordReset').value;
    const confirmPassword = document.getElementById('confirmPasswordReset').value;
    const errorEl = document.getElementById('forgotPasswordError3');
    
    if (!newPassword || newPassword.length < 6) {
      if (errorEl) {
        errorEl.textContent = 'Password must be at least 6 characters long';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (errorEl) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          username: forgotPasswordUsername, 
          otp: forgotPasswordOtp, 
          newPassword 
        })
      });

      if (res.success) {
        alert('Password reset successfully! You can now login with your new password.');
        // Reset and go back to login
        const forgotPasswordSection = document.getElementById('forgotPassword');
        if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('forgotPasswordStep1').classList.remove('hidden');
        document.getElementById('forgotPasswordStep2').classList.add('hidden');
        document.getElementById('forgotPasswordStep3').classList.add('hidden');
        forgotPasswordUsername = '';
        forgotPasswordOtp = '';
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to reset password';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // Resend Verification Email
  document.getElementById('resendVerificationBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = e.target.dataset.username;
    if (!username) return;

    try {
      const res = await api('/api/users/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      if (res.success) {
        let message = res.message || 'Verification email sent. Please check your email.';
        
        // In development mode, show verification link
        if (res.verificationUrl) {
          message += `\n\nDevelopment Mode - Verification Link:\n${res.verificationUrl}`;
          alert(message);
          console.log('Email Verification Link:', res.verificationUrl);
        } else {
          alert(message);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to resend verification email');
    }
  });

  // --- TEST FUNCTION FOR DEBUGGING ---
  window.testImageLoad = function() {
    console.log('=== TESTING IMAGE LOAD ===');
    const testImg = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600';
    const imgElement = document.getElementById('bookImage');
    
    if (imgElement) {
      console.log('Setting test image to:', testImg);
      imgElement.src = testImg;
      imgElement.onload = () => console.log('Test image loaded successfully');
      imgElement.onerror = () => console.error('Test image failed to load');
    } else {
      console.error('bookImage element not found');
    }
  };

  // --- QUICK TEST FOR BOOK DETAILS ---
  window.testBookDetails = function() {
    console.log('=== TESTING BOOK DETAILS ===');
    if (books.length > 0) {
      const testBook = books[0];
      console.log('Testing with book:', testBook);
      viewBook(testBook.id);
    } else {
      console.log('No books loaded');
    }
  };

  // --- DIRECT IMAGE TEST ---
  window.testDirectImage = function() {
    console.log('=== TESTING DIRECT IMAGE ===');
    showPage('bookDetails');
    
    setTimeout(() => {
      const img = document.getElementById('bookImage');
      if (img) {
        const testUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600';
        console.log('Setting direct image:', testUrl);
        
        // Force visible
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.removeAttribute('loading');
        
        img.src = testUrl;
        img.onload = () => console.log('✅ Direct image loaded!');
        img.onerror = () => console.log('❌ Direct image failed!');
        
        console.log('Image element after setting:', {
          src: img.src,
          display: img.style.display,
          visibility: img.style.visibility,
          width: img.style.width,
          height: img.style.height
        });
      } else {
        console.log('❌ Image element not found');
      }
    }, 500);
  };

  // --- SHOW IMAGE INFO ---
  window.showImageInfo = function(bookId) {
    fetch(`${API_BASE}/api/books/`)
      .then(response => response.json())
      .then(books => {
        const book = books.find(b => b.id === parseInt(bookId));
        if (book) {
          alert(`Book: ${book.title}\nImage URL: ${book.image}\n\nThis image should appear in the book details.`);
          console.log('Book Image Info:', {
            title: book.title,
            image: book.image,
            imageLength: book.image ? book.image.length : 0
          });
        }
      });
  };

  // --- FORCE IMAGE TEST ---
  window.forceImageTest = function() {
    console.log('=== FORCE IMAGE TEST ===');
    const img = document.getElementById('bookImage');
    if (img) {
      // Remove all possible hiding attributes
      img.style.display = 'block';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
      img.style.width = '300px';
      img.style.height = '400px';
      img.style.border = '2px solid red';
      img.removeAttribute('loading');
      img.removeAttribute('hidden');
      
      // Set a guaranteed working image
      img.src = 'https://m.media-amazon.com/images/I/71a7t1okN0L._SX331_BO1,204,203,200_.jpg';
      
      console.log('Force image test applied');
      
      // Show the details page
      showPage('bookDetails');
    }
  };

  // --- TEST BACKEND IMAGES ---
  window.testBackendImages = function() {
    console.log('=== TESTING BACKEND IMAGES ===');
    
    fetch(`${API_BASE}/api/books/`)
      .then(response => response.json())
      .then(books => {
        console.log('Backend books loaded:', books.length);
        
        // Show first 3 books with their images
        books.slice(0, 3).forEach((book, index) => {
          console.log(`Book ${index + 1}:`, {
            id: book.id,
            title: book.title,
            image: book.image,
            imageLength: book.image ? book.image.length : 0
          });
        });
        
        // Test first book image
        const testBook = books[0];
        console.log('Testing image URL:', testBook.image);
        
        // Create test image to verify URL works
        const testImg = new Image();
        testImg.onload = () => console.log('✅ Test image loaded successfully!');
        testImg.onerror = () => console.log('❌ Test image failed to load');
        testImg.src = testBook.image;
        
        alert(`Backend connected! Found ${books.length} books. Testing first book image: ${testBook.title}`);
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
        alert('Failed to connect to backend: ' + error.message);
      });
  };

  // --- DIRECT IMAGE TEST ---
  window.testDirectImage = function() {
    console.log('=== DIRECT IMAGE TEST ===');
    
    // Hide everything
    document.querySelectorAll('section').forEach(section => section.style.display = 'none');
    
    // Show book details
    const bookDetails = document.getElementById('bookDetails');
    if (bookDetails) {
      bookDetails.style.display = 'block';
    }
    
    // Force image to show
    const img = document.getElementById('bookImage');
    if (img) {
      // Clear everything
      img.removeAttribute('class');
      img.removeAttribute('loading');
      img.setAttribute('style', '');
      
      // Set simple styles
      img.style.display = 'block';
      img.style.width = '300px';
      img.style.height = '400px';
      img.style.border = '5px solid blue';
      img.style.background = 'lightblue';
      
      // Set a guaranteed working image
      const testUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600';
      console.log('Setting test image:', testUrl);
      img.src = testUrl;
      
      img.onload = () => console.log('✅ TEST IMAGE LOADED!');
      img.onerror = () => console.log('❌ TEST IMAGE FAILED');
      
      // Set test text
      document.getElementById('bookTitle').textContent = 'DIRECT IMAGE TEST';
      document.getElementById('bookAuthor').textContent = 'Testing Image Display';
      document.getElementById('bookDescription').textContent = 'This should show a blue-bordered image if everything works.';
      document.getElementById('bookCategory').textContent = 'Category: Debug';
      
      console.log('✅ Direct image test completed');
      console.log('📷 You should see a blue-bordered image');
    }
  };
  window.completeImageTest = function() {
    console.log('=== COMPLETE IMAGE TEST ===');
    
    // Test 1: Check backend connection
    console.log('Testing backend connection...');
    fetch(`${API_BASE}/api/books/`)
      .then(response => response.json())
      .then(books => {
        console.log('✅ Backend connected, books loaded:', books.length);
        
        if (books.length > 0) {
          const testBook = books[0];
          console.log('Test book:', testBook);
          console.log('Test book image:', testBook.image);
          
          // Test 2: Show book details page
          console.log('Showing book details page...');
          
          // Hide all pages
          document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
          });
          
          // Show book details
          const bookDetailsSection = document.getElementById('bookDetails');
          if (bookDetailsSection) {
            bookDetailsSection.classList.remove('hidden');
            console.log('✅ Book details page shown');
          }
          
          // Test 3: Set image with maximum force
          setTimeout(() => {
            const img = document.getElementById('bookImage');
            console.log('Image element found:', !!img);
            
            if (img) {
              // Remove everything that might interfere
              img.className = '';
              img.setAttribute('style', '');
              img.removeAttribute('loading');
              img.removeAttribute('hidden');
              
              // Set forced styles
              img.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: 300px !important;
                height: 400px !important;
                border: 5px solid green !important;
                background: yellow !important;
                object-fit: cover !important;
              `;
              
              console.log('Setting image to:', testBook.image);
              img.src = testBook.image;
              
              // Add load handlers
              img.onload = function() {
                console.log('✅✅✅ IMAGE LOADED SUCCESSFULLY! ✅✅✅');
                console.log('Image dimensions:', this.naturalWidth + 'x' + this.naturalHeight);
              };
              
              img.onerror = function() {
                console.log('❌❌❌ IMAGE FAILED TO LOAD ❌❌❌');
                console.log('Trying fallback image...');
                this.src = 'https://m.media-amazon.com/images/I/71a7t1okN0L._SX331_BO1,204,203,200_.jpg';
              };
              
              // Set book info
              document.getElementById('bookTitle').textContent = testBook.title;
              document.getElementById('bookAuthor').textContent = `By ${testBook.author}`;
              document.getElementById('bookDescription').textContent = testBook.description || 'No description available.';
              document.getElementById('bookCategory').textContent = `Category: ${testBook.category}`;
              
              console.log('✅ Complete test setup done');
              console.log('📷 You should see a green-bordered image with yellow background');
            } else {
              console.log('❌ Image element not found!');
            }
          }, 500);
        } else {
          console.log('❌ No books found in backend');
        }
      })
      .catch(error => {
        console.error('❌ Backend connection failed:', error);
      });
  };
  window.testSimpleBookView = function() {
    console.log('=== SIMPLE BOOK VIEW TEST ===');
    
    // Hide all other pages
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show book details page
    const bookDetailsSection = document.getElementById('bookDetails');
    if (bookDetailsSection) {
      bookDetailsSection.classList.remove('hidden');
      console.log('✅ Book details section shown');
    } else {
      console.log('❌ Book details section not found');
      return;
    }
    
    // Set a test image
    const img = document.getElementById('bookImage');
    if (img) {
      // Remove all classes and styles that might hide it
      img.className = '';
      img.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 300px !important; height: 400px !important; border: 3px solid red !important;';
      
      // Set a guaranteed working image
      img.src = 'https://m.media-amazon.com/images/I/71a7t1okN0L._SX331_BO1,204,203,200_.jpg';
      
      console.log('✅ Test image set with red border');
      console.log('Image element:', img);
      console.log('Image src:', img.src);
    } else {
      console.log('❌ Book image element not found');
    }
    
    // Set test text
    document.getElementById('bookTitle').textContent = 'TEST BOOK TITLE';
    document.getElementById('bookAuthor').textContent = 'By Test Author';
    document.getElementById('bookDescription').textContent = 'This is a test to see if the book details page works correctly.';
    document.getElementById('bookCategory').textContent = 'Category: Test';
    
    console.log('✅ Simple book view test completed');
  };

  // --- WORKING BOOK DETAILS ---
  window.viewBook = async function (bookId) {
    console.log('=== VIEW BOOK DETAILS ===');
    console.log('Book ID requested:', bookId);
    
    try {
      // Ensure books array is loaded
      if (!books || books.length === 0) {
        console.log('Books not loaded, loading books...');
        await loadBooks();
      }
      
      // Find the book in the actual books array
      const book = books.find(b => b.id === bookId);
      if (!book) {
        console.error('Book not found with ID:', bookId);
        alert('Book not found!');
        return;
      }
      
      console.log('Found book:', book);
      console.log('Book image URL:', book.image);
      
      // Show the book details page
      if (typeof showPage === 'function') {
        showPage('bookDetails');
      } else {
        // Fallback navigation
        document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
        document.getElementById('bookDetails').classList.remove('hidden');
      }
      
      // Update the book details with actual book data
      updateBookDetails(book);
      
    } catch (error) {
      console.error('Error in viewBook:', error);
      alert('Error loading book details: ' + error.message);
    }
  };

  // Helper function to update book details with actual book data
  function updateBookDetails(book) {
    console.log('Updating book details for:', book.title);
    
    // Enhanced book data with additional impressive details
    const enhancedBook = {
      ...book,
      impressiveDescription: generateImpressiveDescription(book),
      highlights: generateBookHighlights(book),
      testimonials: generateTestimonials(book),
      readingTime: Math.floor(Math.random() * 10) + 5, // 5-15 hours
      difficulty: ['Easy Read', 'Moderate', 'Challenging'][Math.floor(Math.random() * 3)],
      audience: ['Young Adults', 'Adult Readers', 'All Ages'][Math.floor(Math.random() * 3)]
    };
    
    // Update image element with enhanced styling
    const imgElement = document.getElementById('bookImage');
    if (imgElement) {
      console.log('Setting image to:', enhancedBook.image);
      
      // Enhanced image styling with glow effect
      imgElement.style.cssText = 'display: block !important; visibility: visible !important; width: 256px !important; height: 384px !important; object-fit: cover !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);';
      imgElement.src = enhancedBook.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600';
      
      // Handle image loading with enhanced feedback
      imgElement.onload = function() {
        console.log('✅ Book image loaded successfully!');
        this.classList.add('animate-pulse');
        setTimeout(() => this.classList.remove('animate-pulse'), 1000);
      };
      
      imgElement.onerror = function() {
        console.log('❌ Book image failed to load, using fallback');
        this.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600';
      };
      
    } else {
      console.error('Image element not found!');
    }
    
    // Update text elements with enhanced content
    const titleElement = document.getElementById('bookTitle');
    const authorElement = document.getElementById('bookAuthor');
    const descElement = document.getElementById('bookDescription');
    const categoryElement = document.getElementById('bookCategory');
    
    if (titleElement) {
      titleElement.textContent = enhancedBook.title || 'Unknown Title';
      titleElement.classList.add('animate-fade-in');
    }
    
    if (authorElement) {
      authorElement.textContent = `By ${enhancedBook.author || 'Unknown Author'}`;
      authorElement.classList.add('animate-fade-in');
    }
    
    if (descElement) {
      descElement.innerHTML = enhancedBook.impressiveDescription;
      descElement.classList.add('animate-fade-in');
    }
    
    if (categoryElement) {
      const categoryText = enhancedBook.category ? enhancedBook.category.charAt(0).toUpperCase() + enhancedBook.category.slice(1) : 'Unknown';
      categoryElement.textContent = `📚 ${categoryText}`;
      categoryElement.classList.add('animate-fade-in');
    }
    
    // Update cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      addToCartBtn.dataset.bookId = enhancedBook.id;
      // Add click animation
      addToCartBtn.addEventListener('click', function() {
        this.classList.add('animate-bounce');
        setTimeout(() => this.classList.remove('animate-bounce'), 1000);
      });
    }
    
    // Update wishlist button
    const addToWishlistBtn = document.getElementById('addToWishlistBtn');
    if (addToWishlistBtn) {
      addToWishlistBtn.dataset.bookId = enhancedBook.id;
      addToWishlistBtn.dataset.bookTitle = enhancedBook.title;
      addToWishlistBtn.dataset.bookAuthor = enhancedBook.author;
      
      // Remove existing event listeners
      const newBtn = addToWishlistBtn.cloneNode(true);
      addToWishlistBtn.parentNode.replaceChild(newBtn, addToWishlistBtn);
      
      // Add new event listener
      newBtn.addEventListener('click', function() {
        const bookId = parseInt(this.dataset.bookId);
        const bookTitle = this.dataset.bookTitle;
        const bookAuthor = this.dataset.bookAuthor;
        
        this.classList.add('animate-bounce');
        setTimeout(() => this.classList.remove('animate-bounce'), 1000);
        
        addToWishlist(bookId, bookTitle, bookAuthor);
      });
      
      // Check if book is already in wishlist and update button
      checkWishlistStatus(enhancedBook.id).then(inWishlist => {
        if (inWishlist) {
          newBtn.innerHTML = '<span class="text-2xl">💖</span> In Wishlist';
          newBtn.classList.add('opacity-75', 'cursor-not-allowed');
          newBtn.disabled = true;
        } else {
          newBtn.innerHTML = '<span class="text-2xl">❤️</span> Add to Wishlist';
          newBtn.classList.remove('opacity-75', 'cursor-not-allowed');
          newBtn.disabled = false;
        }
      });
    }
    
    // Add some interactive elements
    addInteractiveBookElements(enhancedBook);
    
    // Populate testimonials dynamically
    populateTestimonials(enhancedBook);
    
    // Update dynamic metadata
    updateDynamicMetadata(enhancedBook);
    
    console.log('✅ Enhanced book details updated successfully for:', enhancedBook.title);
  }
  
  // Update dynamic metadata based on book category
  function updateDynamicMetadata(book) {
    // Update rating based on category
    const ratingElement = document.querySelector('.text-white\\/90.font-semibold');
    const reviewCountElement = document.querySelector('.text-white\\/75');
    
    const categoryRatings = {
      fiction: { rating: '4.9', reviews: '3,847' },
      'non-fiction': { rating: '4.7', reviews: '2,156' },
      science: { rating: '4.8', reviews: '1,892' },
      technology: { rating: '4.6', reviews: '2,743' },
      romance: { rating: '4.9', reviews: '4,521' },
      mystery: { rating: '4.8', reviews: '2,934' },
      comic: { rating: '4.7', reviews: '1,678' }
    };
    
    const ratingData = categoryRatings[book.category?.toLowerCase()] || { rating: '4.8', reviews: '2,347' };
    
    if (ratingElement) ratingElement.textContent = `${ratingData.rating} out of 5`;
    if (reviewCountElement) reviewCountElement.textContent = `(${ratingData.reviews} reviews)`;
    
    // Update page count based on category
    const pageCountElement = document.querySelector('.bg-blue-500\\/80');
    const categoryPages = {
      fiction: '📖 380 Pages',
      'non-fiction': '📖 420 Pages',
      science: '📖 450 Pages',
      technology: '📖 520 Pages',
      romance: '📖 340 Pages',
      mystery: '📖 400 Pages',
      comic: '📖 280 Pages'
    };
    
    if (pageCountElement) {
      pageCountElement.textContent = categoryPages[book.category?.toLowerCase()] || '📖 450 Pages';
    }
    
    // Update award badge based on category
    const awardElement = document.querySelector('.bg-purple-500\\/80');
    const categoryAwards = {
      fiction: '🎯 Literary Award',
      'non-fiction': '🎯 Research Prize',
      science: '🎯 Science Medal',
      technology: '🎯 Innovation Award',
      romance: '🎯 Romance Prize',
      mystery: '🎯 Mystery Award',
      comic: '🎯 Graphic Novel Award'
    };
    
    if (awardElement) {
      awardElement.textContent = categoryAwards[book.category?.toLowerCase()] || '🎯 Award Winner';
    }
    
    // Update bestseller badge
    const bestsellerElement = document.querySelector('.absolute.bottom-4.left-4');
    const categoryBestseller = {
      fiction: '🏆 Bestseller 2024',
      'non-fiction': '🏆 Top Non-Fiction',
      science: '🏆 Science Bestseller',
      technology: '🏆 Tech Bestseller',
      romance: '🏆 Romance Hit',
      mystery: '🏆 Mystery Bestseller',
      comic: '🏆 Graphic Novel Hit'
    };
    
    if (bestsellerElement) {
      bestsellerElement.textContent = categoryBestseller[book.category?.toLowerCase()] || '🏆 Bestseller';
    }
  }
  
  // Populate testimonials based on book category
  function populateTestimonials(book) {
    const testimonialsContainer = document.getElementById('testimonialsContainer');
    if (!testimonialsContainer) return;
    
    const testimonials = generateTestimonials(book);
    
    testimonialsContainer.innerHTML = testimonials.map(testimonial => `
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div class="flex text-yellow-400 mb-2">⭐⭐⭐⭐⭐</div>
        <p class="text-gray-700 italic mb-2">"${testimonial.text}"</p>
        <p class="text-sm text-gray-600 font-semibold">- ${testimonial.name}, ${testimonial.role}</p>
      </div>
    `).join('');
  }
  
  // Generate impressive book descriptions based on book category and title
  function generateImpressiveDescription(book) {
    const baseDescription = book.description || 'An extraordinary literary journey that will captivate your imagination and touch your soul.';
    
    // Category-specific content
    const categoryContent = getCategorySpecificContent(book.category, book.title, book.author);
    
    // Dynamic impressive additions based on book properties
    const impressiveAdditions = [
      `🌟 <strong>${categoryContent.headline}</strong> 🌟<br><br>`,
      `This isn't just a ${book.category || 'book'}—it's ${categoryContent.experience} that will stay with you long after the final page.<br><br>`,
      `<strong>🔥 WHY THIS ${book.category?.toUpperCase() || 'BOOK'} IS CAPTIVATING READERS WORLDWIDE:</strong><br>`,
      ...categoryContent.bulletPoints.map(point => `• ${point}<br>`),
      `<br><strong>💫 PERFECT FOR:</strong> ${categoryContent.targetAudience}<br><br>`,
      `<strong>📖 READING EXPERIENCE:</strong> ${categoryContent.readingExperience}<br><br>`,
      `<strong>🎯 THE PROMISE:</strong> ${categoryContent.promise}<br><br>`,
      `<strong>⭐ CRITICAL ACCLAIM:</strong> ${categoryContent.criticalAcclaim}<br><br>`,
      baseDescription
    ];
    
    return impressiveAdditions.join('');
  }
  
  // Get category-specific content
  function getCategorySpecificContent(category, title, author) {
    const categories = {
      fiction: {
        headline: 'A LITERARY MASTERPIECE THAT WILL TRANSFORM YOUR PERSPECTIVE',
        experience: 'an immersive story world',
        bulletPoints: [
          'Unforgettable characters that feel like real people',
          'Plot twists that will leave you breathless',
          'Beautiful prose that reads like poetry',
          'Deep themes that resonate with the human experience'
        ],
        targetAudience: 'Readers who crave stories that challenge, inspire, and entertain in equal measure',
        readingExperience: 'Each chapter reveals new layers of meaning, making this a book you\'ll want to savor and discuss',
        promise: 'By the time you finish this book, you\'ll see the world—and yourself—differently',
        criticalAcclaim: `"A triumph of modern literature" - Literary Times<br>"This generation\'s most important work" - Book Review Quarterly`
      },
      'non-fiction': {
        headline: 'AN EYE-OPENING JOURNEY INTO REAL-WORLD DISCOVERY',
        experience: 'a transformative learning experience',
        bulletPoints: [
          'Groundbreaking research and insights',
          'Practical knowledge you can apply immediately',
          'Compelling real-world examples and case studies',
          'Thought-provoking perspectives on important issues'
        ],
        targetAudience: 'Curious minds seeking to expand their understanding of the world',
        readingExperience: 'Fascinating discoveries on every page that will change how you see the world',
        promise: 'You\'ll gain valuable insights that will enhance your personal and professional life',
        criticalAcclaim: `"Essential reading for our time" - The Guardian<br>"A masterpiece of non-fiction storytelling" - New York Times`
      },
      science: {
        headline: 'A REVOLUTIONARY EXPLORATION OF SCIENTIFIC DISCOVERY',
        experience: 'a mind-expanding scientific adventure',
        bulletPoints: [
          'Cutting-edge research explained in accessible language',
          'Fascinating discoveries that push the boundaries of knowledge',
          'Real-world applications of scientific principles',
          'Insights into the future of technology and humanity'
        ],
        targetAudience: 'Science enthusiasts and curious learners of all levels',
        readingExperience: 'Complex concepts made simple and exciting for everyday readers',
        promise: 'You\'ll understand the world around you in ways you never imagined',
        criticalAcclaim: `"The best science writing of the year" - Scientific American<br>"Makes complex science accessible and thrilling" - Nature`
      },
      technology: {
        headline: 'THE DEFINITIVE GUIDE TO DIGITAL TRANSFORMATION',
        experience: 'your roadmap to technological excellence',
        bulletPoints: [
          'Actionable strategies for digital innovation',
          'Real-world case studies from tech leaders',
          'Step-by-step implementation guides',
          'Future-proof frameworks for tomorrow\'s challenges'
        ],
        targetAudience: 'Tech professionals, entrepreneurs, and digital innovators',
        readingExperience: 'Practical insights you can implement immediately in your work',
        promise: 'You\'ll gain the skills and knowledge to thrive in the digital age',
        criticalAcclaim: `"Essential reading for every tech leader" - TechCrunch<br>"A game-changing guide to digital success" - Wired`
      },
      romance: {
        headline: 'A HEARTWARMING TALE OF LOVE AND CONNECTION',
        experience: 'an emotional journey that touches the soul',
        bulletPoints: [
          'Breathtaking romance that will make your heart soar',
          'Characters you\'ll fall in love with',
          'Beautiful exploration of human relationships',
          'A story that celebrates the power of love'
        ],
        targetAudience: 'Romance lovers and hopeless romantics',
        readingExperience: 'A feel-good story that will leave you believing in love',
        promise: 'This book will remind you why love is the most powerful force in the universe',
        criticalAcclaim: `"The most beautiful romance of the year" - Romance Today<br>"A story that will stay in your heart forever" - Book Lovers Weekly`
      },
      mystery: {
        headline: 'A GRIPPING MYSTERY THAT WILL KEEP YOU GUESSING',
        experience: 'a thrilling puzzle that will challenge your mind',
        bulletPoints: [
          'Intricate plot with unexpected twists',
          'Suspense that builds to a stunning conclusion',
          'Clever clues and red herrings',
          'A mystery that will keep you turning pages all night'
        ],
        targetAudience: 'Mystery lovers and puzzle enthusiasts',
        readingExperience: 'Edge-of-your-seat suspense with a satisfying resolution',
        promise: 'You\'ll be guessing until the very last page',
        criticalAcclaim: `"A masterclass in mystery writing" - Mystery Review<br>"The most unpredictable thriller of the year" - Crime Fiction Today`
      },
      comic: {
        headline: 'AN EPIC GRAPHIC ADVENTURE THAT BRINGS HEROES TO LIFE',
        experience: 'a visual storytelling masterpiece',
        bulletPoints: [
          'Stunning artwork that jumps off the page',
          'Compelling characters with incredible depth',
          'Action-packed storylines with heart',
          'A perfect blend of art and narrative'
        ],
        targetAudience: 'Comic book fans and graphic novel enthusiasts',
        readingExperience: 'Visual storytelling at its finest with breathtaking artwork',
        promise: 'You\'ll be transported to a world where heroes come alive',
        criticalAcclaim: `"The best graphic novel of the year" - Comic Book Review<br>"A visual masterpiece that redefines the medium" - Graphic Novel Today`
      }
    };
    
    // Default content for unknown categories
    const defaultContent = {
      headline: 'AN EXTRAORDINARY LITERARY ADVENTURE AWAITS',
      experience: 'a captivating reading journey',
      bulletPoints: [
        'Engaging content that will keep you hooked',
        'Well-crafted narrative and prose',
        'Thoughtful exploration of important themes',
        'A story that will stay with you long after reading'
      ],
      targetAudience: 'Readers seeking quality literature and engaging stories',
      readingExperience: 'A satisfying read that delivers on every level',
      promise: 'This book will provide hours of enjoyable reading',
      criticalAcclaim: `"A standout in its genre" - Literary Review<br>"Well worth your time and attention" - Book Digest`
    };
    
    return categories[category?.toLowerCase()] || defaultContent;
  }
  
  // Generate book highlights based on category
  function generateBookHighlights(book) {
    const highlights = {
      fiction: [
        '🏆 Literary award winner',
        '💝 Emotional storytelling',
        '🎨 Beautiful prose',
        '🧠 Deep character development',
        '🌍 Critically acclaimed',
        '⭐ Bestseller status'
      ],
      'non-fiction': [
        '🏆 Research excellence award',
        '💝 Life-changing insights',
        '🎨 Groundbreaking analysis',
        '🧠 Evidence-based content',
        '🌍 Expert endorsed',
        '⭐ Educational value'
      ],
      science: [
        '🏆 Scientific breakthrough',
        '💝 Mind-expanding knowledge',
        '🎨 Accessible explanations',
        '🧠 Cutting-edge research',
        '🌍 Peer-reviewed',
        '⭐ Educational excellence'
      ],
      technology: [
        '🏆 Innovation award',
        '💝 Practical solutions',
        '🎨 Future-focused',
        '🧠 Industry insights',
        '🌍 Tech leader approved',
        '⭐ Career-boosting'
      ],
      romance: [
        '🏆 Romance novel award',
        '💝 Heartwarming love story',
        '🎨 Beautiful relationships',
        '🧠 Emotional depth',
        '🌍 Reader favorite',
        '⭐ Feel-good factor'
      ],
      mystery: [
        '🏆 Mystery award winner',
        '💝 Suspenseful plotting',
        '🎨 Clever twists',
        '🧠 Intellectual challenge',
        '🌍 Thriller community approved',
        '⭐ Page-turner'
      ],
      comic: [
        '🏆 Graphic novel award',
        '💝 Visual storytelling',
        '🎨 Stunning artwork',
        '🧠 Character depth',
        '🌍 Fan favorite',
        '⭐ Collector\'s item'
      ]
    };
    
    return highlights[book.category?.toLowerCase()] || [
      '🏆 Award-winning content',
      '💝 Engaging narrative',
      '🎨 Well-crafted prose',
      '🧠 Thoughtful insights',
      '🌍 Reader approved',
      '⭐ High quality'
    ];
  }
  
  // Generate realistic testimonials based on category
  function generateTestimonials(book) {
    const testimonials = {
      fiction: [
        {
          name: 'Sarah Mitchell',
          role: 'Book Club President',
          text: `This book transformed our book club discussions! The depth and beauty of "${book.title}" left us speechless.`
        },
        {
          name: 'Dr. James Richardson',
          role: 'Literature Professor',
          text: `I've been teaching literature for 20 years, and "${book.title}" is one of the most remarkable works I've ever encountered.`
        },
        {
          name: 'Emily Chen',
          role: 'Avid Reader',
          text: `I couldn't put "${book.title}" down! It kept me up all night, and it was worth every minute of lost sleep.`
        }
      ],
      'non-fiction': [
        {
          name: 'Michael Thompson',
          role: 'Research Analyst',
          text: `"${book.title}" provides groundbreaking insights that changed how I approach my work. Absolutely essential reading.`
        },
        {
          name: 'Dr. Lisa Anderson',
          role: 'University Professor',
          text: `The research and analysis in "${book.title}" are outstanding. This should be required reading in every university.`
        },
        {
          name: 'Robert Kim',
          role: 'Business Consultant',
          text: `Practical, insightful, and transformative. "${book.title}" delivers real value that I apply daily.`
        }
      ],
      science: [
        {
          name: 'Dr. Patricia Lee',
          role: 'Research Scientist',
          text: `"${book.title}" makes complex science accessible and exciting. A brilliant achievement in science communication.`
        },
        {
          name: 'Jennifer Wu',
          role: 'Science Educator',
          text: `I use "${book.title}" in my classroom. Students love it and finally understand difficult concepts.`
        },
        {
          name: 'Mark Rodriguez',
          role: 'Tech Innovator',
          text: `The scientific insights in "${book.title}" inspired my latest project. Truly mind-expanding content.`
        }
      ],
      technology: [
        {
          name: 'Alex Chen',
          role: 'CTO at TechCorp',
          text: `"${book.title}" is the definitive guide for digital transformation. Every tech leader should read this.`
        },
        {
          name: 'Sarah Johnson',
          role: 'Startup Founder',
          text: `The strategies in "${book.title}" helped scale our company. Practical, actionable, and brilliant.`
        },
        {
          name: 'David Park',
          role: 'Software Engineer',
          text: `Finally, a technology book that delivers real value. "${book.title}" is worth every penny.`
        }
      ],
      romance: [
        {
          name: 'Maria Garcia',
          role: 'Romance Blogger',
          text: `"${book.title}" is the most beautiful romance I've read this year. It made me believe in love all over again.`
        },
        {
          name: 'Amanda Foster',
          role: 'Book Reviewer',
          text: `The emotional depth in "${book.title}" is extraordinary. This story will stay with me forever.`
        },
        {
          name: 'Rachel Lee',
          role: 'Romance Reader',
          text: `I laughed, I cried, I fell in love. "${book.title}" is everything a romance should be and more.`
        }
      ],
      mystery: [
        {
          name: 'Tom Harrison',
          role: 'Mystery Reviewer',
          text: `"${book.title}" kept me guessing until the very end. A masterclass in mystery writing.`
        },
        {
          name: 'Susan Clarke',
          role: 'Book Club Member',
          text: `We couldn't put "${book.title}" down! The twists were brilliant and the ending was perfect.`
        },
        {
          name: 'James Wilson',
          role: 'Thriller Enthusiast',
          text: `The suspense in "${book.title}" is unbearable - in the best way possible. Absolutely thrilling!`
        }
      ],
      comic: [
        {
          name: 'Kevin Park',
          role: 'Comic Book Store Owner',
          text: `"${book.title}" is flying off our shelves. The artwork is stunning and the story is incredible.`
        },
        {
          name: 'Jessica Moore',
          role: 'Graphic Novel Reviewer',
          text: `The visual storytelling in "${book.title}" redefines the medium. A true masterpiece.`
        },
        {
          name: 'Ryan Thompson',
          role: 'Comic Collector',
          text: `I've been collecting comics for 20 years, and "${book.title}" is one of the best I've ever read.`
        }
      ]
    };
    
    return testimonials[book.category?.toLowerCase()] || [
      {
        name: 'Book Lover',
        role: 'Avid Reader',
        text: `"${book.title}" is an excellent book that I thoroughly enjoyed. Highly recommended!`
      },
      {
        name: 'Reader Review',
        role: 'Book Enthusiast',
        text: `I couldn't put "${book.title}" down. A wonderful reading experience from start to finish.`
      },
      {
        name: 'Happy Customer',
        role: 'Regular Reader',
        text: `"${book.title}" exceeded all my expectations. A quality book that's worth your time.`
      }
    ];
  }
  
  // Add interactive elements to the book details page
  function ensureFloatingActions() {
    if (document.getElementById('fabWishlist')) return;

    const floatingActions = document.createElement('div');
    floatingActions.className = 'fixed bottom-8 right-6 flex flex-col gap-3 z-40';
    floatingActions.innerHTML = `
      <button id="fabWishlist" class="bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition transform hover:scale-110" title="Add current book to Wishlist">
        ❤️
      </button>
      <button id="fabShare" class="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition transform hover:scale-110" title="Share this page">
        📤
      </button>
      <button id="fabPreview" class="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition transform hover:scale-110" title="Download / Scroll to top">
        📥
      </button>
    `;
    document.body.appendChild(floatingActions);

    // Hook up floating action buttons
    const fabWishlist = document.getElementById('fabWishlist');
    const fabShare = document.getElementById('fabShare');
    const fabPreview = document.getElementById('fabPreview');

    // Pink: add current book (from bookDetails) to wishlist, if possible
    fabWishlist?.addEventListener('click', async () => {
      try {
        // If we're on the bookDetails section and it has a button wired, reuse its dataset
        const addToWishlistBtn = document.getElementById('addToWishlistBtn');
        const bookId = addToWishlistBtn?.dataset.bookId ? parseInt(addToWishlistBtn.dataset.bookId) : NaN;
        const bookTitle = addToWishlistBtn?.dataset.bookTitle || '';
        const bookAuthor = addToWishlistBtn?.dataset.bookAuthor || '';

        if (!bookId || Number.isNaN(bookId)) {
          showNotification('Open a book first to add it to your wishlist.', 'warning');
          return;
        }

        fabWishlist.classList.add('animate-bounce');
        setTimeout(() => fabWishlist.classList.remove('animate-bounce'), 800);

        await addToWishlist(bookId, bookTitle, bookAuthor);
      } catch (err) {
        console.error('FAB wishlist error:', err);
        showNotification('Could not add book to wishlist.', 'error');
      }
    });

    // Blue: share current page URL (uses Web Share API if available, else copy link)
    fabShare?.addEventListener('click', async () => {
      const shareUrl = window.location.href;
      const shareTitle = document.title || 'Pustakalayah LibraryHub';

      fabShare.classList.add('animate-bounce');
      setTimeout(() => fabShare.classList.remove('animate-bounce'), 800);

      try {
        if (navigator.share) {
          await navigator.share({ title: shareTitle, url: shareUrl });
          showNotification('Share dialog opened.', 'success');
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          showNotification('Link copied to clipboard!', 'success');
        } else {
          showNotification('Sharing not supported in this browser.', 'warning');
        }
      } catch (err) {
        console.error('FAB share error:', err);
        showNotification('Failed to share this page.', 'error');
      }
    });

    // Green: scroll to book preview / top of current section
    fabPreview?.addEventListener('click', () => {
      fabPreview.classList.add('animate-bounce');
      setTimeout(() => fabPreview.classList.remove('animate-bounce'), 800);

      // Try to scroll to the book details preview button first
      const previewButton = document.getElementById('previewSampleBtn');
      if (previewButton) {
        // Ensure bookDetails section is visible if user/admin is viewing a book
        const bookDetailsSection = document.getElementById('bookDetails');
        if (bookDetailsSection && bookDetailsSection.classList.contains('hidden')) {
          // If hidden, just smooth scroll to top instead of forcing navigation
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          previewButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Fallback: smooth scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Add scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section > div').forEach(section => {
      observer.observe(section);
    });
  }

  function addInteractiveBookElements(book) {
    // Add a reading progress indicator (if not already added)
    if (!document.getElementById('readingProgress')) {
      const progressBar = document.createElement('div');
      progressBar.className = 'fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 transition-transform duration-1000';
      progressBar.id = 'readingProgress';
      document.body.appendChild(progressBar);

      setTimeout(() => {
        progressBar.style.transform = 'scaleX(1)';
      }, 500);
    }

    ensureFloatingActions();
    
    // Add scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });
  }

  const addToCartBtn = document.getElementById('addToCartBtn');
  addToCartBtn?.addEventListener('click', async () => {
    const bookId = parseInt(addToCartBtn.dataset.bookId);
    console.log('Add to cart clicked for book ID:', bookId);
    
    // Ensure books array is loaded
    if (!books || books.length === 0) {
      console.log('Books not loaded, loading books...');
      await loadBooks();
    }
    
    const book = books.find(b => b.id === bookId);
    if (!book) {
      console.error('Book not found with ID:', bookId);
      alert('Book not found!');
      return;
    }

    console.log('Found book:', book);

    if (cart.find(item => item.id === book.id)) {
      alert(`${book.title} is already in your cart!`);
      return;
    }

    cart.push({ id: book.id, title: book.title, author: book.author });
    updateLocalStorage();
    renderCart();
    alert(`${book.title} added to cart!`);
    console.log('Cart updated:', cart);
  });

  // Fetch and render books list
  async function renderBooks(category = 'all') {
    console.log('renderBooks called with category:', category);
    if (!books.length) {
      console.log('No books in array, loading books...');
      await loadBooks();
    }
    const bookCatalog = document.getElementById('bookCatalog');
    if (!bookCatalog) return;
    bookCatalog.innerHTML = '';

    console.log('Books available for rendering:', books);
    const filteredBooks = category === 'all' ? books : books.filter(book => book.category === category);
    console.log('Filtered books:', filteredBooks);

    filteredBooks.forEach(book => {
      console.log('Rendering book:', book);
      const bookCard = `
        <div class="bg-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105 border-t-4 border-indigo-200">
          <img src="${book.image || ''}" alt="${book.title}" class="w-full h-64 object-cover rounded-lg mb-4 shadow-md">
          <div class="space-y-2">
            <h3 class="font-bold text-xl text-gray-800">${book.title}</h3>
            <p class="text-gray-600">${book.author}</p>
            <p class="text-sm text-indigo-500 italic font-medium">${book.category.charAt(0).toUpperCase() + book.category.slice(1)}</p>
            <p class="text-sm text-gray-700 line-clamp-2">${book.description || ''}</p>
            <button class="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md" 
              onclick="viewBook(${book.id})">View Details</button>
          </div>
        </div>
      `;
      bookCatalog.innerHTML += bookCard;
    });
  }

  window.filterBooks = function (category, clickedButton) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    renderBooks(category);
  };

  // --- CART & BORROWING ---
  window.emptyCart = function () {
    if (confirm('Are you sure you want to empty your cart?')) {
      cart = [];
      updateLocalStorage();
      renderCart();
      alert('Cart emptied!');
    }
  }

  window.borrowBook = async function (index) {
    if (!activeUser) { alert('Please login first.'); return; }
    const item = cart[index];
    if (!item) return;

    try {
      await api('/api/borrowing/borrow', {
        method: 'POST',
        body: JSON.stringify({
          user_id: activeUser.id,
          book_id: item.id,
          book_title: item.title,
          book_author: item.author,
        })
      });
      cart.splice(index, 1);
      updateLocalStorage();
      renderCart();
      await loadBorrowRecords();
      renderBorrowList();
      alert(`${item.title} borrowed successfully! Happy reading!`);
    } catch (err) {
      alert((err && err.message) || 'Failed to borrow');
    }
  };

  window.returnBook = async function (borrowId) {
    if (!activeUser) { alert('Please login first.'); return; }
    try {
      console.log('Returning book with ID:', borrowId);
      console.log('API_BASE:', API_BASE);
      
      // Test backend connectivity first
      try {
        const testResponse = await fetch(`${API_BASE}/api/books/`);
        console.log('Backend connectivity test - status:', testResponse.status);
      } catch (testErr) {
        console.error('Backend connectivity failed:', testErr);
        alert('Cannot connect to backend. Please ensure the backend server is running.');
        return;
      }
      
      const result = await api(`/api/borrowing/return/${borrowId}`, { method: 'PUT' });
      console.log('Return API result:', result);
      
      // Force refresh borrow records from backend
      console.log('Refreshing borrow records...');
      await loadBorrowRecords();
      console.log('Updated borrow records:', borrowRecords);
      
      // Re-render the list
      renderBorrowList();
      console.log('Borrow list re-rendered');
      
      alert('Returned successfully!');
    } catch (err) {
      console.error('Return error:', err);
      alert((err && err.message) || 'Failed to return');
    }
  };

  // --- PROFILE ---
  editProfileBtn?.addEventListener('click', () => {
    originalProfile = { name: profileNameInput.value, email: profileEmailInput.value };
    toggleEditMode(true);
  });

  cancelProfileBtn?.addEventListener('click', () => {
    profileNameInput.value = originalProfile.name;
    profileEmailInput.value = originalProfile.email;
    toggleEditMode(false);
  });

  saveProfileBtn?.addEventListener('click', async () => {
    if (!activeUser) return;

    const newName = profileNameInput.value.trim();
    const newEmail = profileEmailInput.value.trim();
    if (!newName || !newEmail) { alert('Name and Email cannot be empty.'); return; }

    try {
      // Send as FormData to match backend expectations
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('email', newEmail);

      const updated = await api('/api/users/me', {
        method: 'PUT',
        body: formData
      });
      
      // Update activeUser and localStorage
      activeUser = updated;
      localStorage.setItem('user', JSON.stringify(updated));
      
      alert('Profile updated successfully!');
      toggleEditMode(false);
      updateProfileFields(updated);
      await loadMembers();
    } catch (err) {
      console.error('Profile update error:', err);
      alert((err && err.message) || 'Failed to update profile');
    }
  });

  // Open file picker to upload custom avatar
  changeAvatarBtn?.addEventListener('click', () => {
    avatarInput?.click();
  });

  // Handle local file selection for avatar
  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await handleAvatarFile(file);
  });

  // Show avatar gallery modal and populate
  chooseFromGalleryBtn?.addEventListener('click', async () => {
    if (!avatarGallery) return;
    avatarGalleryOverlay?.classList.remove('hidden');
    try {
      const manifestPath = window.location.pathname.includes('/pages/') ? './assets/avatars.json' : 'pages/assets/avatars.json';
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      const list = res.ok ? await res.json() : DEFAULT_AVATARS;
      avatarGallery.innerHTML = '';
      const avatarBase = manifestPath.replace(/avatars\.json$/, '');
      list.forEach((file) => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.alt = file;
        img.className = 'w-20 h-20 rounded-full cursor-pointer border-2 border-transparent hover:border-indigo-400 object-cover';
        img.addEventListener('click', async () => {
          // Normalize to an absolute URL that respects hosting subpath
          const selected = toAbsoluteAvatarUrl(img.src);
          profileAvatar.src = selected;
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.id) {
              // Persist to backend - avatar is stored per user
              const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: selected }) });
              if (updated) {
                activeUser = updated;
                try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
                // Update avatar from backend response (user-specific) with cache-busting
                if (updated.avatar) {
                  let avatarUrl = updated.avatar;
                  if (avatarUrl.startsWith('/uploads/')) {
                    avatarUrl = buildUrl(avatarUrl);
                  }
                  const separator = avatarUrl.includes('?') ? '&' : '?';
                  profileAvatar.src = avatarUrl + separator + '_t=' + Date.now();
                }
              }
            } else {
              // If logged out, keep a pending choice to apply on next login
              try { localStorage.setItem('pendingAvatarChoice', selected); } catch (e) { /* ignore */ }
            }
          } catch (err) {
            console.warn('Failed to persist chosen avatar to backend, stored locally only', err);
          }
          avatarGalleryOverlay?.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar gallery failed', err);
    }
  });

  closeAvatarGallery?.addEventListener('click', () => {
    avatarGalleryOverlay?.classList.add('hidden');
  });

  uploadAvatarBtn?.addEventListener('click', () => {
    // Reuse the file input for uploads
    avatarInput?.click();
  });

  // Load stored avatar on profile page load - only use user.avatar from backend
  (function loadStoredAvatar() {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      // Always use avatar from user object (stored per user in backend)
      if (storedUser && storedUser.avatar && profileAvatar) {
        // Build full URL for avatar if it's a relative path
        let avatarUrl = storedUser.avatar;
        if (avatarUrl.startsWith('/uploads/')) {
          avatarUrl = buildUrl(avatarUrl);
        }
        // Add cache-busting to ensure fresh image load
        const separator = avatarUrl.includes('?') ? '&' : '?';
        profileAvatar.src = avatarUrl + separator + '_t=' + Date.now();
      }
    } catch (err) { /* ignore */ }
  })();

  // --- INITIAL RENDER (unauthenticated) ---
  renderBooks();
  renderCart();
  renderBorrowList();

  // Toggle Add Book form display
  window.toggleAddBookForm = function () {
    const form = document.getElementById('addBookForm');
    form.classList.toggle('hidden');
  };

  // Add Book form submit handler
  window.handleAddBook = async function (e) {
    e.preventDefault();
    const data = {
      title: document.getElementById('bookTitle').value.trim(),
      author: document.getElementById('bookAuthor').value.trim(),
      category: document.getElementById('bookCategory').value.trim(),
      image: document.getElementById('bookImage').value.trim(),
      isbn: document.getElementById('bookISBN').value.trim() || undefined,
      published_year: parseInt(document.getElementById('bookYear').value) || undefined,
      description: document.getElementById('bookDesc').value.trim(),
      available: true
    };
    try {
      const res = await fetch(buildUrl('/api/books'), {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Add failed.");
      alert("Book added!");
      toggleAddBookForm();
      await loadBooks();
      renderBooks();
      e.target.reset();
    } catch (err) {
      alert(`Failed to add book: ${err.message}`);
    }
    return false;
  };

  // Show Add Book section if admin user
  function showAddBookForAdmin() {
    const section = document.getElementById('addBookSection');
    if (!section) return;
    if (activeUser && activeUser.role === 'admin') {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  // Wishlist functionality
  let wishlistItems = [];

  // Load wishlist from backend
  async function loadWishlist() {
    console.log('🔄 Loading wishlist...');
    try {
      const response = await api('/api/users/wishlist');
      console.log('📋 Wishlist response:', response);
      if (response && response.success) {
        wishlistItems = response.wishlist || [];
        updateWishlistUI();
        console.log('✅ Wishlist loaded successfully:', wishlistItems.length, 'items');
      } else {
        console.error('❌ Wishlist API returned error:', response);
        wishlistItems = [];
        updateWishlistUI();
      }
    } catch (error) {
      console.error('❌ Failed to load wishlist:', error);
      wishlistItems = [];
      updateWishlistUI();
      // Don't show alert to user on load, just log the error
    }
  }

  // Add book to wishlist
  async function addToWishlist(bookId, bookTitle, bookAuthor) {
    console.log('🛒 Adding to wishlist:', { bookId, bookTitle, bookAuthor });
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      showNotification('Please login to add books to wishlist', 'warning');
      return;
    }
    
    // Prevent duplicate requests
    const addToWishlistBtn = document.getElementById('addToWishlistBtn');
    if (addToWishlistBtn && addToWishlistBtn.disabled) {
      console.log('⚠️ Wishlist button already disabled, preventing duplicate request');
      return;
    }
    
    // Disable button to prevent multiple clicks
    if (addToWishlistBtn) {
      addToWishlistBtn.disabled = true;
      addToWishlistBtn.innerHTML = '<span class="text-2xl">⏳</span> Adding...';
    }
    
    try {
      const formData = new FormData();
      formData.append('book_id', bookId);
      formData.append('book_title', bookTitle);
      formData.append('book_author', bookAuthor);

      console.log('📤 Sending wishlist request (via api helper)...');

      const result = await api('/api/users/wishlist', {
        method: 'POST',
        body: formData
      });

      console.log('✅ Wishlist API response:', result);
      
      if (result.success) {
        wishlistItems.push(result.wishlist_item);
        updateWishlistUI();
        
        // Update button to show success
        if (addToWishlistBtn) {
          addToWishlistBtn.innerHTML = '<span class="text-2xl">💖</span> In Wishlist';
          addToWishlistBtn.classList.add('opacity-75', 'cursor-not-allowed');
          addToWishlistBtn.disabled = true;
        }
        
        // Show success message without alert (less intrusive)
        showNotification('Book added to wishlist! ❤️', 'success');
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Failed to add to wishlist:', error);
      
      // Re-enable button on error
      if (addToWishlistBtn) {
        addToWishlistBtn.disabled = false;
        addToWishlistBtn.innerHTML = '<span class="text-2xl">❤️</span> Add to Wishlist';
      }
      
      // Show error notification
      showNotification(error.message || 'Failed to add to wishlist', 'error');
    }
  }

  // Remove book from wishlist
  async function removeFromWishlist(bookId) {
    console.log('🗑️ Removing book from wishlist:', bookId);
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      showNotification('Please login to remove books from wishlist', 'warning');
      return;
    }
    
    try {
      console.log('📤 Sending remove request (via api helper)...');

      const result = await api(`/api/users/wishlist/${bookId}`, {
        method: 'DELETE'
      });

      console.log('✅ Remove API response:', result);
      
      if (result.success) {
        wishlistItems = wishlistItems.filter(item => item.book_id !== bookId);
        updateWishlistUI();
        showNotification('Book removed from wishlist! 🗑️', 'success');
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Failed to remove from wishlist:', error);
      showNotification(error.message || 'Failed to remove from wishlist', 'error');
    }
  }

  // Make removeFromWishlist globally accessible
  window.removeFromWishlist = removeFromWishlist;

  // Clear entire wishlist
  async function clearWishlist() {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    console.log('🗑️ Clearing entire wishlist...');
    
    try {
      // Remove all items one by one
      for (const item of wishlistItems) {
        await removeFromWishlist(item.book_id);
      }
      showNotification('Wishlist cleared successfully! 🗑️', 'success');
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      showNotification('Failed to clear wishlist', 'error');
    }
  }

  // Make clearWishlist globally accessible
  window.clearWishlist = clearWishlist;

  // Update wishlist UI
  function updateWishlistUI() {
    console.log('🎨 Updating wishlist UI with', wishlistItems.length, 'items');
    
    const wishlistCount = document.getElementById('wishlistCount');
    const navWishlistCount = document.getElementById('navWishlistCount');
    const navWishlistCountMobile = document.getElementById('navWishlistCountMobile');
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const emptyMessage = document.getElementById('emptyWishlistMessage');

    // Update counts
    const count = wishlistItems.length;
    console.log('📊 Updating count badges to:', count);
    
    if (wishlistCount) {
      wishlistCount.textContent = count;
      console.log('✅ Updated main wishlist count');
    } else {
      console.log('⚠️ wishlistCount element not found');
    }
    
    if (navWishlistCount) {
      navWishlistCount.textContent = count;
      navWishlistCount.classList.toggle('hidden', count === 0);
      console.log('✅ Updated desktop nav wishlist count');
    } else {
      console.log('⚠️ navWishlistCount element not found');
    }
    
    if (navWishlistCountMobile) {
      navWishlistCountMobile.textContent = count;
      navWishlistCountMobile.classList.toggle('hidden', count === 0);
      console.log('✅ Updated mobile nav wishlist count');
    } else {
      console.log('⚠️ navWishlistCountMobile element not found');
    }

    // Update wishlist items
    if (wishlistItemsContainer) {
      if (wishlistItems.length === 0) {
        wishlistItemsContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.classList.remove('hidden');
        console.log('✅ Showed empty wishlist message');
      } else {
        if (emptyMessage) emptyMessage.classList.add('hidden');
        wishlistItemsContainer.innerHTML = wishlistItems.map(item => `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium">${item.book_title}</td>
            <td class="p-4">${item.book_author}</td>
            <td class="p-4">${new Date(item.added_date).toLocaleDateString()}</td>
            <td class="p-4">
              <button onclick="removeFromWishlist(${item.book_id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                Remove
              </button>
            </td>
          </tr>
        `).join('');
        console.log('✅ Rendered wishlist items table');
      }
    } else {
      console.log('⚠️ wishlistItemsContainer element not found');
    }
    
    console.log('✅ Wishlist UI update complete');
  }

  // Check if book is in wishlist
  async function checkWishlistStatus(bookId) {
    try {
      const result = await api(`/api/users/wishlist/check/${bookId}`);
      return !!(result && result.in_wishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
      return false;
    }
  }

  // Show/hide Add Book section on page load for good measure
  showAddBookForAdmin();

  // Notification system for better user feedback
  function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300';
      document.body.appendChild(notification);
    }

    // Set message and styling based on type
    notification.textContent = message;
    notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-transform duration-300';
    
    switch(type) {
      case 'success':
        notification.classList.add('bg-green-500', 'text-white');
        break;
      case 'error':
        notification.classList.add('bg-red-500', 'text-white');
        break;
      case 'warning':
        notification.classList.add('bg-yellow-500', 'text-white');
        break;
      default:
        notification.classList.add('bg-blue-500', 'text-white');
    }

    // Show notification
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
});