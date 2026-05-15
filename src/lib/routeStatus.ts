import type { Tables } from "#/types/database.types";

type RouteStatus = Tables<"routes">["status"];
type AppRole = Tables<"profiles">["role"];

export function canTransition(
	currentStatus: RouteStatus,
	newStatus: RouteStatus,
	role: AppRole,
	isCreator: boolean,
): boolean {
	// Organizer can do almost anything
	if (role === "organizer") {
		if (currentStatus === newStatus) return true;
		// Organizer can transition from any state to published directly
		if (newStatus === "published") return true;
		// Organizer can also set to pending or draft from any state
		if (newStatus === "pending_approval") return true;
		if (newStatus === "draft") return true;
		return false;
	}

	// Expedition lead rules
	if (role === "expedition_lead") {
		if (!isCreator) return false;
		if (currentStatus === newStatus) return true;
		// Expedition lead can only submit for approval from draft
		if (currentStatus === "draft" && newStatus === "pending_approval")
			return true;
		// Cannot publish directly or revert approval
		if (newStatus === "published") return false;
		return false;
	}

	// Participants cannot change status
	return false;
}

export function getVisibleStatuses(role: AppRole): RouteStatus[] {
	switch (role) {
		case "organizer":
			return ["draft", "pending_approval", "published"];
		case "expedition_lead":
			return ["draft", "pending_approval", "published"];
		case "participant":
		default:
			return ["published"];
	}
}

export function getEditableStatuses(role: AppRole): RouteStatus[] {
	switch (role) {
		case "organizer":
			return ["draft", "pending_approval", "published"];
		case "expedition_lead":
			return ["draft", "pending_approval"];
		case "participant":
		default:
			return [];
	}
}

export function getStatusLabel(status: RouteStatus): string {
	switch (status) {
		case "draft":
			return "Borrador";
		case "pending_approval":
			return "Pendiente de aprobación";
		case "published":
			return "Publicada";
		default:
			return status;
	}
}

export function getStatusColor(status: RouteStatus): string {
	switch (status) {
		case "draft":
			return "bg-gray-100 text-gray-800 border-gray-200";
		case "pending_approval":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "published":
			return "bg-green-100 text-green-800 border-green-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
}
