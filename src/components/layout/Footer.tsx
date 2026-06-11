import Link from "next/link";

const footerLinks = [
  { label: "Artifacts", href: "/artifacts" },
  { label: "Submit", href: "/submit" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Admin", href: "/admin" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary/30 bg-white/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-display font-semibold">GAD</span> &mdash; Global
          Archaeological Database
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
