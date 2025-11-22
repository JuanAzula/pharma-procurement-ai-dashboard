import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">TED Procurement Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Track pharmaceutical procurement across Europe
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Data from{' '}
            <a
              href="https://ted.europa.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Tenders Electronic Daily (TED)
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

