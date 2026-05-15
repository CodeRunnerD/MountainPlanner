import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { supabase } from "#/lib/supabase";
import { getStatusLabel } from "#/lib/routeStatus";
import { useAuth } from "#/contexts/AuthContext";
import type { Tables } from "#/types/database.types";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApprovalPanelProps {
	route: Tables<"routes">;
	onStatusChange?: (status: Tables<"routes">["status"]) => void;
}

export function ApprovalPanel({ route, onStatusChange }: ApprovalPanelProps) {
	const { user } = useAuth();
	const role = user?.profile?.role ?? "participant";

	// Only organizers can see the approval panel
	if (role !== "organizer") return null;

	const [loading, setLoading] = useState(false);
	const [confirmReject, setConfirmReject] = useState(false);

	const handleApprove = async () => {
		setLoading(true);
		const { error } = await supabase
			.from("routes")
			.update({ status: "published" })
			.eq("id", route.id);
		setLoading(false);
		if (!error) {
			onStatusChange?.("published");
		}
	};

	const handleReject = async () => {
		setLoading(true);
		const { error } = await supabase
			.from("routes")
			.update({ status: "draft" })
			.eq("id", route.id);
		setLoading(false);
		setConfirmReject(false);
		if (!error) {
			onStatusChange?.("draft");
		}
	};

	return (
		<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-yellow-900">
						Ruta pendiente de aprobación
					</h3>
					<p className="text-sm text-yellow-800">
						Creada por {route.created_by ?? "—"} · Estado:{" "}
						{getStatusLabel(route.status)}
					</p>
				</div>
			</div>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="default"
					className="bg-green-600 hover:bg-green-700"
					onClick={handleApprove}
					disabled={loading}
				>
					{loading ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<CheckCircle className="mr-2 h-4 w-4" />
					)}
					Aprobar y Publicar
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="border-red-300 text-red-700 hover:bg-red-50"
					onClick={() => setConfirmReject(true)}
					disabled={loading}
				>
					<XCircle className="mr-2 h-4 w-4" />
					Rechazar
				</Button>
			</div>

			<Dialog open={confirmReject} onOpenChange={setConfirmReject}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rechazar ruta</DialogTitle>
						<DialogDescription>
							¿Estás seguro de que deseas rechazar esta ruta? Se
							devolverá a estado borrador y solo el creador podrá verla.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmReject(false)}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={loading}
						>
							{loading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Rechazar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
