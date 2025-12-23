import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const AUTH_FEATURES = [
    'Live control over fleet dispatch and return cycles.',
    'Continuous visibility into driver readiness and compliance.',
    'Executive-grade analytics for corridor and customer performance.'
];

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid min-h-screen w-full overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
                <img
                    src="/black.png"
                    alt="TIMS logistics operations"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/55 to-emerald-50/45 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-900/60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.25),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(34,197,94,0.25),_transparent_60%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-12 text-slate-800 xl:p-16 dark:text-slate-100">
                    <Link href={home()} className="flex items-center gap-3 text-base font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        <AppLogoIcon className="size-8 fill-current text-sky-500 dark:text-sky-400" />
                        {name}
                    </Link>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                                Transport Information Management System
                            </span>
                            <h2 className="text-3xl font-semibold leading-snug text-slate-900 dark:text-white">
                                Coordinate heavy-transport operations with precision, accountability, and realtime visibility.
                            </h2>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-200">
                                TIMS brings planners, controllers, and leadership onto one secure control tower. Log in to pick up where you left off and keep cargo moving.
                            </p>
                        </div>
                        <ul className="grid gap-4 text-sm text-slate-600 dark:text-slate-200">
                            {AUTH_FEATURES.map(feature => (
                                <li key={feature} className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex size-2 rounded-full bg-sky-500" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {quote && (
                        <div className="space-y-3 text-slate-700 dark:text-slate-200">
                            <blockquote className="text-lg font-medium">
                                “{quote.message}”
                            </blockquote>
                            <footer className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                                {quote.author}
                            </footer>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-100 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/80 lg:bg-none" />
                <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
                    <Link href={home()} className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white lg:hidden">
                        <AppLogoIcon className="size-8 fill-current text-sky-500 dark:text-sky-400" />
                        {name}
                    </Link>
                    <div className="space-y-3 text-left">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
