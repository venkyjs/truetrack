import { useState, type FC } from 'react';
import styles from './AppHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPlus, faSearch, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Default Tippy CSS
import 'tippy.js/themes/light.css'; // Optional: if you want a base light theme to customize from
import logo from '../../assets/truetrack-logo.png';

interface AppHeaderProps {
    onOpenPreferences: () => void;
    onAddProject: () => void;
    onSearch: (query: string) => void;
    onAutoLayout: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({
    onOpenPreferences,
    onAddProject,
    onSearch,
    onAutoLayout
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        onSearch(e.target.value);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isSearchOpen) {
            // if closing, clear search
            setSearchQuery('');
            onSearch('');
        }
    };

    return (
        <header className={styles.appHeader}>
            <div className={styles.logoContainer}>
                <img src={logo} alt='TrueTrack!' className={styles.logo} />
            </div>
            <div className={styles.headerControls}>
                <div
                    className={`${styles.searchContainer} ${
                        isSearchOpen ? styles.searchContainerOpen : ''
                    }`}
                >
                    <Tippy content='Search' placement='bottom' theme='material'>
                        <button onClick={toggleSearch} className={styles.controlButton}>
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                    </Tippy>
                    <input
                        type='text'
                        placeholder='Search...'
                        className={`${styles.searchInput} ${
                            isSearchOpen ? styles.searchInputOpen : ''
                        }`}
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                <Tippy content='Auto-layout Projects' placement='bottom' theme='material'>
                    <button
                        onClick={onAutoLayout}
                        className={`${styles.controlButton} ${styles.autoLayoutButton}`}
                    >
                        <FontAwesomeIcon icon={faLayerGroup} />
                    </button>
                </Tippy>
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
