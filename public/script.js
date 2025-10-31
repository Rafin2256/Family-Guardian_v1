// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.log('Service Worker registration failed:', error);
      });
  });
}
// Emergency Button (Call Family)
document.getElementById('emergencyBtn').addEventListener('click', function() {
    if (confirm('Are you sure you need emergency help?')) {
        // Save emergency alert
        fetch('/api/flag-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'EMERGENCY BUTTON PRESSED - NEED HELP', 
                type: 'emergency' 
            })
        }).then(() => {
            alert('🚨 Emergency alert sent to your family! They will contact you soon.');
        });
    }
});

// Message Checker - UPDATED to save alerts
function checkMessage() {
    const message = document.getElementById('messageInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!message) {
        resultDiv.innerHTML = '<p style="color: orange;">Please enter a message to check</p>';
        return;
    }
    
    const scamKeywords = [
    'urgent', 'bank', 'verify', 'password', 'money', 'prize', 'suspended',
    'account', 'verification', 'click', 'immediately', 'action required',
    'social security', 'irs', 'tax', 'lawsuit', 'wire transfer', 'gift card',
    'free', 'winner', 'claim', 'limited time', 'offer expires'];
    const foundScams = scamKeywords.filter(word => message.toLowerCase().includes(word));
    
    if (foundScams.length > 0) {
        // SAVE the suspicious message to database
        fetch('/api/flag-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message, 
                type: 'suspicious' 
            })
        }).then(() => {
            resultDiv.innerHTML = `<p style="color: red;">⚠️ WARNING: Suspicious message detected! Alert sent to family. Keywords: ${foundScams.join(', ')}</p>`;
        });
    } else {
        resultDiv.innerHTML = '<p style="color: green;">✅ This message looks safe!</p>';
    }
}

// Family Dashboard Functions
function loadAlerts() {
    fetch('/api/alerts')
        .then(response => response.json())
        .then(alerts => {
            const container = document.getElementById('alertsContainer');
            if (alerts.length === 0) {
                container.innerHTML = '<p>No active alerts. Everything looks good! ✅</p>';
            } else {
                container.innerHTML = alerts.map(alert => `
                    <div class="alert-item ${alert.type === 'emergency' ? 'emergency-alert' : ''}" 
                         data-alert-id="${alert.id}">
                        <strong>${alert.type.toUpperCase()}</strong>
                        <p>${alert.message}</p>
                        <small>Received: ${alert.timestamp}</small>
                        ${alert.status === 'pending' ? `
                            <div class="alert-actions">
                                <button class="btn btn-primary" onclick="handleAlertAction(${alert.id}, 'approve')">
                                    ✅ Approve
                                </button>
                                <button class="btn btn-emergency" onclick="handleAlertAction(${alert.id}, 'block')">
                                    ❌ Block
                                </button>
                            </div>
                        ` : `
                            <p><em>Resolved (${alert.resolvedAction})</em></p>
                        `}
                    </div>
                `).join('');
            }
        });
}

// NEW: Handle approve/block actions
// REAL Alert Action Handler
async function handleAlertAction(alertId, action) {
    try {
        const response = await fetch('/api/resolve-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alertId: alertId,
                action: action
            })
        });
        
        if (response.ok) {
            // Remove the alert from the display immediately
            const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (alertElement) {
                alertElement.style.opacity = '0.5';
                alertElement.innerHTML = `<p><em>Resolved (${action})</em></p>`;
                setTimeout(() => {
                    loadAlerts(); // Refresh the list after 2 seconds
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error resolving alert:', error);
    }
}
function loadSafeContacts() {
    fetch('/api/safe-contacts')
        .then(response => response.json())
        .then(contacts => {
            const container = document.getElementById('safeContactsContainer');
            container.innerHTML = contacts.map(contact => `
                <div class="contact-item">
                    <strong>${contact.name}</strong><br>
                    ${contact.phone}
                </div>
            `).join('');
        });
}

// Auto-load dashboard data when on dashboard page
if (window.location.pathname === '/dashboard') {
    document.addEventListener('DOMContentLoaded', function() {
        loadAlerts();
        loadSafeContacts();
    });
}