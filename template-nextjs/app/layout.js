export const metadata = {
	title: 'Next.js on Harper',
	description: 'A Next.js app powered by Harper',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
				{children}
			</body>
		</html>
	);
}
