import type { ImgHTMLAttributes } from "react";

const LOGO_SRC = "/brand-logo.png";

type Props = ImgHTMLAttributes<HTMLImageElement>;

export function BrandLogo({
  className,
  alt = "Pet Stop — logo com pata e pin de localização em laranja sobre fundo verde",
  ...rest
}: Props) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      decoding="async"
      {...rest}
    />
  );
}
