// src/components/Icon.tsx
import React from "react";

export type IconName =
    | "bag"
    | "menu"
    | "profile"
    | "search"
    | "close"
    | "arrow-left"
    | "arrow-right"
    | "orders";

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
    name: IconName;
    size?: number | string;      // 24 | "1.5rem" | "32px"
    strokeWidth?: number;        // толщина линий
    title?: string;              // подпись для a11y
}

export default function Icon({
    name,
    size = 24,
    strokeWidth = 1,
    title,
    ...rest
}: IconProps) {
    const sizePx = typeof size === "number" ? `${size}px` : size;

    const content = (() => {
        switch (name) {
            case "bag":
                // ЧУТЬ УЖЕ: корпус 14px шириной вместо 16px
                return (
                    <>
                        <rect x="5" y="8" width="14" height="12" rx="2.5" />
                        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
                    </>
                );
            case "menu":
                return (
                    <>
                        <path d="M3 6h18" />
                        <path d="M3 12h18" />
                        <path d="M3 18h18" />
                    </>
                );
            case "profile":
                return (
                    <>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </>
                );
            case "search":
                return (
                    <>
                        <circle cx="11" cy="11" r="6" />
                        <path d="M16 16l5 5" />
                    </>
                );
            case "close":
                return (
                    <>
                        <path d="M6 6l12 12" />
                        <path d="M18 6l-12 12" />
                    </>
                );
            case "arrow-left":
                return (
                    <>
                        <path d="M19 12H5" />
                        <path d="M12 5l-7 7 7 7" />
                    </>
                );
            case "arrow-right":
                return (
                    <>
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                    </>
                );
            case "orders":
                // Клипборд + две строки списка
                return (
                    <>
                        <rect x="6" y="7" width="12" height="13" rx="2" />
                        <path d="M10 7V6a2 2 0 0 1 4 0v1" />
                        <path d="M9 12h6" />
                        <path d="M9 16h6" />
                    </>
                );
            default:
                return null;
        }
    })();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={sizePx}
            height={sizePx}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            role={title ? "img" : "presentation"}
            aria-label={title}
            aria-hidden={title ? undefined : true}
            {...rest}
        >
            {title ? <title>{title}</title> : null}
            {content}
        </svg>
    );
}
