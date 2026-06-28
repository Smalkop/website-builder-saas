interface HeroProps {
  businessName: string;
  description: string;
  bannerUrl: string;
  logoUrl: string;
  whatsappNumber: string;
}

export default function Hero({ businessName, description, bannerUrl, logoUrl, whatsappNumber }: HeroProps) {
  const heroStyle = bannerUrl
    ? { backgroundImage: `url(${bannerUrl})` }
    : {};

  return (
    <section className="hero" style={heroStyle}>
      <div className="hero-overlay">
        <div className="hero-content">
          {logoUrl && <img src={logoUrl} alt={businessName} className="hero-logo" />}
          <h1 className="hero-title">{businessName}</h1>
          {description && <p className="hero-description">{description}</p>}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta"
            >
              Cont&aacute;ctanos por WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
