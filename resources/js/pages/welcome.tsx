import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, Route, ShieldCheck, Truck } from 'lucide-react';

interface Highlight {
    title: string;
    description: string;
    icon: LucideIcon;
}

const HIGHLIGHTS: Highlight[] = [
    {
        title: 'End-to-end Fleet Visibility',
        description: 'Monitor every truck, route, and dispatch window in one live control tower.',
        icon: Truck
    },
    {
        title: 'Operational Discipline',
        description: 'Standard operating procedures, digital waybills, and automated status updates.',
        icon: Route
    },
    {
        title: 'Safety & Compliance',
        description: 'Daily readiness checks, incident logging, and proactive risk mitigation.',
        icon: ShieldCheck
    },
    {
        title: 'Executive Intelligence',
        description: 'KPIs, variance alerts, and performance narratives for strategic steering.',
        icon: BarChart3
    }
];

const CORE_PURPOSE: string[] = [
    'Create a unified command centre that connects planning, dispatch, execution, and reporting.',
    'Provide a transparent view of fleet utilisation, driver readiness, and customer commitments.',
    'Empower leadership with reliable insights for tactical decisions and long-term optimisation.'
];

const Welcome = (): JSX.Element => {
    const { auth, name, quote } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);

    const heroQuote = quote?.message ?? 'Operational excellence happens when technology, process, and people execute with clarity.';
    const heroQuoteAuthor = quote?.author ?? 'Transport Operations Office';

    return (
        <div className="relative grid min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left side - Image and branding */}
            <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
                <img
                    src="/black.png"
                    alt="TIMS logistics operations"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/80 to-slate-900/60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.25),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(34,197,94,0.25),_transparent_55%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
                    <Link href={home()} className="flex items-center gap-3 text-base font-semibold uppercase tracking-[0.3em] text-slate-300 hover:text-slate-200 transition-colors">
                        <AppLogoIcon className="size-8 fill-current text-sky-400" />
                        {name || 'TIMS'}
                    </Link>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200">
                                Transport Information Management System
                            </span>
                            <h2 className="text-3xl font-semibold leading-snug text-white">
                                A command centre for modern transport operations
                            </h2>
                            <p className="max-w-xl text-sm text-slate-200">
                                TIMS unifies dispatch, compliance, safety, and analytics so your team makes confident, timely decisions.
                            </p>
                        </div>
                        <ul className="grid gap-4 text-sm text-slate-200">
                            {CORE_PURPOSE.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex size-2 rounded-full bg-sky-400 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {quote && (
                        <div className="space-y-3">
                            <blockquote className="text-lg font-medium text-white">
                                "{heroQuote}"
                            </blockquote>
                            <footer className="text-sm uppercase tracking-[0.35em] text-slate-400">
                                {heroQuoteAuthor}
                            </footer>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side - Main content */}
            <div className="relative flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/95 to-slate-900/80 lg:bg-none" />
                <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
                    {/* Mobile logo */}
                    <Link href={home()} className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-slate-300 lg:hidden">
                        <AppLogoIcon className="size-8 fill-current text-sky-400" />
                        {name || 'TIMS'}
                    </Link>

                    {/* Hero section */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                                Welcome to TIMS
                            </h1>
                            <p className="text-sm text-slate-300">
                                Coordinate heavy-transport operations with precision, accountability, and realtime visibility.
                            </p>
                        </div>

                        <Button asChild size="lg" className="w-full bg-sky-500 text-white hover:bg-sky-500/90">
                            <Link href={isAuthenticated ? dashboard.url() : login.url()}>
                                {isAuthenticated ? 'Go to dashboard' : 'Access TIMS'}
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                    </div>

                    {/* Capabilities */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">System capabilities</p>
                            <h2 className="text-xl font-semibold text-white">What TIMS enables</h2>
                        </div>
                        <div className="grid gap-4">
                            {HIGHLIGHTS.map(({ title, description, icon: Icon }) => (
                                <div key={title} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-300 flex-shrink-0">
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                                        <p className="text-xs leading-relaxed text-slate-300">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-xs text-center text-slate-400">
                            Transport Information Management System
                        </p>
                    </div>
                </div>
            </div>

            <Head title="Transport Information Management System" />
        </div>
    );
};

export default Welcome;
