import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8c0-1.1046.8954-2 2-2h24c1.1046 0 2 .8954 2 2v2c0 1.1046-.8954 2-2 2h-9v18c0 1.1046-.8954 2-2 2h-8c-1.1046 0-2-.8954-2-2V12H8c-1.1046 0-2-.8954-2-2V8Z" />
            <path d="M12 26c0-1.1046.8954-2 2-2h12c1.1046 0 2 .8954 2 2v2c0 1.1046-.8954 2-2 2H14c-1.1046 0-2-.8954-2-2v-2Z" opacity={0.7} />
        </svg>
    );
}
