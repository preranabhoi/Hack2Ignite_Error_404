import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20.2961, 85.8245];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hasCoordinates = (grievance) => {
  const latitude = Number(grievance?.location?.latitude);
  const longitude = Number(grievance?.location?.longitude);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const formatDate = (date) => {
  if (!date) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const GrievanceMap = ({ grievances = [], onMarkerClick, height = '520px', compact = false }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const navigate = useNavigate();

  const mappableGrievances = grievances.filter(hasCoordinates);
  const missingLocationCount = grievances.length - mappableGrievances.length;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const firstLocation = mappableGrievances[0];
      const center = firstLocation
        ? [Number(firstLocation.location.latitude), Number(firstLocation.location.longitude)]
        : DEFAULT_CENTER;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom: compact ? 11 : 12,
        scrollWheelZoom: !compact,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;

    if (markersGroup) {
      markersGroup.clearLayers();

      mappableGrievances.forEach((grievance) => {
        const lat = Number(grievance.location.latitude);
        const lng = Number(grievance.location.longitude);
        const marker = L.marker([lat, lng], { icon: markerIcon });

        const popupContent = document.createElement('div');
        popupContent.style.minWidth = compact ? '180px' : '220px';
        popupContent.style.fontSize = '0.82rem';

        popupContent.innerHTML = `
          <strong style="display:block;margin-bottom:0.35rem;font-size:0.9rem;">${grievance.title || 'Untitled Grievance'}</strong>
          <div><b>Category:</b> ${grievance.category || 'N/A'}</div>
          <div><b>Priority:</b> ${grievance.priority || 'N/A'}</div>
          <div><b>Status:</b> ${grievance.status || 'N/A'}</div>
          <div><b>Date:</b> ${formatDate(grievance.createdAt)}</div>
          <div style="margin-top:0.5rem;">
            <button class="btn btn-primary btn-sm" id="btn-view-${grievance._id}" style="width:100%;font-size:0.75rem;padding:0.3rem 0.5rem;cursor:pointer;">
              Open Grievance
            </button>
          </div>
        `;

        const btn = popupContent.querySelector(`#btn-view-${grievance._id}`);
        if (btn) {
          btn.onclick = () => {
            if (onMarkerClick) {
              onMarkerClick(grievance);
            } else {
              navigate(`/grievances/${grievance._id}`);
            }
          };
        }

        marker.bindPopup(popupContent);
        marker.addTo(markersGroup);
      });

      if (mappableGrievances.length > 0) {
        const bounds = L.latLngBounds(
          mappableGrievances.map((g) => [
            Number(g.location.latitude),
            Number(g.location.longitude),
          ])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [grievances, compact]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div
        ref={mapContainerRef}
        style={{
          height,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: '#e2e8f0',
        }}
      />
      {mappableGrievances.length === 0 && (
        <p style={{ marginTop: '0.65rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No grievances have usable latitude and longitude coordinates yet. Address details remain available in each grievance.
        </p>
      )}
      {mappableGrievances.length > 0 && missingLocationCount > 0 && (
        <p style={{ marginTop: '0.65rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {missingLocationCount} grievance{missingLocationCount === 1 ? '' : 's'} without coordinates {compact ? 'are' : 'is'} not shown as markers.
        </p>
      )}
    </div>
  );
};

export { hasCoordinates };
export default GrievanceMap;
