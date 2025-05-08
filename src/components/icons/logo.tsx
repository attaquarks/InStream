import type { SVGProps } from 'react';

export function InStreamLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50" // Adjusted viewBox for better text rendering
      width="120" // Adjusted width
      height="30"  // Adjusted height
      aria-label="InStream Logo"
      {...props}
    >
      <style>
        {`
          .instream-text {
            font-family: var(--font-geist-sans), 'Arial', sans-serif;
            font-size: 28px; /* Adjusted font size */
            font-weight: bold;
            fill: hsl(var(--sidebar-foreground));
            dominant-baseline: central; /* Vertically align text */
          }
          .instream-highlight {
            fill: hsl(var(--sidebar-primary));
          }
        `}
      </style>
      <text x="5" y="25" className="instream-text"> {/* Adjusted x, y for alignment */}
        In<tspan className="instream-highlight">Stream</tspan>
      </text>
    </svg>
  );
}
