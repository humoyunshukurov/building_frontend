import React, { useState, useEffect } from "react";
import { useReviews } from "../context/ReviewContext";

interface ReviewSectionProps {
  productId: string;
  userName: string;
}

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Yomon", "Qoniqarli", "O'rtacha", "Yaxshi", "A'lo"];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110">
          <svg className={`w-7 h-7 transition-colors duration-100 ${star <= (hovered || value) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      <span className="text-sm text-gray-400 ml-1">{labels[hovered || value] || "Baho bering"}</span>
    </div>
  );
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, userName }) => {
  const { addReview, getProductReviews } = useReviews();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingReviews(true);
      const data = await getProductReviews(productId);
      setReviews(data);
      setLoadingReviews(false);
    };
    load();
  }, [productId, getProductReviews]);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Iltimos, baho bering"); return; }
    if (comment.trim().length < 5) { setError("Izoh kamida 5 ta harf bo'lsin"); return; }
    setError("");
    setSubmitting(true);
    try {
      await addReview(productId, rating, comment.trim());
      // Yangi izohni localda qo'shamiz
      setReviews(prev => [{
        id: Date.now().toString(),
        user: { name: userName },
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setRating(0);
      setComment("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e: any) {
      setError(e.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Izohlar {reviews.length > 0 && `(${reviews.length})`}
      </h3>

      {/* Write review */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Fikringizni qoldiring</p>
        <div className="mb-3"><StarPicker value={rating} onChange={(v) => { setRating(v); setError(""); }} /></div>
        <textarea value={comment} onChange={e => { setComment(e.target.value); setError(""); }}
          placeholder="Bu mahsulot haqida fikringizni yozing..." rows={3}
          className={`w-full text-sm border-2 rounded-xl px-3 py-2.5 resize-none focus:outline-none transition-all ${error && !comment.trim() ? "border-red-300 bg-red-50" : "border-gray-200 bg-white focus:border-orange-400"}`} />
        {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
        {submitted && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" /></svg>Izohingiz qo'shildi!</p>}
        <button onClick={handleSubmit} disabled={submitting}
          className="mt-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2">
          {submitting ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Yuborilmoqda...</> : "Yuborish"}
        </button>
      </div>

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="flex justify-center py-4"><svg className="w-5 h-5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <p className="text-sm text-gray-400">Hozircha izoh yo'q. Birinchi bo'ling!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(review.user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{review.user?.name || "Foydalanuvchi"}</p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className={`w-3 h-3 ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
