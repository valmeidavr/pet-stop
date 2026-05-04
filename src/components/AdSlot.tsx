import "./AdSlot.css";

type Props = {
  label?: string;
};

export function AdSlot({ label = "Espaço para anúncios" }: Props) {
  return (
    <aside className="ad-slot" aria-label={label}>
      <span className="ad-slot__text">{label}</span>
    </aside>
  );
}
