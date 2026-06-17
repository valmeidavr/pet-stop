'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import type { EstablishmentType } from "@prisma/client";
import type { EstablishmentWithRelations } from "@/lib/queries/establishments";
import "./PetMap.css";

type Establishment = EstablishmentWithRelations;

// Turbopack resolves static image imports to a URL string, while webpack
// resolves them to a StaticImageData object ({ src }). Normalize both shapes.
function toIconUrl(img: string | { src: string }): string {
  return typeof img === "string" ? img : img.src
}

const DefaultIcon = L.icon({
  iconUrl: toIconUrl(markerIcon),
  iconRetinaUrl: toIconUrl(markerIcon2x),
  shadowUrl: toIconUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LOGO_MARKER_PX = 52;

function escapeImgSrc(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function createEstablishmentIcon(e: Establishment): L.DivIcon {
  const safeSrc = escapeImgSrc(e.logoImage);
  return L.divIcon({
    className: "pet-map-marker-root",
    html: `<div class="pet-map-marker-logo"><img src="${safeSrc}" alt="" width="${LOGO_MARKER_PX}" height="${LOGO_MARKER_PX}" decoding="async" /></div>`,
    iconSize: [LOGO_MARKER_PX, LOGO_MARKER_PX],
    iconAnchor: [LOGO_MARKER_PX / 2, LOGO_MARKER_PX],
    popupAnchor: [0, -LOGO_MARKER_PX],
  });
}

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const typeLabels: Record<EstablishmentType, string> = {
  loja: "Lojas / pet shops",
  clinica: "Clínicas",
  farmacia: "Farmácias",
  hospital: "Hospitais",
  banho_tosa: "Banho e tosa",
};

/** Ordem dos filtros na barra “Paradas Pets”. */
const PARADAS_FILTER_ORDER: EstablishmentType[] = [
  "clinica",
  "loja",
  "farmacia",
  "banho_tosa",
  "hospital",
];

function initialFilter(
  emergencyMode: boolean,
  establishments: Establishment[],
): Set<EstablishmentType> {
  if (emergencyMode) {
    const types = (["clinica", "hospital"] as const).filter((t) =>
      establishments.some((e) => e.type === t),
    );
    return new Set(types);
  }
  return new Set(establishments.map((e) => e.type));
}

function distanceKm(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function getCurrentPositionPromise(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("no_api"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/** Mensagens por código GeolocationPositionError (1/2/3). */
function messageForGeoError(code: number | undefined): string {
  switch (code) {
    case 1:
      return "A localização está bloqueada ou foi negada. Permita o acesso nas configurações do navegador (cadeado ou ícone ao lado do endereço) e atualize a página. O mapa mostra a região padrão.";
    case 2:
      return "O aparelho não conseguiu obter a posição agora (GPS ou rede). O mapa mostra a região padrão.";
    case 3:
      return "A busca pela sua posição demorou demais. Tente com Wi‑Fi ligado ou em local aberto para o GPS. O mapa mostra a região padrão.";
    default:
      return "Não foi possível obter sua localização. O mapa mostra a região padrão (Vale / Barra Mansa).";
  }
}

type Props = {
  emergencyMode?: boolean;
  establishments: Establishment[];
  defaultMapCenter: [number, number];
};

export function PetMap({
  emergencyMode = false,
  establishments,
  defaultMapCenter,
}: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(true);
  const [filter, setFilter] = useState<Set<EstablishmentType>>(() =>
    initialFilter(emergencyMode, establishments),
  );
  const [selected, setSelected] = useState<Establishment | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setGeoLoading(true);
      setGeoStatus("");

      if (!navigator.geolocation) {
        if (!cancelled) {
          setUserPos(defaultMapCenter);
          setGeoStatus(
            "Geolocalização não suportada neste navegador — usando região padrão.",
          );
          setGeoLoading(false);
        }
        return;
      }

      /** Rede/Wi‑Fi costuma responder mais rápido que só GPS de alta precisão. */
      const attempts: PositionOptions[] = [
        {
          enableHighAccuracy: false,
          maximumAge: 300_000,
          timeout: 5_000,
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: 8_000,
        },
        {
          enableHighAccuracy: false,
          maximumAge: 0,
          timeout: 12_000,
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20_000,
        },
      ];

      let lastCode: number | undefined;

      for (const opts of attempts) {
        if (cancelled) return;
        try {
          const pos = await getCurrentPositionPromise(opts);
          if (cancelled) return;
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setGeoStatus("");
          setGeoLoading(false);
          return;
        } catch (e) {
          lastCode =
            e instanceof GeolocationPositionError ? e.code : undefined;
        }
      }

      if (!cancelled) {
        setUserPos(defaultMapCenter);
        setGeoStatus(messageForGeoError(lastCode));
        setGeoLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterableTypes = useMemo(() => {
    const present = new Set<EstablishmentType>();
    for (const e of establishments) present.add(e.type);
    return PARADAS_FILTER_ORDER.filter((t) => present.has(t));
  }, [establishments]);

  const visible = useMemo(
    () => establishments.filter((e) => filter.has(e.type)),
    [filter, establishments],
  );

  const establishmentIcons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const est of establishments) {
      m.set(est.id, createEstablishmentIcon(est));
    }
    return m;
  }, [establishments]);

  const nearestEmergency = useMemo(() => {
    if (!emergencyMode || !userPos) return null;
    const pool = establishments.filter(
      (e) => e.type === "clinica" || e.type === "hospital",
    );
    let best: Establishment | null = null;
    let bestD = Infinity;
    for (const e of pool) {
      const d = distanceKm(userPos, [e.lat, e.lng]);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best ? { place: best, km: bestD } : null;
  }, [emergencyMode, userPos, establishments]);

  const routeLine = useMemo(() => {
    if (!emergencyMode || !userPos || !nearestEmergency) return null;
    return [userPos, [nearestEmergency.place.lat, nearestEmergency.place.lng]] as [
      [number, number],
      [number, number],
    ];
  }, [emergencyMode, userPos, nearestEmergency]);

  const googleMapsDirectionsUrl = useMemo(() => {
    if (!emergencyMode || !userPos || !nearestEmergency) return null;
    const [latO, lngO] = userPos;
    const { lat: latD, lng: lngD } = nearestEmergency.place;
    const params = new URLSearchParams({
      api: "1",
      origin: `${latO},${lngO}`,
      destination: `${latD},${lngD}`,
      travelmode: "driving",
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [emergencyMode, userPos, nearestEmergency]);

  const center = userPos ?? defaultMapCenter;

  const toggleType = useCallback((t: EstablishmentType) => {
    setFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      if (next.size === 0) next.add(t);
      return next;
    });
  }, []);

  return (
    <div className={`pet-map ${emergencyMode ? "pet-map--emergency" : ""}`}>
      {emergencyMode && (
        <div className="pet-map__banner">
          <p className="pet-map__banner-title">Atendimento emergencial</p>
          {geoLoading && (
            <p className="pet-map__banner-text" role="status">
              Obtendo sua localização… Em geral leva poucos segundos; em áreas
              fechadas pode demorar um pouco mais.
            </p>
          )}
          {!geoLoading && nearestEmergency && userPos && (
            <div className="pet-map__banner-row">
              <p className="pet-map__banner-text">
                Unidade mais próxima:{" "}
                <strong>{nearestEmergency.place.name}</strong> (~
                {nearestEmergency.km.toFixed(1)} km). Rota sugerida em destaque
                no mapa.
              </p>
              {googleMapsDirectionsUrl && (
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-orange pet-map__maps-btn"
                >
                  Abrir GPS no Google Maps
                </a>
              )}
            </div>
          )}
          {geoStatus && <p className="pet-map__banner-warn">{geoStatus}</p>}
        </div>
      )}

      {!emergencyMode && (
        <div className="pet-map__toolbar">
          <div
            className="pet-map__filter-bar"
            role="group"
            aria-label="Tipos de estabelecimento no mapa"
          >
            {filterableTypes.map((t) => (
              <label key={t} className="pet-map__filter-item">
                <input
                  type="checkbox"
                  className="pet-map__filter-checkbox"
                  checked={filter.has(t)}
                  onChange={() => toggleType(t)}
                />
                <span className="pet-map__filter-label">{typeLabels[t]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="pet-map__layout">
        <div className="pet-map__map">
          <MapContainer
            center={center}
            zoom={emergencyMode ? 10 : 10}
            className="pet-map__leaflet"
            scrollWheelZoom
          >
            <MapResize />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPos && (
              <Marker position={userPos} icon={DefaultIcon}>
                <Popup>Você está aqui (aprox.)</Popup>
              </Marker>
            )}
            {routeLine && (
              <Polyline positions={routeLine} color="#ea580c" weight={5} opacity={0.85} />
            )}
            {visible.map((e) => (
              <Marker
                key={e.id}
                position={[e.lat, e.lng]}
                icon={establishmentIcons.get(e.id) ?? DefaultIcon}
                eventHandlers={{
                  click: () => setSelected(e),
                }}
              />
            ))}
          </MapContainer>
        </div>

        {selected && (
          <aside className="pet-map__sidebar">
            <button
              type="button"
              className="pet-map__sidebar-close"
              onClick={() => setSelected(null)}
              aria-label="Fechar painel"
            >
              ×
            </button>
            <h2 className="pet-map__sidebar-title">{selected.name}</h2>
            <p className="pet-map__sidebar-type">
              {selected.type === "loja" && "Loja / pet shop"}
              {selected.type === "clinica" && "Clínica veterinária"}
              {selected.type === "hospital" && "Hospital veterinário"}
              {selected.type === "farmacia" && "Farmácia pet"}
              {selected.type === "banho_tosa" && "Banho e tosa"}
            </p>
            <p className="pet-map__sidebar-addr">{selected.address}</p>
            <p>
              <a href={`tel:${selected.phone.replace(/\s/g, "")}`}>
                {selected.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${selected.email}`}>{selected.email}</a>
            </p>

            {(selected.type === "clinica" || selected.type === "hospital") && (
              <>
                {selected.exams && selected.exams.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Exames</h3>
                    <ul>
                      {selected.exams.slice(0, 5).map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.vaccines && selected.vaccines.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Vacinas</h3>
                    <ul>
                      {selected.vaccines.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.medications && selected.medications.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Medicamentos</h3>
                    <ul>
                      {selected.medications.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.professionals && selected.professionals.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Profissionais</h3>
                    <ul>
                      {selected.professionals.map((p) => (
                        <li key={p.name}>
                          {p.name} — {p.specialty}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.plans && selected.plans.length > 0 && (
                  <p className="pet-map__plans">
                    <strong>Planos:</strong> {selected.plans.join(", ")}
                  </p>
                )}
                {selected.rating > 0 && (
                  <p className="pet-map__price-note">
                    Avaliação média: {selected.rating.toFixed(1)} / 5
                  </p>
                )}
              </>
            )}

            {(selected.type === "loja" || selected.type === "banho_tosa") && (
              <>
                {selected.shopServices && selected.shopServices.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Serviços</h3>
                    <ul>
                      {selected.shopServices.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.samplePrices && selected.samplePrices.length > 0 && (
                  <div className="pet-map__list-block">
                    <h3>Preços (amostra)</h3>
                    <ul>
                      {selected.samplePrices.map((x) => (
                        <li key={x.item}>
                          {x.item}: {x.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {selected.type === "farmacia" && selected.samplePrices && (
              <div className="pet-map__list-block">
                <h3>Itens (amostra)</h3>
                <ul>
                  {selected.samplePrices.map((x) => (
                    <li key={x.item}>
                      {x.item}: {x.price}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/estabelecimento/${selected.slug}`}
              className="btn btn-green pet-map__more"
            >
              Saiba mais
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
