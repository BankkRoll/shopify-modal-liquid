/**
 * Universal Modal System
 * 
 * A comprehensive modal management system for Shopify themes that handles
 * multiple trigger types, frequency controls, and responsive behavior.
 * 
 * Features:
 * - Multiple trigger types (time, scroll, click, exit intent, page load, manual)
 * - Frequency controls (always, once per session/day/week)
 * - Device-specific visibility (mobile/desktop)
 * - Accessibility compliant (ARIA, keyboard navigation)
 * - Development mode for testing
 * - Theme-agnostic design
 * 
 * @class ModalManager
 */
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.scrollListeners = new Set();
    this.exitIntentListeners = new Set();
    this.isInitialized = false;
    this.storage = {
      prefix: 'modal_',
      session: sessionStorage,
      local: localStorage
    };
    
    this.init();
  }

  /**
   * Initialize the modal manager
   * Sets up DOM ready listeners and discovers existing modals
   * @private
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.discoverModals());
    } else {
      this.discoverModals();
    }

    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    this.cleanupOldData();
  }

  /**
   * Discover and register all modal elements in the DOM
   * @private
   */
  discoverModals() {
    const modalElements = document.querySelectorAll('[data-modal-trigger-type]');
    
    modalElements.forEach(modal => {
      const modalId = modal.dataset.modalId;
      if (!modalId) return;

      const config = this.parseModalConfig(modal);
      this.registerModal(modalId, config, modal);
    });

    if (this.isDebugMode()) {
      console.log(`Modal Manager: Discovered ${modalElements.length} modals`);
    }
  }

  /**
   * Parse modal configuration from DOM element data attributes
   * @param {HTMLElement} modal - The modal DOM element
   * @returns {Object} Modal configuration object
   * @private
   */
  parseModalConfig(modal) {
    const dataset = modal.dataset;
    
    return {
      element: modal,
      triggerType: dataset.modalTriggerType || 'page-load',
      triggerValue: dataset.modalTriggerValue || '0',
      frequency: dataset.modalFrequency || 'once-per-session',
      delay: parseInt(dataset.modalDelay) || 0,
      mobileEnabled: dataset.modalMobile !== 'false',
      desktopEnabled: dataset.modalDesktop !== 'false',
      closeOnOutsideClick: dataset.modalCloseOutside !== 'false',
      autoCloseAfter: parseInt(dataset.modalAutoClose) || 0,
      devMode: dataset.modalDevMode === 'true',
      isShown: false,
      lastShown: null
    };
  }

  /**
   * Register a modal with the manager
   * @param {string} modalId - Unique modal identifier
   * @param {Object} config - Modal configuration
   * @param {HTMLElement} element - Modal DOM element
   * @private
   */
  registerModal(modalId, config, element) {
    if (!this.isDeviceCompatible(config)) {
      if (this.isDebugMode()) {
        console.log(`Modal ${modalId}: Skipped (device not compatible)`);
      }
      return;
    }

    if (!this.canShowModal(modalId, config.frequency)) {
      if (this.isDebugMode()) {
        console.log(`Modal ${modalId}: Skipped (frequency restriction)`);
      }
      return;
    }

    this.modals.set(modalId, config);
    this.setupModalTrigger(modalId, config);
    this.setupModalEvents(element);
    
    if (this.isDebugMode()) {
      console.log(`Modal ${modalId}: Registered with trigger "${config.triggerType}"`);
    }
  }

  /**
   * Check if modal is compatible with current device
   * @param {Object} config - Modal configuration
   * @returns {boolean} Device compatibility
   * @private
   */
  isDeviceCompatible(config) {
    const isMobile = window.innerWidth <= 768;
    return isMobile ? config.mobileEnabled : config.desktopEnabled;
  }

  /**
   * Check if modal can be shown based on frequency restrictions
   * @param {string} modalId - Modal identifier
   * @param {string} frequency - Frequency setting
   * @returns {boolean} Whether modal can be shown
   * @private
   */
  canShowModal(modalId, frequency) {
    const config = this.modals.get(modalId);
    
    if (config && config.devMode) {
      if (this.isDebugMode()) {
        console.log(`Dev Mode: Modal ${modalId} can always show`);
      }
      return true;
    }

    const key = this.storage.prefix + modalId;

    switch (frequency) {
      case 'always':
        return true;
        
      case 'once-per-session':
        return !this.storage.session.getItem(key + '_session');
        
      case 'once-per-day':
        const lastDay = this.storage.local.getItem(key + '_day');
        const todayKey = new Date().toDateString();
        return lastDay !== todayKey;
        
      case 'once-per-week':
        const lastWeek = parseInt(this.storage.local.getItem(key + '_week')) || 0;
        const thisWeek = this.getWeekNumber();
        return lastWeek !== thisWeek;
        
      default:
        return true;
    }
  }

  /**
   * Setup trigger for modal based on configuration
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupModalTrigger(modalId, config) {
    switch (config.triggerType) {
      case 'time':
        this.setupTimeTrigger(modalId, config);
        break;
        
      case 'scroll':
        this.setupScrollTrigger(modalId, config);
        break;
        
      case 'click':
        this.setupClickTrigger(modalId, config);
        break;
        
      case 'exit':
        this.setupExitIntentTrigger(modalId, config);
        break;
        
      case 'page-load':
        this.setupPageLoadTrigger(modalId, config);
        break;
        
      case 'manual':
        break;
        
      default:
        console.warn(`Unknown trigger type: ${config.triggerType}`);
    }
  }

  /**
   * Setup time-based trigger
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupTimeTrigger(modalId, config) {
    const delay = (parseInt(config.triggerValue) * 1000) + (config.delay * 1000);
    
    setTimeout(() => {
      this.triggerModal(modalId);
    }, delay);
  }

  /**
   * Setup scroll percentage trigger
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupScrollTrigger(modalId, config) {
    const targetPercent = parseInt(config.triggerValue) || 50;
    
    const scrollHandler = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercent >= targetPercent) {
        setTimeout(() => {
          this.triggerModal(modalId);
        }, config.delay * 1000);
        
        window.removeEventListener('scroll', scrollHandler);
        this.scrollListeners.delete(scrollHandler);
      }
    };

    this.scrollListeners.add(scrollHandler);
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  /**
   * Setup click trigger
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupClickTrigger(modalId, config) {
    const selector = config.triggerValue;
    
    if (!selector) {
      console.warn(`Click trigger requires a selector for modal ${modalId}`);
      return;
    }

    document.addEventListener('click', (e) => {
      if (e.target.matches(selector) || e.target.closest(selector)) {
        e.preventDefault();
        
        setTimeout(() => {
          this.triggerModal(modalId);
        }, config.delay * 1000);
      }
    });
  }

  /**
   * Setup exit intent trigger (desktop only)
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupExitIntentTrigger(modalId, config) {
    if (window.innerWidth <= 768) return;

    const exitHandler = (e) => {
      if (e.clientY <= 0 && e.relatedTarget === null) {
        setTimeout(() => {
          this.triggerModal(modalId);
        }, config.delay * 1000);
        
        document.removeEventListener('mouseout', exitHandler);
        this.exitIntentListeners.delete(exitHandler);
      }
    };

    this.exitIntentListeners.add(exitHandler);
    document.addEventListener('mouseout', exitHandler);
  }

  /**
   * Setup page load trigger
   * @param {string} modalId - Modal identifier
   * @param {Object} config - Modal configuration
   * @private
   */
  setupPageLoadTrigger(modalId, config) {
    const delay = config.delay * 1000;
    
    setTimeout(() => {
      this.triggerModal(modalId);
    }, delay);
  }

  /**
   * Setup event handlers for modal
   * @param {HTMLElement} element - Modal DOM element
   * @private
   */
  setupModalEvents(element) {
    const modalId = element.dataset.modalId;
    const config = this.modals.get(modalId);

    // Close button events
    const closeButtons = element.querySelectorAll('[data-modal-close]');
    closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal(modalId);
      });
    });

    // Backdrop click to close
    const backdrop = element.querySelector('.modal__backdrop');
    if (backdrop && config.closeOnOutsideClick) {
      backdrop.addEventListener('click', () => this.closeModal(modalId));
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && config.isShown) {
        this.closeModal(modalId);
      }
    });

    if (config.autoCloseAfter > 0 && !config.devMode) {
      setTimeout(() => {
        if (config.isShown) {
          this.closeModal(modalId);
        }
      }, config.autoCloseAfter * 1000);
    } else if (config.devMode && config.autoCloseAfter > 0 && this.isDebugMode()) {
      console.log(`Dev Mode: Auto-close disabled for modal ${modalId}`);
    }

    // Handle form submissions in modals
    const forms = element.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (this.isDebugMode()) {
          console.log(`Form submitted in modal ${modalId}`);
        }
        
        if (!form.action.includes('contact') && !form.action.includes('newsletter')) {
          setTimeout(() => {
            this.closeModal(modalId);
          }, 1000);
        }
      });
    });

    // Handle theme block interactions
    const buttons = element.querySelectorAll('.button, [role="button"]');
    buttons.forEach(button => {
      if (!button.hasAttribute('data-modal-close')) {
        button.addEventListener('click', (e) => {
          if (this.isDebugMode()) {
            console.log(`Button clicked in modal ${modalId}:`, button.textContent?.trim());
          }
        });
      }
    });
  }

  /**
   * Trigger modal display if conditions are met
   * @param {string} modalId - Modal identifier
   * @public
   */
  triggerModal(modalId) {
    const config = this.modals.get(modalId);
    if (!config || config.isShown) return;

    if (!this.canShowModal(modalId, config.frequency)) {
      if (this.isDebugMode()) {
        console.log(`Modal ${modalId}: Blocked at trigger time (frequency)`);
      }
      return;
    }

    this.showModal(modalId);
  }

  /**
   * Show modal with animations and state management
   * @param {string} modalId - Modal identifier
   * @private
   */
  showModal(modalId) {
    const config = this.modals.get(modalId);
    if (!config) return;

    const element = config.element;
    
    // Show the modal
    element.style.display = 'block';
    element.setAttribute('aria-hidden', 'false');
    
    // Trigger animation
    requestAnimationFrame(() => {
      element.classList.add('modal--active');
    });

    // Focus management
    const firstFocusable = element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Update state
    config.isShown = true;
    config.lastShown = Date.now();
    
    // Track display for frequency control
    this.trackModalDisplay(modalId, config.frequency);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    if (this.isDebugMode()) {
      console.log(`Modal ${modalId}: Shown${config.devMode ? ' (DEV MODE)' : ''}`);
    }

    // Dispatch custom event
    this.dispatchModalEvent('modal:shown', modalId, { config });
    
    // Integrate with theme analytics if available
    if (window.gtag) {
      window.gtag('event', 'modal_shown', {
        'modal_id': modalId,
        'trigger_type': config.triggerType
      });
    }
  }

  /**
   * Close modal with animations and state management
   * @param {string} modalId - Modal identifier
   * @private
   */
  closeModal(modalId) {
    const config = this.modals.get(modalId);
    if (!config || !config.isShown) return;

    if (config.devMode) {
      if (this.isDebugMode()) {
        console.log(`Dev Mode: Modal ${modalId} close prevented`);
      }
      return;
    }

    const element = config.element;
    
    // Hide animation
    element.classList.remove('modal--active');
    
    // Wait for animation to complete
    setTimeout(() => {
      element.style.display = 'none';
      element.setAttribute('aria-hidden', 'true');
    }, 300);

    // Update state
    config.isShown = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    if (this.isDebugMode()) {
      console.log(`Modal ${modalId}: Closed`);
    }

    // Dispatch custom event
    this.dispatchModalEvent('modal:closed', modalId, { config });
  }

  /**
   * Track modal display for frequency control
   * @param {string} modalId - Modal identifier
   * @param {string} frequency - Frequency setting
   * @private
   */
  trackModalDisplay(modalId, frequency) {
    const config = this.modals.get(modalId);
    
    if (config && config.devMode) {
      if (this.isDebugMode()) {
        console.log(`Dev Mode: Frequency tracking disabled for modal ${modalId}`);
      }
      return;
    }

    const key = this.storage.prefix + modalId;
    const now = Date.now();

    switch (frequency) {
      case 'once-per-session':
        this.storage.session.setItem(key + '_session', now.toString());
        break;
        
      case 'once-per-day':
        const todayKey = new Date().toDateString();
        this.storage.local.setItem(key + '_day', todayKey);
        break;
        
      case 'once-per-week':
        const thisWeek = this.getWeekNumber();
        this.storage.local.setItem(key + '_week', thisWeek.toString());
        break;
    }
  }

  /**
   * Handle page visibility changes
   * @private
   */
  handleVisibilityChange() {
    // Future: Could be used for additional exit intent logic
  }

  /**
   * Clean up old storage data
   * @private
   */
  cleanupOldData() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < this.storage.session.length; i++) {
      const key = this.storage.session.key(i);
      if (key && key.startsWith(this.storage.prefix)) {
        const value = this.storage.session.getItem(key);
        if (value && parseInt(value) < oneWeekAgo) {
          this.storage.session.removeItem(key);
        }
      }
    }
  }

  /**
   * Get current week number for frequency tracking
   * @returns {number} Week number
   * @private
   */
  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} Debug mode status
   * @private
   */
  isDebugMode() {
    return window.location.search.includes('modal_debug=true') || 
           localStorage.getItem('modal_debug') === 'true';
  }

  /**
   * Dispatch custom modal events
   * @param {string} eventName - Event name
   * @param {string} modalId - Modal identifier
   * @param {Object} data - Additional event data
   * @private
   */
  dispatchModalEvent(eventName, modalId, data = {}) {
    const event = new CustomEvent(eventName, {
      detail: { modalId, ...data },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Public API: Show a modal
   * @param {string} modalId - Modal identifier
   * @public
   */
  show(modalId) {
    this.showModal(modalId);
  }

  /**
   * Public API: Hide a modal
   * @param {string} modalId - Modal identifier
   * @public
   */
  hide(modalId) {
    this.closeModal(modalId);
  }

  /**
   * Public API: Hide all modals
   * @public
   */
  hideAll() {
    this.modals.forEach((config, modalId) => {
      if (config.isShown) {
        this.closeModal(modalId);
      }
    });
  }

  // Reset frequency tracking for a modal
  /**
   * Reset frequency tracking for a modal
   * @param {string} modalId - Modal identifier
   * @public
   */
  resetFrequency(modalId) {
    const key = this.storage.prefix + modalId;
    this.storage.session.removeItem(key + '_session');
    this.storage.local.removeItem(key + '_day');
    this.storage.local.removeItem(key + '_week');
    
    if (this.isDebugMode()) {
      console.log(`Modal ${modalId}: Frequency tracking reset`);
    }
  }

  /**
   * Get modal status information
   * @param {string} modalId - Modal identifier
   * @returns {Object} Modal status
   * @public
   */
  getStatus(modalId) {
    const config = this.modals.get(modalId);
    return config ? {
      isRegistered: true,
      isShown: config.isShown,
      lastShown: config.lastShown,
      canShow: this.canShowModal(modalId, config.frequency),
      devMode: config.devMode,
      triggerType: config.triggerType,
      frequency: config.frequency
    } : {
      isRegistered: false,
      isShown: false,
      lastShown: null,
      canShow: false,
      devMode: false
    };
  }
}

/**
 * Initialize the modal manager
 */
const modalManager = new ModalManager();

/**
 * Global Modal Manager API
 * Provides public methods for interacting with modals
 */
window.ModalManager = {
  show: (modalId) => modalManager.show(modalId),
  hide: (modalId) => modalManager.hide(modalId),
  hideAll: () => modalManager.hideAll(),
  forceClose: (modalId) => {
    const config = modalManager.modals.get(modalId);
    if (!config || !config.isShown) return;
    
    if (modalManager.isDebugMode()) {
      console.log(`Force closing modal ${modalId} (bypassing dev mode)`);
    }
    
    const element = config.element;
    element.classList.remove('modal--active');
    setTimeout(() => {
      element.style.display = 'none';
      element.setAttribute('aria-hidden', 'true');
    }, 300);
    
    config.isShown = false;
    document.body.style.overflow = '';
    modalManager.dispatchModalEvent('modal:closed', modalId, { config });
  },
  resetFrequency: (modalId) => modalManager.resetFrequency(modalId),
  getStatus: (modalId) => modalManager.getStatus(modalId),
  
  // Development helpers
  listModals: () => {
    const modals = Array.from(modalManager.modals.keys());
    if (modalManager.isDebugMode()) {
      console.table(modals.map(id => ({
        id,
        ...modalManager.getStatus(id)
      })));
    }
    return modals;
  },
  enableDevMode: (modalId) => {
    const config = modalManager.modals.get(modalId);
    if (config) {
      config.devMode = true;
      config.element.setAttribute('data-modal-dev-mode', 'true');
      if (modalManager.isDebugMode()) {
        console.log(`Dev mode enabled for ${modalId}`);
      }
    }
  },
  
  disableDevMode: (modalId) => {
    const config = modalManager.modals.get(modalId);
    if (config) {
      config.devMode = false;
      config.element.setAttribute('data-modal-dev-mode', 'false');
      if (modalManager.isDebugMode()) {
        console.log(`Dev mode disabled for ${modalId}`);
      }
    }
  }
};

/**
 * Initialize debug logging if enabled
 */
if (typeof window !== 'undefined' && modalManager.isDebugMode()) {
  console.log('Modal Manager: Ready');
  console.log('API: ModalManager.show(id), ModalManager.hide(id), ModalManager.hideAll()');
  console.log('Dev: ModalManager.listModals(), ModalManager.enableDevMode(id), ModalManager.forceClose(id)');
  console.log('Theme Integration: Color schemes, @theme/@app blocks, responsive design');
  console.log('Settings: Dynamic visibility, working translation keys, dev mode toggle');
}
