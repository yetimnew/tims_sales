import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { validateCargoType, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Boxes, ClipboardCheck, AlertTriangle, Shield, Save, ArrowLeft, ArrowUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Cargo Types',
		href: '/cargo-types',
	},
	{
		title: 'Create',
		href: '/cargo-types/create',
	},
];

interface CategoryOption {
	value: string;
	label: string;
}

interface CargoTypesCreateProps {
	categories: CategoryOption[];
}

type CargoTypeCreateForm = {
	name: string;
	category: string;
	weight_per_cubic_meter: string;
	handling_requirements: string;
	safety_requirements: string;
	requires_special_equipment: boolean;
};

export default function CargoTypesCreate({ categories }: CargoTypesCreateProps) {
	const categoryOptions: CategoryOption[] = categories.length ? categories : [];

	const { data, setData, post, processing, errors } = useForm<CargoTypeCreateForm>({
		name: '',
		category: categoryOptions?.[0]?.value ?? '',
		weight_per_cubic_meter: '',
		handling_requirements: '',
		safety_requirements: '',
		requires_special_equipment: false,
	});

	const { toast } = useToast();
	const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
	const [isDirty, setIsDirty] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const scrollContainerRef = useRef<HTMLFormElement | null>(null);

	const mergedErrors = useMemo(
		() => ({ ...frontendErrors, ...errors }) as Record<string, string | string[]>,
		[frontendErrors, errors]
	);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		const handleScroll = () => {
			setShowScrollTop(container.scrollTop > 240);
		};

		handleScroll();
		container.addEventListener('scroll', handleScroll);

		return () => {
			container.removeEventListener('scroll', handleScroll);
		};
	}, []);

	useEffect(() => {
		if (!data.category && categoryOptions[0]) {
			setData('category', categoryOptions[0].value);
		}
	}, [categoryOptions, data.category, setData]);

	useEffect(() => {
		if (Object.keys(errors).length === 0) {
			return;
		}

		const message = Object.values(errors)
			.map((value) => (Array.isArray(value) ? value.join(', ') : value))
			.filter(Boolean)
			.join(', ');

		toast({
			variant: 'destructive',
			title: 'Validation error',
			description: message || 'Please address the highlighted fields before saving.',
		});
	}, [errors, toast]);

	const handleScrollToTop = () => {
		scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const validateField = (fieldName: keyof typeof data, value: string | boolean) => {
		const payload = { ...data, [fieldName]: value };
		const validationErrors = validateCargoType(payload);
		const fieldError = validationErrors[fieldName];

		setFrontendErrors((prev) => {
			const next = { ...prev };
			if (fieldError) {
				next[fieldName] = fieldError;
			} else {
				delete next[fieldName];
			}
			return next;
		});
	};

	const handleFieldChange = (fieldName: keyof typeof data, value: string, shouldValidate = true) => {
		setData(fieldName, value);
		setIsDirty(true);

		if (shouldValidate) {
			validateField(fieldName, value);
		} else {
			setFrontendErrors((prev) => {
				const next = { ...prev };
				delete next[fieldName];
				return next;
			});
		}
	};

	const handleCheckboxChange = (checked: boolean) => {
		setData('requires_special_equipment', checked);
		setIsDirty(true);
		validateField('requires_special_equipment', checked);
	};

	const submit: FormEventHandler = (event) => {
		event.preventDefault();

		const validationResult = validateCargoType({ ...data });
		if (Object.keys(validationResult).length > 0) {
			setFrontendErrors(validationResult);
			toast({
				variant: 'destructive',
				title: 'Validation error',
				description: 'Please resolve the highlighted issues before saving.',
			});
			return;
		}

		post('/cargo-types', {
			preserveScroll: true,
			onSuccess: () => {
				setFrontendErrors({});
				setIsDirty(false);
			},
		});
	};

	const getFieldError = (fieldName: keyof typeof data) => {
		const value = mergedErrors[fieldName];
		if (!value) {
			return '';
		}
		return Array.isArray(value) ? value.join(', ') : value;
	};

	const hasErrors = Object.keys(mergedErrors).length > 0;

	const densityInsight = useMemo(() => {
		const value = Number.parseFloat(data.weight_per_cubic_meter);
		if (!Number.isFinite(value) || value <= 0) {
			return null;
		}
		if (value >= 1200) {
			return { label: 'Heavy Density', tone: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' };
		}
		if (value >= 600) {
			return { label: 'Medium Density', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' };
		}
		return { label: 'Light Density', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
	}, [data.weight_per_cubic_meter]);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Create Cargo Type" />
			<div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
				<Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
					<CardHeader className="px-6 pb-0">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<div className="rounded-xl bg-rose-100 p-2 text-rose-600 shadow-sm dark:bg-rose-900/30 dark:text-rose-300">
									<Package className="h-5 w-5" />
								</div>
								<div>
									<CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
										Register Cargo Type
									</CardTitle>
									<CardDescription className="text-sm text-slate-600 dark:text-slate-400">
										Standardize cargo classifications to improve dispatch planning and safety compliance.
									</CardDescription>
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<Button variant="ghost" size="sm" asChild>
									<Link href="/cargo-types">
										<ArrowLeft className="mr-2 h-4 w-4" />
										Back to Cargo Types
									</Link>
								</Button>
								{isDirty && (
									<div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
										<Save className="h-3 w-3" />
										Unsaved Changes
									</div>
								)}
								<div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
									<div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
									Inventory Standards
								</div>
							</div>
						</div>
					</CardHeader>

					<CardContent className="flex flex-1 flex-col overflow-hidden p-0">
						{hasErrors && (
							<div className="mx-6 mt-6">
								<Alert variant="destructive" className="border-red-500/50">
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
								</Alert>
							</div>
						)}

						<form
							ref={scrollContainerRef}
							onSubmit={submit}
							className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
						>
							<section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
										<Boxes className="h-4 w-4" />
									</div>
									<div>
										<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cargo Overview</h2>
										<p className="text-sm text-muted-foreground">Define the core identity and classification for this cargo type.</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Cargo Name <span className="text-red-500">*</span>
										</Label>
										<Input
											id="name"
											type="text"
											value={data.name}
											onChange={(event) => handleFieldChange('name', event.target.value)}
											placeholder="e.g., Bagged Cement"
											maxLength={255}
											className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
										/>
										{getFieldError('name') && (
											<p className="flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('name')}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Category <span className="text-red-500">*</span>
										</Label>
										<Select
											value={data.category}
											onValueChange={(value) => handleFieldChange('category', value)}
											disabled={!categoryOptions.length}
										>
											<SelectTrigger
												id="category"
												className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('category') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
											>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent className="bg-white shadow-lg dark:bg-slate-800">
												{categoryOptions.map((option: CategoryOption) => (
													<SelectItem
														key={option.value}
														value={option.value}
														className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{!categoryOptions.length && (
											<p className="text-sm text-muted-foreground">No categories available. Please add at least one category in the backend.</p>
										)}
										{getFieldError('category') && (
											<p className="flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('category')}
											</p>
										)}
									</div>

									<div className="md:col-span-2">
										<div className="flex flex-col gap-3 rounded-lg border border-dashed border-rose-300/60 bg-rose-50/70 p-4 dark:border-rose-500/40 dark:bg-rose-500/10 md:flex-row md:items-center md:justify-between">
											<div className="flex items-start gap-3">
												<div className="rounded-full bg-white/90 p-2 text-rose-600 shadow-sm dark:bg-white/10 dark:text-rose-300">
													<Package className="h-4 w-4" />
												</div>
												<div>
													<p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Special Equipment Requirement</p>
													<p className="text-xs text-rose-700/80 dark:text-rose-200/80">
														Flag cargos that need forklifts, refrigeration, or dedicated containment.
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Checkbox
													id="requires_special_equipment"
													checked={data.requires_special_equipment}
													onCheckedChange={(checked) => handleCheckboxChange(Boolean(checked))}
													className="border-slate-300 text-rose-600 focus-visible:ring-rose-500 dark:border-slate-600"
												/>
												<Label htmlFor="requires_special_equipment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
													Requires special equipment
												</Label>
												<Badge variant="secondary" className={`border-0 ${data.requires_special_equipment ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'}`}>
													{data.requires_special_equipment ? 'Flagged' : 'Standard Handling'}
												</Badge>
											</div>
										</div>
										{getFieldError('requires_special_equipment') && (
											<p className="mt-2 flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('requires_special_equipment')}
											</p>
										)}
									</div>
								</div>
							</section>

							<section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
										<ClipboardCheck className="h-4 w-4" />
									</div>
									<div>
										<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Specifications</h2>
										<p className="text-sm text-muted-foreground">Capture physical characteristics that influence transport planning.</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="weight_per_cubic_meter" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Weight per m³ (kg)
										</Label>
										<Input
											id="weight_per_cubic_meter"
											type="number"
											inputMode="decimal"
											step="0.01"
											value={data.weight_per_cubic_meter}
											onChange={(event) => handleFieldChange('weight_per_cubic_meter', event.target.value)}
											placeholder="0.00"
											className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('weight_per_cubic_meter') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
										/>
										{getFieldError('weight_per_cubic_meter') && (
											<p className="flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('weight_per_cubic_meter')}
											</p>
										)}
										<p className="text-xs text-muted-foreground">Optional but improves stacking and load balancing recommendations.</p>
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Density Insight</Label>
										<div className="flex h-12 items-center justify-between rounded-lg border border-dashed border-blue-200/70 bg-blue-50/70 px-4 text-sm dark:border-blue-500/40 dark:bg-blue-500/10">
											<span className="text-slate-600 dark:text-slate-300">Auto assessment</span>
											<Badge variant="secondary" className={`border-0 ${densityInsight ? densityInsight.tone : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
												{densityInsight ? densityInsight.label : 'Awaiting input'}
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">Helps dispatchers assign appropriate trailers and stacking strategy.</p>
									</div>
								</div>
							</section>

							<section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
										<Shield className="h-4 w-4" />
									</div>
									<div>
										<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Handling &amp; Safety Guidance</h2>
										<p className="text-sm text-muted-foreground">Document the operational and compliance instructions for crews.</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="handling_requirements" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Handling Requirements
										</Label>
										<Textarea
											id="handling_requirements"
											value={data.handling_requirements}
											onChange={(event) => handleFieldChange('handling_requirements', event.target.value, false)}
											placeholder="Describe handling instructions, stacking limits, protective materials, etc."
											rows={5}
											className="bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
										/>
										{getFieldError('handling_requirements') && (
											<p className="flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('handling_requirements')}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="safety_requirements" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Safety Requirements
										</Label>
										<Textarea
											id="safety_requirements"
											value={data.safety_requirements}
											onChange={(event) => handleFieldChange('safety_requirements', event.target.value, false)}
											placeholder="Summarize PPE, regulatory compliance, or incident response notes."
											rows={5}
											className="bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
										/>
										{getFieldError('safety_requirements') && (
											<p className="flex items-center gap-1 text-sm text-red-500">
												<AlertTriangle className="h-3 w-3" />
												{getFieldError('safety_requirements')}
											</p>
										)}
									</div>
								</div>
							</section>

							<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
								<div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 md:flex-row md:items-center md:gap-4">
									<div className="flex items-center gap-2">
										<span className="text-red-500">*</span>
										<span>Required fields</span>
									</div>
									<div className="flex items-center gap-2">
										<ClipboardCheck className="h-3 w-3" />
										<span>Accurate cargo profiles keep routing, costing, and compliance aligned.</span>
									</div>
								</div>
								<div className="flex gap-3">
									<Button type="button" variant="outline" asChild className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700">
										<Link href="/cargo-types">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={processing || hasErrors}
										className="min-w-[160px] bg-gradient-to-r from-rose-600 to-rose-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-rose-800 hover:shadow-xl"
									>
										{processing ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
												Saving...
											</>
										) : (
											<>
												<Shield className="mr-2 h-4 w-4" />
												Save Cargo Type
											</>
										)}
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>

				{showScrollTop && (
					<Button
						type="button"
						onClick={handleScrollToTop}
						className="fixed bottom-6 right-6 z-50 shadow-lg"
						variant="secondary"
						aria-label="Scroll to top"
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
				)}
			</div>
		</AppLayout>
	);
}
