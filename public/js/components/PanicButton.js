/**
 * Panic Button component for the emergency alert system
 * This component provides a quick way to send high-priority emergency alerts
 */

class PanicButton {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found.`);
      return;
    }
    
    this.options = {
      buttonText: options.buttonText || 'PANIC ALERT',
      confirmText: options.confirmText || 'Are you sure you want to send a panic alert?',
      confirmButtonText: options.confirmButtonText || 'CONFIRM',
      cancelButtonText: options.cancelButtonText || 'CANCEL',
      apiEndpoint: options.apiEndpoint || '/api/alerts/panic',
      onSuccess: options.onSuccess || this.defaultOnSuccess,
      onError: options.onError || this.defaultOnError,
      accessToken: options.accessToken || null,
      includeLocation: options.includeLocation !== false,
      locationTimeout: options.locationTimeout || 5000, // 5 seconds
      cooldownPeriod: options.cooldownPeriod || 30, // 30 seconds
    };
    
    this.cooldownActive = false;
    this.cooldownTimer = null;
    this.cooldownCounter = this.options.cooldownPeriod;
    
    this.render();
    this.attachEventListeners();
  }
  
  render() {
    // Create button container with styling
    this.container.innerHTML = `
      <div class="panic-button-wrapper">
        <button id="panic-button" class="panic-button" type="button">
          ${this.options.buttonText}
        </button>
        <div id="panic-confirmation" class="panic-confirmation hidden">
          <p>${this.options.confirmText}</p>
          <div class="panic-button-actions">
            <button id="panic-confirm" class="panic-confirm-button" type="button">
              ${this.options.confirmButtonText}
            </button>
            <button id="panic-cancel" class="panic-cancel-button" type="button">
              ${this.options.cancelButtonText}
            </button>
          </div>
        </div>
        <div id="panic-cooldown" class="panic-cooldown hidden">
          <p>Cooldown period active. You can send another panic alert in <span id="cooldown-counter">${this.options.cooldownPeriod}</span> seconds.</p>
        </div>
      </div>
    `;
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .panic-button-wrapper {
        margin: 20px 0;
      }
      
      .panic-button {
        background-color: #ff3b30;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        width: 100%;
        max-width: 300px;
        display: block;
      }
      
      .panic-button:hover {
        background-color: #ff6651;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      }
      
      .panic-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .panic-confirmation {
        margin-top: 15px;
        padding: 15px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        color: #721c24;
      }
      
      .panic-button-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      
      .panic-confirm-button {
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
      }
      
      .panic-cancel-button {
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
      }
      
      .panic-cooldown {
        margin-top: 15px;
        padding: 15px;
        background-color: #cce5ff;
        border: 1px solid #b8daff;
        border-radius: 8px;
        color: #004085;
      }
      
      .hidden {
        display: none;
      }
      
      .panic-button-disabled {
        background-color: #6c757d;
        cursor: not-allowed;
        opacity: 0.65;
      }
      
      .panic-button-disabled:hover {
        background-color: #6c757d;
        transform: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
  
  attachEventListeners() {
    const panicButton = document.getElementById('panic-button');
    const panicConfirmation = document.getElementById('panic-confirmation');
    const panicConfirm = document.getElementById('panic-confirm');
    const panicCancel = document.getElementById('panic-cancel');
    const panicCooldown = document.getElementById('panic-cooldown');
    
    panicButton.addEventListener('click', () => {
      if (this.cooldownActive) {
        return;
      }
      
      panicButton.classList.add('hidden');
      panicConfirmation.classList.remove('hidden');
    });
    
    panicConfirm.addEventListener('click', async () => {
      try {
        // Get location if enabled
        let location = null;
        if (this.options.includeLocation && navigator.geolocation) {
          location = await this.getLocation();
        }
        
        await this.sendPanicAlert(location);
        this.startCooldown();
        
        panicConfirmation.classList.add('hidden');
        panicCooldown.classList.remove('hidden');
        
        this.options.onSuccess();
      } catch (error) {
        console.error('Failed to send panic alert:', error);
        this.options.onError(error);
        
        // Reset UI
        panicConfirmation.classList.add('hidden');
        panicButton.classList.remove('hidden');
      }
    });
    
    panicCancel.addEventListener('click', () => {
      panicConfirmation.classList.add('hidden');
      panicButton.classList.remove('hidden');
    });
  }
  
  getLocation() {
    return new Promise((resolve, reject) => {
      const locationTimeout = setTimeout(() => {
        resolve({ error: 'timeout', message: 'Location retrieval timed out' });
      }, this.options.locationTimeout);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          clearTimeout(locationTimeout);
          resolve({ error: error.code, message: error.message });
        },
        { 
          enableHighAccuracy: true,
          timeout: this.options.locationTimeout,
          maximumAge: 0
        }
      );
    });
  }
  
  async sendPanicAlert(location) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if access token is provided
    if (this.options.accessToken) {
      headers['Authorization'] = `Bearer ${this.options.accessToken}`;
    }
    
    const response = await fetch(this.options.apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ location })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Server returned ${response.status} ${response.statusText}`
      }));
      throw new Error(error.message || 'Failed to send panic alert');
    }
    
    return await response.json();
  }
  
  startCooldown() {
    const cooldownCounter = document.getElementById('cooldown-counter');
    const panicButton = document.getElementById('panic-button');
    const panicCooldown = document.getElementById('panic-cooldown');
    
    this.cooldownActive = true;
    this.cooldownCounter = this.options.cooldownPeriod;
    cooldownCounter.textContent = this.cooldownCounter;
    
    this.cooldownTimer = setInterval(() => {
      this.cooldownCounter--;
      cooldownCounter.textContent = this.cooldownCounter;
      
      if (this.cooldownCounter <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownActive = false;
        
        panicCooldown.classList.add('hidden');
        panicButton.classList.remove('hidden');
      }
    }, 1000);
  }
  
  defaultOnSuccess() {
    console.log('Panic alert sent successfully.');
    alert('Emergency alert sent successfully. Help is on the way.');
  }
  
  defaultOnError(error) {
    console.error('Error sending panic alert:', error);
    alert(`Failed to send emergency alert: ${error.message || error}`);
  }
}

// Export for both module and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PanicButton;
} else {
  window.PanicButton = PanicButton;
}