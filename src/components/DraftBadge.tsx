import { Badge } from "#/components/ui/badge";
import { getStatusLabel, getStatusColor } from "#/lib/routeStatus";
import type { Tables } from "#/types/database.types";

interface DraftBadgeProps {
	status: Tables<"routes">["status"];
	className?: string;
}

export function DraftBadge({ status, className }: DraftBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={`capitalize text-xs ${getStatusColor(status)} ${className || ""}`}
		>
			{getStatusLabel(status)}
		</Badge>
	);
}
