import { Heart, MapPin } from 'lucide-react'
import type * as React from 'react'
import type { Place } from './places'

export function PlaceCard({
  place,
  saved,
  onSave,
}: {
  place: Place
  saved: boolean
  onSave: () => void
}) {
  return (
    <article
      className="atlas-place-card"
      style={
        {
          '--place-color': place.color,
          '--place-offset': `${place.walk * 7}px`,
          '--place-water-position': `${20 + place.walk}%`,
        } as React.CSSProperties
      }
    >
      <div className="atlas-place-art" aria-hidden="true">
        <div className="atlas-place-water" />
        <div className="atlas-place-park" />
        <span className="atlas-place-pin">
          <MapPin size={30} fill="currentColor" />
        </span>
      </div>
      <div className="atlas-place-copy">
        <h2>{place.name}</h2>
        <p>{place.neighborhood}</p>
      </div>
      <button
        type="button"
        className="atlas-save"
        aria-label={`Save ${place.name} in ${place.neighborhood}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Heart size={21} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}
