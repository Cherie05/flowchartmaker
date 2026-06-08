import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const userEmail = localStorage.getItem('user_email') || 'anonymous';
      
      const { error } = await supabase
        .from('feedbacks')
        .insert([{ rating, message, user_email: userEmail }]);

      if (error) throw error;
      
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setRating(0);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md shadow-[0_20px_48px_-30px_rgba(0,0,0,0.1)] relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-emerald-500 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Thank You!</h3>
            <p className="text-slate-600 font-light">Your feedback helps us improve Wizzleflow.</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Enjoying Wizzleflow?</h3>
            <p className="text-slate-600 font-light text-sm mb-8">
              Let us know how your experience has been so far. Your feedback is highly appreciated!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        (hoveredRating || rating) >= star
                          ? 'fill-indigo-600 text-indigo-600'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Any suggestions or issues? (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-indigo-600 focus:bg-white resize-none h-24 font-light"
                  placeholder="Tell us what you think..."
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 py-4 text-base font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
