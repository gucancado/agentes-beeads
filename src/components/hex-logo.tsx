export function HexLogo({ size = 22 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block bg-honey"
      style={{
        width: size,
        height: size * 1.09,
        clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
      }}
    />
  );
}
