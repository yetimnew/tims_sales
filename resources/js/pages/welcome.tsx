import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, Compass, GaugeCircle, Route, ShieldCheck, Truck, Users2 } from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface FocusArea {
    id: string;
    label: string;
    title: string;
    description: string;
    insights: string[];
    icon: LucideIcon;
}

const FOCUS_AREAS: FocusArea[] = [
    {
        id: 'dispatch',
        label: 'Dispatch & control',
        title: 'Dispatch & control desk',
        description: 'Monitor departures, returns, and live route adherence from one synchronized timeline.',
        insights: [
            'Project ETAs with live traffic overlays and corridor intel.',
            'Trigger corrective playbooks the moment variance crosses thresholds.',
            'Share secure snapshots with corridor leaders in one click.',
        ],
        icon: Compass,
    },
    {
        id: 'performance',
        label: 'Performance pulse',
        title: 'Performance pulse board',
        description: 'Surface KPIs, trend deviations, and customer commitments before they become escalations.',
        insights: [
            'Compare planned vs actual cycle times across corridors.',
            'Spot outliers with auto-grouped variance digests.',
            'Push executive summaries to leadership channels instantly.',
        ],
        icon: GaugeCircle,
    },
    {
        id: 'people',
        label: 'People readiness',
        title: 'People readiness suite',
        description: 'Coordinate driver availability, compliance, and rest resets with proactive alerts.',
        insights: [
            'Track certifications and readiness in a real-time roster.',
            'Lock-in backup drivers before a shift falls behind.',
            'Escalate wellbeing issues to the right supervisor immediately.',
        ],
        icon: Users2,
    },
];

const CORE_PURPOSE: string[] = [
    'Create a unified command centre that connects planning, dispatch, execution, and reporting.',
    'Provide a transparent view of fleet utilisation, driver readiness, and customer commitments.',
    'Empower leadership with reliable insights for tactical decisions and long-term optimisation.'
];

const Welcome = (): JSX.Element => {
    const { auth, name, quote } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);
    const defaultArea = useMemo(() => FOCUS_AREAS[0], []);
    const [activeArea, setActiveArea] = useState(defaultArea);

    const heroQuote = quote?.message ?? 'Operational excellence happens when technology, process, and people execute with clarity.';
    const heroQuoteAuthor = quote?.author ?? 'Transport Operations Office';

    return (
        <div className="relative grid min-h-screen w-full overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
                <img
                    src="/black.png"
                    alt="TIMS logistics operations"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/55 to-emerald-50/45 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-900/60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,_rgba(14,165,233,0.25),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_85%,_rgba(34,197,94,0.25),_transparent_60%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-12 text-slate-800 xl:p-16 dark:text-slate-100">
                    <Link href={home()} className="flex items-center gap-3 text-base font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        <AppLogoIcon className="size-8 fill-current text-sky-500 dark:text-sky-400" />
                        {name || 'TIMS'}
                    </Link>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                                Transport Information Management System
                            </span>
                            <h2 className="text-3xl font-semibold leading-snug text-slate-900 dark:text-white">
                                A command centre for modern transport operations
                            </h2>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-200">
                                TIMS unifies dispatch, compliance, safety, and analytics so your team makes confident, timely decisions.
                            </p>
                        </div>
                        <ul className="grid gap-4 text-sm text-slate-600 dark:text-slate-200">
                            {CORE_PURPOSE.map(item => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex size-2 flex-shrink-0 rounded-full bg-sky-500" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {quote && (
                        <div className="space-y-3 text-slate-700 dark:text-slate-200">
                            <blockquote className="text-lg font-medium">
                                “{heroQuote}”
                            </blockquote>
                            <footer className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                                {heroQuoteAuthor}
                            </footer>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-100 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/80 lg:bg-none" />
                <div className="relative z-10 flex w-full max-w-md flex-col gap-10">
                    <Link href={home()} className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white lg:hidden">
                        <AppLogoIcon className="size-8 fill-current text-sky-500 dark:text-sky-400" />
                        {name || 'TIMS'}
                    </Link>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[0.65rem] uppercase tracking-[0.4em] text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
                                Unified control tower
                            </span>
                            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                                Welcome to TIMS
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Coordinate heavy-transport operations with precision, accountability, and realtime visibility.
                            </p>
                        </div>

                        <Button asChild size="lg" className="w-full rounded-xl bg-sky-500 text-white shadow-md shadow-sky-200/60 transition hover:bg-sky-500/90 dark:bg-sky-500 dark:shadow-none">
                            <Link href={isAuthenticated ? dashboard.url() : login.url()}>
                                {isAuthenticated ? 'Go to dashboard' : 'Access TIMS'}
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Command centre modes</p>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pair the console to your shift</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {FOCUS_AREAS.map(area => {
                                const isActive = activeArea.id === area.id;
                                return (
                                    <button
                                        key={area.id}
                                        type="button"
                                        onClick={() => setActiveArea(area)}
                                        aria-pressed={isActive}
                                        className={`flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                                            isActive
                                                ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:border-sky-400 dark:bg-sky-400/10 dark:text-sky-200'
                                                : 'border-slate-200/80 bg-white/80 text-slate-600 hover:border-sky-400 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                                        }`}
                                    >
                                        <area.icon className={`size-4 ${isActive ? 'text-sky-600 dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'}`} />
                                        <span>{area.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 text-sm text-slate-700 shadow-sm shadow-slate-200/40 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:shadow-none">
                            <div className="flex items-start gap-3">
                                <activeArea.icon className="mt-1 size-6 text-sky-500 dark:text-sky-300" />
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{activeArea.title}</h3>
                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{activeArea.description}</p>
                                </div>
                            </div>
                            <ul className="mt-4 grid gap-2">
                                {activeArea.insights.map(insight => (
                                    <li key={insight} className="flex items-start gap-2">
                                        <span className="mt-1 inline-flex size-2 flex-shrink-0 rounded-full bg-sky-400 dark:bg-sky-300" />
                                        <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">System capabilities</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What TIMS enables</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {HIGHLIGHTS.map(({ title, description, icon: Icon }) => (
                                <div key={title} className="flex gap-4 rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-200/40 transition hover:shadow-md dark:border-white/10 dark:bg-slate-900/75 dark:shadow-none">
                                    <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-300">
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-200/80 pt-4 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                        Transport Information Management System
                    </div>
                </div>
            </div>

            <Head title="Transport Information Management System" />
        </div>
    );
};

export default Welcome;
