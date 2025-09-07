import { useEffect, useRef, useCallback } from 'react';
import Masonry from 'masonry-layout';

interface MasonryOptions {
    itemSelector: string;
    columnWidth: string | number | Element;
    gutter: number;
    fitWidth: boolean;
    transitionDuration: string;
    percentPosition?: boolean;
}

interface UseMasonryProps {
    dependencies?: any[];
    options?: Partial<MasonryOptions>;
}

export const useMasonry = ({ dependencies = [], options = {} }: UseMasonryProps = {}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const masonryRef = useRef<Masonry | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const defaultOptions: MasonryOptions = {
        itemSelector: '.masonry-item',
        columnWidth: 300,
        gutter: 16,
        fitWidth: true,
        percentPosition: false,
        transitionDuration: '0.3s',
        ...options
    };

    // Initialize Masonry
    const initMasonry = useCallback(() => {
        if (!containerRef.current) return;

        // Destroy existing instance
        if (masonryRef.current) {
            masonryRef.current.destroy();
            masonryRef.current = null;
        }

        // Wait for DOM to be ready
        requestAnimationFrame(() => {
            if (containerRef.current) {
                // Create new instance
                masonryRef.current = new Masonry(containerRef.current, defaultOptions);

                // Force initial layout
                setTimeout(() => {
                    if (masonryRef.current) {
                        masonryRef.current.layout();
                    }
                }, 100);
            }
        });
    }, [defaultOptions]);

    // Layout items
    const layout = useCallback(() => {
        if (masonryRef.current) {
            masonryRef.current.layout();
        }
    }, []);

    // Add new items
    const appended = useCallback((elements: Element[]) => {
        if (masonryRef.current) {
            masonryRef.current.appended(elements);
        }
    }, []);

    // Handle resize with debouncing
    const handleResize = useCallback(() => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
            layout();
        }, 250); // 250ms debounce
    }, [layout]);

    // Initialize on mount and when dependencies change
    useEffect(() => {
        const timer = setTimeout(() => {
            initMasonry();
        }, 100);

        return () => clearTimeout(timer);
    }, [initMasonry, ...dependencies]);

    // Re-layout when dependencies change
    useEffect(() => {
        if (masonryRef.current && dependencies.length > 0) {
            const timer = setTimeout(() => {
                layout();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, dependencies);

    // Handle window resize
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [handleResize]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (masonryRef.current) {
                masonryRef.current.destroy();
            }
        };
    }, []);

    return {
        containerRef,
        layout,
        appended,
        masonry: masonryRef.current
    };
};
