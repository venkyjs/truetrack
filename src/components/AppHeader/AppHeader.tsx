import React from 'react';
import type { FC } from 'react';
import styles from './AppHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPlus } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Default Tippy CSS
import 'tippy.js/themes/light.css'; // Optional: if you want a base light theme to customize from

interface AppHeaderProps {
    onOpenPreferences: () => void;
    onAddProject: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onOpenPreferences, onAddProject }) => {
    return (
        <header className={styles.appHeader}>
            <div className={styles.logoContainer}>
                <img src='/truetrack-logo.png' alt='TrueTrack!' className={styles.logo} />
            </div>
            <div className={styles.headerControls}>
                <Tippy content='Add New Project' placement='bottom' theme='material'>
                    <button
                        onClick={onAddProject}
                        className={`${styles.controlButton} ${styles.addProjectButton}`}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </Tippy>
                <Tippy content='Preferences' placement='bottom' theme='material'>
                    <button
                        onClick={onOpenPreferences}
                        className={`${styles.controlButton} ${styles.settingsButton}`}
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </Tippy>
            </div>
        </header>
    );
};

export default AppHeader;
