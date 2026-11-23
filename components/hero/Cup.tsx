/**
 * The single CLAP cup, flat and line-drawn. One 200×260 SVG with three groups
 * so the scroll pour can tip it toward the viewer using only transforms:
 *
 *   .cup-body – tapered body + the "CLAP" label (squashes as the cup tips forward)
 *   .cup-rim  – a circle drawn at ry/rx = 0.19 (a closed cup seen from the side);
 *               it grows to a full circle as the mouth turns to face the viewer
 *   .cup-coffee – the coffee surface inside the rim (scales in during the loader)
 *
 * Strokes use non-scaling-stroke so squashing never thins the outline.
 */
export function Cup() {
  return (
    <svg viewBox="0 0 200 260" aria-hidden="true" focusable="false">
      <g className="cup-body">
        <path
          d="M25 40 L45 204 Q47 222 66 222 L134 222 Q153 222 155 204 L175 40 Z"
          fill="#ffffff"
          stroke="#2a1a12"
          strokeWidth="2.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <text
          className="cup-label"
          x="100"
          y="140"
          textAnchor="middle"
          fontSize="38"
          letterSpacing="3"
          fill="#2a1a12"
        >
          CLAP
        </text>
      </g>
      <g className="cup-rim">
        <circle
          cx="100"
          cy="40"
          r="75"
          fill="#ffffff"
          stroke="#2a1a12"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle className="cup-coffee" cx="100" cy="40" r="65" />
      </g>
    </svg>
  );
}
