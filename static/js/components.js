/**
 * UI Components for Agnoster
 * 
 * This file contains reusable UI components and utilities
 * following the ShadCN UI design system principles
 */

// Component initialization and utilities
const ShadcnComponents = {
  /**
   * Initialize all components on page load
   */
  init: function() {
    this.initDropdowns();
    this.initAlerts();
    this.initTooltips();
    this.initModals();
    this.initTabs();
  },

  /**
   * Initialize dropdown components
   */
  initDropdowns: function() {
    document.querySelectorAll('[data-dropdown-toggle]').forEach(toggle => {
      const targetId = toggle.getAttribute('data-dropdown-toggle');
      const target = document.getElementById(targetId);
      
      if (target) {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Close other dropdowns
          document.querySelectorAll('.shadcn-dropdown-content.active').forEach(dropdown => {
            if (dropdown.id !== targetId) {
              dropdown.classList.remove('active');
            }
          });
          
          // Toggle current dropdown
          target.classList.toggle('active');
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.shadcn-dropdown')) {
        document.querySelectorAll('.shadcn-dropdown-content.active').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  },

  /**
   * Initialize alert components
   */
  initAlerts: function() {
    document.querySelectorAll('.shadcn-alert-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        const alert = closeBtn.closest('.shadcn-alert');
        if (alert) {
          alert.style.opacity = '0';
          setTimeout(() => {
            alert.remove();
          }, 300);
        }
      });
    });
  },

  /**
   * Initialize tooltip components
   */
  initTooltips: function() {
    // Tooltips are CSS-only, no JS needed
  },

  /**
   * Initialize modal/dialog components
   */
  initModals: function() {
    document.querySelectorAll('[data-modal-toggle]').forEach(toggle => {
      const targetId = toggle.getAttribute('data-modal-toggle');
      const target = document.getElementById(targetId);
      
      if (target) {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          target.classList.add('active');
        });
        
        // Close button
        const closeButtons = target.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(closeBtn => {
          closeBtn.addEventListener('click', () => {
            target.classList.remove('active');
          });
        });
        
        // Close on overlay click
        target.addEventListener('click', (e) => {
          if (e.target === target) {
            target.classList.remove('active');
          }
        });
      }
    });
  },

  /**
   * Initialize tab components
   */
  initTabs: function() {
    document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
      const tabs = tabContainer.querySelectorAll('[data-tab]');
      const panels = tabContainer.querySelectorAll('[data-tab-panel]');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');
          
          // Deactivate all tabs
          tabs.forEach(t => t.classList.remove('active'));
          
          // Hide all panels
          panels.forEach(panel => {
            panel.classList.remove('active');
          });
          
          // Activate current tab and panel
          tab.classList.add('active');
          tabContainer.querySelector(`[data-tab-panel="${target}"]`).classList.add('active');
        });
      });
    });
  },

  /**
   * Create a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  createToast: function(message, type = 'info', duration = 3000) {
    // Create container if it doesn't exist
    let container = document.querySelector('.shadcn-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'shadcn-toast-container';
      document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'shadcn-toast';
    
    // Icons for different types
    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    // Set toast content
    toast.innerHTML = `
      <div class="shadcn-toast-icon">${icons[type] || icons.info}</div>
      <div class="shadcn-toast-content">
        <div class="shadcn-toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="shadcn-toast-description">${message}</div>
      </div>
      <button class="shadcn-toast-close">&times;</button>
    `;
    
    // Add close functionality
    toast.querySelector('.shadcn-toast-close').addEventListener('click', () => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    });
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('active'), 10);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
    
    return toast;
  },

  /**
   * Create a confirmation dialog
   * @param {Object} options - Dialog options
   * @returns {Promise} - Resolves with true if confirmed, false if canceled
   */
  confirmDialog: function(options = {}) {
    return new Promise((resolve) => {
      const defaults = {
        title: 'Confirm Action',
        message: 'Are you sure you want to continue?',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        destructive: false
      };
      
      const settings = { ...defaults, ...options };
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'shadcn-dialog-overlay';
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'shadcn-dialog';
      
      // Set dialog content
      dialog.innerHTML = `
        <div class="shadcn-dialog-header">
          <h3 class="shadcn-dialog-title">${settings.title}</h3>
          <button class="shadcn-dialog-close" data-modal-close>&times;</button>
        </div>
        <div class="shadcn-dialog-content">
          <p>${settings.message}</p>
        </div>
        <div class="shadcn-dialog-footer">
          <button class="shadcn-button shadcn-button-outline cancel-btn">${settings.cancelText}</button>
          <button class="shadcn-button ${settings.destructive ? 'shadcn-button-destructive' : 'shadcn-button-primary'} confirm-btn">${settings.confirmText}</button>
        </div>
      `;
      
      // Add dialog to overlay
      overlay.appendChild(dialog);
      
      // Add overlay to document
      document.body.appendChild(overlay);
      
      // Handle close
      const closeDialog = (result) => {
        overlay.classList.add('closing');
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };
      
      // Add event listeners
      dialog.querySelector('.shadcn-dialog-close').addEventListener('click', () => closeDialog(false));
      dialog.querySelector('.cancel-btn').addEventListener('click', () => closeDialog(false));
      dialog.querySelector('.confirm-btn').addEventListener('click', () => closeDialog(true));
      
      // Allow closing by clicking overlay
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeDialog(false);
        }
      });
      
      // Animation
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
    });
  },

  /**
   * Toggle switch component constructor
   * @param {HTMLElement} element - Container element
   * @param {Function} onChange - Callback on state change
   */
  createToggleSwitch: function(element, onChange = () => {}) {
    if (!element) return;
    
    const id = `switch-${Math.random().toString(36).substring(2, 9)}`;
    const checked = element.getAttribute('data-checked') === 'true';
    
    element.innerHTML = `
      <label class="shadcn-switch">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
        <span class="shadcn-switch-slider"></span>
      </label>
    `;
    
    const input = element.querySelector('input');
    input.addEventListener('change', () => {
      onChange(input.checked);
    });
    
    return {
      element,
      getChecked: () => input.checked,
      setChecked: (value) => {
        input.checked = Boolean(value);
      }
    };
  }
};

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  ShadcnComponents.init();
  
  // Process any flash messages from the server and show them as toasts
  document.querySelectorAll('.flash-message').forEach(message => {
    const category = message.getAttribute('data-category') || 'info';
    const text = message.textContent.trim();
    
    if (text) {
      ShadcnComponents.createToast(text, category);
    }
    
    // Remove the message element
    message.remove();
  });
  
  // Icons for buttons
  document.querySelectorAll('[data-icon]').forEach(element => {
    const iconName = element.getAttribute('data-icon');
    
    const icons = {
      play: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
      stop: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
      destroy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
      reset: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      edit: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
      user: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      settings: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      logout: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
      plus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      close: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    };
    
    if (icons[iconName]) {
      element.innerHTML = icons[iconName] + element.innerHTML;
    }
  });
});
