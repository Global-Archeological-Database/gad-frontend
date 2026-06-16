import Link from "next/link";
import { GADLogo } from "@/components/ui/GADLogo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary/40 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <GADLogo size="sm" variant="full" />
          <span>&copy; {new Date().getFullYear()} GAD &middot; Open access &middot; Free forever</span>
        </div>
      </div>
    </footer>
  );
}
