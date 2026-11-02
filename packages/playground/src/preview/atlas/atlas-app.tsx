import { useDuoState } from 'duo-react'
import { Heart, LocateFixed, Minus, Plus, Search, X } from 'lucide-react'
import * as React from 'react'
import { CityMap } from './city-map'
import { PlaceCard } from './place-card'
import { categories, initialCenter, type Place, places } from './places'
import './atlas.css'

const titles: Record<string, string> = {
  home: 'Side Street',
  library: 'Places',
  search: 'Search',
  favorites: 'Saved places',
  settings: 'Map settings',
}

export function AtlasApp({ selectedTab }: { selectedTab: string }) {
  const theme = useDuoState((state) => state.system.colorMode)
  const [center, setCenter] = React.useState(initialCenter)
  const [zoom, setZoom] = React.useState(1)
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('All')
  const [selected, setSelected] = React.useState<Place>()
  const [labels, setLabels] = React.useState(true)
  const [route, setRoute] = React.useState(true)
  const [saved, setSaved] = React.useState(
    () => new Set(places.filter((_, i) => i % 4 === 0).map((place) => place.id)),
  )
  const listing = ['library', 'search', 'favorites'].includes(selectedTab)
  const visible = places.filter(
    (place) =>
      (category === 'All' || place.category === category) &&
      (selectedTab !== 'favorites' || saved.has(place.id)) &&
      (!listing ||
        `${place.name} ${place.neighborhood} ${place.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  )
  function toggleSave(id: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  return (
    <div className="atlas-app" data-theme={theme} data-route={route}>
      <CityMap
        places={visible}
        selected={selected?.id}
        onSelect={setSelected}
        center={center}
        onCenterChange={setCenter}
        zoom={zoom}
        showLabels={labels}
        interactive={!listing}
      />
      {listing && (
        <div className="atlas-list" role="region" key={selectedTab} aria-label="Places">
          {visible.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              saved={saved.has(place.id)}
              onSave={() => toggleSave(place.id)}
            />
          ))}
          {!visible.length && (
            <p className="atlas-empty">
              No places found. Try another neighborhood or save a place on the map.
            </p>
          )}
        </div>
      )}
      <header className="atlas-header">
        <h1>{titles[selectedTab] ?? titles.home}</h1>
        {listing && (
          <label className="atlas-search">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="A place, a neighborhood…"
              aria-label="Search places"
            />
          </label>
        )}
        {selectedTab !== 'settings' && (
          <div className="atlas-categories" role="group" aria-label="Place category">
            {categories.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </header>
      {selectedTab === 'settings' && (
        <section className="atlas-preferences" aria-label="Map preferences">
          <label>
            <span>Place names</span>
            <input
              type="checkbox"
              checked={labels}
              onChange={(event) => setLabels(event.target.checked)}
            />
          </label>
          <label>
            <span>Walking loop</span>
            <input
              type="checkbox"
              checked={route}
              onChange={(event) => setRoute(event.target.checked)}
            />
          </label>
          <label>
            <span>
              Map scale<small>{Math.round(zoom * 100)}%</small>
            </span>
            <input
              type="range"
              aria-label="Map scale"
              min={0.65}
              max={1.6}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </section>
      )}
      {!listing && (
        <div className="atlas-map-tools" role="group" aria-label="Map controls">
          <button
            type="button"
            aria-label="Zoom into map"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.15))}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            aria-label="Zoom out of map"
            disabled={zoom <= 0.65}
            onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))}
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            aria-label="Recenter map"
            onClick={() => {
              setCenter(initialCenter)
              setZoom(1)
            }}
          >
            <LocateFixed size={20} />
          </button>
        </div>
      )}
      {selectedTab === 'home' && selected && (
        <section className="atlas-selection" aria-label="Selected place">
          <div>
            <h2>{selected.name}</h2>
            <p>{selected.neighborhood}</p>
          </div>
          <button
            type="button"
            className="atlas-save"
            aria-label="Save selected place"
            aria-pressed={saved.has(selected.id)}
            onClick={() => toggleSave(selected.id)}
          >
            <Heart size={21} fill={saved.has(selected.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="atlas-dismiss"
            aria-label="Close place details"
            onClick={() => setSelected(undefined)}
          >
            <X size={16} />
          </button>
        </section>
      )}
    </div>
  )
}
