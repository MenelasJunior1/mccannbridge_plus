import '../src/index.css';
import '../src/styles/bridge-editorial.css';

export const metadata = {
  title: 'McCann Bridge',
  description: 'Digital operating system pour McCann et ses grands comptes.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1d3d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
