// YENİ DOSYA: src/components/StarRating.jsx

import React, { useState } from "react";
import { toast } from "react-hot-toast";

// Bu bileşen, 'onRatingSubmit' adında bir fonksiyonu prop olarak alır
// ve 'disabled' prop'u ile oylamanın kilitli olup olmadığını belirler.
function StarRating({ onRatingSubmit, disabled = false, initialRating = 0 }) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  // Zaten puanlanmışsa (initialRating > 0), tıklamayı engelle
  const isRated = initialRating > 0;

  const handleClick = async (ratingValue) => {
    if (isRated || disabled) return; // Zaten puanlanmışsa veya kilitliyse bir şey yapma

    try {
      // Parent component'e (SiparislerimSayfasi) puanı gönder
      await onRatingSubmit(ratingValue);
      setRating(ratingValue); // Yıldızları dolu göster
      toast.success("Değerlendirmeniz için teşekkürler!");
    } catch (err) {
      toast.error("Puan verilirken bir hata oluştu.");
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((star, index) => {
        const ratingValue = index + 1; // Yıldız değeri (1, 2, 3, 4, 5)

        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => handleClick(ratingValue)}
              className="hidden" // Radio butonu gizle
              disabled={isRated || disabled}
            />
            <svg
              className={`w-6 h-6 ${
                isRated || disabled ? "cursor-default" : "cursor-pointer"
              }`}
              fill={ratingValue <= (hover || rating) ? "#FBBF24" : "none"} // Dolu (Sarı)
              stroke={ratingValue <= (hover || rating) ? "#FBBF24" : "#D1D5DB"} // Boş (Gri)
              strokeWidth="2"
              viewBox="0 0 24 24"
              onMouseEnter={() =>
                !isRated && !disabled && setHover(ratingValue)
              }
              onMouseLeave={() => !isRated && !disabled && setHover(0)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </label>
        );
      })}
    </div>
  );
}

export default StarRating;
