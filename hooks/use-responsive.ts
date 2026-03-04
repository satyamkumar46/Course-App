import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  phone: 0,
  tablet: 600,
  desktop: 900,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isPhone = width < BREAKPOINTS.tablet;
    const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isDesktop = width >= BREAKPOINTS.desktop;
    const isSmallScreen = width < 380 || height < 600;

    const scale = Math.min(width / 390, 1.5);
    const rs = (size: number) => Math.round(size * scale);

    const horizontalPadding = isTablet ? 24 : isDesktop ? 32 : 16;
    const listGap = isTablet ? 20 : 16;
    const numColumns = isTablet ? 2 : isDesktop ? 3 : 1;

    return {
      width,
      height,
      isPhone,
      isTablet,
      isDesktop,
      isSmallScreen,
      scale,
      rs,
      horizontalPadding,
      listGap,
      numColumns,
    };
  }, [width, height]);
}
