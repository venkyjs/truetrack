import React, { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import styles from './PreferencesDialog.module.css';

interface PreferencesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onWallpaperChange: (wallpaper: string | null) => void;
}

const PreferencesDialog: FC<PreferencesDialogProps> = ({ isOpen, onClose, onWallpaperChange }) => {
    const [selectedSection, setSelectedSection] = useState('general');
    const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleWallpaperSelect = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSelectedWallpaper(result); // Store image data URL
                if (onWallpaperChange) {
                    onWallpaperChange(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h2>Preferences</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        &times;
                    </button>
                </div>
                <div className={styles.contentArea}>
                    <div className={styles.sidebar}>
                        <button
                            className={`${styles.sidebarButton} ${
                                selectedSection === 'general' ? styles.active : ''
                            }`}
                            onClick={() => setSelectedSection('general')}
                        >
                            General
                        </button>
                        {/* Add more sections here */}
                    </div>
                    <div className={styles.mainContent}>
                        {selectedSection === 'general' && (
                            <div className={styles.section}>
                                <h3>General Settings</h3>
                                <div className={styles.settingItem}>
                                    <label htmlFor='wallpaperInput'>Application Wallpaper:</label>
                                    <input
                                        type='file'
                                        id='wallpaperInput'
                                        accept='image/*'
                                        onChange={handleWallpaperSelect}
                                        className={styles.fileInput}
                                    />
                                    {selectedWallpaper && (
                                        <div className={styles.imagePreviewContainer}>
                                            <p>Preview:</p>
                                            <img
                                                src={selectedWallpaper}
                                                alt='Wallpaper Preview'
                                                className={styles.imagePreview}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Add content for other sections here */}
                    </div>
                </div>
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.dialogButton}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreferencesDialog;
