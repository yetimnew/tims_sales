import * as React from 'react';
import { Check, Copy, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
    showLineNumbers?: boolean;
    className?: string;
}

export const CodeBlock = React.memo(function CodeBlock({
    code,
    language = 'text',
    fileName,
    showLineNumbers = false,
    className,
}: CodeBlockProps) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const lines = code.split('\n');

    return (
        <div className={cn('my-6 rounded-lg border bg-muted/50', className)}>
            {/* Header */}
            {(fileName || language) && (
                <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
                    <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        {fileName ? (
                            <span className="text-sm font-medium">{fileName}</span>
                        ) : (
                            <span className="text-sm text-muted-foreground">{language}</span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 gap-1.5"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                <span className="text-xs">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-xs">Copy</span>
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Code Content */}
            <div className="relative overflow-x-auto">
                <pre className="p-4 text-sm">
                    <code className="block font-mono">
                        {showLineNumbers ? (
                            <table className="w-full border-collapse">
                                <tbody>
                                    {lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="pr-4 text-right select-none text-muted-foreground/50 align-top">
                                                {index + 1}
                                            </td>
                                            <td className="pl-4 border-l">
                                                {line || '\n'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            code
                        )}
                    </code>
                </pre>

                {/* Copy Button for no-header version */}
                {!fileName && !language && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="absolute top-2 right-2 h-7 gap-1.5"
                    >
                        {copied ? (
                            <Check className="h-3.5 w-3.5" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
});

