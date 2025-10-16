import { buildClusterIndex, getClusters, createPointsFromData } from '../../utils/clustering';

jest.mock('supercluster', () => {
  return function MockSupercluster(opts) {
    this.opts = opts;
    this._features = [];
    this.load = (features) => {
      this._features = features;
    };
    this.getClusters = (bbox, zoom) => {
      // Simple mock: when zoom < 5, return a single cluster with point_count
      if (zoom < 5) {
        const count = this._features.length;
        return [{
          id: 1,
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { cluster: true, point_count: count, point_count_abbreviated: String(count) }
        }];
      }
      // Otherwise return individual points
      return this._features.map((f, i) => ({ id: i + 2, geometry: f.geometry, properties: { ...f.properties } }));
    };
  };
}, { virtual: true });

describe('clustering utils', () => {
  it('creates points from technicians, polygons, and circles', () => {
    const pts = createPointsFromData({
      technicians: [{ id: 1, current_location: { lat: 1, lng: 2 } }],
      polygons: [{ id: 2, coordinates: [[0, 0], [2, 2]] }],
      circles: [{ id: 3, center: [5, 6] }]
    });
    expect(pts).toHaveLength(3);
    expect(pts[0]).toMatchObject({ id: 'tech-1', lng: 2, lat: 1 });
    expect(pts[1].id).toBe('poly-2');
    expect(pts[2]).toMatchObject({ id: 'circle-3', lng: 6, lat: 5 });
  });

  it('builds a cluster index and returns clusters at low zoom', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, lng: i, lat: i }));
    const idx = buildClusterIndex(points);
    const items = getClusters(idx, [-180, -85, 180, 85], 2);
    expect(items).toHaveLength(1);
    expect(items[0].properties.cluster).toBe(true);
    expect(items[0].properties.point_count).toBe(10);
  });

  it('returns individual points at higher zoom', () => {
    const points = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, lng: i, lat: i }));
    const idx = buildClusterIndex(points);
    const items = getClusters(idx, [-180, -85, 180, 85], 12);
    expect(items).toHaveLength(3);
    expect(items[0].properties.cluster).toBeUndefined();
  });
});
