/**
 * Admin panel specific JavaScript for Agnoster
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the admin page
  if (!document.getElementById('admin-page')) return;
  
  // DOM elements
  const configForm = document.getElementById('config-form');
  const blacklistForm = document.getElementById('blacklist-form');
  const blacklistItems = document.getElementById('blacklist-items');
  const userForm = document.getElementById('user-form');
  const usersList = document.getElementById('users-list');
  const userFormContainer = document.getElementById('user-form-container');
  const newUserBtn = document.getElementById('new-user-btn');
  const cancelUserBtn = document.getElementById('cancel-user-btn');
  
  // State
  let users = [];
  let blacklist = [];
  let editingUserId = null;
  
  // Initialize admin page
  async function initializeAdminPage() {
    try {
      // Fetch data
      const [configData, blacklistData, usersData] = await Promise.all([
        ApiClient.getConfig(),
        ApiClient.getBlacklist(),
        ApiClient.getUsers()
      ]);
      
      // Initialize config form
      if (configForm && configData) {
        configForm.querySelector('#shutdown_threshold').value = configData.shutdown_threshold || 14;
        configForm.querySelector('#monitoring_interval').value = configData.monitoring_interval || 5;
      }
      
      // Initialize blacklist
      blacklist = blacklistData || [];
      renderBlacklist();
      
      // Initialize users
      users = usersData || [];
      renderUsers();
      
      // Add event listeners
      attachEventListeners();
    } catch (error) {
      console.error('Failed to initialize admin page:', error);
      Utils.showToast('Failed to load admin data', 'error');
    }
  }
  
  // Render blacklist items
  function renderBlacklist() {
    if (!blacklistItems) return;
    
    if (blacklist.length === 0) {
      blacklistItems.innerHTML = '<p class="text-muted">No namespaces in blacklist</p>';
      return;
    }
    
    blacklistItems.innerHTML = blacklist.map(namespace => `
      <div class="blacklist-item">
        ${namespace}
        <button class="remove-blacklist" data-namespace="${namespace}" title="Remove from blacklist">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-blacklist').forEach(button => {
      button.addEventListener('click', async (e) => {
        const namespace = button.getAttribute('data-namespace');
        if (!namespace) return;
        
        try {
          await ApiClient.removeFromBlacklist(namespace);
          
          // Update local state
          blacklist = blacklist.filter(item => item !== namespace);
          renderBlacklist();
          
          Utils.showToast(`Removed ${namespace} from blacklist`, 'success');
        } catch (error) {
          console.error('Failed to remove from blacklist:', error);
          Utils.showToast(`Failed to remove from blacklist: ${error.message}`, 'error');
        }
      });
    });
  }
  
  // Render users table
  function renderUsers() {
    if (!usersList) return;
    
    if (users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="4" class="text-center">No users found</td></tr>';
      return;
    }
    
    usersList.innerHTML = users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${user.is_admin ? 'Admin' : 'User'}</td>
        <td>${user.first_login ? 'Yes' : 'No'}</td>
        <td class="user-actions">
          <button class="action-button reset edit-user" data-id="${user.id}" title="Edit user">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            Edit
          </button>
          <button class="action-button destroy delete-user" data-id="${user.id}" title="Delete user">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Delete
          </button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-user').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = parseInt(button.getAttribute('data-id'));
        if (isNaN(userId)) return;
        
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        // Show edit form
        showUserForm(user);
      });
    });
    
    document.querySelectorAll('.delete-user').forEach(button => {
      button.addEventListener('click', async (e) => {
        const userId = parseInt(button.getAttribute('data-id'));
        if (isNaN(userId)) return;
        
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        // Confirm deletion
        Utils.confirmDialog(
          'Delete User',
          `Are you sure you want to delete the user "${user.username}"? This action cannot be undone.`,
          async () => {
            try {
              await ApiClient.deleteUser(userId);
              
              // Update local state
              users = users.filter(u => u.id !== userId);
              renderUsers();
              
              Utils.showToast(`User ${user.username} deleted successfully`, 'success');
            } catch (error) {
              console.error('Failed to delete user:', error);
              Utils.showToast(`Failed to delete user: ${error.message}`, 'error');
            }
          },
          'Delete',
          'Cancel'
        );
      });
    });
  }
  
  // Show user form for creating or editing
  function showUserForm(user = null) {
    if (!userFormContainer || !userForm) return;
    
    // Set form state
    editingUserId = user ? user.id : null;
    
    // Update form fields
    userForm.querySelector('#username').value = user ? user.username : '';
    userForm.querySelector('#password').value = '';
    
    // Set is_admin checkbox
    const isAdminCheckbox = userForm.querySelector('#is_admin');
    if (isAdminCheckbox) {
      isAdminCheckbox.checked = user ? user.is_admin : false;
    }
    
    // Update form title
    const formTitle = userFormContainer.querySelector('h3');
    if (formTitle) {
      formTitle.textContent = user ? 'Edit User' : 'Create New User';
    }
    
    // Show form
    userFormContainer.style.display = 'block';
  }
  
  // Hide user form
  function hideUserForm() {
    if (userFormContainer) {
      userFormContainer.style.display = 'none';
    }
    
    // Reset form
    if (userForm) {
      userForm.reset();
    }
    
    editingUserId = null;
  }
  
  // Attach event listeners
  function attachEventListeners() {
    // Config form submission
    if (configForm) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const shutdownThreshold = parseInt(configForm.querySelector('#shutdown_threshold').value);
        const monitoringInterval = parseInt(configForm.querySelector('#monitoring_interval').value);
        
        if (isNaN(shutdownThreshold) || isNaN(monitoringInterval)) {
          Utils.showToast('Please enter valid numbers for all fields', 'error');
          return;
        }
        
        try {
          await ApiClient.updateConfig({
            shutdown_threshold: shutdownThreshold,
            monitoring_interval: monitoringInterval
          });
          
          Utils.showToast('Configuration updated successfully', 'success');
        } catch (error) {
          console.error('Failed to update config:', error);
          Utils.showToast(`Failed to update configuration: ${error.message}`, 'error');
        }
      });
    }
    
    // Blacklist form submission
    if (blacklistForm) {
      blacklistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const namespaceInput = blacklistForm.querySelector('#namespace_name');
        const namespace = namespaceInput.value.trim();
        
        if (!namespace) {
          Utils.showToast('Please enter a namespace name', 'error');
          return;
        }
        
        try {
          await ApiClient.addToBlacklist(namespace);
          
          // Update local state
          blacklist.push(namespace);
          renderBlacklist();
          
          // Clear input
          namespaceInput.value = '';
          
          Utils.showToast(`Added ${namespace} to blacklist`, 'success');
        } catch (error) {
          console.error('Failed to add to blacklist:', error);
          Utils.showToast(`Failed to add to blacklist: ${error.message}`, 'error');
        }
      });
    }
    
    // New user button
    if (newUserBtn) {
      newUserBtn.addEventListener('click', () => {
        showUserForm();
      });
    }
    
    // Cancel user button
    if (cancelUserBtn) {
      cancelUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideUserForm();
      });
    }
    
    // User form submission
    if (userForm) {
      userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = userForm.querySelector('#username').value.trim();
        const password = userForm.querySelector('#password').value;
        const isAdmin = userForm.querySelector('#is_admin').checked;
        
        if (!username) {
          Utils.showToast('Please enter a username', 'error');
          return;
        }
        
        // For new users, password is required
        if (!editingUserId && !password) {
          Utils.showToast('Please enter a password', 'error');
          return;
        }
        
        try {
          let response;
          
          if (editingUserId) {
            // Update existing user
            response = await ApiClient.updateUser({
              id: editingUserId,
              username,
              password, // Only update if provided
              is_admin: isAdmin
            });
            
            Utils.showToast(`User ${username} updated successfully`, 'success');
          } else {
            // Create new user
            response = await ApiClient.createUser({
              username,
              password,
              is_admin: isAdmin
            });
            
            Utils.showToast(`User ${username} created successfully`, 'success');
          }
          
          // Refresh users list
          const usersData = await ApiClient.getUsers();
          users = usersData;
          renderUsers();
          
          // Hide form
          hideUserForm();
        } catch (error) {
          console.error('Failed to save user:', error);
          Utils.showToast(`Failed to save user: ${error.message}`, 'error');
        }
      });
    }
  }
  
  // Initialize admin page
  initializeAdminPage();
});
