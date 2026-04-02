export const metadata = {
  title: 'Diana · Plan Tracker',
  description: 'Personal project tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, padding: 0, background: '#0F0F0F' }}>{children}</body>
    </html>
  )
}
