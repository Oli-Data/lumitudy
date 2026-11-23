import './bloom-scenery.css'

const petals = [0, 45, 90, 135, 180, 225, 270, 315]

export default function BloomScenery() {
  return (
    <div className="mode-bloom" aria-hidden="true">
      {['far', 'near', 'ridge'].map(depth => (
        <svg key={depth} className={`mode-bloom-plant mode-bloom-plant--${depth}`} viewBox="0 0 112 76" focusable="false">
          <ellipse className="mode-bloom-ground" cx="57" cy="48" rx="44" ry="19" />
          <g transform="translate(56 38) scale(1 .68)">
            <g className="mode-bloom-petals">
              {petals.map(angle => (
                <path key={angle} transform={`rotate(${angle})`}
                  d="M-6-8C-12-17-17-28-15-38C-13-47-7-51 0-51C8-51 14-46 15-38C17-28 12-17 6-8Z" />
              ))}
            </g>
            <circle className="mode-bloom-center" r="13" />
          </g>
        </svg>
      ))}
    </div>
  )
}
