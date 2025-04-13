/**
 * Dashboard specific JavaScript for Agnoster
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const dashboardContent = document.getElementById('dashboard-content');
  const namespaceStats = document.getElementById('namespace-stats');
  const podStats = document.getElementById('pod-stats');
  const loadingIndicator = document.getElementById('loading-indicator');
  
  // State
  let namespaces = [];
  let pods = [];
  let config = {
    shutdown_threshold: 14 // Default threshold in hours
  };
  
  // Icons
  const icons = {
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
    stop: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
    destroy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
    reset: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  
  // Initialize dashboard
  async function initializeDashboard() {
    try {
      showLoading(true);
      
      // Fetch data in parallel
      const [namespacesData, podsData, configData] = await Promise.all([
        ApiClient.getNamespaces(),
        ApiClient.getAllPods(),
        ApiClient.getConfig().catch(() => ({ shutdown_threshold: 14 }))
      ]);
      
      namespaces = namespacesData;
      pods = podsData;
      config = configData;
      
      // Update stats
      updateStats();
      
      // Render dashboard
      renderDashboard();
      
      // Start polling for updates
      startPolling();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      showError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      showLoading(false);
    }
  }
  
  // Show/hide loading indicator
  function showLoading(show) {
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }
  
  // Show error message
  function showError(message) {
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="shadcn-alert shadcn-alert-destructive">
          <div class="shadcn-alert-icon">${icons.warning}</div>
          <div class="shadcn-alert-content">
            <div class="shadcn-alert-title">Error</div>
            <div class="shadcn-alert-description">${message}</div>
          </div>
        </div>
      `;
    }
  }
  
  // Update statistics
  function updateStats() {
    if (namespaceStats && podStats) {
      const totalNamespaces = namespaces.length;
      const activeNamespaces = namespaces.filter(ns => ns.status === 'Active').length;
      
      const totalPods = pods.length;
      const runtimeThreshold = config.shutdown_threshold || 14;
      const longRunningPods = pods.filter(pod => pod.runtime_hours > runtimeThreshold).length;
      
      namespaceStats.innerHTML = `
        <div class="stat-card card">
          <div class="stat-title">Total Namespaces</div>
          <div class="stat-value">${totalNamespaces}</div>
        </div>
        <div class="stat-card card">
          <div class="stat-title">Active Namespaces</div>
          <div class="stat-value">${activeNamespaces}</div>
        </div>
      `;
      
      podStats.innerHTML = `
        <div class="stat-card card">
          <div class="stat-title">Total Pods</div>
          <div class="stat-value">${totalPods}</div>
        </div>
        <div class="stat-card card">
          <div class="stat-title">Long-Running Pods</div>
          <div class="stat-value">${longRunningPods}</div>
          <div class="stat-description">&gt; ${runtimeThreshold} hours</div>
        </div>
      `;
    }
  }
  
  // Render dashboard content
  function renderDashboard() {
    if (!dashboardContent) return;
    
    // Group pods by namespace
    const podsByNamespace = pods.reduce((acc, pod) => {
      const namespace = pod.namespace;
      if (!acc[namespace]) {
        acc[namespace] = [];
      }
      acc[namespace].push(pod);
      return acc;
    }, {});
    
    // Render namespace cards
    const cards = namespaces.map(namespace => {
      const namespacePods = podsByNamespace[namespace.name] || [];
      const longestRunningPod = namespacePods.length > 0 
        ? namespacePods.reduce((prev, current) => 
            (prev.runtime_hours > current.runtime_hours) ? prev : current
          ) 
        : null;
      
      const statusBadgeClass = namespace.status === 'Active' ? 'active' : 'pending';
      
      // Sort pods by runtime (longest first)
      const sortedPods = [...namespacePods].sort((a, b) => b.runtime_hours - a.runtime_hours);
      
      // Take top 3 pods to show
      const topPods = sortedPods.slice(0, 3);
      
      const hasLongRunningPods = namespacePods.some(pod => pod.runtime_hours > config.shutdown_threshold);
      
      return `
        <div class="namespace-card card" data-namespace="${namespace.name}">
          <div class="namespace-header">
            <div class="namespace-title">
              <h3 class="namespace-name">${namespace.name}</h3>
              <div class="namespace-status">
                <span class="status-badge ${statusBadgeClass}">${namespace.status}</span>
                ${hasLongRunningPods ? `<span class="status-badge pending">${icons.warning} Warning</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="namespace-meta">
            <div class="meta-item">
              <span class="meta-label">Created:</span>
              <span class="meta-value">${Utils.formatDate(namespace.created_at)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Pod Count:</span>
              <span class="meta-value">${namespace.pod_count}</span>
            </div>
            ${longestRunningPod ? `
              <div class="meta-item">
                <span class="meta-label">Longest Runtime:</span>
                <span class="meta-value">${Utils.formatRuntime(longestRunningPod.runtime_hours)}</span>
              </div>
            ` : ''}
          </div>
          
          ${topPods.length > 0 ? `
            <div class="namespace-pods">
              <h4 class="pod-title">Top Pods</h4>
              <div class="pod-list">
                ${topPods.map(pod => `
                  <div class="pod-item">
                    <span class="pod-name">${pod.name}</span>
                    <span class="pod-runtime">${Utils.formatRuntime(pod.runtime_hours)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="namespace-actions">
            <button class="action-button start" data-action="start" data-namespace="${namespace.name}" title="Start namespace">
              ${icons.play} Start
            </button>
            <button class="action-button stop" data-action="stop" data-namespace="${namespace.name}" title="Stop namespace">
              ${icons.stop} Stop
            </button>
            <button class="action-button destroy" data-action="destroy" data-namespace="${namespace.name}" title="Permanently destroy namespace">
              ${icons.destroy} Destroy
            </button>
            <button class="action-button reset" data-action="reset" data-namespace="${namespace.name}" title="Reset monitoring state">
              ${icons.reset} Reset
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    dashboardContent.innerHTML = cards || `
      <div class="empty-state">
        <p>No namespaces found. Namespaces on the blacklist are not shown.</p>
      </div>
    `;
    
    // Add event listeners to action buttons
    attachActionButtonHandlers();
  }
  
  // Attach event handlers to action buttons
  function attachActionButtonHandlers() {
    const actionButtons = document.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const action = button.getAttribute('data-action');
        const namespace = button.getAttribute('data-namespace');
        
        if (!namespace || !action) return;
        
        // Different confirmation messages based on action
        let confirmTitle, confirmMessage;
        
        switch (action) {
          case 'start':
            confirmTitle = 'Start Namespace';
            confirmMessage = `Are you sure you want to start the namespace "${namespace}"?`;
            break;
          case 'stop':
            confirmTitle = 'Stop Namespace';
            confirmMessage = `Are you sure you want to stop the namespace "${namespace}"? This will stop all running pods.`;
            break;
          case 'destroy':
            confirmTitle = 'Destroy Namespace';
            confirmMessage = `Are you sure you want to destroy the namespace "${namespace}"? This action is irreversible and will permanently delete all resources in this namespace.`;
            break;
          case 'reset':
            confirmTitle = 'Reset Namespace Monitoring';
            confirmMessage = `Are you sure you want to reset the monitoring state for namespace "${namespace}"?`;
            break;
          default:
            return;
        }
        
        // Show confirmation dialog
        Utils.confirmDialog(confirmTitle, confirmMessage, async () => {
          try {
            showLoading(true);
            
            let result;
            switch (action) {
              case 'start':
                result = await ApiClient.startNamespace(namespace);
                break;
              case 'stop':
                result = await ApiClient.stopNamespace(namespace);
                break;
              case 'destroy':
                result = await ApiClient.destroyNamespace(namespace);
                break;
              case 'reset':
                result = await ApiClient.resetNamespace(namespace);
                break;
            }
            
            // Show success message
            Utils.showToast(result.message || `${action} operation successful`, 'success');
            
            // Refresh data after a short delay
            setTimeout(refreshData, 1000);
          } catch (error) {
            console.error(`Failed to ${action} namespace:`, error);
            Utils.showToast(`Failed to ${action} namespace: ${error.message}`, 'error');
          } finally {
            showLoading(false);
          }
        });
      });
    });
  }
  
  // Refresh data
  async function refreshData() {
    try {
      // Fetch updated data
      const [namespacesData, podsData] = await Promise.all([
        ApiClient.getNamespaces(),
        ApiClient.getAllPods()
      ]);
      
      namespaces = namespacesData;
      pods = podsData;
      
      // Update stats and re-render
      updateStats();
      renderDashboard();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }
  
  // Start polling for updates
  function startPolling() {
    // Poll every 5 seconds as per requirements
    setInterval(refreshData, 5000);
  }
  
  // Initialize dashboard when DOM is loaded
  initializeDashboard();
});
