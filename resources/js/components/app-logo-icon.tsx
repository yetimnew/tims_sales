import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<SVGSVGElement>) {
    const { className, ...restProps } = props;

    // Inline SVG that responds to dark mode using CSS custom properties
    return (
        <svg
            viewBox="0 0 320 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            className={className}
            preserveAspectRatio="xMidYMid meet"
            {...restProps}
        >
            <defs>
                <style>
                    {`
                        .logo-text {
                            font-family: 'Instrument Sans', 'Segoe UI', Arial, sans-serif;
                        }
                        .logo-main-text {
                            fill: var(--foreground, rgb(15, 23, 42));
                        }
                        .logo-sub-text {
                            fill: var(--muted-foreground, rgb(71, 85, 105));
                        }
                    `}
                </style>
            </defs>
            <image
                href="/favicon.ico"
                x="0"
                y="0"
                width="80"
                height="80"
                preserveAspectRatio="xMidYMid meet"
            />
            <text
                x="100"
                y="46"
                className="logo-text logo-main-text"
                style={{ fontWeight: 600, fontSize: 36 }}
            >
                TIMS
            </text>
            <text
                x="100"
                y="64"
                className="logo-text logo-sub-text"
                style={{ fontWeight: 500, fontSize: 16 }}
            >
                Transport Integrated Management System
            </text>
        </svg>
    );
}

