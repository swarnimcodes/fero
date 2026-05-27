import { open as tauriDialog } from '@tauri-apps/plugin-dialog'
import { useAppStore } from '../lib/store/appStore'
import {
	setAutoStart,
	setRealClose,
	setStartMinimized,
	setDownloadPath,
} from '../lib/utils'

export default function SettingsModal() {
	const settingsOpen = useAppStore((s) => s.settingsOpen)
	const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
	const autostart = useAppStore((s) => s.autostart)
	const realclose = useAppStore((s) => s.realclose)
	const startminimized = useAppStore((s) => s.startminimized)
	const downloadPath = useAppStore((s) => s.downloadPath)

	async function openDownloadPicker() {
		const result = await tauriDialog({
			title: 'Select the destination for files',
			directory: true,
			multiple: false,
		})
		if (result === null) return
		await setDownloadPath(result as string)
	}

	if (!settingsOpen) return null

	return (
		<div className="absolute z-10 w-full h-full flex justify-center items-center bg-black/25">
			<div className="bg-white rounded-xl shadow-xl p-4 w-[24rem]">
				<div className="flex flex-row justify-between items-center">
					<h3 className="font-medium text-xl">Settings</h3>
					<button
						className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out"
						onClick={() => setSettingsOpen(false)}
					>
						Close
					</button>
				</div>

				<div className="py-4 flex flex-col">
					{/* Start on boot */}
					<div className="form-control hover:bg-gray-500/10 rounded-xl p-3">
						<label
							className="cursor-pointer flex flex-row justify-between items-center"
							onClick={() => setAutoStart(!autostart)}
						>
							<span>Start on boot</span>
							<input
								type="checkbox"
								checked={autostart}
								onChange={() => {}}
								className="checkbox focus:outline-none"
							/>
						</label>
					</div>

					{/* Keep running on close */}
					<div className="form-control hover:bg-gray-500/10 rounded-xl p-3">
						<label
							className="cursor-pointer flex flex-row justify-between items-center"
							onClick={() => setRealClose(!realclose)}
						>
							<span>Keep running on close</span>
							<input
								type="checkbox"
								checked={!realclose}
								onChange={() => {}}
								className="checkbox focus:outline-none"
							/>
						</label>
					</div>

					{/* Start minimized */}
					<div className="form-control hover:bg-gray-500/10 rounded-xl p-3">
						<label
							className="cursor-pointer flex flex-row justify-between items-center"
							onClick={() => setStartMinimized(!startminimized)}
						>
							<span>Start minimized</span>
							<input
								type="checkbox"
								checked={startminimized}
								onChange={() => {}}
								className="checkbox focus:outline-none"
							/>
						</label>
					</div>

					{/* Download folder */}
					<div className="form-control hover:bg-gray-500/10 rounded-xl p-3">
						<label
							className="cursor-pointer flex flex-col items-start"
							onClick={openDownloadPicker}
						>
							<span>Change download folder</span>
							<span className="overflow-hidden whitespace-nowrap text-ellipsis text-xs max-w-80">
								{'>'} {downloadPath ?? "OS User's download folder"}
							</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	)
}
