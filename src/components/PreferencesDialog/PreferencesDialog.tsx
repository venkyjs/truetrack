import { useState, useRef } from 'react';
import type { ChangeEvent, FC } from 'react';
import styles from './PreferencesDialog.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faUpload,
    faKey,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { getAllDataFromDB, clearAllDataInDB, restoreDataToDB } from '../../utils/dataUtils';
import { encryptData, decryptData } from '../../utils/cryptoUtils';

interface PreferencesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onWallpaperChange: (wallpaper: string | null) => void;
}

const PreferencesDialog: FC<PreferencesDialogProps> = ({ isOpen, onClose, onWallpaperChange }) => {
    const [selectedSection, setSelectedSection] = useState('general');
    const [activeDataTab, setActiveDataTab] = useState('backup');
    const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null);
    const [downloadPassphrase, setDownloadPassphrase] = useState('');
    const [restorePassphrase, setRestorePassphrase] = useState('');
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDownloadData = async () => {
        setError(null);
        setSuccessMessage(null);
        if (!downloadPassphrase) {
            setError('Passphrase is required to download data.');
            return;
        }
        try {
            const data = await getAllDataFromDB();
            if (!data || Object.keys(data).length === 0) {
                setError('No data found in the database to download.');
                return;
            }
            const encryptedData = await encryptData(JSON.stringify(data), downloadPassphrase);
            const blob = new Blob([encryptedData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project-pulse-backup.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSuccessMessage('Data downloaded successfully. Keep your passphrase safe!');
            setDownloadPassphrase('');
        } catch (err) {
            console.error('Error downloading data:', err);
            setError('Failed to download data. Check console for details.');
        }
    };

    const handleRestoreFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setRestoreFile(event.target.files[0]);
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleRestoreData = async () => {
        setError(null);
        setSuccessMessage(null);
        if (!restoreFile) {
            setError('Please select a file to restore.');
            return;
        }
        if (!restorePassphrase) {
            setError('Passphrase is required to restore data.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const encryptedData = e.target?.result as string;
                if (!encryptedData) {
                    setError('File is empty or could not be read.');
                    return;
                }
                const decryptedDataString = await decryptData(encryptedData, restorePassphrase);
                const dataToRestore = JSON.parse(decryptedDataString);

                await clearAllDataInDB();
                await restoreDataToDB(dataToRestore);
                setSuccessMessage(
                    'Data restored successfully! The application might need to refresh to reflect changes.'
                );
                setRestorePassphrase('');
                setRestoreFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset file input
                }
                // Optionally, you might want to trigger a page reload or a state update in App.tsx
                // to reflect the restored data immediately.
            } catch (err) {
                console.error('Error restoring data:', err);
                setError(
                    'Failed to restore data. Incorrect passphrase or corrupted file. Check console for details.'
                );
            }
        };
        reader.onerror = () => {
            setError('Error reading the restore file.');
        };
        reader.readAsText(restoreFile);
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
                        <button
                            className={`${styles.sidebarButton} ${
                                selectedSection === 'data' ? styles.active : ''
                            }`}
                            onClick={() => {
                                setSelectedSection('data');
                                setError(null);
                                setSuccessMessage(null);
                            }}
                        >
                            Data Management
                        </button>
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
                        {selectedSection === 'data' && (
                            <div className={styles.section}>
                                <h3>Data Management</h3>

                                <div className={styles.tabContainer}>
                                    <button
                                        className={`${styles.tabButton} ${
                                            activeDataTab === 'backup' ? styles.activeTab : ''
                                        }`}
                                        onClick={() => setActiveDataTab('backup')}
                                    >
                                        Backup
                                    </button>
                                    <button
                                        className={`${styles.tabButton} ${
                                            activeDataTab === 'restore' ? styles.activeTab : ''
                                        }`}
                                        onClick={() => setActiveDataTab('restore')}
                                    >
                                        Restore
                                    </button>
                                </div>

                                {error && (
                                    <p className={styles.errorMessage}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                                    </p>
                                )}
                                {successMessage && (
                                    <p className={styles.successMessage}>{successMessage}</p>
                                )}

                                {activeDataTab === 'backup' && (
                                    <div className={styles.settingItem}>
                                        <p className={styles.warningMessage}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            Important: Remember this passphrase. You will need it to
                                            restore your data. We cannot recover it for you.
                                        </p>
                                        <label htmlFor='downloadPassphrase'>
                                            Encryption Passphrase:
                                        </label>
                                        <div className={styles.inputWithIcon}>
                                            <FontAwesomeIcon
                                                icon={faKey}
                                                className={styles.inputIcon}
                                            />
                                            <input
                                                type='password'
                                                id='downloadPassphrase'
                                                value={downloadPassphrase}
                                                onChange={(e) =>
                                                    setDownloadPassphrase(e.target.value)
                                                }
                                                className={styles.textInput}
                                                placeholder='Enter a strong passphrase'
                                            />
                                        </div>
                                        <button
                                            onClick={handleDownloadData}
                                            className={`${styles.dialogButton} ${styles.primaryButton}`}
                                            disabled={!downloadPassphrase}
                                        >
                                            <FontAwesomeIcon icon={faDownload} /> Download Encrypted
                                            Data
                                        </button>
                                    </div>
                                )}

                                {activeDataTab === 'restore' && (
                                    <div className={styles.settingItem}>
                                        <p className={styles.standardMessage}>
                                            Upload your previously downloaded data file and enter
                                            the passphrase to restore.
                                        </p>
                                        <label htmlFor='restoreFile'>Backup File (.txt):</label>
                                        <input
                                            type='file'
                                            id='restoreFile'
                                            accept='.txt'
                                            onChange={handleRestoreFileChange}
                                            className={styles.fileInput}
                                            ref={fileInputRef}
                                        />
                                        <label htmlFor='restorePassphrase'>
                                            Decryption Passphrase:
                                        </label>
                                        <div className={styles.inputWithIcon}>
                                            <FontAwesomeIcon
                                                icon={faKey}
                                                className={styles.inputIcon}
                                            />
                                            <input
                                                type='password'
                                                id='restorePassphrase'
                                                value={restorePassphrase}
                                                onChange={(e) =>
                                                    setRestorePassphrase(e.target.value)
                                                }
                                                className={styles.textInput}
                                                placeholder='Enter passphrase for backup'
                                            />
                                        </div>
                                        <button
                                            onClick={handleRestoreData}
                                            className={`${styles.dialogButton} ${styles.primaryButton}`}
                                            disabled={!restoreFile || !restorePassphrase}
                                        >
                                            <FontAwesomeIcon icon={faUpload} /> Restore Data
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
