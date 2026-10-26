import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { FilePlus2, FolderOpen, Settings } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-md bg-cream px-4 py-2 text-sm font-medium text-forest">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-cream-muted">Algo deu errado. Tente novamente.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-cream px-4 py-2 text-sm font-medium text-forest">Tentar de novo</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Proposta Rápida" },
      { name: "description", content: "Gere propostas comerciais profissionais com IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const nav = [
  { to: "/", label: "Nova proposta", icon: FilePlus2 },
  { to: "/propostas", label: "Minhas propostas", icon: FolderOpen },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen pb-20 sm:pb-0">
        <header className="border-b border-cream/15">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link to="/" className="font-serif text-xl font-semibold tracking-tight">Proposta <em className="text-brass">Rápida</em></Link>
            <nav className="hidden gap-1 sm:flex">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-md px-3 py-2 text-sm text-cream-muted transition hover:text-cream" activeProps={{ className: "bg-cream/10 !text-cream" }}>{n.label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8"><Outlet /></main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-cream/15 bg-background sm:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-cream-muted" activeProps={{ className: "!text-brass" }}>
              <n.icon className="h-5 w-5" />{n.label}
            </Link>
          ))}
        </nav>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
