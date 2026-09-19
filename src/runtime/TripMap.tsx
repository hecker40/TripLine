import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Activity } from "../../shared/itinerary";
import type { Research } from "../../shared/runtime";

export function TripMap({
  activities,
  selected,
  onSelect,
  research,
}: {
  activities: Activity[];
  selected: string;
  onSelect: (id: string) => void;
  research: Research | null;
}) {
  const [tilesFailed, setTilesFailed] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([35.68, 139.76], 12);
    map.current = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    })
      .on("tileerror", () => setTilesFailed(true))
      .on("load", () => setTilesFailed(false))
      .addTo(m);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const points: L.LatLngTuple[] = [];
    activities.forEach((a, i) => {
      if (a.location.latitude === null || a.location.longitude === null) return;
      const p: L.LatLngTuple = [a.location.latitude, a.location.longitude];
      points.push(p);
      const marker = L.marker(p, {
        icon: L.divIcon({
          className: "map-marker-host",
          html: `<span class="map-marker ${a.id === selected ? "active" : ""}">${i + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });
      const popup = document.createElement("div");
      popup.textContent = `${a.startTime} · ${a.title}`;
      marker.bindTooltip(popup);
      marker.on("click", () => callback.current(a.id));
      marker.addTo(layer.current!);
    });
    if (points.length > 1)
      L.polyline(points, {
        color: "#496d5a",
        weight: 3,
        dashArray: "6 8",
        opacity: 0.6,
      }).addTo(layer.current);
    if (points.length)
      map.current.fitBounds(L.latLngBounds(points), {
        padding: [55, 55],
        maxZoom: 14,
      });
    else if (research) {
      map.current.setView([research.latitude, research.longitude], 12);
      L.circleMarker([research.latitude, research.longitude], {
        radius: 9,
        color: "#617b4c",
        fillOpacity: 0.15,
      })
        .bindTooltip("City center — venue coordinates unavailable")
        .addTo(layer.current);
    }
  }, [activities, selected, research]);
  return (
    <div className="map-frame">
      <div
        ref={host}
        className="trip-map"
        aria-label="Interactive itinerary map"
      />
      <div className="map-caption">
        {tilesFailed
          ? "Map tiles unavailable. Your itinerary is still available."
          : activities.some(
                (a) =>
                  a.location.latitude !== null && a.location.longitude !== null,
              )
            ? "Proposed locations · dotted lines are not navigation routes"
            : activities.length
              ? "City overview only — this day has no mapped venue coordinates"
              : "Destination overview · generate a trip to add stops"}
      </div>
    </div>
  );
}
