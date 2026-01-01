/**
 * Help System Utility Functions
 */

export interface Heading {
    id: string;
    title: string;
    level: number;
}

/**
 * Calculate estimated reading time based on word count
 * Average reading speed: 200 words per minute
 */
export function calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);

    if (minutes < 1) {
        return '1 min';
    } else if (minutes === 1) {
        return '1 min';
    } else {
        return `${minutes} min`;
    }
}

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Format date for "last updated" display
 */
export function formatLastUpdated(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
        return 'today';
    } else if (diffInDays === 1) {
        return 'yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerm(
    text: string,
    searchTerm: string
): string {
    if (!searchTerm.trim()) {
        return text;
    }

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract headings from HTML content for TOC generation
 * Note: This is a simplified version. In a real implementation,
 * you might parse the actual React component or use a markdown parser.
 */
export function extractHeadings(htmlContent: string): Heading[] {
    const headings: Heading[] = [];
    const regex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
    let match;

    while ((match = regex.exec(htmlContent)) !== null) {
        headings.push({
            level: parseInt(match[1]),
            id: match[2],
            title: match[3].replace(/<[^>]*>/g, ''), // Strip HTML tags
        });
    }

    return headings;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get excerpt from content (first paragraph or N characters)
 */
export function getExcerpt(content: string, maxLength: number = 160): string {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Get first paragraph or truncate
    const firstParagraph = plainText.split('\n\n')[0];
    
    if (firstParagraph.length <= maxLength) {
        return firstParagraph.trim();
    }
    
    return truncate(firstParagraph, maxLength);
}

/**
 * Search through text with fuzzy matching
 */
export function fuzzySearch(text: string, query: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
        return true;
    }
    
    // Split query into words for multi-word search
    const queryWords = normalizedQuery.split(/\s+/);
    
    // Check if all query words are present in text
    return queryWords.every(word => normalizedText.includes(word));
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevance(
    text: string,
    searchTerm: string,
    weights: {
        title?: number;
        description?: number;
        keywords?: number;
        content?: number;
    } = {}
): number {
    const defaultWeights = {
        title: 10,
        description: 5,
        keywords: 7,
        content: 1,
        ...weights,
    };

    const normalizedText = text.toLowerCase();
    const normalizedQuery = searchTerm.toLowerCase().trim();
    
    if (!normalizedQuery) {
        return 0;
    }
    
    // Count occurrences
    const occurrences = (normalizedText.match(new RegExp(escapeRegExp(normalizedQuery), 'g')) || []).length;
    
    // Simple relevance score based on occurrence count
    return occurrences;
}

/**
 * Store search history in localStorage
 */
export function saveSearchHistory(query: string, maxHistory: number = 10): void {
    if (!query.trim()) return;
    
    try {
        const history = getSearchHistory();
        const updated = [query, ...history.filter(q => q !== query)].slice(0, maxHistory);
        localStorage.setItem('help-search-history', JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save search history:', error);
    }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): string[] {
    try {
        const stored = localStorage.getItem('help-search-history');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to get search history:', error);
        return [];
    }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
    try {
        localStorage.removeItem('help-search-history');
    } catch (error) {
        console.error('Failed to clear search history:', error);
    }
}

