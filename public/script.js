// API Base URL - will be same as website URL when deployed
const API_BASE = window.location.origin;

// Global variables
let allPosts = [];
let filteredPosts = [];

// Load posts on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    checkLoginStatus();
});

// Load posts from API
async function loadPosts(type = '') {
    try {
        showLoading();
        
        let url = `${API_BASE}/api/posts`;
        const params = new URLSearchParams();
        
        if (type) params.append('type', type);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        allPosts = posts;
        filteredPosts = [...posts];
        
        displayPosts(posts);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading posts:', error);
        showError('Failed to load posts. Please try again later.');
        hideLoading();
    }
}

// Display posts in the container
function displayPosts(posts) {
    const container = document.getElementById('postContainer');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts">
                <h3>No posts found</h3>
                <p>Be the first to post a buy/sell request!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card ${post.type}-post">
            <div class="post-header">
                <span class="post-type">${post.type.toUpperCase()}</span>
                <span class="rating">${calculateRatingStars(post.views, post.clicks)}</span>
            </div>
            <h3>${escapeHtml(post.category)}</h3>
            <p>${escapeHtml(post.details)}</p>
            <p><strong>Rate:</strong> ₹${post.rate} per ${post.unit}</p>
            <p><strong>City:</strong> ${escapeHtml(post.city)}</p>
            <p><strong>Posted by:</strong> ${escapeHtml(post.userName)}</p>
            <div class="stats">
                <span>👁️ Views: ${post.views}</span> | 
                <span>👆 Clicks: ${post.clicks}</span>
            </div>
            <button class="contact-btn" onclick="viewContact('${post._id}')">
                📧 View Contact Details
            </button>
        </div>
    `).join('');
}

// Calculate rating stars
function calculateRatingStars(views, clicks) {
    const rating = calculateRating(views, clicks);
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Calculate rating based on views and clicks
function calculateRating(views, clicks) {
    if (views === 0) return 1;
    
    const engagementRate = clicks / views;
    const baseScore = Math.min(Math.log(views + 1) / Math.log(10), 5);
    const engagementScore = Math.min(engagementRate * 10, 5);
    
    const totalScore = (baseScore + engagementScore) / 2;
    
    if (totalScore >= 4.5) return 5;
    if (totalScore >= 3.5) return 4;
    if (totalScore >= 2.5) return 3;
    if (totalScore >= 1.5) return 2;
    return 1;
}

// Toggle filter section
function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.style.display = filterSection.style.display === 'flex' ? 'none' : 'flex';
}

// Apply filters
function applyFilters() {
    const category = document.getElementById('categoryFilter').value.toLowerCase();
    const city = document.getElementById('cityFilter').value.toLowerCase();
    
    filteredPosts = allPosts.filter(post => {
        const categoryMatch = !category || post.category.toLowerCase().includes(category);
        const cityMatch = !city || post.city.toLowerCase().includes(city);
        
        return categoryMatch && cityMatch;
    });
    
    displayPosts(filteredPosts);
}

// Clear all filters
function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('cityFilter').value = '';
    filteredPosts = [...allPosts];
    displayPosts(filteredPosts);
}

// Show post form modal
function showPostForm(type) {
    document.getElementById('postType').value = type;
    document.getElementById('modalTitle').textContent = `Post ${type === 'sell' ? 'Sell' : 'Buy'} Ad`;
    document.getElementById('postModal').style.display = 'block';
}

// Hide post form modal
function hidePostForm() {
    document.getElementById('postModal').style.display = 'none';
    document.getElementById('postForm').reset();
}

// Handle post form submission
document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const postData = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });
        
        if (response.ok) {
            hidePostForm();
            loadPosts();
            showSuccess('Post created successfully!');
        } else {
            throw new Error('Failed to create post');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error creating post. Please try again.');
    }
});

// View contact details
async function viewContact(postId) {
    if (!localStorage.getItem('loggedIn')) {
        if (!confirm('🔐 Please login to view contact details. Would you like to simulate login?')) {
            return;
        }
        simulateLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/contact`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        alert(`📧 Contact Information:\n\nEmail: ${data.contactEmail}\n\n${data.message}`);
        
        // Reload to update click counts and ratings
        loadPosts();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error fetching contact details. Please try again.');
    }
}

// Simulate login
function simulateLogin() {
    localStorage.setItem('loggedIn', 'true');
    updateAuthUI();
    showSuccess('Successfully logged in with Gmail (simulated)');
}

// Simulate logout
function simulateLogout() {
    localStorage.removeItem('loggedIn');
    updateAuthUI();
    showSuccess('Successfully logged out');
}

// Check login status
function checkLoginStatus() {
    updateAuthUI();
}

// Update authentication UI
function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('loggedIn');
    const authSection = document.querySelector('.auth-section');
    
    if (isLoggedIn) {
        authSection.innerHTML = `
            <p>✅ Logged in with Gmail (simulated)</p>
            <button class="auth-btn logout" onclick="simulateLogout()">Logout</button>
        `;
    } else {
        authSection.innerHTML = `
            <p>🔒 No login required to browse. Click 'View Contact' to simulate login.</p>
            <button class="auth-btn" onclick="simulateLogin()">Simulate Gmail Login</button>
        `;
    }
}

// Utility functions
function showLoading() {
    const container = document.getElementById('postContainer');
    container.innerHTML = '<div class="loading">Loading posts...</div>';
}

function hideLoading() {
    // Loading state is handled in displayPosts
}

function showError(message) {
    const container = document.getElementById('postContainer');
    container.innerHTML = `
        <div class="error">
            <h3>❌ Error</h3>
            <p>${message}</p>
            <button onclick="loadPosts()" class="auth-btn">Try Again</button>
        </div>
    `;
}

function showSuccess(message) {
    alert(`✅ ${message}`);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('postModal');
    if (event.target === modal) {
        hidePostForm();
    }
}