const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json()); // ←  allows reading JSON from requests
app.set('view engine', 'ejs');

// Data file paths
const dataDir = path.join(__dirname, 'data');
const alertsFile = path.join(dataDir, 'alerts.json');
const contactsFile = path.join(dataDir, 'safe-contacts.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Helper functions to read/write data
function readAlerts() {
    try {
        const alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
        // Only return non-resolved alerts for the dashboard
        return alerts.filter(alert => alert.status !== 'resolved');
    } catch (error) {
        return [];
    }
}

function writeAlerts(alerts) {
    fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
}

function readContacts() {
    try {
        const data = fs.readFileSync(contactsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading contacts:', error);
        return [];
    }
}

// Routes
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/icons/:iconName', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'icons', req.params.iconName));
});
app.get('/', (req, res) => {
    res.render('elderly-ui');
});

app.get('/dashboard', (req, res) => {
    res.render('family-dashboard');
});

// Add this with your other routes
app.get('/micro-lessons', (req, res) => {
    res.render('micro-lessons');
});

// REAL APIs - Replace the test ones
app.get('/api/alerts', (req, res) => {
    const alerts = readAlerts();
    res.json(alerts);
});

//app.get('/api/safe-contacts', (req, res) => {
    //try {
        //const contacts = readContacts();
        //console.log('Contacts loaded:', contacts); // Debug line
      //  res.json(contacts);
    //} catch (error) {
      //  console.error('Error loading contacts:', error);
    //    res.json([]); // Return empty array if error
  //  }
//});

app.get('/api/safe-contacts', (req, res) => {
    const contacts = [
        {"name": "Dr. Smith", "phone": "555-0101"},
        {"name": "Daughter Amy", "phone": "555-0102"}, 
        {"name": "Local Pharmacy", "phone": "555-0103"}
    ];
    res.json(contacts);
});
// NEW: API to save alerts from senior interface
app.post('/api/flag-event', (req, res) => {
    const { message, type = 'message' } = req.body;
    
    const alerts = readAlerts();
    const newAlert = {
        id: Date.now(), // Simple ID
        message: message,
        type: type,
        status: 'pending',
        timestamp: new Date().toLocaleString()
    };
    
    alerts.unshift(newAlert); // Add to beginning
    writeAlerts(alerts);
    
    res.json({ success: true, alert: newAlert });
});

// NEW: API to resolve alerts
app.post('/api/resolve-alert', (req, res) => {
    const { alertId, action } = req.body;
    
    const alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
    const alertIndex = alerts.findIndex(alert => alert.id == alertId);
    
    if (alertIndex !== -1) {
        alerts[alertIndex].status = 'resolved';
        alerts[alertIndex].resolvedAction = action;
        alerts[alertIndex].resolvedAt = new Date().toLocaleString();
        
        fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: 'Alert not found' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`👨‍👩‍👧‍👦 Family Dashboard: http://localhost:${PORT}/dashboard`);
});