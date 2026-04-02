export const metadata = {
  title: 'Diana · Plan Tracker',
  description: 'Personal project tracker',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, padding: 0, background: '#0F0F0F' }}>{children}</body>
    </html>
  )
}
