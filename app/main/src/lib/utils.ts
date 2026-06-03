import { invoke } from '@tauri-apps/api/core'
import { enable, disable } from '@tauri-apps/plugin-autostart'
import { gt } from 'semver'
import type { Visibility } from '@swarnimcodes/fero-core/bindings/Visibility'
import type { SendInfo } from '@swarnimcodes/fero-core/bindings/SendInfo'
import type { ChannelMessage } from '@swarnimcodes/fero-core/bindings/ChannelMessage'
import { ChannelAction } from '@swarnimcodes/fero-core'
import { useAppStore } from './store/appStore'
import {
	autostartKey,
	downloadPathKey,
	numberToVisibility,
	realcloseKey,
	startminimizedKey,
	stateToDisplay,
	visibilityKey,
	visibilityToNumber,
} from './types'
import type { DisplayedItem } from './types'

// ─── Autostart ───────────────────────────────────────────────────────────────

export async function setAutoStart(autostart: boolean) {
	const { store, setAutostart } = useAppStore.getState()
	if (!store) return
	if (autostart) {
		await enable()
	} else {
		await disable()
	}
	await store.set(autostartKey, autostart)
	await store.save()
	setAutostart(autostart)
}

export async function applyAutoStart() {
	const { store, setAutostart } = useAppStore.getState()
	if (!store) return
	const autostart = (await store.get<boolean>(autostartKey)) ?? false
	setAutostart(autostart)
	if (autostart) {
		await enable()
	} else {
		await disable()
	}
}

// ─── Real-close ───────────────────────────────────────────────────────────────

export async function setRealClose(realclose: boolean) {
	const { store, setRealclose } = useAppStore.getState()
	if (!store) return
	await store.set(realcloseKey, realclose)
	await store.save()
	setRealclose(realclose)
}

export async function getRealclose() {
	const { store, setRealclose } = useAppStore.getState()
	if (!store) return
	setRealclose((await store.get<boolean>(realcloseKey)) ?? false)
}

// ─── Start minimized ─────────────────────────────────────────────────────────

export async function setStartMinimized(startminimized: boolean) {
	const { store, setStartminimized } = useAppStore.getState()
	if (!store) return
	await store.set(startminimizedKey, startminimized)
	await store.save()
	setStartminimized(startminimized)
}

export async function getStartMinimized() {
	const { store, setStartminimized } = useAppStore.getState()
	if (!store) return
	setStartminimized((await store.get<boolean>(startminimizedKey)) ?? false)
}

// ─── Visibility ───────────────────────────────────────────────────────────────

export async function setVisibility(visibility: Visibility) {
	const { store, setVisibility: setVis } = useAppStore.getState()
	if (!store) return
	await invoke('change_visibility', { message: visibility })
	await store.set(visibilityKey, visibilityToNumber[visibility])
	await store.save()
	setVis(visibility)
}

export async function getVisibility() {
	const { store, setVisibility: setVis } = useAppStore.getState()
	if (!store) return
	const num = (await store.get<number>(visibilityKey)) ?? 0
	setVis(numberToVisibility[num])
}

export async function invertVisibility() {
	const { visibility } = useAppStore.getState()
	if (visibility === 'Temporarily') return
	if (visibility === 'Visible') return setVisibility('Invisible')
	return setVisibility('Visible')
}

// ─── Discovery / sending ──────────────────────────────────────────────────────

export async function clearSending() {
	const { setOutboundPayload, setDiscoveryRunning, clearEndpointInfo } =
		useAppStore.getState()
	await invoke('stop_discovery')
	setOutboundPayload(undefined)
	setDiscoveryRunning(false)
	clearEndpointInfo()
}

export async function sendInfo(eid: string) {
	const { endpointsInfo, outboundPayload } = useAppStore.getState()
	if (outboundPayload === undefined) return
	const ei = endpointsInfo.find((el) => el.id === eid)
	if (!ei || !ei.ip || !ei.port) return
	const msg: SendInfo = {
		id: ei.id,
		name: ei.name ?? 'Unknown',
		addr: `${ei.ip}:${ei.port}`,
		ob: outboundPayload,
	}
	await invoke('send_payload', { message: msg })
}

export async function sendCmd(id: string, action: ChannelAction) {
	const cm: ChannelMessage = {
		id,
		direction: 'FrontToLib',
		action,
		meta: null,
		state: null,
		rtype: null,
	}
	console.log('js2rs:', cm)
	await invoke('send_to_rs', { message: cm })
}

// ─── Download path ────────────────────────────────────────────────────────────

export async function setDownloadPath(dest: string) {
	const { store, setDownloadPath: setPath } = useAppStore.getState()
	if (!store) return
	await invoke('change_download_path', { message: dest })
	await store.set(downloadPathKey, dest)
	await store.save()
	setPath(dest)
}

export async function getDownloadPath() {
	const { store, setDownloadPath: setPath } = useAppStore.getState()
	if (!store) return
	setPath((await store.get<string>(downloadPathKey)) ?? undefined)
}

// ─── Version check ────────────────────────────────────────────────────────────

export async function getLatestVersion(currentVersion: string) {
	const { setNewVersion } = useAppStore.getState()
	try {
		const response = await fetch(
			'https://api.github.com/repos/swarnimcodes/fero/releases/latest',
		)
		if (!response.ok)
			throw new Error(`Error: ${response.status} ${response.statusText}`)
		const data = await response.json()
		const latest = (data.tag_name as string).replace(/^v/, '')
		console.log(`Latest version: ${currentVersion} vs ${latest}`)
		if (currentVersion && gt(latest, currentVersion)) {
			setNewVersion(latest)
		}
	} catch (err) {
		console.error(err)
	}
}

// ─── Displayed items (derived state) ─────────────────────────────────────────

export function computeDisplayedItems(
	endpointsInfo: ReturnType<typeof useAppStore.getState>['endpointsInfo'],
	requests: ReturnType<typeof useAppStore.getState>['requests'],
): DisplayedItem[] {
	const ndisplayed: DisplayedItem[] = []

	endpointsInfo.forEach((el) => {
		const idx = ndisplayed.findIndex((nel) => el.id === nel.id)
		if (idx !== -1) return
		ndisplayed.push({
			id: el.id,
			name: el.name ?? 'Unknown',
			deviceType: el.rtype ?? 'Unknown',
			endpoint: true,
		})
	})

	requests
		.filter((el) => stateToDisplay.includes(el.state ?? 'Initial'))
		.forEach((el) => {
			const idx = ndisplayed.findIndex((nel) => el.id === nel.id)
			const elem: DisplayedItem = {
				id: el.id,
				name: el.meta?.source?.name ?? 'Unknown',
				deviceType: el.meta?.source?.device_type ?? 'Unknown',
				endpoint: false,
				rtype: el.rtype ?? undefined,
				state: el.state ?? undefined,
				pin_code: el.meta?.pin_code ?? undefined,
				destination: el.meta?.destination ?? undefined,
				files: el.meta?.files ?? undefined,
				text_description: el.meta?.text_description ?? undefined,
				text_payload: el.meta?.text_payload ?? undefined,
				text_type: el.meta?.text_type ?? undefined,
				ack_bytes: (el.meta?.ack_bytes as number | undefined) ?? undefined,
				total_bytes: (el.meta?.total_bytes as number | undefined) ?? undefined,
			}
			if (idx !== -1) {
				ndisplayed[idx] = elem
			} else {
				ndisplayed.push(elem)
			}
		})

	return ndisplayed
}

// ─── Progress arc ─────────────────────────────────────────────────────────────

export function getProgress(item: DisplayedItem): string {
	const value = (item.ack_bytes! / item.total_bytes!) * 100
	return `--progress: ${value}`
}
