import { useState, useEffect, useCallback, useRef } from "react";
import type { ParsedWaypoint } from "#/lib/gpx";

export interface RouteDraft {
	name: string;
	description: string;
	story: string;
	coverImage: string;
	difficulty: string;
	sourceUrl: string;
	skills: string[];
	waypoints: ParsedWaypoint[];
	trackPoints: [number, number][];
	gpxFileName?: string | null;
	savedAt: string;
}

const MAX_DRAFT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function getDraftKey(userId: string, routeId?: string): string {
	if (routeId) {
		return `route-draft-${userId}-${routeId}`;
	}
	return `route-draft-${userId}`;
}

function isDraftTooLarge(draft: RouteDraft): boolean {
	try {
		const serialized = JSON.stringify(draft);
		return serialized.length > MAX_DRAFT_SIZE_BYTES;
	} catch {
		return true;
	}
}

export function useRouteDraft(userId: string | undefined, routeId?: string) {
	const [draft, setDraft] = useState<RouteDraft | null>(null);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const draftKey = userId ? getDraftKey(userId, routeId) : null;

	const loadDraft = useCallback(() => {
		if (!draftKey) return null;
		try {
			const raw = localStorage.getItem(draftKey);
			if (raw) {
				const parsed = JSON.parse(raw) as RouteDraft;
				setDraft(parsed);
				setLastSaved(new Date(parsed.savedAt));
				return parsed;
			}
		} catch {
			// Ignore parse errors
		}
		return null;
	}, [draftKey]);

	const saveDraft = useCallback(
		(data: Omit<RouteDraft, "savedAt">) => {
			if (!draftKey) return;
			const draftData: RouteDraft = {
				...data,
				savedAt: new Date().toISOString(),
			};
			if (isDraftTooLarge(draftData)) {
				console.warn("Draft exceeds 5 MB limit, not saving");
				return;
			}
			localStorage.setItem(draftKey, JSON.stringify(draftData));
			setDraft(draftData);
			setLastSaved(new Date());
		},
		[draftKey],
	);

	const clearDraft = useCallback(() => {
		if (!draftKey) return;
		localStorage.removeItem(draftKey);
		setDraft(null);
		setLastSaved(null);
	}, [draftKey]);

	const hasDraft = useCallback(() => {
		if (!draftKey) return false;
		return localStorage.getItem(draftKey) !== null;
	}, [draftKey]);

	const debouncedSave = useCallback(
		(data: Omit<RouteDraft, "savedAt">) => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			debounceRef.current = setTimeout(() => {
				saveDraft(data);
			}, 3000);
		},
		[saveDraft],
	);

	useEffect(() => {
		loadDraft();
	}, [loadDraft]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	return {
		draft,
		lastSaved,
		loadDraft,
		saveDraft,
		debouncedSave,
		clearDraft,
		hasDraft,
	};
}
