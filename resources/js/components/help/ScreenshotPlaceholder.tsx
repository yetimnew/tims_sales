import * as React from 'react';
import { Image as ImageIcon, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Annotation {
    x: number; // percentage from left
    y: number; // percentage from top
    text: string;
    type: 'arrow' | 'number' | 'highlight';
}

interface ScreenshotPlaceholderProps {
    description: string;
    fileName: string;
    width?: number;
    height?: number;
    annotations?: Annotation[];
    caption?: string;
    alt?: string;
    className?: string;
}

export const ScreenshotPlaceholder = React.memo(function ScreenshotPlaceholder({
    description,
    fileName,
    width = 1200,
    height = 800,
    annotations = [],
    caption,
    alt,
    className,
}: ScreenshotPlaceholderProps) {
    const aspectRatio = (height / width) * 100;
    const imagePath = `/images/help/${fileName}`;

    // Check if actual image exists (you can implement actual check if needed)
    const [imageExists, setImageExists] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
        // Try to load the image
        const img = new Image();
        img.src = imagePath;
        img.onload = () => setImageExists(true);
        img.onerror = () => setImageError(true);
    }, [imagePath]);

    if (imageExists && !imageError) {
        return (
            <figure className={cn('my-6', className)}>
                <div className="relative overflow-hidden rounded-lg border bg-muted">
                    <img
                        src={imagePath}
                        alt={alt || description}
                        className="w-full h-auto"
                        loading="lazy"
                    />
                    {/* Render annotations on actual image */}
                    {annotations.map((annotation, index) => (
                        <div
                            key={index}
                            className="absolute"
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                            }}
                        >
                            {annotation.type === 'number' && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg">
                                    {index + 1}
                                </div>
                            )}
                            {annotation.type === 'arrow' && (
                                <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                    {annotation.text}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {caption && (
                    <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                        {caption}
                    </figcaption>
                )}
            </figure>
        );
    }

    return (
        <figure className={cn('my-6', className)}>
            <div
                className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50"
                style={{ paddingBottom: `${aspectRatio}%` }}
            >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                        📸 Screenshot Placeholder
                    </p>
                    <p className="text-xs text-muted-foreground mb-3 max-w-md">
                        {description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 bg-background px-3 py-1.5 rounded-md border">
                        <MapPin className="h-3 w-3" />
                        <code className="text-xs">{imagePath}</code>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground/60">
                        Dimensions: {width} × {height}px
                    </div>

                    {/* Show annotation markers */}
                    {annotations.length > 0 && (
                        <div className="mt-4 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                                Annotations needed:
                            </p>
                            {annotations.map((annotation, index) => (
                                <div
                                    key={index}
                                    className="text-xs text-muted-foreground/70"
                                >
                                    {index + 1}. {annotation.text} ({annotation.type})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {caption && (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
});

