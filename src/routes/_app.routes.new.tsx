import {
	createFileRoute,
	Link,
	useNavigate,
} from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { supabase } from "#/lib/supabase";
import { useAuth } from "#/contexts/AuthContext";
import { getUserWithProfile } from "#/lib/session.functions";
import { requireApprovedOrganizer } from "#/lib/route-guards";
import { parseGpx } from "#/lib/gpx";
import { parseKml } from "#/lib/kml";
import { uploadRouteGpx } from "#/lib/storage";
import { RouteMap } from "#/components/RouteMap";
import { DraftActions } from "#/components/DraftActions";
import { useRouteDraft } from "#/hooks/useRouteDraft";
import { canTransition } from "#/lib/routeStatus";
import type { ParsedWaypoint } from "#/lib/gpx";
import {
	ArrowLeft,
	Plus,
	X,
	Upload,
	Loader2,
	Trash2,
	Navigation,
	Star,
	Flag,
	CircleDot,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useForm } from "@tanstack/react-form";

export const Route = createFileRoute("/_app/routes/new")({
	beforeLoad: async () => {
		const data = await getUserWithProfile();
		requireApprovedOrganizer(data?.profile);
	},
	component: NewRoutePage,
});

function NewRoutePage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const role = user?.profile?.role ?? "participant";
	const [newSkill, setNewSkill] = useState("");
	const [waypoints, setWaypoints] = useState<ParsedWaypoint[]>([]);
	const [trackPoints, setTrackPoints] = useState<[number, number][]>([]);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [gpxFile, setGpxFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		loadDraft,
		saveDraft,
		debouncedSave,
		clearDraft,
		lastSaved,
	} = useRouteDraft(user?.id);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			story: "",
			coverImage: "",
			difficulty: "",
			sourceUrl: "",
			skills: [] as string[],
		},
		onSubmit: async ({ value }) => {
			// Default submit is treated as "save draft" for expedition leads
			// and "publish" for organizers. Handled by DraftActions instead.
			await handleSubmit("draft");
		},
	});

	// Load draft on mount
	useEffect(() => {
		const draft = loadDraft();
		if (draft) {
			form.reset({
				name: draft.name,
				description: draft.description,
				story: draft.story,
				coverImage: draft.coverImage,
				difficulty: draft.difficulty,
				sourceUrl: draft.sourceUrl,
				skills: draft.skills,
			});
			setWaypoints(draft.waypoints);
			setTrackPoints(draft.trackPoints);
			if (draft.gpxFileName) {
				// Cannot restore actual File object, but we keep the name
				setGpxFile(null);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-save draft on changes (debounced)
	useEffect(() => {
		const values = form.getFieldValue;
		debouncedSave({
			name: form.getFieldValue("name"),
			description: form.getFieldValue("description"),
			story: form.getFieldValue("story"),
			coverImage: form.getFieldValue("coverImage"),
			difficulty: form.getFieldValue("difficulty"),
			sourceUrl: form.getFieldValue("sourceUrl"),
			skills: form.getFieldValue("skills"),
			waypoints,
			trackPoints,
			gpxFileName: gpxFile?.name ?? null,
		});
	}, [
		form.getFieldValue("name"),
		form.getFieldValue("description"),
		form.getFieldValue("story"),
		form.getFieldValue("coverImage"),
		form.getFieldValue("difficulty"),
		form.getFieldValue("sourceUrl"),
		form.getFieldValue("skills"),
		waypoints,
		trackPoints,
		gpxFile,
	]);

	const handleSubmit = async (
		targetStatus: "draft" | "pending_approval" | "published",
	) => {
		if (!canTransition("draft", targetStatus, role, true)) {
			alert("No tienes permiso para realizar esta acción");
			return;
		}

		setIsSubmitting(true);
		const value = {
			name: form.getFieldValue("name"),
			description: form.getFieldValue("description"),
			story: form.getFieldValue("story"),
			coverImage: form.getFieldValue("coverImage"),
			difficulty: form.getFieldValue("difficulty"),
			sourceUrl: form.getFieldValue("sourceUrl"),
			skills: form.getFieldValue("skills"),
		};

		let gpxFilePath: string | null = null;

		// Upload file if present
		if (gpxFile) {
			const tempRouteId = crypto.randomUUID();
			const { path, error } = await uploadRouteGpx(gpxFile, tempRouteId);
			if (error) {
				alert("Error al subir archivo: " + error.message);
				setIsSubmitting(false);
				return;
			}
			gpxFilePath = path;
		}

		const { data: route, error } = await supabase
			.from("routes")
			.insert({
				name: value.name.trim(),
				description: value.description.trim() || null,
				story: value.story.trim() || null,
				cover_image: value.coverImage.trim() || null,
				difficulty: value.difficulty || null,
				source_url: value.sourceUrl.trim() || null,
				gpx_file_path: gpxFilePath,
				gpx_parsed:
					waypoints.length > 0
						? {
								distance: calculateDistance(waypoints),
								elevation_gain: calculateElevationGain(waypoints),
							}
						: {},
				created_by: user?.id,
				status: targetStatus,
			})
			.select()
			.single();

		if (error || !route) {
			alert("Error al crear la ruta: " + (error?.message ?? "Desconocido"));
			setIsSubmitting(false);
			return;
		}

		// Insert waypoints
		if (waypoints.length > 0) {
			const { error: wpError } = await supabase
				.from("route_waypoints")
				.insert(
					waypoints.map((wp, index) => ({
						route_id: route.id,
						name: wp.name || `Waypoint ${index + 1}`,
						lat: wp.lat,
						lng: wp.lng,
						elevation: wp.elevation ?? null,
						order_index: index,
						type: wp.type,
					})),
				);
			if (wpError) {
				console.error("Error inserting waypoints:", wpError);
			}
		}

		if (value.skills.length > 0) {
			await supabase
				.from("route_skill_requirements")
				.insert(
					value.skills.map((skill) => ({
						route_id: route.id,
						skill_tag: skill,
					})),
				);
		}

		clearDraft();
		setIsSubmitting(false);
		navigate({ to: "/routes/$routeId", params: { routeId: route.id } });
	};

	const addSkill = () => {
		const trimmed = newSkill.trim();
		if (!trimmed) return;
		const current = form.getFieldValue("skills") || [];
		if (!current.includes(trimmed)) {
			form.setFieldValue("skills", [...current, trimmed]);
		}
		setNewSkill("");
	};

	const removeSkill = (skill: string) => {
		const current = form.getFieldValue("skills") || [];
		form.setFieldValue(
			"skills",
			current.filter((s) => s !== skill),
		);
	};

	const handleFileDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setUploadError(null);

			const files = e.dataTransfer.files;
			if (files.length === 0) return;
			await processFile(files[0]);
		},
		[],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			setUploadError(null);
			const file = e.target.files?.[0];
			if (!file) return;
			await processFile(file);
		},
		[],
	);

	const processFile = async (file: File) => {
		const ext = file.name.split(".").pop()?.toLowerCase();
		if (ext !== "gpx" && ext !== "kml") {
			setUploadError("Solo se permiten archivos .gpx y .kml");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setUploadError("El archivo no debe exceder 10 MB");
			return;
		}

		setIsUploading(true);
		try {
			const text = await file.text();
			let parsed: ParsedWaypoint[] = [];
			let trk: [number, number][] = [];

			if (ext === "gpx") {
				const gpxResult = parseGpx(text);
				parsed = gpxResult.waypoints;
				trk = gpxResult.trackPoints;
			} else {
				const kmlResult = parseKml(text);
				parsed = kmlResult.waypoints;
				trk = kmlResult.trackPoints;
			}

			setWaypoints(parsed);
			setTrackPoints(trk);
			setGpxFile(file);
			setUploadError(null);
		} catch (err) {
			setUploadError(
				err instanceof Error ? err.message : "Error al parsear el archivo",
			);
			setWaypoints([]);
			setTrackPoints([]);
			setGpxFile(null);
		} finally {
			setIsUploading(false);
		}
	};

	const updateWaypoint = (
		index: number,
		field: keyof ParsedWaypoint,
		value: string | number,
	) => {
		setWaypoints((prev) =>
			prev.map((wp, i) =>
				i === index
					? {
							...wp,
							[field]:
								field === "lat" || field === "lng" || field === "elevation"
									? Number(value)
									: value,
						}
					: wp,
			),
		);
	};

	const removeWaypoint = (index: number) => {
		setWaypoints((prev) => prev.filter((_, i) => i !== index));
	};

	const addWaypoint = () => {
		setWaypoints((prev) => [
			...prev,
			{
				lat: 0,
				lng: 0,
				name: `Waypoint ${prev.length + 1}`,
				type: "waypoint",
			},
		]);
	};

	const getWaypointIcon = (type: string) => {
		switch (type) {
			case "start":
				return <Navigation className="h-4 w-4 text-green-500" />;
			case "summit":
				return <Star className="h-4 w-4 text-red-500" />;
			case "end":
				return <Flag className="h-4 w-4 text-blue-500" />;
			default:
				return <CircleDot className="h-4 w-4 text-gray-500" />;
		}
	};

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<Button variant="ghost" size="sm" asChild className="gap-1">
				<Link to="/routes">
					<ArrowLeft className="h-4 w-4" /> Volver a rutas
				</Link>
			</Button>

			<div>
				<h1 className="text-3xl font-bold text-foreground">Nueva ruta</h1>
				<p className="text-muted-foreground">
					Registra una nueva ruta de montaña
				</p>
			</div>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					// Default action based on role
					if (role === "organizer") {
						handleSubmit("published");
					} else {
						handleSubmit("draft");
					}
				}}
			>
				<Card className="border-border shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Información básica</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="name"
							validators={{
								onSubmit: ({ value }) =>
									!value.trim() ? "El nombre es requerido" : undefined,
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Nombre de la ruta</Label>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Ej: Cumbre del Nevado del Tolima"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-xs text-destructive">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						/>
						<form.Field
							name="description"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Descripción</Label>
									<Textarea
										id={field.name}
										name={field.name}
										placeholder="Describe la ruta, dificultad, paisajes..."
										rows={4}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						/>
						<form.Field
							name="story"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Historia / Relato</Label>
									<Textarea
										id={field.name}
										name={field.name}
										placeholder="Comparte la historia o experiencia de esta ruta..."
										rows={4}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						/>
						<form.Field
							name="coverImage"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>URL de imagen de portada</Label>
									<Input
										id={field.name}
										name={field.name}
										placeholder="https://example.com/image.jpg"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						/>
						<form.Field
							name="difficulty"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Dificultad</Label>
									<Select
										value={field.state.value}
										onValueChange={(v) => field.handleChange(v)}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Selecciona dificultad" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="beginner">Principiante</SelectItem>
											<SelectItem value="intermediate">Intermedio</SelectItem>
											<SelectItem value="advanced">Avanzado</SelectItem>
											<SelectItem value="expert">Experto</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						/>
						<form.Field
							name="sourceUrl"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										URL fuente (Wikiloc u otro)
									</Label>
									<Input
										id={field.name}
										name={field.name}
										placeholder="https://wikiloc.com/..."
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				<Card className="border-border shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Archivo GPX / KML</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div
							className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50 cursor-pointer"
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleFileDrop}
							onClick={() => document.getElementById("gpx-upload")?.click()}
						>
							<div className="text-center">
								{isUploading ? (
									<Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
								) : (
									<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
								)}
								<p className="mt-2 text-sm font-medium">
									{gpxFile
										? gpxFile.name
										: "Arrastra un archivo GPX/KML o haz clic para subir"}
								</p>
								<p className="text-xs text-muted-foreground">
									.gpx, .kml (máx. 10 MB)
								</p>
							</div>
							<input
								id="gpx-upload"
								type="file"
								accept=".gpx,.kml"
								className="hidden"
								onChange={handleFileSelect}
							/>
						</div>
						{uploadError && (
							<p className="text-sm text-destructive">{uploadError}</p>
						)}
						{waypoints.length > 0 && (
							<div className="space-y-4">
								<div className="rounded-lg border border-border overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-8"></TableHead>
												<TableHead>Nombre</TableHead>
												<TableHead>Lat</TableHead>
												<TableHead>Lng</TableHead>
												<TableHead>Elevación</TableHead>
												<TableHead>Tipo</TableHead>
												<TableHead className="w-8"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{waypoints.map((wp, index) => (
												<TableRow key={index}>
													<TableCell>{getWaypointIcon(wp.type)}</TableCell>
													<TableCell>
														<Input
															value={wp.name || ""}
															onChange={(e) =>
																updateWaypoint(index, "name", e.target.value)
															}
															className="h-8"
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="any"
															value={wp.lat}
															onChange={(e) =>
																updateWaypoint(index, "lat", e.target.value)
															}
															className="h-8 w-24"
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="any"
															value={wp.lng}
															onChange={(e) =>
																updateWaypoint(index, "lng", e.target.value)
															}
															className="h-8 w-24"
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="any"
															value={wp.elevation ?? ""}
															placeholder="m"
															onChange={(e) =>
																updateWaypoint(
																	index,
																	"elevation",
																	e.target.value,
																)
															}
															className="h-8 w-20"
														/>
													</TableCell>
													<TableCell>
														<select
															value={wp.type}
															onChange={(e) =>
																updateWaypoint(index, "type", e.target.value)
															}
															className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
														>
															<option value="start">Inicio</option>
															<option value="waypoint">Waypoint</option>
															<option value="summit">Cumbre</option>
															<option value="end">Fin</option>
														</select>
													</TableCell>
													<TableCell>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => removeWaypoint(index)}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addWaypoint}
								>
									<Plus className="h-4 w-4 mr-1" /> Agregar waypoint
								</Button>

								<RouteMap
									waypoints={waypoints}
									trackPoints={trackPoints}
									height="300px"
								/>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Habilidades requeridas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Ej: Manejo de cuerdas"
								value={newSkill}
								onChange={(e) => setNewSkill(e.target.value)}
								onKeyDown={(e) =>
									e.key === "Enter" && (e.preventDefault(), addSkill())
								}
							/>
							<Button type="button" variant="secondary" onClick={addSkill}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{form.getFieldValue("skills")?.map((skill) => (
								<Badge key={skill} variant="secondary" className="gap-1 pr-1">
									{skill}
									<button
										type="button"
										onClick={() => removeSkill(skill)}
										className="ml-1 rounded-full p-0.5 hover:bg-muted"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				<DraftActions
					role={role}
					isSubmitting={isSubmitting}
					lastSaved={lastSaved}
					onSaveDraft={() => handleSubmit("draft")}
					onSubmitForApproval={() => handleSubmit("pending_approval")}
					onPublish={() => handleSubmit("published")}
					onClearDraft={() => {
						clearDraft();
						form.reset();
						setWaypoints([]);
						setTrackPoints([]);
						setGpxFile(null);
					}}
				/>
			</form>
		</div>
	);
}

function calculateDistance(waypoints: ParsedWaypoint[]): number {
	let distance = 0;
	for (let i = 1; i < waypoints.length; i++) {
		const a = waypoints[i - 1];
		const b = waypoints[i];
		const R = 6371; // km
		const dLat = ((b.lat - a.lat) * Math.PI) / 180;
		const dLon = ((b.lng - a.lng) * Math.PI) / 180;
		const lat1 = (a.lat * Math.PI) / 180;
		const lat2 = (b.lat * Math.PI) / 180;
		const a2 =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
		distance += R * c;
	}
	return Math.round(distance * 10) / 10;
}

function calculateElevationGain(waypoints: ParsedWaypoint[]): number {
	let gain = 0;
	for (let i = 1; i < waypoints.length; i++) {
		const a = waypoints[i - 1];
		const b = waypoints[i];
		if (
			a.elevation != null &&
			b.elevation != null &&
			b.elevation > a.elevation
		) {
			gain += b.elevation - a.elevation;
		}
	}
	return Math.round(gain);
}
