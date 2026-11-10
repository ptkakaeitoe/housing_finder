const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

function project({ lat, lng }) {
  const latitude = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat)) * Math.PI / 180;
  return { x: (lng + 180) / 360, y: (1 - Math.log(Math.tan(Math.PI / 4 + latitude / 2)) / Math.PI) / 2 };
}

function unproject({ x, y }) {
  return { lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI, lng: ((x * 360) % 360 + 360) % 360 - 180 };
}

// Camera offsets are in screen pixels: a positive x leaves room on the right,
// and a positive y leaves room below the selected marker.
export function mapCameraTarget(position, zoom, { x = 0, y = 0 } = {}) {
  const point = project(position);
  const scale = TILE_SIZE * 2 ** zoom;
  return unproject({ x: point.x + x / scale, y: point.y + y / scale });
}

export function animateMapCamera(map, target, duration = 560) {
  const current = map.getCenter();
  if (!current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    map.moveCamera(target);
    return () => {};
  }
  const start = project({ lat: current.lat(), lng: current.lng() });
  const end = project(target.center);
  // Take the short route when crossing the date line.
  if (end.x - start.x > .5) end.x -= 1;
  if (end.x - start.x < -.5) end.x += 1;
  const startZoom = map.getZoom() ?? target.zoom;
  const startedAt = performance.now();
  let frame;
  function tick(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - (1 - progress) ** 3;
    map.moveCamera({
      center: unproject({ x: start.x + (end.x - start.x) * eased, y: start.y + (end.y - start.y) * eased }),
      zoom: startZoom + (target.zoom - startZoom) * eased,
    });
    if (progress < 1) frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
