document.addEventListener("DOMContentLoaded", () => {
    fetch('zabbix_data.php')
        .then(res => res.json())
        .then(data => {
            updateDashboard(data);
            updateMap(data);
            updateAlerts(data);
            updateSummary(data);
        });

    function updateDashboard(hosts) {
        const dashboard = document.querySelector(".dashboard");
        dashboard.innerHTML = '';

        hosts.forEach(host => {
            const card = document.createElement("div");
            card.className = `card ${host.status}`;

            card.innerHTML = `
                <h3>${host.name}</h3>
                <p><strong>IP:</strong> ${host.ip}</p>
                <p><strong>Adresse:</strong> ${host.address}</p>
                <div class="status ${host.status}">
                    <span class="status-dot ${host.status}"></span>
                    ${statusText(host.status)}
                </div>
            `;
            dashboard.appendChild(card);
        });
    }

    function updateMap(hosts) {
        const map = L.map('mapContainer').setView([46.5, 2.2], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        hosts.forEach(host => {
            const marker = L.marker([host.lat, host.lon]).addTo(map);
            marker.bindPopup(`<strong>${host.name}</strong><br>IP: ${host.ip}<br>${host.address}`);
        });
    }

    function updateAlerts(hosts) {
        const alertsContainer = document.querySelector(".alerts");
        alertsContainer.innerHTML = '';

        const alerts = hosts.filter(h => h.status === 'disconnected');
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p>Aucune alerte détectée.</p>';
            return;
        }

        alerts.forEach(host => {
            const alert = document.createElement("div");
            alert.className = 'alert-item';
            alert.innerHTML = `
                <p>🚨 <strong>${host.name}</strong> est déconnecté !</p>
 <div class="alert-details">
                    <p><strong>IP:</strong> ${host.ip}</p>
                    <p><strong>Adresse:</strong> ${host.address}</p>
                    <p><strong>Statut:</strong> <span class="status-text disconnected">Déconnecté</span></p>
                    <p><strong>Heure de détection:</strong> ${new Date().toLocaleTimeString()}</p>
                </div>
            `;
            alertsContainer.appendChild(alert);
        });
    }

    function updateSummary(hosts) {
        const connected = hosts.filter(h => h.status === 'connected').length;
        const disconnected = hosts.filter(h => h.status === 'disconnected').length;
        const unstable = hosts.filter(h => h.status === 'unknown').length;

        document.querySelector(".status-box.connected h3").textContent = connected;
        document.querySelector(".status-box.disconnected h3").textContent = disconnected;
        document.querySelector(".status-box.unstable h3").textContent = unstable;

        const now = new Date();
        document.getElementById("updateTime").textContent = now.toLocaleString();
    }

    function statusText(status) {
        return {
            connected: 'Connecté',
            disconnected: 'Déconnecté',
            unknown: 'Inconnu'
        }[status] || 'Inconnu';
    }
});

