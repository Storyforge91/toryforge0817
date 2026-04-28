import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Create",
    items: [
      { href: "/", label: "Home", icon: "H" },
      { href: "/demo", label: "Studio", icon: "St" },
    ],
  },
  {
    label: "Publish",
    items: [{ href: "/calendar", label: "Calendar", icon: "Ca" }],
  },
];

const settingsItem: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: "Se",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-14 items-center border-b border-zinc-800 px-5">
          <Link href="/" className="text-lg font-bold text-white">
            StoryForge AI
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
          {navSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {section.label}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-xs font-medium text-zinc-300">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <Link
            href={settingsItem.href}
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-xs font-medium text-zinc-300">
              {settingsItem.icon}
            </span>
            {settingsItem.label}
          </Link>
          <p className="px-1 text-[10px] text-zinc-600">
            Hero Shot Reel Engine
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1">{children}</main>
    </div>
  );
}
