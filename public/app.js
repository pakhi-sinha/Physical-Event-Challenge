/**
 * VenueCrowd Frontend Engine
 * Handles real-time map updates, AI assistant interactions, and venue operations.
 */

const CONFIG = {
    GOOGLE_API_KEY: "REPLACE_WITH_YOUR_KEY",
    REFRESH_INTERVAL: 30000,
    NOTIF_TIMEOUT: 6000
};

let map, markers = [];

/**
 * Bootstraps the Google Maps script into the document.
 */
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_API_KEY}&callback=initMap`;
    script.async = true;
    script.onerror = () => {
        updateConnectionStatus("🔴 Maps API Error", "error");
    };
    document.head.appendChild(script);
}

/**
 * Initializes the interactive map with custom stadium-themed styling.
 */
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8198, lng: 144.9834 },
        zoom: 17,
        disableDefaultUI: true,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
          { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
          { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] }
        ]
    });
    fetchCrowdData();
}

/**
 * Fetches the latest crowd density data from the backend.
 */
async function fetchCrowdData() {
    try {
        const response = await fetch('/api/venue/crowd');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderCrowdUI(data);
        updateConnectionStatus("🟢 Service Live", "success");
    } catch (error) {
        updateConnectionStatus("🔴 System Offline", "error");
        console.error('Crowd data fetch failed:', error);
    }
}

/**
 * Updates the sidebar list and map markers based on zone data.
 * @param {Array} zones - List of zone density objects.
 */
function renderCrowdUI(zones) {
    const listContainer = document.getElementById('crowd-list');
    listContainer.innerHTML = '';
    
    // Clear old markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    zones.forEach(zone => {
        // Create Sidebar Card
        const card = document.createElement('div');
        card.className = 'zone-card';
        card.role = 'listitem';
        card.tabIndex = 0;
        card.ariaLabel = `${zone.name}, Status: ${zone.status}, Density: ${zone.density}%`;
        card.innerHTML = `
            <span style="font-weight: 500">${zone.name}</span>
            <span class="density-tag ${zone.status.toLowerCase()}">${zone.status}</span>
        `;
        
        card.onkeypress = (e) => { if(e.key === 'Enter') handleZoneClick(zone); };
        card.onclick = () => handleZoneClick(zone);
        listContainer.appendChild(card);

        // Add Map Marker
        if (window.google && map) {
            const marker = new google.maps.Marker({
                position: { 
                    lat: -37.8198 + (Math.random() * 0.002 - 0.001), 
                    lng: 144.9834 + (Math.random() * 0.004 - 0.002) 
                },
                map: map,
                title: zone.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10 + (zone.density / 10),
                    fillColor: getZoneColor(zone.status),
                    fillOpacity: 0.7,
                    strokeWeight: 2,
                    strokeColor: "#ffffff"
                }
            });
            markers.push(marker);
        }
    });
}

/**
 * Maps zone status to a specific UI color.
 * @param {string} status - High, Medium, or Low.
 * @returns {string} Hex color value.
 */
function getZoneColor(status) {
    switch (status) {
        case 'High': return "#ef4444";
        case 'Medium': return "#f59e0b";
        default: return "#10b981";
    }
}

/**
 * Handles individual zone interaction.
 * @param {Object} zone - The selected zone data.
 */
function handleZoneClick(zone) {
    showNotification("Zone Insight", `${zone.name} is currently ${zone.status}. Optimization suggests Gate B for faster entry.`);
}

/**
 * Interfaces with the Gemini AI backend for natural language queries.
 */
async function askAssistant() {
    const queryInput = document.getElementById('ai-query');
    const query = queryInput.value.trim();
    if (!query) return;

    const responseDiv = document.getElementById('ai-response');
    responseDiv.innerHTML = '<span class="loader" aria-hidden="true"></span> <span class="sr-only">AI is </span> Analyzing...';
    responseDiv.style.display = 'block';

    try {
        const response = await fetch(`/api/venue/assistant?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        responseDiv.innerHTML = `<strong>Assistant:</strong><br>${data.analysis || data.fallback}`;
    } catch (error) {
        responseDiv.innerHTML = "AI Assistant temporarily unavailable.";
        console.error('AI query failed:', error);
    }
}

/**
 * Optimizes travel routes between venue points.
 */
async function getSmartRoute() {
    const from = document.getElementById('start-node').value;
    const to = document.getElementById('end-node').value;
    const button = event.currentTarget;
    
    button.disabled = true;
    button.innerHTML = '<span class="loader" aria-hidden="true"></span> <span class="sr-only">Optimizer is </span> Optimizing...';

    try {
        const response = await fetch(`/api/venue/route?from=${from}&to=${to}`);
        const data = await response.json();
        
        const panel = document.getElementById('route-panel');
        const text = document.getElementById('route-text');
        
        text.innerHTML = `Path: <strong>${data.pathIds.join(' → ')}</strong> <br><br>Benefit: <span style="color: var(--secondary)">${data.benefit}</span>`;
        panel.style.display = 'block';
    } catch (error) {
        showNotification("Error", "Routing computation failed.");
    } finally {
        button.disabled = false;
        button.innerHTML = '🚀 Find Smartest Route';
    }
}

/**
 * Synchronizes venue events with Google Calendar.
 */
async function syncCalendar() {
    try {
        const response = await fetch('/api/calendar/sync', { method: 'POST' });
        const data = await response.json();
        showNotification(data.error ? "Sync Alert" : "Calendar Update", data.error || "Event successfully added to your calendar.");
    } catch (error) {
        showNotification("Sync Error", "Could not connect to the calendar service.");
    }
}

/**
 * Displays simulated emergency/traffic alerts.
 */
async function simulateAlert() {
    try {
        const response = await fetch('/api/venue/alert');
        const data = await response.json();
        showNotification(data.alert.title, data.alert.message);
    } catch (error) {
        console.warn('Alert simulation failed');
    }
}

/**
 * Global notification handler.
 * @param {string} title - The notification header.
 * @param {string} message - The body text.
 */
function showNotification(title, message) {
    const notifyElem = document.getElementById('notification');
    document.getElementById('notif-title').innerText = title;
    document.getElementById('notif-msg').innerText = message;
    notifyElem.classList.add('show');
    setTimeout(() => notifyElem.classList.remove('show'), CONFIG.NOTIF_TIMEOUT);
}

/**
 * Helper to update connection indicator in the header.
 */
function updateConnectionStatus(text, type) {
    const statusElem = document.getElementById('connection-status');
    const isError = type === 'error';
    const statusIcon = isError ? "🔴" : "🟢";
    
    statusElem.innerHTML = `<span aria-hidden="true">${statusIcon}</span> <span class="sr-only">System status: </span> ${text}`;
    statusElem.className = isError ? 'status-error' : 'status-live';
    
    if (isError) {
        statusElem.style.color = 'var(--danger)';
    } else {
        statusElem.style.color = 'var(--success)';
    }
}

/**
 * Admin: Toggles the simulation configuration modal.
 */
function toggleAdminModal(show) {
    document.getElementById('admin-modal').style.display = show ? 'flex' : 'none';
}

/**
 * Admin: Post new density data to the simulation engine.
 */
async function submitAdminUpdate() {
    const zoneId = document.getElementById('admin-zone').value;
    const density = document.getElementById('admin-density').value;
    
    toggleAdminModal(false);
    showNotification("Admin Processing", "Updating simulated density levels...");

    try {
        await fetch('/api/venue/admin/density', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zoneId, density: parseInt(density) })
        });
        fetchCrowdData();
        showNotification("Admin Success", `Zone ${zoneId} updated to ${density}%.`);
    } catch (error) {
        showNotification("Admin Error", "Override failed.");
    }
}

/**
 * Mock Google Authentication Flow.
 */
function googleAuth() {
    const button = document.getElementById('auth-btn');
    button.disabled = true;
    button.innerHTML = '<span class="loader"></span> Authenticating...';
    
    setTimeout(() => {
        document.getElementById('user-profile').style.display = 'flex';
        button.style.display = 'none';
        showNotification("Identity Service", "Signed in as Stadium Attendee.");
    }, 1500);
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    loadGoogleMaps();
    setInterval(fetchCrowdData, CONFIG.REFRESH_INTERVAL);
});
