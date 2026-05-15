import { Button } from "#/components/ui/button";
import type { Tables } from "#/types/database.types";
import type { RouteDraft } from "#/hooks/useRouteDraft";
import { Save, Send, Globe, Trash2, Loader2 } from "lucide-react";

interface DraftActionsProps {
	role: Tables<"profiles">["role"];
	status?: Tables<"routes">["status"];
	isSubmitting: boolean;
	lastSaved: Date | null;
	onSaveDraft: () => void;
	onSubmitForApproval: () => void;
	onPublish: () => void;
	onClearDraft: () => void;
}

export function DraftActions({
	role,
	status,
	isSubmitting,
	lastSaved,
	onSaveDraft,
	onSubmitForApproval,
	onPublish,
	onClearDraft,
}: DraftActionsProps) {
	const isOrganizer = role === "organizer";
	const isExpeditionLead = role === "expedition_lead";

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				{/* Organizer actions */}
				{isOrganizer && (
					<>
						<Button
							type="button"
							variant="outline"
							onClick={onSaveDraft}
							disabled={isSubmitting}
							size="sm"
						>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Save className="mr-2 h-4 w-4" />
							)}
							Guardar borrador
						</Button>
						<Button
							type="button"
							variant="default"
							onClick={onPublish}
							disabled={isSubmitting}
							size="sm"
						>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Globe className="mr-2 h-4 w-4" />
							)}
							Publicar directamente
						</Button>
					</>
				)}

				{/* Expedition lead actions */}
				{isExpeditionLead && (
					<>
						<Button
							type="button"
							variant="outline"
							onClick={onSaveDraft}
							disabled={isSubmitting}
							size="sm"
						>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Save className="mr-2 h-4 w-4" />
							)}
							Guardar borrador
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={onSubmitForApproval}
							disabled={isSubmitting}
							size="sm"
						>
							{isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Send className="mr-2 h-4 w-4" />
							)}
							Enviar para aprobación
						</Button>
					</>
				)}

				<Button
					type="button"
					variant="ghost"
					onClick={onClearDraft}
					disabled={isSubmitting}
					size="sm"
					className="text-muted-foreground"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Descartar borrador
				</Button>
			</div>

			{lastSaved && (
				<p className="text-xs text-muted-foreground">
					Guardado automáticamente: {lastSaved.toLocaleTimeString("es-CO")}
				</p>
			)}
		</div>
	);
}
