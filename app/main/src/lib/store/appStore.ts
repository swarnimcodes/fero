import { create } from 'zustand'
import type { Store } from '@tauri-apps/plugin-store'
import type { UnlistenFn } from '@tauri-apps/api/event'
import type { ChannelMessage } from '@swarnimcodes/fero-core/bindings/ChannelMessage'
import type { EndpointInfo } from '@swarnimcodes/fero-core/bindings/EndpointInfo'
import type { OutboundPayload } from '@swarnimcodes/fero-core/bindings/OutboundPayload'
import type { Visibility } from '@swarnimcodes/fero-core/bindings/Visibility'
import type { ToDelete } from '../types'

interface AppState {
	// Tauri store (persisted settings)
	store: Store | null

	// UI state
	isAppInForeground: boolean
	discoveryRunning: boolean
	isDragHovering: boolean
	settingsOpen: boolean

	// Transfer state
	requests: ChannelMessage[]
	endpointsInfo: EndpointInfo[]
	toDelete: ToDelete[]
	outboundPayload: OutboundPayload | undefined

	// Cleanup
	unlisteners: UnlistenFn[]

	// App info
	version: string | null
	newVersion: string | null
	hostname: string | undefined

	// Settings
	autostart: boolean
	realclose: boolean
	startminimized: boolean
	visibility: Visibility
	downloadPath: string | undefined

	// Actions
	setStore: (store: Store) => void
	setDiscoveryRunning: (v: boolean) => void
	setIsDragHovering: (v: boolean) => void
	setSettingsOpen: (v: boolean) => void
	upsertRequest: (cm: ChannelMessage) => void
	removeRequest: (id: string) => void
	upsertEndpointInfo: (ei: EndpointInfo) => void
	removeEndpointInfo: (id: string) => void
	clearEndpointInfo: () => void
	setOutboundPayload: (payload: OutboundPayload | undefined) => void
	pushToDelete: (td: ToDelete) => void
	addUnlistener: (fn: UnlistenFn) => void
	clearUnlisteners: () => void
	setVersion: (v: string) => void
	setNewVersion: (v: string | null) => void
	setHostname: (v: string) => void
	setAutostart: (v: boolean) => void
	setRealclose: (v: boolean) => void
	setStartminimized: (v: boolean) => void
	setVisibility: (v: Visibility) => void
	setDownloadPath: (v: string | undefined) => void
}

export const useAppStore = create<AppState>((set) => ({
	store: null,
	isAppInForeground: false,
	discoveryRunning: false,
	isDragHovering: false,
	settingsOpen: false,
	requests: [],
	endpointsInfo: [],
	toDelete: [],
	outboundPayload: undefined,
	unlisteners: [],
	version: null,
	newVersion: null,
	hostname: undefined,
	autostart: true,
	realclose: false,
	startminimized: false,
	visibility: 'Visible',
	downloadPath: undefined,

	setStore: (store) => set({ store }),
	setDiscoveryRunning: (v) => set({ discoveryRunning: v }),
	setIsDragHovering: (v) => set({ isDragHovering: v }),
	setSettingsOpen: (v) => set({ settingsOpen: v }),

	upsertRequest: (cm) =>
		set((state) => {
			const idx = state.requests.findIndex((r) => r.id === cm.id)
			if (idx !== -1) {
				const prev = state.requests[idx]
				const updated = [...state.requests]
				updated[idx] = {
					...cm,
					state: cm.state ?? prev.state,
					meta: cm.meta ?? prev.meta,
				}
				return { requests: updated }
			}
			return { requests: [...state.requests, cm] }
		}),

	removeRequest: (id) =>
		set((state) => ({ requests: state.requests.filter((r) => r.id !== id) })),

	upsertEndpointInfo: (ei) =>
		set((state) => {
			const idx = state.endpointsInfo.findIndex((e) => e.id === ei.id)
			if (idx !== -1) {
				const updated = [...state.endpointsInfo]
				updated[idx] = ei
				return { endpointsInfo: updated }
			}
			return { endpointsInfo: [...state.endpointsInfo, ei] }
		}),

	removeEndpointInfo: (id) =>
		set((state) => ({ endpointsInfo: state.endpointsInfo.filter((e) => e.id !== id) })),

	clearEndpointInfo: () => set({ endpointsInfo: [] }),

	setOutboundPayload: (payload) => set({ outboundPayload: payload }),

	pushToDelete: (td) =>
		set((state) => ({ toDelete: [...state.toDelete, td] })),

	addUnlistener: (fn) =>
		set((state) => ({ unlisteners: [...state.unlisteners, fn] })),

	clearUnlisteners: () => set({ unlisteners: [] }),

	setVersion: (v) => set({ version: v }),
	setNewVersion: (v) => set({ newVersion: v }),
	setHostname: (v) => set({ hostname: v }),
	setAutostart: (v) => set({ autostart: v }),
	setRealclose: (v) => set({ realclose: v }),
	setStartminimized: (v) => set({ startminimized: v }),
	setVisibility: (v) => set({ visibility: v }),
	setDownloadPath: (v) => set({ downloadPath: v }),
}))
