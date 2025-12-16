import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            <rect x={4} y={4} width={40} height={40} rx={12} fill="currentColor" opacity={0.12} />
            <path
                d="M16 16h16"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
            />
            <path
                d="M24 16v18"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
            />
            <path
                d="M16 30c0-3.314 2.239-5 6-5h7c3.761 0 7-2.686 7-6"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
            />
            <path
                d="M17 34c0 2.21 1.79 4 4 4h11"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.55}
            />
        </svg>
    );
}
