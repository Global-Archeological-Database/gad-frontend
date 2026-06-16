import Link from "next/link";
import { GADLogo } from "@/components/ui/GADLogo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary/40 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <GADLogo size="sm" variant="full" />
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Map
            </Link>
            <Link
              href="/artifacts"
              className="hover:text-foreground transition-colors"
            >
              Collection
            </Link>
            <Link
              href="/submit"
              className="hover:text-foreground transition-colors"
            >
              Contribute
            </Link>
          </div>
          <span>&copy; {new Date().getFullYear()} GAD &middot; Open access &middot; Free forever</span>
        </div>
      </div>
    </footer>
  );
}
