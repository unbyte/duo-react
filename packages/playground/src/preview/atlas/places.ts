const neighborhoods = [
  'North Quarter',
  'Canal District',
  'Old Town',
  'East Village',
  'Garden Quarter',
  'Harbor Side',
  'West End',
  'South Bank',
]
const names = [
  'Corner House',
  'Paper & Ink',
  'Greenhouse',
  'Little Sunday',
  'The Courtyard',
  'Blue Door',
  'Common Ground',
  'Morning Light',
  'Studio Nine',
]
export const categories = ['All', 'Cafés', 'Culture', 'Outdoors'] as const
export type Category = (typeof categories)[number]

export const places = neighborhoods.flatMap((neighborhood, district) =>
  names.map((name, index) => ({
    id: `${district}-${index}`,
    name,
    neighborhood,
    category: categories[1 + (index % 3)],
    x: 370 + ((district * 3 + index * 5) % 13) * 130,
    y: 370 + ((district * 5 + index * 2) % 13) * 130,
    walk: 3 + ((district * 7 + index * 3) % 24),
    color: ['#ec6348', '#8d61d4', '#25856a'][index % 3],
  })),
)

export type Place = (typeof places)[number]
export const initialCenter = { x: 1150, y: 1150 }
