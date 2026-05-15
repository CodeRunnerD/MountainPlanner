import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	CircleDot,
	Download,
	Flag,
	Layers,
	Loader2,
	Map as MapIcon,
	Mountain,
	Navigation,
	Star,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { RouteMap } from "#/components/RouteMap";
import { DraftBadge } from "#/components/DraftBadge";
import { ApprovalPanel } from "#/components/ApprovalPanel";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { ParsedWaypoint } from "#/lib/gpx";
import { downloadRouteFile } from "#/lib/storage";
import { supabase } from "#/lib/supabase";
import type { Tables } from "#/types/database.types";
import { useAuth } from "#/contexts/AuthContext";
import { useIsOrganizer } from "./_app";

type Route = Tables<"routes">;
type RouteWaypoint = Tables<"route_waypoints">;
type RouteSkill = Tables<"route_skill_requirements">;
type Profile = Tables<"profiles">;
type Trip = Tables<"trips">;

export const Route = createFileRoute("/_app/routes/$routeId")({
	component: RouteDetailPage,
});

function RouteDetailPage() {
	const { routeId } = Route.useParams();
	const [route, setRoute] = useState<Route | null>(null);
	const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
	const [parsedWaypoints, setParsedWaypoints] = useState<ParsedWaypoint[]>([]);
	const [skills, setSkills] = useState<RouteSkill[]>([]);
	const [creator, setCreator] = useState<Profile | null>(null);
	const [tripsUsing, setTripsUsing] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [downloading, setDownloading] = useState(false);
	const isOrganizer = useIsOrganizer();
	const { user } = useAuth();
	const role = user?.profile?.role ?? "participant";
	const isCreator = route?.created_by === user?.id;

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const { data: r, error: routeError } = await supabase
					.from("routes")
					.select("*")
					.eq("id", routeId)
					.single();
				if (routeError) {
					console.error("Error loading route:", routeError);
					setError(
						routeError.code === "PGRST116"
							? "Ruta no encontrada o no tienes permiso para verla"
							: `Error al cargar la ruta: ${routeError.message}`,
					);
					setLoading(false);
					return;
				}
				if (!r) {
					setError("Ruta no encontrada");
					setLoading(false);
					return;
				}
				setRoute(r);

				const [
					{ data: w, error: wpError },
					{ data: s, error: skillError },
					{ data: c },
					{ data: t, error: tripError },
				] = await Promise.all([
					supabase
						.from("route_waypoints")
						.select("*")
						.eq("route_id", routeId)
						.order("order_index", { ascending: true }),
					supabase
						.from("route_skill_requirements")
						.select("*")
						.eq("route_id", routeId),
					r.created_by
						? supabase
								.from("profiles")
								.select("*")
								.eq("id", r.created_by)
								.single()
						: Promise.resolve({ data: null, error: null }),
					supabase.from("trips").select("*").eq("route_id", routeId),
				]);

				if (wpError) {
					console.error("Error loading waypoints:", wpError);
				}
				if (skillError) {
					console.error("Error loading skills:", skillError);
				}
				if (tripError) {
					console.error("Error loading trips:", tripError);
				}

				setWaypoints(w || []);
				setSkills(s || []);
				setCreator(c);
				setTripsUsing(t || []);

				const pWaypoints: ParsedWaypoint[] =
					w?.map((wp) => ({
						lat: wp.lat,
						lng: wp.lng,
						elevation: wp.elevation ?? undefined,
						name: wp.name,
						type: wp.type,
					})) || [];
				setParsedWaypoints(pWaypoints);
			} catch (err) {
				console.error("Unexpected error loading route detail:", err);
				setError(
					"Error inesperado al cargar el detalle de la ruta. Por favor intenta de nuevo.",
				);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [routeId]);

	const handleDownload = async () => {
		if (!route?.gpx_file_path) return;
		setDownloading(true);
		try {
			const blob = await downloadRouteFile(route.gpx_file_path);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const filename = route.gpx_file_path.split("/").pop() || "route.gpx";
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			alert(
				"Error al descargar: " +
					(err instanceof Error ? err.message : "Desconocido"),
			);
		} finally {
			setDownloading(false);
		}
	};

	const handleStatusChange = (newStatus: Route["status"]) => {
		setRoute((prev) => (prev ? { ...prev, status: newStatus } : prev));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error || !route) {
		return (
			<div className="text-center py-12 space-y-4">
				<p className="text-destructive font-medium">
					{error ?? "Ruta no encontrada"}
				</p>
				<Button asChild variant="link">
					<Link to="/routes">Volver a rutas</Link>
				</Button>
			</div>
		);
	}

	const canEditRoute =
		isOrganizer &&
		(role === "organizer" ||
			(role === "expedition_lead" &&
				isCreator &&
				route.status !== "published"));

	const getWaypointIcon = (type: string) => {
		switch (type) {
			case "start":
				return <Navigation className="h-4 w-4 text-primary" />;
			case "summit":
				return <Star className="h-4 w-4 text-accent" />;
			case "end":
				return <Flag className="h-4 w-4 text-destructive" />;
			default:
				return <CircleDot className="h-4 w-4 text-muted-foreground" />;
		}
	};

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<Button variant="ghost" size="sm" asChild className="gap-1">
				<Link to="/routes">
					<ArrowLeft className="h-4 w-4" /> Volver a rutas
				</Link>
			</Button>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold text-foreground">
							{route.name}
						</h1>
						<DraftBadge status={route.status} />
					</div>
					<p className="text-muted-foreground mt-1">{route.description}</p>
				</div>
				<div className="flex gap-2 flex-wrap">
					{canEditRoute && (
						<Button variant="outline" asChild>
							<Link
								to="/routes/$routeId/edit"
								params={{ routeId: route.id }}
							>
								Editar
							</Link>
						</Button>
					)}
					{route.gpx_file_path && (
						<Button
							variant="outline"
							onClick={handleDownload}
							disabled={downloading}
						>
							{downloading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							Descargar GPX/KML
						</Button>
					)}
					<Button asChild>
						<Link to="/trips/new" search={{ routeId: route.id }}>
							Crear salida
						</Link>
					</Button>
				</div>
			</div>

			{role === "organizer" &&
				route.status === "pending_approval" && (
					<ApprovalPanel
						route={route}
						onStatusChange={handleStatusChange}
					/>
				)}

			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-border shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<TrendingUp className="h-5 w-5 text-primary" />
						<div>
							<p className="text-lg font-bold text-foreground">
								{(route.gpx_parsed as any)?.distance ?? 0} km
							</p>
							<p className="text-xs text-muted-foreground">Distancia</p>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<Layers className="h-5 w-5 text-secondary" />
						<div>
							<p className="text-lg font-bold text-foreground">
								{(route.gpx_parsed as any)?.elevation_gain ?? 0} m
							</p>
							<p className="text-xs text-muted-foreground">
								Desnivel positivo
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<Mountain className="h-5 w-5 text-accent" />
						<div>
							<p className="text-lg font-bold text-foreground">
								{waypoints.find((w) => w.type === "summit")?.elevation ??
									"—"}{" "}
								m
							</p>
							<p className="text-xs text-muted-foreground">Cumbre</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{parsedWaypoints.length > 0 && (
				<Card className="border-border shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<MapIcon className="h-5 w-5 text-primary" />
							Mapa de la ruta
						</CardTitle>
					</CardHeader>
					<CardContent>
						<RouteMap
							waypoints={parsedWaypoints}
							trackPoints={parsedWaypoints.map((wp) => [
								wp.lat,
								wp.lng,
							])}
							height="400px"
						/>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-border shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<MapIcon className="h-5 w-5 text-primary" />
							Waypoints
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{waypoints.map((wp) => (
							<div
								key={wp.id}
								className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3"
							>
								{getWaypointIcon(wp.type)}
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm text-foreground truncate">
										{wp.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{wp.elevation ? `${wp.elevation} m` : "—"}
									</p>
								</div>
								<Badge variant="outline" className="text-xs capitalize">
									{wp.type}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card className="border-border shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">
								Habilidades requeridas
							</CardTitle>
						</CardHeader>
						<CardContent>
							{skills.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Sin requisitos técnicos
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{skills.map((s) => (
										<Badge key={s.id} variant="secondary">
											{s.skill_tag}
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-border shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Información</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Creado por</span>
								<span className="font-medium">
									{creator?.display_name ?? "—"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Fecha</span>
								<span>
									{new Date(route.created_at).toLocaleDateString("es-CO")}
								</span>
							</div>
							{route.difficulty && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Dificultad</span>
									<span className="font-medium capitalize">
										{route.difficulty}
									</span>
								</div>
							)}
							{route.source_url && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Fuente</span>
									<a
										href={route.source_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary hover:underline truncate max-w-[200px]"
									>
										Wikiloc
									</a>
								</div>
							)}
						</CardContent>
					</Card>

					{tripsUsing.length > 0 && (
						<Card className="border-border shadow-sm">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Salidas usando esta ruta
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{tripsUsing.map((trip) => (
									<Link
										key={trip.id}
										to="/trips/$tripId"
										params={{ tripId: trip.id }}
										className="block rounded-md p-2 text-sm hover:bg-muted transition-colors"
									>
										{trip.title}
									</Link>
								))}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
