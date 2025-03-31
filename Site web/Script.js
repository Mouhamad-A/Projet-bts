
 
 // Initialisation de la carte
 document.addEventListener('DOMContentLoaded', function() {
    const map = L.map('mapContainer').setView([46.603354, 1.888334], 5); // Centre sur la France
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Données des sites
    const sites = [
        { name: "Paris", lat: 48.8566, lon: 2.3522, status: "connected" },
        { name: "Lyon", lat: 45.750000, lon: 4.850000, status: "disconnected" },
        { name: "Marseille", lat: 43.296482, lon: 5.369780, status: "unstable" },
        { name: "Bordeaux", lat: 44.837789, lon: -0.579180, status: "connected" },
        { name: "Lille", lat: 50.629250, lon: 3.057256, status: "connected" },
        { name: "Toulouse", lat: 43.604652, lon: 1.444209, status: "connected" }
    ];
    
    // Ajouter les marqueurs
    sites.forEach(site => {
        // Définir la couleur du marqueur en fonction du statut
        let markerColor;
        let statusText;
        
        switch(site.status) {
            case "connected":
                markerColor = "#10B981";
                statusText = "Connecté";
                break;
            case "disconnected":
                markerColor = "#EF4444";
                statusText = "Déconnecté";
                break;
            case "unstable":
                markerColor = "#F59E0B";
                statusText = "Instable";
                break;
        }
        
        // Création d'un marqueur personnalisé
        const marker = L.circleMarker([site.lat, site.lon], {
            radius: 8,
            fillColor: markerColor,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        // Ajouter une popup
        marker.bindPopup(`
            <b>Site ${site.name}</b><br>
            Statut: ${statusText}<br>
            <small>Cliquez pour plus de détails</small>
        `);
    });
});

// Animation simple pour les liens de navigation
document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        document.getElementById(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});