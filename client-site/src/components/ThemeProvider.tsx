import { useEffect, ReactNode } from 'react';

interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  animations_enabled: number;
  layout_type: string;
}

interface ThemeProviderProps {
  config: ThemeConfig;
  children: ReactNode;
}

export default function ThemeProvider({ config, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primary_color);
    root.style.setProperty('--secondary-color', config.secondary_color);
    root.style.setProperty('--font-family', config.font_family);
    root.style.setProperty('--animations-enabled', config.animations_enabled ? '1' : '0');
    root.setAttribute('data-layout', config.layout_type);

    root.style.fontFamily = config.font_family;
  }, [config]);

  return <>{children}</>;
}
