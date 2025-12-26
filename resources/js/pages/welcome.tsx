import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart3, Lock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const Welcome = (): JSX.Element => {
    const { auth, name } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950">
            <Head title="Welcome to TIMS" />

            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
                <img
                    src="/black.png"
                    alt="TIMS Fleet Operations"
                    className="h-full w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-blue-950/95" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.15),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_rgba(14,165,233,0.1),_transparent_50%)]" />
            </div>

            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            {/* Content Container - Centered */}
            <div className={`relative z-10 flex h-full items-center justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="max-w-5xl px-8 text-center">
                    {/* Logo */}
                    <Link href={home()} className="inline-flex items-center gap-3 mb-12 group">
                        <AppLogoIcon className="h-16 fill-current text-sky-400 transition-transform group-hover:scale-110 duration-300" />
                    </Link>

                    {/* Main Heading */}
                    <div className="space-y-6 mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 backdrop-blur-sm mb-6">
                            <Sparkles className="h-4 w-4 text-sky-400" />
                            <span className="text-sm font-semibold text-sky-300 uppercase tracking-wider">
                                Transport Information Management System
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-extrabold text-white leading-tight mb-6">
                            Command Your
                            <span className="block bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                Fleet Operations
                            </span>
                        </h1>

                        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Unified dispatch control, real-time fleet visibility, and executive intelligence
                            for modern transport operations.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button
                            asChild
                            size="lg"
                            className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-2xl shadow-sky-500/30 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-sky-500/50"
                        >
                            <Link href={isAuthenticated ? dashboard.url() : login.url()}>
                                <div className="flex items-center gap-3">
                                    {isAuthenticated ? (
                                        <>
                                            <BarChart3 className="h-5 w-5" />
                                            <span>Open Dashboard</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5" />
                                            <span>Access Control Tower</span>
                                        </>
                                    )}
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        </Button>
                    </div>

                    {/* Feature Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                        {[
                            'Live Fleet Tracking',
                            'Dispatch Control',
                            'Performance Analytics',
                            'Safety Compliance',
                        ].map((feature, index) => (
                            <div
                                key={feature}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-sky-500/30"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                <div className="h-2 w-2 rounded-full bg-sky-400" />
                                <span className="text-slate-300 font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Badge */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="px-6 py-3 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-md">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Powered by {name || 'TIMS'} • Yetimeshet Tadesse • 2025
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Welcome;
