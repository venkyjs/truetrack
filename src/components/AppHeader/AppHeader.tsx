import React from 'react';
import type { FC } from 'react';
import styles from './AppHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

interface AppHeaderProps {
    onOpenPreferences: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onOpenPreferences }) => {
    return (
        <header className={styles.appHeader}>
            <div className={styles.title}>Project Pulse UI</div>
            <div className={styles.headerControls}>
                <button
                    onClick={onOpenPreferences}
                    className={styles.settingsButton}
                    title='Preferences'
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>
        </header>
    );
};

export default AppHeader;
