import './globals.css';

export const metadata = {
  title: 'ATOMYS — Goal Setting & Tracking Portal',
  description: 'Enterprise goal setting, tracking, and performance management portal by Atomberg. Quarterly check-ins, real-time dashboards, and analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Anti-Caching & Service Worker Cleanup Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  if (registrations.length > 0) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                    if ('caches' in window) {
                      caches.keys().then((names) => {
                        for (let name of names) {
                          caches.delete(name);
                        }
                      });
                    }
                    setTimeout(() => {
                      window.location.reload();
                    }, 200);
                  }
                });
              }
            `
          }}
        />
        {children}
      </body>
    </html>
  );
}
