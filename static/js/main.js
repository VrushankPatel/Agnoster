/**
 * Main JavaScript for Agnoster
 */

// Common utility functions
const Utils = {
  /**
   * Format a timestamp
   * @param {string} timestamp - ISO timestamp string
   * @param {boolean} includeTime - Whether to include time
   * @returns {string} Formatted date/time
   */
  formatDate: function(timestamp, includeTime = true) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
  },
  
  /**
   * Format runtime hours into a human-readable format
   * @param {number} hours - Hours as a decimal
   * @returns {string} Formatted time
   */
  formatRuntime: function(hours) {
    if (hours === undefined || hours === null) return 'N/A';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);
    
    if (minutes === 0) {
      return `${fullHours} hour${fullHours !== 1 ? 's' : ''}`;
    }
    
    return `${fullHours}h ${minutes}m`;
  },
  
  /**
   * Creates a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, warning)
   * @param {number} duration - Duration in milliseconds
   */
  showToast: function(message, type = 'success', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.shadcn-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'shadcn-toast-container';
      document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'shadcn-toast';
    
    // Set icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case 'error':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        break;
      case 'warning':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      default:
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    // Set toast content
    toast.innerHTML = `
      <div class="shadcn-toast-icon">${icon}</div>
      <div class="shadcn-toast-content">
        <div class="shadcn-toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="shadcn-toast-description">${message}</div>
      </div>
      <button class="shadcn-toast-close">&times;</button>
    `;
    
    // Add event listener to close button
    toast.querySelector('.shadcn-toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    // Add toast to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('active');
    }, 10);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  },
  
  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Callback on confirm
   * @param {string} confirmText - Text for confirm button
   * @param {string} cancelText - Text for cancel button
   */
  confirmDialog: function(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'shadcn-dialog-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'shadcn-dialog';
    
    // Set dialog content
    dialog.innerHTML = `
      <div class="shadcn-dialog-header">
        <h3 class="shadcn-dialog-title">${title}</h3>
        <button class="shadcn-dialog-close">&times;</button>
      </div>
      <div class="shadcn-dialog-content">
        <p>${message}</p>
      </div>
      <div class="shadcn-dialog-footer">
        <button class="shadcn-button shadcn-button-outline dialog-cancel">${cancelText}</button>
        <button class="shadcn-button shadcn-button-primary dialog-confirm">${confirmText}</button>
      </div>
    `;
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners
    const closeDialog = () => {
      overlay.remove();
    };
    
    dialog.querySelector('.shadcn-dialog-close').addEventListener('click', closeDialog);
    dialog.querySelector('.dialog-cancel').addEventListener('click', closeDialog);
    dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
      onConfirm();
      closeDialog();
    });
    
    // Close if clicking outside the dialog
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog();
      }
    });
  }
};

// API client for backend communication
const ApiClient = {
  // Flag to check if connection is lost
  _connectionLost: false,
  
  // Connection loss alert element
  _connectionAlert: null,
  
  /**
   * Show connection loss alert
   */
  showConnectionLossAlert() {
    // Only show once
    if (this._connectionLost) return;
    
    this._connectionLost = true;
    
    // Create alert if it doesn't exist
    if (!this._connectionAlert) {
      this._connectionAlert = document.createElement('div');
      this._connectionAlert.className = 'shadcn-alert shadcn-alert-destructive connection-loss-alert';
      this._connectionAlert.innerHTML = `
        <div class="shadcn-alert-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-wifi-off">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        </div>
        <div class="shadcn-alert-content">
          <div class="shadcn-alert-title">Connection Lost</div>
          <div class="shadcn-alert-description">
            Unable to connect to the server. Please check your network connection, proxy settings, or VPN configuration.
            <button class="shadcn-button shadcn-button-outline retry-button">Retry Connection</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(this._connectionAlert);
      
      // Add event listener to retry button
      this._connectionAlert.querySelector('.retry-button').addEventListener('click', () => {
        this.resetConnectionState();
        window.location.reload();
      });
    } else {
      // Show existing alert
      this._connectionAlert.style.display = 'flex';
    }
  },
  
  /**
   * Reset connection state
   */
  resetConnectionState() {
    this._connectionLost = false;
    if (this._connectionAlert) {
      this._connectionAlert.style.display = 'none';
    }
  },
  
  /**
   * Generic fetch with error handling
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async fetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }
      
      // Connection restored if we got here
      this.resetConnectionState();
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Check if it's a network error (connection loss)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        this.showConnectionLossAlert();
        throw new Error('Connection to server lost. Please check your network settings.');
      }
      
      Utils.showToast(error.message, 'error');
      throw error;
    }
  },
  
  /**
   * Get all namespaces
   * @returns {Promise<Object>} Response with namespaces and demo mode flag
   */
  async getNamespaces() {
    return this.fetch('/api/namespaces');
  },
  
  /**
   * Get pods in a namespace
   * @param {string} namespace - Namespace name
   * @returns {Promise<Object>} Response with pods and demo mode flag
   */
  async getPods(namespace) {
    return this.fetch(`/api/pods/${namespace}`);
  },
  
  /**
   * Get all pods across namespaces
   * @returns {Promise<Object>} Response with pods and demo mode flag
   */
  async getAllPods() {
    return this.fetch('/api/all_pods');
  },
  
  /**
   * Start a namespace
   * @param {string} namespace - Namespace to start
   * @returns {Promise<Object>} Response
   */
  async startNamespace(namespace) {
    return this.fetch(`/api/namespace/${namespace}/start`, {
      method: 'POST'
    });
  },
  
  /**
   * Stop a namespace
   * @param {string} namespace - Namespace to stop
   * @returns {Promise<Object>} Response
   */
  async stopNamespace(namespace) {
    return this.fetch(`/api/namespace/${namespace}/stop`, {
      method: 'POST'
    });
  },
  
  /**
   * Destroy a namespace
   * @param {string} namespace - Namespace to destroy
   * @returns {Promise<Object>} Response
   */
  async destroyNamespace(namespace) {
    return this.fetch(`/api/namespace/${namespace}/destroy`, {
      method: 'POST'
    });
  },
  
  /**
   * Reset a namespace
   * @param {string} namespace - Namespace to reset
   * @returns {Promise<Object>} Response
   */
  async resetNamespace(namespace) {
    return this.fetch(`/api/namespace/${namespace}/reset`, {
      method: 'POST'
    });
  },
  
  /**
   * Get configuration
   * @returns {Promise<Object>} Configuration
   */
  async getConfig() {
    return this.fetch('/api/config');
  },
  
  /**
   * Update configuration
   * @param {Object} config - Configuration to update
   * @returns {Promise<Object>} Response
   */
  async updateConfig(config) {
    return this.fetch('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },
  
  /**
   * Get blacklist
   * @returns {Promise<Array>} Blacklisted namespaces
   */
  async getBlacklist() {
    return this.fetch('/api/blacklist');
  },
  
  /**
   * Add namespace to blacklist
   * @param {string} namespace - Namespace to blacklist
   * @returns {Promise<Object>} Response
   */
  async addToBlacklist(namespace) {
    return this.fetch('/api/blacklist', {
      method: 'POST',
      body: JSON.stringify({ namespace })
    });
  },
  
  /**
   * Remove namespace from blacklist
   * @param {string} namespace - Namespace to remove
   * @returns {Promise<Object>} Response
   */
  async removeFromBlacklist(namespace) {
    return this.fetch('/api/blacklist', {
      method: 'DELETE',
      body: JSON.stringify({ namespace })
    });
  },
  
  /**
   * Get users
   * @returns {Promise<Array>} Users
   */
  async getUsers() {
    return this.fetch('/api/users');
  },
  
  /**
   * Create user
   * @param {Object} user - User data
   * @returns {Promise<Object>} Response
   */
  async createUser(user) {
    return this.fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },
  
  /**
   * Update user
   * @param {Object} user - User data
   * @returns {Promise<Object>} Response
   */
  async updateUser(user) {
    return this.fetch('/api/users', {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  },
  
  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<Object>} Response
   */
  async deleteUser(id) {
    return this.fetch('/api/users', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize dropdowns
  const dropdownToggles = document.querySelectorAll('[data-dropdown-toggle]');
  dropdownToggles.forEach(toggle => {
    const targetId = toggle.getAttribute('data-dropdown-toggle');
    const target = document.getElementById(targetId);
    
    if (target) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        target.classList.toggle('active');
      });
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.shadcn-dropdown-content.active').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  });
  
  // Initialize flash messages as toasts
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(message => {
    const category = message.getAttribute('data-category') || 'info';
    const text = message.textContent.trim();
    
    if (text) {
      Utils.showToast(text, category);
    }
    
    // Remove after processing
    message.remove();
  });
});
