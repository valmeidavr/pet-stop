'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./MapPickerInner').then((m) => m.MapPickerInner), {
  ssr: false,
  loading: () => <div className="map-picker__loading">Carregando mapa…</div>,
})

export function MapPicker({
  latName = 'lat',
  lngName = 'lng',
  defaultCenter = [-22.41, -44.12],
}: {
  latName?: string
  lngName?: string
  defaultCenter?: [number, number]
}) {
  return <Inner latName={latName} lngName={lngName} defaultCenter={defaultCenter} />
}
