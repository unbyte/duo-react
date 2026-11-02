import { memo } from 'react'

const blocks = Array.from({ length: 324 }, (_, index) => ({
  x: (index % 18) * 130 + 30,
  y: Math.floor(index / 18) * 130 + 30,
  park: index % 17 === 0 || index % 23 === 0,
  tone: index % 5,
}))
export const MapArt = memo(function MapArt() {
  return (
    <g className="atlas-map-art">
      <rect width={2400} height={2400} fill="var(--atlas-land)" />
      {blocks.map((block, index) => (
        <g key={index} transform={`translate(${block.x} ${block.y})`}>
          <rect
            width={104}
            height={104}
            rx={13}
            fill={block.park ? 'var(--atlas-park)' : 'var(--atlas-block)'}
          />
          {block.park ? (
            <>
              <path
                d="M15 75 Q52 12 90 34 M26 100 Q72 65 99 78"
                fill="none"
                stroke="var(--atlas-path)"
                strokeWidth={5}
              />
              <circle cx={27} cy={29} r={15} fill="var(--atlas-tree)" />
              <circle cx={72} cy={68} r={19} fill="var(--atlas-tree)" />
            </>
          ) : (
            <>
              <rect
                x={10}
                y={10}
                width={34}
                height={60}
                rx={4}
                fill={`var(--atlas-building-${block.tone})`}
              />
              <rect
                x={53}
                y={10}
                width={41}
                height={33}
                rx={4}
                fill={`var(--atlas-building-${(block.tone + 2) % 5})`}
              />
              <rect
                x={53}
                y={53}
                width={41}
                height={41}
                rx={4}
                fill={`var(--atlas-building-${(block.tone + 1) % 5})`}
              />
            </>
          )}
        </g>
      ))}
      <path
        d="M-100 1500 C500 1900 650 700 1250 1100 S1750 1800 2500 1050"
        className="atlas-river-bank"
      />
      <path
        d="M-100 1500 C500 1900 650 700 1250 1100 S1750 1800 2500 1050"
        className="atlas-river"
      />
      {[650, 1170, 1820].map((x, index) => (
        <g key={x} transform={`translate(${x} ${[1260, 1080, 1450][index]}) rotate(-25)`}>
          <rect
            x={-15}
            y={-170}
            width={30}
            height={340}
            rx={3}
            fill="var(--atlas-road)"
            stroke="var(--atlas-block)"
            strokeWidth={4}
          />
          <path d="M0 -170 V170" stroke="var(--atlas-path)" strokeWidth={2} strokeDasharray="6 6" />
        </g>
      ))}
      <text x={825} y={790} className="atlas-district-name">
        Canal District
      </text>
      <text x={1460} y={990} className="atlas-district-name">
        East Village
      </text>
      <text x={590} y={1725} className="atlas-district-name">
        South Bank
      </text>
      <path d="M815 680 H1075 V940 H1335 V1200 H1595" className="atlas-route-halo" />
      <path d="M815 680 H1075 V940 H1335 V1200 H1595" className="atlas-route" />
    </g>
  )
})
