// Exact eight-petal geometry and colors from CO3-Labs-Landing/ProductSymbol.
// The adjacent wordmark provides the accessible brand name.
export default function LumitudyFlower() {
  return <svg className="lumitudy-flower" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <g className="lumitudy-flower-petals">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M29 25C29 21.5 26.5 19.2 26.5 15.5V9.5C26.5 2.2 37.5 2.2 37.5 9.5V15.5C37.5 19.2 35 21.5 35 25Z" transform={`rotate(${angle} 32 32)`} />)}
    </g>
    <circle className="lumitudy-flower-hub" cx="32" cy="32" r="10.5" />
    <circle className="lumitudy-flower-center" cx="32" cy="32" r="7.2" />
  </svg>
}
