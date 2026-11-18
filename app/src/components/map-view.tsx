"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { PlaceSummary } from "@/lib/places";

const STATE_COLOR: Record<string, string> = {
  active: "#2ed3b0",
  claimed: "#ffc970",
  mapped: "#8fa39c",
};

export function MapView({
  places,
  center,
  onOpen,
}: {
  places: PlaceSummary[];
  center: { lat: number; lng: number };
  onOpen: (slug: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const openRef = useRef(onOpen);

  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
        mapRef.current = new maplibregl.Map({
          container: containerRef.current,
          style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/dark",
          center: [center.lng, center.lat],
          zoom: 15.1,
          attributionControl: { compact: true },
        });
        mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      }

      const map = mapRef.current;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      for (const place of places) {
        const el = document.createElement("button");
        el.type = "button";
        el.title = `${place.name} · ${place.trust}`;
        el.setAttribute("aria-label", `${place.name}, ${place.trust}`);
        el.style.cssText = `display:block;width:${place.kind === "osm" ? 9 : 12}px;height:${
          place.kind === "osm" ? 9 : 12
        }px;border-radius:999px;border:2px solid rgba(0,0,0,.55);background:${STATE_COLOR[place.trust] ?? "#8fa39c"};box-shadow:0 0 0 3px ${
          STATE_COLOR[place.trust] ?? "#8fa39c"
        }33;cursor:pointer;padding:0`;

        const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: "260px" }).setDOMContent(
          (() => {
            const wrap = document.createElement("div");
            const title = document.createElement("div");
            title.style.fontWeight = "700";
            title.textContent = place.name;
            const meta = document.createElement("div");
            meta.style.opacity = "0.75";
            meta.style.fontSize = "11px";
            meta.textContent = `${place.category} · ${place.trust}${place.isDemo ? " · demo" : ""}`;
            const link = document.createElement("a");
            link.href = `/places/${place.slug}`;
            link.textContent = "Open place →";
            link.style.color = "#2ed3b0";
            link.style.fontWeight = "600";
            link.style.display = "inline-block";
            link.style.marginTop = "6px";
            wrap.append(title, meta, link);
            return wrap;
          })(),
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => marker.togglePopup());
        el.addEventListener("mouseleave", () => marker.getPopup()?.isOpen() && marker.togglePopup());
        el.addEventListener("focus", () => marker.togglePopup());
        el.addEventListener("blur", () => marker.getPopup()?.isOpen() && marker.togglePopup());
        el.addEventListener("click", () => openRef.current(place.slug));

        markersRef.current.push(marker);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [places, center.lat, center.lng]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  return <div ref={containerRef} className="h-[520px] w-full overflow-hidden rounded-xl border border-line" />;
}
