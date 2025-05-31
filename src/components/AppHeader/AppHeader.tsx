import React from 'react';
import type { FC } from 'react';
import styles from './AppHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPlus } from '@fortawesome/free-solid-svg-icons';

interface AppHeaderProps {
    onOpenPreferences: () => void;
    onAddProject: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onOpenPreferences, onAddProject }) => {
    return (
        <header className={styles.appHeader}>
            <div className={styles.title}>Project Pulse UI</div>
            <div className={styles.headerControls}>
                <button
                    onClick={onAddProject}
                    className={`${styles.controlButton} ${styles.addProjectButton}`}
                    title='Add New Project'
                >
                    <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                    onClick={onOpenPreferences}
                    className={`${styles.controlButton} ${styles.settingsButton}`}
                    title='Preferences'
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>
        </header>
    );
};

export default AppHeader;
