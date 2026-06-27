import { useLocale } from "@/i18n";

const Discover = () => {
  const { t } = useLocale();
  const s = t.discover;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="text-center px-6">
        <h1 className="font-serif text-3xl mb-3" style={{ color: '#E8A87C' }}>{s.title}</h1>
        <p className="text-sm" style={{ color: 'rgba(245,240,235,0.5)' }}>{s.subtitle}</p>
      </div>
    </div>
  );
};

export default Discover;
