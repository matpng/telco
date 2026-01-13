import "./globals.css";

export const metadata = {
  title: "TelcoCredit PNG",
  description: "Corporate mobile credit platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <div className="mx-auto max-w-6xl p-6">
            <header className="flex items-center justify-between py-4">
              <div className="text-xl font-semibold">TelcoCredit PNG</div>
              <nav className="text-sm flex gap-4">
                <a href="/" className="underline">Dashboard</a>
                <a href="/employees" className="underline">Employees</a>
                <a href="/invoices" className="underline">Invoices</a>
              </nav>
            </header>
            <main className="rounded-xl bg-white p-6 shadow-sm">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
