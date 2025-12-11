import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, Route, ShieldCheck, Truck, Users } from 'lucide-react';

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

const CREATOR_PROFILE = {
    name: 'YETIMESHET TADESSE ESHETE',
    title: 'Lead Programmer & Software Engineer',
    location: 'Addis Ababa, Ethiopia',
    phones: ['0929 102 926', '0916 666 254'],
    emails: ['yetimnew@gmail.com', 'yetimtade@yahoo.com'],
    github: 'https://github.com/yetimnew',
    linkedin: 'https://linkedin.com/in/yetimeshet-tadesse'
};

const Welcome = (): JSX.Element => {
    const { auth, quote } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);

    const heroQuote = quote?.message ?? 'Operational excellence happens when technology, process, and people execute with clarity.';
    const heroQuoteAuthor = quote?.author ?? 'Transport Operations Office';

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <Head title="Transport Information Management System" />

            <div className="pointer-events-none absolute inset-0 -z-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18)_0%,_rgba(15,23,42,0.4)_45%,_rgba(2,6,23,0.95)_100%)]" />
                <div className="absolute inset-x-0 top-24 h-72 bg-gradient-to-r from-sky-500/30 via-transparent to-lime-400/20 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-8 sm:px-10 lg:px-12">
                <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-slate-300">
                        <span className="flex size-10 items-center justify-center rounded-md bg-sky-500/10 text-sky-300">TIMS</span>
                        <span>Transport Information Management System</span>
                    </div>

                    <nav className="flex items-center gap-2 text-sm text-slate-300">
                        {isAuthenticated ? (
                            <Link className="underline-offset-4 hover:text-slate-100 hover:underline" href={dashboard.url()}>
                                Dashboard
                            </Link>
                        ) : (
                            <Link className="underline-offset-4 hover:text-slate-100 hover:underline" href={login.url()}>
                                Sign in
                            </Link>
                        )}
                        <span className="mx-2 hidden text-slate-600 sm:block">|</span>
                        <Link className="underline-offset-4 hover:text-slate-100 hover:underline" href="#creator">
                            Creator
                        </Link>
                    </nav>
                </header>

                <main className="mt-16 flex flex-col gap-20">
                    <section className="flex flex-col gap-12 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="flex flex-col gap-8">
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-200 shadow-sm backdrop-blur">
                                <Users className="size-4 text-sky-400" />
                                <span>Powering national fleet coordination</span>
                            </div>
                            <div className="space-y-6">
                                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                    A command centre for modern transport operations.
                                </h1>
                                <p className="max-w-xl text-lg leading-relaxed text-slate-300">
                                    TIMS unifies dispatch, compliance, safety, and analytics so your team makes confident, timely decisions.
                                    Use this page to brief stakeholders, capture key goals, and direct users into the system.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button asChild size="lg" className="bg-sky-500 text-white hover:bg-sky-500/90">
                                    <Link href={isAuthenticated ? dashboard.url() : login.url()}>
                                        {isAuthenticated ? 'Go to dashboard' : 'Access TIMS'}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80">
                                    <Link href="#capabilities">Explore capabilities</Link>
                                </Button>
                            </div>
                            <figure className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-sm backdrop-blur">
                                <blockquote className="font-medium text-slate-100">“{heroQuote}”</blockquote>
                                <figcaption className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">{heroQuoteAuthor}</figcaption>
                            </figure>
                        </div>

                        <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-sky-900/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-900/90" />
                            <img
                                alt="TIMS flagship fleet operations"
                                src="/Designer.png"
                                className="h-full w-full object-cover opacity-80"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.25),_rgba(14,165,233,0)_60%)]" />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(34,197,94,0.25),_rgba(14,165,233,0)_60%)]" />
                            <div className="relative flex h-full flex-col justify-end gap-4 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-10">
                                <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Built for scale</p>
                                <p className="text-lg leading-relaxed text-slate-100">
                                    TIMS modernises heavy-transport management with a unified platform for planning, dispatch, realtime visibility, and executive reporting.
                                </p>
                                <ul className="grid gap-3 text-sm text-slate-200">
                                    {CORE_PURPOSE.map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <span className="mt-1 inline-block size-2 rounded-full bg-sky-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section id="capabilities" className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">System capabilities</p>
                            <h2 className="text-3xl font-semibold text-white sm:text-4xl">What TIMS enables for your operations</h2>
                            <p className="max-w-3xl text-base text-slate-300">
                                Tailor these highlights to mirror the exact transport workflows you run—fleet assignments, outsourcing cycles, safety checks, and stakeholder transparency.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {HIGHLIGHTS.map(({ title, description, icon: Icon }) => (
                                <article key={title} className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-7 shadow-sm backdrop-blur transition-transform hover:-translate-y-1">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
                                        <Icon className="size-5" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-300">{description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section id="creator" className="grid gap-8 lg:grid-cols-[0.75fr_1fr]">
                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-sky-900/30">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Project stewardship</p>
                            <h2 className="mt-3 text-3xl font-semibold text-white">Meet the creator</h2>
                            <p className="mt-4 text-sm text-slate-300">
                                TIMS is engineered as a mission-critical platform for Ethiopia&rsquo;s transport sector, combining dependable architecture with real operational insight.
                            </p>
                        </div>
                        <article className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-200 shadow-sm backdrop-blur">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Creator</p>
                                <p className="mt-4 text-2xl font-semibold text-white">{CREATOR_PROFILE.name}</p>
                                <p className="mt-2 text-sm text-slate-300">{CREATOR_PROFILE.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{CREATOR_PROFILE.location}</p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6 text-left text-sm text-slate-200">
                                <p>
                                    “I build transport information systems that deliver clarity, accountability, and measurable results for every stakeholder in the logistics value chain.”
                                </p>
                            </div>
                            <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
                                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Phone</p>
                                    <ul className="mt-3 space-y-2">
                                        {CREATOR_PROFILE.phones.map((phone) => {
                                            const sanitized = phone.replace(/\s+/g, '');

                                            return (
                                                <li key={phone}>
                                                    <a className="text-sky-300 hover:text-sky-200" href={`tel:${sanitized}`}>
                                                        {phone}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Email</p>
                                    <ul className="mt-3 space-y-2">
                                        {CREATOR_PROFILE.emails.map((mail) => (
                                            <li key={mail}>
                                                <a className="text-sky-300 hover:text-sky-200" href={`mailto:${mail}`}>
                                                    {mail}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5 sm:col-span-2">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Connect</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-4">
                                        <a className="text-sky-300 hover:text-sky-200" href={CREATOR_PROFILE.github} target="_blank" rel="noopener noreferrer">
                                            GitHub: github.com/yetimnew
                                        </a>
                                        <span className="text-slate-600">|</span>
                                        <a className="text-sky-300 hover:text-sky-200" href={CREATOR_PROFILE.linkedin} target="_blank" rel="noopener noreferrer">
                                            LinkedIn: linkedin.com/in/yetimeshet-tadesse
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </section>
                </main>

                <footer className="mt-24 border-t border-white/10 pt-8 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500">
                        <span>Transport Information Management System</span>
                        <span>Powered by TIMS Platform, Inertia, and React</span>
                        <span>Engineered by Yetimeshet Tadesse Eshete</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Welcome;
