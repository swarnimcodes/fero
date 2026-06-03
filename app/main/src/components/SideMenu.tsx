import { useAppStore } from '../lib/store/appStore'
import { invertVisibility, clearSending } from '../lib/utils'

const pluralize = (n: number, s: string) => (n === 1 ? s : `${s}s`)

export default function SideMenu() {
	const visibility = useAppStore((s) => s.visibility)
	const outboundPayload = useAppStore((s) => s.outboundPayload)

	// ── Visibility panel ────────────────────────────────────────────────────
	if (outboundPayload === undefined) {
		return (
			<div className="w-72 p-3">
				<p className="mt-4 mb-2 pt-3 px-3">Visibility state</p>

				<button
					className="btn font-medium flex flex-row !justify-between w-full items-center rounded-xl active:scale-95 transition duration-150 ease-in-out p-3"
					onClick={() => invertVisibility()}
				>
					{visibility === 'Visible' && <span>Always visible</span>}
					{visibility === 'Invisible' && <span>Hidden from everyone</span>}
					{visibility === 'Temporarily' && <span>Temporarily visible</span>}

					<svg
						xmlns="http://www.w3.org/2000/svg"
						height="24"
						viewBox="0 -960 960 960"
						width="24"
						className={visibility === 'Invisible' ? 'rotate-180' : ''}
					>
						<path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
					</svg>
				</button>

				<p className="text-xs mt-2 pb-3 px-3">
					{visibility === 'Visible' && (
						<span>
							Nearby devices can share files with you, but you'll always be notified and
							have to approve each transfer before receiving it.
						</span>
					)}
					{visibility === 'Invisible' && (
						<span>
							No one can see your device at the moment. However, keep in mind that if
							another device has saved yours before, it might still attempt to start a
							transfer with you.
							<br />
							<br />
							You will get a notification when someone nearby is sharing giving you the
							ability to become visible for 1 minute.
						</span>
					)}
					{visibility === 'Temporarily' && (
						<span>You are temporarily visible to everyone.</span>
					)}
				</p>
			</div>
		)
	}

	// ── Outbound payload panel ───────────────────────────────────────────────
	return (
		<div className="w-72 p-6 flex flex-col justify-between">
			<div>
				{'Files' in outboundPayload && (
					<>
						<p className="mt-4 mb-2">
							Sharing {outboundPayload.Files.length}{' '}
							{pluralize(outboundPayload.Files.length, 'file')}
						</p>
						<div className="bg-white w-32 h-32 rounded-2xl mb-2 flex justify-center items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
								className="w-8 h-8"
							>
								{/* eslint-disable-next-line */}
								<path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
							</svg>
						</div>
						{outboundPayload.Files.map((f) => (
							<p
								key={f}
								className="overflow-hidden whitespace-nowrap text-ellipsis"
							>
								{f.split('/').pop()}
							</p>
						))}
					</>
				)}

				{'Text' in outboundPayload && (
					<>
						<p className="mt-4 mb-2">Sharing clipboard</p>
						<div className="bg-white w-32 h-32 rounded-2xl mb-2 flex justify-center items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
								className="w-8 h-8"
							>
								<path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
							</svg>
						</div>
						<p className="text-sm text-gray-500 overflow-hidden whitespace-nowrap text-ellipsis">
							{outboundPayload.Text}
						</p>
					</>
				)}

				<p className="text-xs mt-3">
					Make sure both devices are unlocked, close together, and have bluetooth turned
					on. Device you're sharing with needs Quick Share turned on and visible to you.
				</p>
			</div>

			<button
				className="btn px-3 rounded-xl active:scale-95 transition duration-150 ease-in-out w-fit"
				onClick={() => clearSending()}
			>
				Cancel
			</button>
		</div>
	)
}
