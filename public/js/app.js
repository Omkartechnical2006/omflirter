// State Management
let currentCategory = 'flirting';
let items = [];
let filteredItems = [];
let displayedItems = [];
let editingItemId = null;
let deleteItemId = null;
let searchQuery = '';
let itemsPerPage = 10;
let currentPage = 1;

// DOM Elements
const content = document.getElementById('content');
const tabs = document.querySelectorAll('.tab-btn');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const modal = document.getElementById('modal');
const deleteModal = document.getElementById('deleteModal');
const closeBtn = document.getElementById('closeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const itemForm = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const itemContent = document.getElementById('itemContent');
const itemId = document.getElementById('itemId');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadItems(currentCategory);
    attachEventListeners();
});

// Event Listeners
function attachEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            switchTab(category);
        });
    });

    // Add button
    addBtn.addEventListener('click', openAddModal);

    // Export button
    exportBtn.addEventListener('click', exportItems);

    // Search input
    searchInput.addEventListener('input', handleSearch);
    clearSearch.addEventListener('click', clearSearchInput);

    // Modal close
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Delete modal
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteItem);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Form submission
    itemForm.addEventListener('submit', handleFormSubmit);
}

// Tab Switching
function switchTab(category) {
    currentCategory = category;

    // Update active tab
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    // Clear search when switching tabs
    clearSearchInput();

    // Reset pagination
    currentPage = 1;

    // Load items for this category
    loadItems(category);
}

// Load Items
async function loadItems(category) {
    content.innerHTML = '<div class="loading"></div>';

    try {
        const response = await fetch(`/api/items/${category}`);
        items = await response.json();
        applySearch(); // Apply current search filter
    } catch (error) {
        console.error('Error loading items:', error);
        content.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error loading items</p>';
    }
}

// Render Items
function renderItems() {
    if (filteredItems.length === 0) {
        const message = searchQuery
            ? `<div class="empty-state">
                <div class="empty-emoji">🔍</div>
                <h2>No results found</h2>
                <p>Try a different search term or clear the search to see all items</p>
               </div>`
            : `<div class="empty-state">
                <div class="empty-emoji">📝</div>
                <h2>No items yet</h2>
                <p>Click the "Add New" button to create your first item!</p>
               </div>`;
        content.innerHTML = message;
        return;
    }

    // Calculate items to display based on current page
    const itemsToShow = currentPage * itemsPerPage;
    displayedItems = filteredItems.slice(0, itemsToShow);
    const hasMore = displayedItems.length < filteredItems.length;

    const itemsHTML = displayedItems.map(item => `
        <div class="item-card">
            <div class="item-content">${escapeHtml(item.content)}</div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editItem('${item._id}')">
                    ✏️ Edit
                </button>
                <button class="btn-delete-item" onclick="openDeleteModal('${item._id}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');

    const searchSummary = searchQuery
        ? `<p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
            Showing ${displayedItems.length} of ${filteredItems.length} items (Total: ${items.length})
           </p>`
        : `<p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
            Showing ${displayedItems.length} of ${filteredItems.length} items
           </p>`;

    const loadMoreButton = hasMore
        ? `<div class="load-more-container">
            <button class="btn-load-more" onclick="loadMore()">
                📄 Load More (${filteredItems.length - displayedItems.length} remaining)
            </button>
           </div>`
        : '';

    content.innerHTML = searchSummary + `<div class="items-grid">${itemsHTML}</div>` + loadMoreButton;
}

// Modal Functions
function openAddModal() {
    editingItemId = null;
    modalTitle.textContent = 'Add New Item';
    itemContent.value = '';
    itemId.value = '';
    modal.classList.add('active');
    itemContent.focus();
}

function editItem(id) {
    const item = items.find(i => i._id === id);
    if (!item) return;

    editingItemId = id;
    modalTitle.textContent = 'Edit Item';
    itemContent.value = item.content;
    itemId.value = id;
    modal.classList.add('active');
    itemContent.focus();
}

function closeModal() {
    modal.classList.remove('active');
    itemForm.reset();
    editingItemId = null;
}

function openDeleteModal(id) {
    deleteItemId = id;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteItemId = null;
}

// Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const content = itemContent.value.trim();
    if (!content) return;

    try {
        if (editingItemId) {
            // Update existing item
            await fetch(`/api/items/${editingItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });
        } else {
            // Create new item
            await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    category: currentCategory,
                }),
            });
        }

        closeModal();
        loadItems(currentCategory);
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item. Please try again.');
    }
}

// Delete Item
async function deleteItem() {
    if (!deleteItemId) return;

    try {
        await fetch(`/api/items/${deleteItemId}`, {
            method: 'DELETE',
        });

        closeDeleteModal();
        loadItems(currentCategory);
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
    }
}

// Search Functions
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase().trim();

    // Show/hide clear button
    if (searchQuery) {
        clearSearch.style.display = 'flex';
    } else {
        clearSearch.style.display = 'none';
    }

    applySearch();
}

function applySearch() {
    if (!searchQuery) {
        filteredItems = [...items];
    } else {
        filteredItems = items.filter(item =>
            item.content.toLowerCase().includes(searchQuery)
        );
    }
    // Reset pagination when search changes
    currentPage = 1;
    renderItems();
}

function clearSearchInput() {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.style.display = 'none';
    currentPage = 1; // Reset pagination
    applySearch();
}

// Load More Function
function loadMore() {
    currentPage++;
    renderItems();
    // Smooth scroll to first new item
    setTimeout(() => {
        const cards = document.querySelectorAll('.item-card');
        const firstNewCard = cards[(currentPage - 1) * itemsPerPage];
        if (firstNewCard) {
            firstNewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Export Items
function exportItems() {
    // Navigate to export endpoint
    window.location.href = `/api/export/${currentCategory}`;
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        if (modal.classList.contains('active')) {
            closeModal();
        }
        if (deleteModal.classList.contains('active')) {
            closeDeleteModal();
        }
    }

    // Ctrl/Cmd + N opens new item modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddModal();
    }
});
