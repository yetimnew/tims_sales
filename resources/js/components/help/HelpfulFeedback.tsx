import * as React from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface HelpfulFeedbackProps {
    articleId: string;
    onFeedback?: (feedback: { helpful: boolean; comment?: string }) => void;
    className?: string;
}

export const HelpfulFeedback = React.memo(function HelpfulFeedback({
    articleId,
    onFeedback,
    className,
}: HelpfulFeedbackProps) {
    const [feedback, setFeedback] = React.useState<boolean | null>(null);
    const [showComment, setShowComment] = React.useState(false);
    const [comment, setComment] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    // Check if user already provided feedback for this article
    React.useEffect(() => {
        const storedFeedback = sessionStorage.getItem(`help-feedback-${articleId}`);
        if (storedFeedback) {
            setSubmitted(true);
            setFeedback(JSON.parse(storedFeedback).helpful);
        }
    }, [articleId]);

    const handleFeedbackClick = (helpful: boolean) => {
        setFeedback(helpful);
        setShowComment(true);
    };

    const handleSubmit = () => {
        const feedbackData = {
            helpful: feedback!,
            comment: comment.trim() || undefined,
            timestamp: new Date().toISOString(),
        };

        // Store in session storage
        sessionStorage.setItem(
            `help-feedback-${articleId}`,
            JSON.stringify(feedbackData)
        );

        // Call callback if provided
        onFeedback?.(feedbackData);

        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div
                className={cn(
                    'my-8 rounded-lg border bg-card p-6 text-center',
                    className
                )}
            >
                <p className="text-sm text-muted-foreground">
                    ✅ Thank you for your feedback! It helps us improve our documentation.
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'my-8 rounded-lg border bg-card p-6',
                className
            )}
        >
            <div className="text-center">
                <h3 className="text-base font-semibold mb-2">Was this article helpful?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Help us improve our documentation
                </p>

                {feedback === null ? (
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleFeedbackClick(true)}
                            className="gap-2"
                        >
                            <ThumbsUp className="h-5 w-5" />
                            Yes, helpful
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleFeedbackClick(false)}
                            className="gap-2"
                        >
                            <ThumbsDown className="h-5 w-5" />
                            Not helpful
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Show selected feedback */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            {feedback ? (
                                <>
                                    <ThumbsUp className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">Marked as helpful</span>
                                </>
                            ) : (
                                <>
                                    <ThumbsDown className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">Marked as not helpful</span>
                                </>
                            )}
                        </div>

                        {/* Optional comment */}
                        {showComment && (
                            <div className="max-w-md mx-auto space-y-3">
                                <div className="flex items-start gap-2 text-left">
                                    <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="feedback-comment"
                                            className="text-sm font-medium mb-1 block"
                                        >
                                            {feedback
                                                ? 'What did you find most helpful?'
                                                : 'How can we improve this article?'}
                                        </label>
                                        <Textarea
                                            id="feedback-comment"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Your feedback (optional)..."
                                            rows={3}
                                            className="resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setFeedback(null);
                                            setShowComment(false);
                                            setComment('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSubmit}>
                                        Submit Feedback
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

