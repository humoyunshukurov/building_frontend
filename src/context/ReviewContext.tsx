import React, { createContext, useContext, useState, useCallback } from "react";
import { reviewsApi } from "../api/api";

interface ReviewContextType {
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  getProductReviews: (productId: string) => Promise<any[]>;
  getProductRating: (productId: string, baseRating: number, baseCount: number) => { rating: number; count: number };
  localRatings: Record<string, { rating: number; count: number }>;
}

const ReviewContext = createContext<ReviewContextType | null>(null);

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localRatings, setLocalRatings] = useState<Record<string, { rating: number; count: number }>>({});

  const addReview = useCallback(async (productId: string, rating: number, comment: string) => {
    await reviewsApi.create(productId, rating, comment);
    // Mahsulot ratingini localda yangilaymiz (backend yangilaydi, lekin refresh kerak bo'lmasin)
    setLocalRatings(prev => {
      const current = prev[productId];
      if (!current) return prev;
      const newCount = current.count + 1;
      const newRating = Math.round(((current.rating * current.count + rating) / newCount) * 10) / 10;
      return { ...prev, [productId]: { rating: newRating, count: newCount } };
    });
  }, []);

  const getProductReviews = useCallback(async (productId: string) => {
    try {
      return await reviewsApi.getByProduct(productId);
    } catch {
      return [];
    }
  }, []);

  const getProductRating = useCallback((productId: string, baseRating: number, baseCount: number) => {
    return localRatings[productId] || { rating: baseRating, count: baseCount };
  }, [localRatings]);

  const initProductRating = useCallback((productId: string, rating: number, count: number) => {
    setLocalRatings(prev => {
      if (prev[productId]) return prev;
      return { ...prev, [productId]: { rating, count } };
    });
  }, []);

  return (
    <ReviewContext.Provider value={{ addReview, getProductReviews, getProductRating, localRatings }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = (): ReviewContextType => {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error("useReviews must be inside ReviewProvider");
  return ctx;
};
