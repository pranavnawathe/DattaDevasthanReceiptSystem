import { formatDate } from '../utils/formatters';

export function Header() {
  const today = new Date();

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold marathi mb-2">
            श्री दत्त देवस्थान, साखरपा
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">
            Shri Datta Devasthan, Sakharapa
          </h2>
          <p className="text-sm opacity-90">
            Donation Receipt System | {formatDate(today)}
          </p>
        </div>
      </div>
    </header>
  );
}
