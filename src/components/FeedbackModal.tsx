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
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
            <p className="text-slate-400">Your feedback helps us improve Wizzleflow.</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-2">Enjoying Wizzleflow?</h3>
            <p className="text-slate-400 text-sm mb-6">
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
                      className={`w-8 h-8 transition-colors ${
                        (hoveredRating || rating) >= star
                          ? 'fill-indigo-500 text-indigo-500'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Any suggestions or issues? (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
                  placeholder="Tell us what you think..."
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
