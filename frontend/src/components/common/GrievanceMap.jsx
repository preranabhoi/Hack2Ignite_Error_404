import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
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
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
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
  const mappableGrievances = grievances.filter(hasCoordinates);
  const missingLocationCount = grievances.length - mappableGrievances.length;
  const firstLocation = mappableGrievances[0];
  const center = firstLocation
    ? [Number(firstLocation.location.latitude), Number(firstLocation.location.longitude)]
    : DEFAULT_CENTER;

  return (
    <div>
      <div
        style={{
          height,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: '#e2e8f0',
        }}
      >
        <MapContainer center={center} zoom={compact ? 11 : 12} scrollWheelZoom={!compact} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizeHandler />
          {mappableGrievances.map((grievance) => (
            <Marker
              key={grievance._id}
              position={[Number(grievance.location.latitude), Number(grievance.location.longitude)]}
              icon={markerIcon}
              eventHandlers={{ click: () => onMarkerClick?.(grievance) }}
            >
              <Popup>
                <div style={{ minWidth: compact ? '180px' : '220px', fontSize: '0.82rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>{grievance.title}</strong>
                  <div><b>Category:</b> {grievance.category || 'N/A'}</div>
                  <div><b>Priority:</b> {grievance.priority || 'N/A'}</div>
                  <div><b>Status:</b> {grievance.status || 'N/A'}</div>
                  <div><b>Date:</b> {formatDate(grievance.createdAt)}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    {onMarkerClick ? (
                      <button type="button" onClick={() => onMarkerClick(grievance)} className="btn btn-primary btn-sm">
                        Open grievance
                      </button>
                    ) : (
                      <Link to={`/grievances/${grievance._id}`}>Open grievance</Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

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
