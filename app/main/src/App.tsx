import { Suspense } from 'react'
import { Toaster } from 'sonner'
import HomePage from './components/HomePage'

export default function App() {
	return (
		<div className="w-screen h-screen select-none cursor-default">
			<Toaster position="top-right" richColors />
			<Suspense>
				<HomePage />
			</Suspense>
		</div>
	)
}
