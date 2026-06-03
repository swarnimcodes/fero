import { invoke } from '@tauri-apps/api/core'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open as tauriDialog } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import type { OutboundPayload } from '@swarnimcodes/fero-core/bindings/OutboundPayload'
import { useAppStore } from '../lib/store/appStore'

export default function ContentStatus() {
	const requests = useAppStore((s) => s.requests)
	const endpointsInfo = useAppStore((s) => s.endpointsInfo)
	const outboundPayload = useAppStore((s) => s.outboundPayload)
	const isDragHovering = useAppStore((s) => s.isDragHovering)
	const { setOutboundPayload, setDiscoveryRunning } = useAppStore()

	const displayedIsEmpty = requests.length === 0 && endpointsInfo.length === 0
	const hasPayload = outboundPayload !== undefined
	const hasEndpoints = endpointsInfo.length > 0
	const showReadyIndicator = displayedIsEmpty && !hasEndpoints

	// ── File picker ──────────────────────────────────────────────────────────
	async function openFilePicker() {
		const result = await tauriDialog({
			title: 'Select a file to send',
			directory: false,
			multiple: true,
		})
		if (result === null) return

		let paths: string[]
		if (Array.isArray(result)) {
			// Newer plugin versions return { path } objects; older return strings
			if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null) {
				paths = (result as unknown as Array<{ path: string }>).map((e) => e.path)
			} else {
				paths = result as string[]
			}
		} else {
			paths = [result as string]
		}

		setOutboundPayload({ Files: paths } as OutboundPayload)
		const { discoveryRunning } = useAppStore.getState()
		if (!discoveryRunning) await invoke('start_discovery')
		setDiscoveryRunning(true)
	}

	// ── Clipboard share ──────────────────────────────────────────────────────
	async function shareClipboard() {
		let text: string | null = null
		try {
			text = await readText()
		} catch {
			// No text — try image clipboard
			try {
				const tempPath = await invoke<string>('save_clipboard_image')
				setOutboundPayload({ Files: [tempPath] } as OutboundPayload)
				const { discoveryRunning } = useAppStore.getState()
				if (!discoveryRunning) await invoke('start_discovery')
				setDiscoveryRunning(true)
			} catch {
				toast.error('Clipboard is empty')
			}
			return
		}
		if (!text) {
			toast.error('Clipboard is empty')
			return
		}
		setOutboundPayload({ Text: text } as OutboundPayload)
		const { discoveryRunning } = useAppStore.getState()
		if (!discoveryRunning) await invoke('start_discovery')
		setDiscoveryRunning(true)
	}

	return (
		<>
			<h3 className="mb-4 font-medium text-xl">
				{displayedIsEmpty
					? `Ready to receive${hasPayload ? ' / send' : ''}`
					: 'Nearby devices'}
			</h3>

			{/* Animated pulse — visible when idle with no endpoints */}
			{showReadyIndicator && (
				<div className="m-auto status-indicator status-indicator--success status-indicator--xl">
					<div className="circle circle--animated circle-main" />
					<div className="circle circle--animated circle-secondary" />
					<div className="circle circle--animated circle-tertiary" />
				</div>
			)}

			{/* Drop zone / action buttons — visible when no payload queued */}
			{displayedIsEmpty && !hasPayload && (
				<div
					className={`w-full border rounded-2xl p-6 flex flex-col justify-center items-center transition duration-150 ease-in-out mt-auto ${isDragHovering ? 'border-green-200 bg-green-100 scale-105' : ''}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						height="24"
						viewBox="0 -960 960 960"
						width="24"
						className="w-8 h-8"
					>
						{/* eslint-disable-next-line */}
						<path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
					</svg>
					<h4 className="mt-2 font-medium">Drop files to send</h4>
					<div className="flex gap-2 mt-2">
						<button
							className="btn active:scale-95 transition duration-150 ease-in-out"
							onClick={openFilePicker}
						>
							<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
								<path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
							</svg>
							<span className="ml-2">Select</span>
						</button>
						<button
							className="btn active:scale-95 transition duration-150 ease-in-out"
							onClick={shareClipboard}
						>
							<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
								<path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
							</svg>
							<span className="ml-2">Clipboard</span>
						</button>
					</div>
				</div>
			)}
		</>
	)
}
