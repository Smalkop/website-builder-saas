interface FooterProps {
  businessName: string;
  facebookUrl: string;
  instagramUrl: string;
  whatsappNumber: string;
}

export default function Footer({ businessName, facebookUrl, instagramUrl, whatsappNumber }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>{businessName}</h3>
        </div>

        {(facebookUrl || instagramUrl || whatsappNumber) && (
          <div className="footer-social">
            <h4>S&iacute;guenos</h4>
            <div className="social-links">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                  Facebook
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                  Instagram
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} {businessName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
