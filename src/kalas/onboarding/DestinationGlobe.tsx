"use client";

/* Interactive destination picker for onboarding: a Kalas-styled three.js globe
   (ivory sphere, sage dot-matrix continents) with curated wedding destinations.
   Spin it, tap a place, and the pick lands in form.location. Country shapes are
   bundled Natural Earth data (countries-110m) — no runtime fetches. */

import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import countriesTopo from './countries-110m.json';
import { useLang } from '../i18n';

export type Destination = {
  id: string;
  label: string;   // Danish source (t() translates)
  country: string; // Danish source
  lat: number;
  lng: number;
};

/* Curated inspiration — Denmark first, then Europe's classics, then far away. */
export const DESTINATIONS: Destination[] = [
  { id: 'cph',       label: 'København',    country: 'Danmark',    lat: 55.68,  lng: 12.57 },
  { id: 'aarhus',    label: 'Aarhus',       country: 'Danmark',    lat: 56.16,  lng: 10.21 },
  { id: 'skagen',    label: 'Skagen',       country: 'Danmark',    lat: 57.72,  lng: 10.58 },
  { id: 'bornholm',  label: 'Bornholm',     country: 'Danmark',    lat: 55.13,  lng: 14.92 },
  { id: 'fyn',       label: 'Fyn',          country: 'Danmark',    lat: 55.35,  lng: 10.40 },
  { id: 'stockholm', label: 'Stockholm',    country: 'Sverige',    lat: 59.33,  lng: 18.07 },
  { id: 'iceland',   label: 'Island',       country: 'Island',     lat: 64.15,  lng: -21.94 },
  { id: 'scotland',  label: 'Skotland',     country: 'Storbritannien', lat: 57.12, lng: -4.71 },
  { id: 'paris',     label: 'Paris',        country: 'Frankrig',   lat: 48.86,  lng: 2.35 },
  { id: 'provence',  label: 'Provence',     country: 'Frankrig',   lat: 43.95,  lng: 4.81 },
  { id: 'tuscany',   label: 'Toscana',      country: 'Italien',    lat: 43.77,  lng: 11.25 },
  { id: 'amalfi',    label: 'Amalfikysten', country: 'Italien',    lat: 40.63,  lng: 14.60 },
  { id: 'como',      label: 'Comosøen',     country: 'Italien',    lat: 45.99,  lng: 9.26 },
  { id: 'santorini', label: 'Santorini',    country: 'Grækenland', lat: 36.39,  lng: 25.46 },
  { id: 'mallorca',  label: 'Mallorca',     country: 'Spanien',    lat: 39.57,  lng: 2.65 },
  { id: 'barcelona', label: 'Barcelona',    country: 'Spanien',    lat: 41.39,  lng: 2.17 },
  { id: 'lisbon',    label: 'Lissabon',     country: 'Portugal',   lat: 38.72,  lng: -9.14 },
  { id: 'algarve',   label: 'Algarve',      country: 'Portugal',   lat: 37.02,  lng: -7.93 },
  { id: 'dubrovnik', label: 'Dubrovnik',    country: 'Kroatien',   lat: 42.65,  lng: 18.09 },
  { id: 'alps',      label: 'Alperne',      country: 'Østrig',     lat: 47.27,  lng: 11.40 },
  { id: 'marrakech', label: 'Marrakech',    country: 'Marokko',    lat: 31.63,  lng: -8.01 },
  { id: 'nyc',       label: 'New York',     country: 'USA',        lat: 40.71,  lng: -74.01 },
  { id: 'tulum',     label: 'Tulum',        country: 'Mexico',     lat: 20.21,  lng: -87.46 },
  { id: 'capetown',  label: 'Cape Town',    country: 'Sydafrika',  lat: -33.92, lng: 18.42 },
  { id: 'bali',      label: 'Bali',         country: 'Indonesien', lat: -8.34,  lng: 115.09 },
  { id: 'kyoto',     label: 'Kyoto',        country: 'Japan',      lat: 35.01,  lng: 135.77 },
];

/** Canonical stored value — Danish, independent of the viewer's UI language. */
export const destinationValue = (d: Destination) => `${d.label}, ${d.country}`;

// Bundled TopoJSON → GeoJSON features (typed loosely; the shape is Natural Earth's).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = countriesTopo as any;
const LAND = (feature(topo, topo.objects.countries) as unknown as { features: object[] }).features;

const INK = '#3B432A';
const SAGE = '#A9B380';
const TERRACOTTA = '#C17B5C';

export default function DestinationGlobe({ selectedId, onPick }: {
  selectedId: string | null;
  onPick: (d: Destination) => void;
}) {
  const { t } = useLang();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Fill the container; the globe needs explicit pixel dimensions.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const globeMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#EFE8D8' }),
    []
  );

  const onReady = () => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.enableZoom = false;
    // Wake up over Europe — most couples start close to home.
    g.pointOfView({ lat: 48, lng: 10, altitude: 1.85 }, 0);
  };

  const pick = (d: Destination) => {
    onPick(d);
    const g = globeRef.current;
    if (g) {
      g.controls().autoRotate = false;
      g.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 700);
    }
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={() => { const g = globeRef.current; if (g) g.controls().autoRotate = false; }}
      className="relative h-[min(58vh,420px)] w-full cursor-grab active:cursor-grabbing"
      aria-label={t('Drej på kloden og vælg et sted')}
    >
      {size.w > 0 && (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor={SAGE}
          atmosphereAltitude={0.13}
          hexPolygonsData={LAND}
          hexPolygonResolution={3}
          hexPolygonMargin={0.62}
          hexPolygonColor={() => SAGE}
          labelsData={DESTINATIONS as object[]}
          labelLat={(d) => (d as Destination).lat}
          labelLng={(d) => (d as Destination).lng}
          labelText={(d) => t((d as Destination).label)}
          labelSize={1.05}
          labelDotRadius={0.55}
          labelAltitude={0.012}
          labelResolution={2}
          labelColor={(d) => ((d as Destination).id === selectedId ? TERRACOTTA : INK)}
          onLabelClick={(d) => pick(d as Destination)}
          onLabelHover={(d) => {
            if (wrapRef.current) wrapRef.current.style.cursor = d ? 'pointer' : 'grab';
          }}
          onGlobeReady={onReady}
        />
      )}
    </div>
  );
}
