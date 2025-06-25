"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"

interface ReviewFormProps {
  agentId: string
  onSubmit: (review: { rating: number; comment: string }) => Promise<void>
}

export function ReviewForm({ agentId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !comment.trim()) {
      // Maybe show a toast message here
      return
    }
    setIsSubmitting(true)
    await onSubmit({ rating, comment })
    setRating(0)
    setComment("")
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block">Your Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer transition-colors ${
                (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment">Your Review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others what you think about this agent..."
          rows={4}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0 || !comment.trim()}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
} 