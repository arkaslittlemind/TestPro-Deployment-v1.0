export function Footer() {
  return (
    <>
      <footer className="w-full bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-8 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Johnson & Johnson API Migration
          </span>
          <span className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} TestPro Tool. Built securely for
            internal validation.
          </span>
        </div>
      </footer>
    </>
  );
}
