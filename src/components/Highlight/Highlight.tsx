import type { FC } from 'react';
import styles from './Highlight.module.css';

interface HighlightProps {
    text: string;
    highlight: string;
}

const Highlight: FC<HighlightProps> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) =>
                regex.test(part) ? (
                    <mark key={index} className={styles.highlight}>
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
};

export default Highlight;
