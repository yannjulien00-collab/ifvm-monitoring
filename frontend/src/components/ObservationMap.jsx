import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, Rectangle, TileLayer, useMap } from "react-leaflet";

const MADAGASCAR_CENTER = [-18.8792, 47.5079];
const DEFAULT_ZOOM = 6;
const severityScale = [
  { key: "faible", label: "Faible", color: "#4f7f52" },
  { key: "modere", label: "Modere", color: "#c39a38" },
  { key: "eleve", label: "Eleve", color: "#d46f34" },
  { key: "critique", label: "Critique", color: "#b44343" },
];

const severityWeight = {
  faible: 0,
  modere: 1,
  eleve: 2,
  critique: 3,
};

function formatDate(value) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityMeta(level, density) {
  if (level === "critique") return severityScale[3];
  if (level === "eleve") return severityScale[2];
  if (level === "moyen" || level === "modere") return severityScale[1];

  const value = Number(density);
  if (value >= 50) return severityScale[3];
  if (value >= 30) return severityScale[2];
  if (value >= 15) return severityScale[1];
  return severityScale[0];
}

function MapViewport({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(MADAGASCAR_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0].position, 10);
      return;
    }

    const bounds = points.map((point) => point.position);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);

  return null;
}

export default function ObservationMap({ observations }) {
  const points = useMemo(
    () =>
      observations
        .map((item) => {
          const latitude = Number(item.latitude);
          const longitude = Number(item.longitude);

          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
          }

          return {
            id: item.id_observation,
            position: [latitude, longitude],
            zone: item.zone ?? "Zone inconnue",
            type: item.type_criquet ?? "Observation",
            density: item.densite ?? 0,
            severity: getSeverityMeta(item.niveau_alerte, item.densite),
            comment: item.commentaire ?? "Sans commentaire",
            date: item.date_observation,
          };
        })
        .filter(Boolean),
    [observations]
  );

  const severityCounts = useMemo(
    () =>
      severityScale.map((entry) => ({
        ...entry,
        total: points.filter((point) => point.severity.key === entry.key).length,
      })),
    [points]
  );

  const zoneAreas = useMemo(() => {
    const grouped = new Map();

    points.forEach((point) => {
      const current = grouped.get(point.zone);
      const [lat, lng] = point.position;

      if (!current) {
        grouped.set(point.zone, {
          zone: point.zone,
          minLat: lat,
          maxLat: lat,
          minLng: lng,
          maxLng: lng,
          count: 1,
          severity: point.severity,
        });
        return;
      }

      current.minLat = Math.min(current.minLat, lat);
      current.maxLat = Math.max(current.maxLat, lat);
      current.minLng = Math.min(current.minLng, lng);
      current.maxLng = Math.max(current.maxLng, lng);
      current.count += 1;

      if (severityWeight[point.severity.key] > severityWeight[current.severity.key]) {
        current.severity = point.severity;
      }
    });

    return Array.from(grouped.values()).map((zone) => {
      const latPadding = Math.max((zone.maxLat - zone.minLat) * 0.4, 0.08);
      const lngPadding = Math.max((zone.maxLng - zone.minLng) * 0.4, 0.08);

      return {
        ...zone,
        bounds: [
          [zone.minLat - latPadding, zone.minLng - lngPadding],
          [zone.maxLat + latPadding, zone.maxLng + lngPadding],
        ],
      };
    });
  }, [points]);

  return (
    <div className="map-shell">
      <MapContainer center={MADAGASCAR_CENTER} zoom={DEFAULT_ZOOM} className="agent-map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport points={points} />
        {zoneAreas.map((zone) => (
          <Rectangle
            key={`zone-${zone.zone}`}
            bounds={zone.bounds}
            pathOptions={{
              color: zone.severity.color,
              weight: 2,
              fillColor: zone.severity.color,
              fillOpacity: 0.14,
              dashArray: "8 6",
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>Zone {zone.zone}</strong>
                <span className={`map-level map-level-${zone.severity.key}`}>{zone.severity.label}</span>
                <span>{zone.count} observation(s) dans cette zone</span>
              </div>
            </Popup>
          </Rectangle>
        ))}
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={point.position}
            radius={12}
            pathOptions={{
              color: "#f7f1e7",
              weight: 2,
              fillColor: point.severity.color,
              fillOpacity: 0.92,
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>
                  {point.zone} · {point.type}
                </strong>
                <span className={`map-level map-level-${point.severity.key}`}>{point.severity.label}</span>
                <span>Densite : {point.density}</span>
                <span>{formatDate(point.date)}</span>
                <span>{point.comment}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-summary">
        <span>Madagascar · {points.length} point(s)</span>
        {zoneAreas.map((zone) => (
          <span key={`legend-${zone.zone}`} className={`map-zone-pill map-zone-${zone.severity.key}`}>
            <i className="map-zone-square" />
            Zone {zone.zone} · {zone.severity.label}
          </span>
        ))}
        {severityCounts.map((entry) => (
          <span key={entry.key} className={`map-legend-pill map-legend-${entry.key}`}>
            {entry.label} · {entry.total}
          </span>
        ))}
      </div>
    </div>
  );
}
