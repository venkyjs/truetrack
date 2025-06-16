import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import styles from './AppHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPlus, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Default Tippy CSS
import 'tippy.js/themes/light.css'; // Optional: if you want a base light theme to customize from
import logo from '../../assets/truetrack-logo.png';

interface AppHeaderProps {
    onOpenPreferences: () => void;
    onAddProject: () => void;
    onSearchChange: (searchTerm: string) => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onOpenPreferences, onAddProject, onSearchChange }) => {
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchVisible) {
            searchInputRef.current?.focus();
        }
    }, [isSearchVisible]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
        onSearchChange(newSearchTerm);
    };

    const clearSearch = () => {
        setSearchTerm('');
        onSearchChange('');
        setIsSearchVisible(false);
    };

    const handleSearchBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        if (!searchContainerRef.current?.contains(event.relatedTarget as Node | null)) {
            if (!searchTerm) {
                setIsSearchVisible(false);
            }
        }
    };

    const handleSearchIconClick = () => {
        if (isSearchVisible && searchTerm) {
            searchInputRef.current?.focus();
            return; // Don't close if there is a search term, just focus
        }
        setIsSearchVisible(!isSearchVisible);
    };

    return (
        <header className={styles.appHeader}>
            <div className={styles.logoContainer}>
                <img src={logo} alt='TrueTrack!' className={styles.logo} />
            </div>
            <div className={styles.headerControls}>
                <div
                    ref={searchContainerRef}
                    className={`${styles.searchContainer} ${
                        isSearchVisible ? styles.searchVisible : ''
                    }`}
                    onBlur={handleSearchBlur}
                >
                    <Tippy content='Search' placement='bottom' theme='material'>
                        <button
                            onClick={handleSearchIconClick}
                            className={`${styles.controlButton} ${styles.searchButton}`}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                    </Tippy>
                    <input
                        ref={searchInputRef}
                        type='text'
                        placeholder='Search projects...'
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {searchTerm && (
                        <Tippy content='Clear Search' placement='bottom' theme='material'>
                            <button onClick={clearSearch} className={styles.clearSearchButton}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </Tippy>
                    )}
                </div>
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
