import "./StarRating.css";

type Props = {
  value: number;
  max?: number;
  showNumber?: boolean;
  size?: "sm" | "md";
};

export function StarRating({
  value,
  max = 5,
  showNumber = true,
  size = "md",
}: Props) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5 && full < max;

  return (
    <div
      className="star-rating"
      role="img"
      aria-label={`${value.toFixed(1)} de ${max} estrelas`}
    >
      <span className={`star-rating__stars star-rating__stars--${size}`}>
        {Array.from({ length: max }, (_, i) => {
          if (i < full) {
            return (
              <span key={i} className="star-char star-char--full">
                ★
              </span>
            );
          }
          if (i === full && hasHalf) {
            return (
              <span key={i} className="star-char star-char--half">
                ★
              </span>
            );
          }
          return (
            <span key={i} className="star-char star-char--empty">
              ★
            </span>
          );
        })}
      </span>
      {showNumber && (
        <span className="star-rating__num">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
