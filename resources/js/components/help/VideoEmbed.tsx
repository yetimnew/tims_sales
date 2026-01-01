import * as React from 'react';
import { Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoEmbedProps {
    title: string;
    description?: string;
    duration?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    className?: string;
}

export const VideoEmbed = React.memo(function VideoEmbed({
    title,
    description,
    duration,
    thumbnailUrl,
    videoUrl,
    className,
}: VideoEmbedProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);

    // Extract video ID and type from URL
    const getVideoEmbed = (url: string) => {
        // YouTube
        const youtubeMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
        );
        if (youtubeMatch) {
            return {
                type: 'youtube',
                embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`,
            };
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return {
                type: 'vimeo',
                embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
            };
        }

        return null;
    };

    const embedInfo = videoUrl ? getVideoEmbed(videoUrl) : null;

    if (isPlaying && embedInfo) {
        return (
            <div className={cn('my-6 aspect-video', className)}>
                <iframe
                    src={embedInfo.embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg border"
                />
            </div>
        );
    }

    return (
        <div className={cn('my-6', className)}>
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted group cursor-pointer">
                {/* Thumbnail or Placeholder */}
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <div className="text-center space-y-3">
                            <Play className="h-16 w-16 text-muted-foreground mx-auto" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Video Tutorial
                            </p>
                        </div>
                    </div>
                )}

                {/* Play Button Overlay */}
                <button
                    onClick={() => videoUrl && setIsPlaying(true)}
                    disabled={!videoUrl}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
                    aria-label={`Play video: ${title}`}
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 ml-1" />
                    </div>
                </button>

                {/* Duration Badge */}
                {duration && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        {duration}
                    </div>
                )}

                {/* Coming Soon Badge */}
                {!videoUrl && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Coming Soon
                    </div>
                )}
            </div>

            {/* Video Info */}
            <div className="mt-3">
                <h4 className="font-semibold text-base mb-1">{title}</h4>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
});

