"use client";

import type { RecommendationCard as RecommendationCardData } from "@/next/types/cubiqo";

type Props = {
  card: RecommendationCardData;
  onSave?: (card: RecommendationCardData) => void;
  onAlreadyHave?: (card: RecommendationCardData) => void;
  onTellMeMore?: (card: RecommendationCardData) => void;
  onFindCheaper?: (card: RecommendationCardData) => void;
  onCompare?: (card: RecommendationCardData) => void;
};

export function RecommendationCard({
  card,
  onSave,
  onAlreadyHave,
  onTellMeMore,
  onFindCheaper,
  onCompare,
}: Props) {
  const priceLabel = card.price
    ? `${card.price.currency === "GBP" ? "£" : card.price.currency === "USD" ? "$" : `${card.price.currency} `}${card.price.amount.toFixed(2)}`
    : null;

  return (
    <article className="rec-card">
      {(card.imageUrl || card.logoUrl) && (
        <img src={card.imageUrl || card.logoUrl} alt="" className="rec-card-logo" />
      )}
      <h3>{card.entityName}</h3>
      {card.tagline && <p>{card.tagline}</p>}
      {priceLabel && <p>{priceLabel}</p>}
      {card.rating != null && (
        <p>
          {card.rating.toFixed(1)} stars
          {card.reviewCount != null ? ` (${card.reviewCount.toLocaleString()} reviews)` : ""}
        </p>
      )}
      {(card.isPrime || card.primeEligible) && <p>Prime eligible</p>}
      {card.promoCode && <p>Promo: {card.promoCode}</p>}
      <a href={card.trackedUrl} target="_blank" rel="noreferrer">
        {card.tier === 3 ? "View product" : "Get started"}
      </a>
      <button type="button" onClick={() => onSave?.(card)}>Save</button>
      <button type="button" onClick={() => onAlreadyHave?.(card)}>I already have this</button>
      <button type="button" onClick={() => onFindCheaper?.(card)}>Find cheaper</button>
      <button type="button" onClick={() => onCompare?.(card)}>Compare options</button>
      <button type="button" onClick={() => onTellMeMore?.(card)}>Tell me more</button>
      <p className="rec-card-disclosure">
        {card.disclosure || "CubiQo may earn a commission. Your price does not change."}
      </p>
    </article>
  );
}
