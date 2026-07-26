export function Footer() {
  return (
    <footer className="border-t border-paper-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-steel">
        <p>
          ServiceLink — a Diploma of Computer Science final project, Riara University School of Computing
          Sciences. Nairobi County, {new Date().getFullYear()}.
        </p>
      </div>
    </footer>
  );
}
