// Lightweight wrapper around supercluster to make clustering testable and swappable
// Points: [{ id, lng, lat, properties }]
// Options: { radius, maxZoom, minZoom }
export function buildClusterIndex(points = [], options = {}) {
  // Lazy require to allow Jest virtual mock in tests
  const Supercluster = require('supercluster');
  const idx = new Supercluster({
    radius: options.radius ?? 60,
    maxZoom: options.maxZoom ?? 16,
    minZoom: options.minZoom ?? 0,
  });
  const features = points.map((p) => ({
    type: 'Feature',
    properties: { ...(p.properties || {}), pointId: p.id },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
  }));
  idx.load(features);
  return idx;
}

// bbox: [west, south, east, north]
export function getClusters(index, bbox, zoom) {
  return index.getClusters(bbox, zoom);
}

export function createPointsFromData({ technicians = [], polygons = [], circles = [] }) {
  const pts = [];
  // technician points
  technicians.forEach((t) => {
    const loc = t?.current_location;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      pts.push({ id: `tech-${t.id}`, lng: loc.lng, lat: loc.lat, properties: { kind: 'technician' } });
    }
  });
  // polygon centroids (simple average fallback)
  polygons.forEach((a) => {
    if (Array.isArray(a.coordinates) && a.coordinates.length) {
      const avg = a.coordinates.reduce((acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng], [0, 0]);
      const lat = avg[0] / a.coordinates.length;
      const lng = avg[1] / a.coordinates.length;
      pts.push({ id: `poly-${a.id}`, lng, lat, properties: { kind: 'polygon' } });
    }
  });
  // circle centers
  circles.forEach((c) => {
    if (Array.isArray(c.center)) {
      pts.push({ id: `circle-${c.id}`, lng: c.center[1], lat: c.center[0], properties: { kind: 'circle' } });
    }
  });
  return pts;
}
