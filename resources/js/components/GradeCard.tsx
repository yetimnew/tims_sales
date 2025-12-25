import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GradeCategoryView {
    key: string;
    label: string;
    description: string;
    detail?: string;
    score: number;
    weight: number | null;
    metrics: Array<{
        label: string;
        value: string;
    }>;
}

interface GradeRequirement {
    description: string;
    minimum: number;
    current: number;
    met: boolean;
}

interface GradeCardProps {
    status?: 'graded' | 'insufficient_data';
    message?: string;
    requirements?: GradeRequirement[];
    current?: Record<string, any>;
    overall: {
        score: number;
        letter: string;
    } | null;
    categories?: GradeCategoryView[];
    title?: string;
    description?: string;
}

function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat('en-ET', options).format(value);
}

export function GradeCard({
    status = 'graded',
    message,
    requirements = [],
    overall,
    categories = [],
    title = 'Grade',
    description = 'Weighted comparison against peers',
}: GradeCardProps) {
    if (status === 'insufficient_data') {
        return (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/30">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                    Grading Not Available Yet
                                </h3>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                    {message || 'Not enough data to calculate a grade.'}
                                </p>

                                {requirements.length > 0 && (
                                    <div className="bg-white dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-3">
                                        <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                                            Requirements for grading:
                                        </h4>
                                        <ul className="space-y-2">
                                            {requirements.map((req, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm">
                                                    {req.met ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                                                    )}
                                                    <span className="flex-1 text-amber-700 dark:text-amber-200">
                                                        {req.description}
                                                    </span>
                                                    <Badge
                                                        variant={req.met ? 'default' : 'secondary'}
                                                        className={
                                                            req.met
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                        }
                                                    >
                                                        {req.current} / {req.minimum}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                                    Grading will automatically be available once minimum requirements are met.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!overall) {
        return null;
    }

    return (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Overall grade
                        </p>
                        <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-100">
                            {overall.letter}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(overall.score, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {categories.map((category) => (
                        <div
                            key={category.key}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {category.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{category.description}</p>
                                    {category.detail && (
                                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                            {category.detail}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                        {formatNumber(category.score, { maximumFractionDigits: 0 })}%
                                    </p>
                                    {category.weight !== null && (
                                        <p className="text-xs text-muted-foreground">Weight {category.weight}%</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-indigo-500"
                                    style={{
                                        width: `${Math.min(Math.max(category.score, 0), 100)}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-3 grid gap-2 text-xs">
                                {category.metrics.map((metric) => (
                                    <div
                                        key={`${category.key}-${metric.label}`}
                                        className="flex items-center justify-between text-muted-foreground"
                                    >
                                        <span>{metric.label}</span>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                            {metric.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

