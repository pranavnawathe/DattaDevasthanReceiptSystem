interface TempleHeaderProps {
  title?: string;
  subtitle?: string;
  showDate?: boolean;
}

export function TempleHeader({ title, subtitle, showDate = false }: TempleHeaderProps) {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold marathi mb-2">
            श्री दत्त देवस्थान, साखरपा
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">
            Shri Datta Devasthan, Sakharapa
          </h2>
          {title && (
            <div className="mt-3 pt-3 border-t border-orange-400/30">
              <p className="text-lg md:text-xl font-medium marathi">
                {title}
              </p>
              {subtitle && (
                <p className="text-sm opacity-90 mt-1">{subtitle}</p>
              )}
            </div>
          )}
          {showDate && (
            <p className="text-sm opacity-90 mt-2">
              {today}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
