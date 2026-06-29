interface NavbarProps {
  businessName: string;
  menuItems: { label: string; anchor: string; children: any[] }[];
  hasProducts: boolean;
  hasContact: boolean;
}

export default function Navbar({ businessName, menuItems, hasProducts, hasContact }: NavbarProps) {
  const items = menuItems.length > 0
    ? menuItems
    : [
        { label: 'Inicio', anchor: 'inicio' },
        ...(hasProducts ? [{ label: 'Productos', anchor: 'productos' }] : []),
        { label: 'Nosotros', anchor: 'nosotros' },
        ...(hasContact ? [{ label: 'Contacto', anchor: 'contacto' }] : []),
      ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="#inicio" className="navbar-brand">{businessName}</a>
        <div className="navbar-links">
          {items.map((item) => (
            <a key={item.anchor} href={`#${item.anchor}`} className="navbar-link">
              {item.label}
            </a>
          ))}
          <a href="/admin/" className="navbar-link navbar-link-admin" target="_blank" rel="noopener noreferrer">
            Panel
          </a>
        </div>
      </div>
    </nav>
  );
}
