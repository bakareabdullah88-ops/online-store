/**
 * Kamplug's own icons for navigation and categories. Duotone: a soft filled
 * shape sits behind a rounded outline, nudged down-right so it reads as a
 * little 2.5D, like the illustrations. Same props as an <svg>; colour comes
 * from `currentColor`.
 */
import type { SVGProps } from "react";

export type AppIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function make(name: string, fill: React.ReactNode, line: React.ReactNode): AppIcon {
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...props}
      >
        <g fill="currentColor" stroke="none" opacity={0.2} transform="translate(1.2 1.2)">
          {fill}
        </g>
        {line}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

/* ------------------------------ Navigation ------------------------------ */

export const HomeIcon = make(
  "HomeIcon",
  <path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z" />,
  <>
    <path d="M3.5 11 12 3.8l8.5 7.2" />
    <path d="M5.5 9.5v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </>,
);

export const DiscoverIcon = make(
  "DiscoverIcon",
  <circle cx="12" cy="12" r="8.5" />,
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2 5-5 2 2-5Z" />
  </>,
);

export const OrdersIcon = make(
  "OrdersIcon",
  <path d="M5 3.5h14v17l-2.3-1.5-2.4 1.5-2.3-1.5-2.4 1.5L7.3 19 5 20.5Z" />,
  <>
    <path d="M5 3.5h14v17l-2.3-1.5-2.4 1.5-2.3-1.5-2.4 1.5L7.3 19 5 20.5Z" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </>,
);

export const DashboardIcon = make(
  "DashboardIcon",
  <path d="M3.5 16a8.5 8.5 0 1 1 17 0Z" />,
  <>
    <path d="M3.5 16a8.5 8.5 0 0 1 17 0" />
    <path d="M12 16l3.5-4.5" />
    <circle cx="12" cy="16" r="1.4" />
    <path d="M3.5 19.5h17" />
  </>,
);

export const MessagesIcon = make(
  "MessagesIcon",
  <path d="M4 5.5h16v10.5H9l-5 4Z" />,
  <>
    <path d="M4 5.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-5 4Z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </>,
);

export const SavedIcon = make(
  "SavedIcon",
  <path d="M12 20s-8-4.6-8-10.3A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.7C20 15.4 12 20 12 20Z" />,
  <path d="M12 20s-8-4.6-8-10.3A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.7C20 15.4 12 20 12 20Z" />,
);

export const BagIcon = make(
  "BagIcon",
  <path d="M4.5 8h15l-1.2 12.5h-12.6Z" />,
  <>
    <path d="M4.5 8h15l-1.2 11.6a1 1 0 0 1-1 .9H6.7a1 1 0 0 1-1-.9Z" />
    <path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" />
  </>,
);

/* ------------------------------ Categories ------------------------------ */

export const FashionIcon = make(
  "FashionIcon",
  <path d="M8 4 3.5 7l2 4 2-1V20h9V10l2 1 2-4L16 4c-.7 1.6-2.2 2.5-4 2.5S8.7 5.6 8 4Z" />,
  <path d="M8 4 3.5 7l2 4 2-1V20h9V10l2 1 2-4L16 4c-.7 1.6-2.2 2.5-4 2.5S8.7 5.6 8 4Z" />,
);

export const ThriftIcon = make(
  "ThriftIcon",
  <rect x="3.5" y="8" width="17" height="11.5" rx="2" />,
  <>
    <rect x="3.5" y="8" width="17" height="11.5" rx="2" />
    <path d="M9 8V5.5h6V8M8 8v11.5M16 8v11.5" />
  </>,
);

export const FoodIcon = make(
  "FoodIcon",
  <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />,
  <>
    <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />
    <path d="M9 3.5c-.8 1 .8 2 0 3M13 3.5c-.8 1 .8 2 0 3" />
  </>,
);

export const BeautyIcon = make(
  "BeautyIcon",
  <rect x="7" y="10" width="6" height="10.5" rx="1.2" />,
  <>
    <rect x="7" y="10" width="6" height="10.5" rx="1.2" />
    <path d="M8.5 10V5.5l3-2V10" />
    <path d="M18 4.5v3M16.5 6h3M17 13.5v2M16 14.5h2" />
  </>,
);

export const AccessoriesIcon = make(
  "AccessoriesIcon",
  <circle cx="12" cy="12" r="5.5" />,
  <>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M9.5 6.9 10 3.5h4l.5 3.4M9.5 17.1l.5 3.4h4l.5-3.4M12 9.5V12l1.6 1" />
  </>,
);

export const PrintIcon = make(
  "PrintIcon",
  <rect x="3.5" y="9" width="17" height="8" rx="1.5" />,
  <>
    <path d="M7 9V3.5h10V9" />
    <rect x="3.5" y="9" width="17" height="8" rx="1.5" />
    <path d="M7 14.5h10v6H7Z" />
    <path d="M17 11.8h.01" />
  </>,
);

export const TechIcon = make(
  "TechIcon",
  <rect x="6.5" y="3" width="11" height="18" rx="2.5" />,
  <>
    <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
    <path d="M10.5 18h3" />
  </>,
);

export const BooksIcon = make(
  "BooksIcon",
  <path d="M4 5.5h6.5A1.5 1.5 0 0 1 12 7v13a2 2 0 0 0-2-2H4Z" />,
  <>
    <path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4Z" />
    <path d="M20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6Z" />
  </>,
);
