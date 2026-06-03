import { useEffect, useMemo } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { getStore } from '@tauri-apps/plugin-store'
import {
	isPermissionGranted,
	requestPermission,
} from '@tauri-apps/plugin-notification'
import { open } from '@tauri-apps/plugin-shell'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { toast } from 'sonner'
import type { ChannelMessage } from '@swarnimcodes/fero-core/bindings/ChannelMessage'
import type { EndpointInfo } from '@swarnimcodes/fero-core/bindings/EndpointInfo'
import type { OutboundPayload } from '@swarnimcodes/fero-core/bindings/OutboundPayload'
import { useAppStore } from '../lib/store/appStore'
import {
	applyAutoStart,
	clearSending,
	computeDisplayedItems,
	getDownloadPath,
	getLatestVersion,
	getRealclose,
	getStartMinimized,
	getVisibility,
	sendCmd,
	sendInfo,
	setAutoStart,
} from '../lib/utils'
import { autostartKey } from '../lib/types'
import type { DisplayedItem } from '../lib/types'
import SettingsModal from './SettingsModal'
import Heading from './Heading'
import SideMenu from './SideMenu'
import ContentStatus from './ContentStatus'
import ItemSide from './ItemSide'

export default function HomePage() {
	const {
		setStore,
		addUnlistener,
		clearUnlisteners,
		setHostname,
		setVersion,
		upsertRequest,
		removeRequest,
		pushToDelete,
		upsertEndpointInfo,
		removeEndpointInfo,
		setOutboundPayload,
		setDiscoveryRunning,
		setIsDragHovering,
		setSettingsOpen,
	} = useAppStore()

	const requests = useAppStore((s) => s.requests)
	const endpointsInfo = useAppStore((s) => s.endpointsInfo)
	const isDragHovering = useAppStore((s) => s.isDragHovering)

	// ── One-time app initialisation ──────────────────────────────────────────
	useEffect(() => {
		async function init() {
			// Tauri persisted store
			const tauriStore = (await getStore('.settings.json'))!
			setStore(tauriStore)

			// Basic app info
			const [hostname, version] = await Promise.all([
				invoke<string>('get_hostname'),
				getVersion(),
			])
			setHostname(hostname)
			setVersion(version)

			// Settings
			await getVisibility()
			if (!(await tauriStore.has(autostartKey))) {
				await setAutoStart(true)
			} else {
				await applyAutoStart()
			}
			await getRealclose()
			await getStartMinimized()
			await getDownloadPath()

			// Notification permission
			let permissionGranted = await isPermissionGranted()
			if (!permissionGranted) {
				const permission = await requestPermission()
				permissionGranted = permission === 'granted'
			}

			// ── Event: channel message ────────────────────────────────────────
			addUnlistener(
				await listen('rs2js_channelmessage', async (event) => {
					const cm = event.payload as ChannelMessage

					if (cm.state === 'Disconnected') {
						pushToDelete({ id: cm.id, triggered: Date.now() })
					}

					// Auto-clear sidebar when an outbound transfer finishes
					if (cm.state === 'Finished' && cm.rtype === 'Outbound') {
						toast.success('Sent successfully')
						useAppStore.getState().removeRequest(cm.id)
						await clearSending()
						return
					}

					upsertRequest(cm)
				}),
			)

			// ── Event: endpoint info ──────────────────────────────────────────
			addUnlistener(
				await listen('rs2js_endpointinfo', (event) => {
					const ei = event.payload as EndpointInfo
					if (!ei.present) {
						removeEndpointInfo(ei.id)
						return
					}
					upsertEndpointInfo(ei)
				}),
			)

			// ── Event: visibility changed ─────────────────────────────────────
			addUnlistener(
				await listen('visibility_updated', async () => {
					console.log('Visibility changed')
					await getVisibility()
				}),
			)

			// ── Drag-and-drop ─────────────────────────────────────────────────
			addUnlistener(
				await getCurrentWindow().onDragDropEvent(async (event) => {
					if (event.payload.type === 'over') {
						setIsDragHovering(true)
					} else if (event.payload.type === 'drop') {
						setIsDragHovering(false)
						setOutboundPayload({ Files: event.payload.paths } as OutboundPayload)
						const { discoveryRunning } = useAppStore.getState()
						if (!discoveryRunning) await invoke('start_discovery')
						setDiscoveryRunning(true)
					} else {
						setIsDragHovering(false)
					}
				}),
			)

			// Check for updates
			await getLatestVersion(version)
		}

		init()

		// Cleanup: stop all Tauri event listeners
		return () => {
			const { unlisteners } = useAppStore.getState()
			unlisteners.forEach((fn) => fn())
			clearUnlisteners()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// ── Derived state ────────────────────────────────────────────────────────
	const displayedItems: DisplayedItem[] = useMemo(
		() => computeDisplayedItems(endpointsInfo, requests),
		[endpointsInfo, requests],
	)

	// ── Helpers ───────────────────────────────────────────────────────────────
	async function writeToClipboard(text: string | undefined) {
		if (!text) return
		try {
			await writeText(text)
			toast.success('Copied to clipboard')
		} catch {
			toast.error('Unknown error while copying text')
		}
	}

	async function openUrl(url: string | undefined) {
		if (!url) return
		try {
			await open(url)
		} catch {
			toast.error('Error opening URL, it may not be a valid URI')
		}
	}

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className="flex flex-col w-full h-full bg-green-50 max-w-full max-h-full overflow-hidden">
			<SettingsModal />

			<Heading onOpenSettings={() => setSettingsOpen(true)} />

			<div className="flex-1 flex flex-row">
				<SideMenu />

				<div
					className={`flex-1 flex flex-col bg-white w-full max-w-full min-w-0 min-h-full rounded-tl-[3rem] p-12 h-1 overflow-y-scroll transition duration-150 ease-in-out ${isDragHovering ? 'ring-2 ring-green-300' : ''}`}
				>
					<ContentStatus />

					{displayedItems.map((item) => (
						<div
							key={item.id}
							className={`w-full rounded-3xl flex flex-row gap-6 p-4 mb-4 bg-green-100 ${item.endpoint ? 'cursor-pointer' : ''}`}
							onClick={() => item.endpoint && sendInfo(item.id)}
						>
							{/* Device icon + progress arc + pin code */}
							<ItemSide item={item} />

							{/* Transfer content and actions */}
							<div
								className={`flex-1 flex flex-col text-sm min-w-0 ${item.state === undefined ? 'justify-center' : ''}`}
							>
								<h4 className="text-base font-medium">{item.name}</h4>

								{/* ── Waiting for consent ── */}
								{item.state === 'WaitingForUserConsent' && (
									<div className="flex-1 flex flex-col justify-between">
										<p className="mt-4">
											Wants to share{' '}
											{item.files?.join(', ') ?? item.text_description ?? 'some file(s).'}
										</p>
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); sendCmd(item.id, 'AcceptTransfer') }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Accept
											</button>
											<button
												onClick={(e) => { e.stopPropagation(); sendCmd(item.id, 'RejectTransfer') }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Decline
											</button>
										</div>
									</div>
								)}

								{/* ── In progress ── */}
								{['SentIntroduction', 'SendingFiles', 'ReceivingFiles'].includes(
									item.state ?? '',
								) && (
									<div>
										{['SentIntroduction', 'SendingFiles'].includes(item.state ?? '') ? (
											<p className="mt-2">Sending...</p>
										) : (
											<p className="mt-2">Receiving...</p>
										)}
										{item.files?.map((f) => (
											<p key={f} className="overflow-hidden whitespace-nowrap text-ellipsis">
												{f}
											</p>
										))}
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); sendCmd(item.id, 'CancelTransfer') }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Cancel
											</button>
										</div>
									</div>
								)}

								{/* ── Finished outbound ── */}
								{item.state === 'Finished' && item.rtype === 'Outbound' && (
									<div>
										<p className="mt-2">Sent successfully</p>
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); removeRequest(item.id) }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Clear
											</button>
										</div>
									</div>
								)}

								{/* ── Finished inbound ── */}
								{item.state === 'Finished' && item.rtype !== 'Outbound' && (
									<div>
										<p className="mt-2">Received {item.text_type ? 'text' : ''}</p>
										{item.files?.map((f) => (
											<p key={f} className="overflow-hidden whitespace-nowrap text-ellipsis">
												{f}
											</p>
										))}
										{item.files && (
											<p className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis">
												Saved to {item.destination}
											</p>
										)}
										{item.text_type && (
											<p className="select-text cursor-text overflow-hidden whitespace-nowrap text-ellipsis">
												{item.text_payload}
											</p>
										)}
										<div className="flex flex-row justify-end gap-4 mt-1">
											{(item.destination ||
												(item.text_type === 'Url' && item.text_payload)) && (
												<button
													onClick={(e) => {
														e.stopPropagation()
														openUrl(item.destination ?? item.text_payload)
													}}
													className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
												>
													Open
												</button>
											)}
											{item.text_type && item.text_payload && (
												<button
													onClick={(e) => {
														e.stopPropagation()
														writeToClipboard(item.text_payload)
													}}
													className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
												>
													Copy
												</button>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation()
													removeRequest(item.id)
												}}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Clear
											</button>
										</div>
									</div>
								)}

								{/* ── Cancelled ── */}
								{item.state === 'Cancelled' && (
									<div>
										<p className="mt-2">Transfer cancelled</p>
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); removeRequest(item.id) }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Clear
											</button>
										</div>
									</div>
								)}

								{/* ── Rejected ── */}
								{item.state === 'Rejected' && (
									<div>
										<p className="mt-2">Transfer rejected</p>
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); removeRequest(item.id) }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Clear
											</button>
										</div>
									</div>
								)}

								{/* ── Disconnected ── */}
								{item.state === 'Disconnected' && (
									<div>
										<p className="mt-2">Unexpected disconnection</p>
										<div className="flex flex-row justify-end gap-4 mt-1">
											<button
												onClick={(e) => { e.stopPropagation(); removeRequest(item.id) }}
												className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out shadow-none"
											>
												Clear
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
