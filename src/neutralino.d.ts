// Neutralino API type definitions
declare global {
    interface Window {
        NL_TOKEN?: string;
        NL_CWD?: string;
        NL_ARGS?: string[];
        NL_PATH?: string;
        NL_PORT?: number;
        NL_MODE?: string;
        NL_VERSION?: string;
        NL_CVERSION?: string;
        NL_COMMIT?: string;
        NL_CCOMMIT?: string;
        NL_OS?: string;
        NL_ARCH?: string;
        NL_APPID?: string;
        NL_APPVERSION?: string;
        NL_EXTENABLED?: boolean;
        NL_RESMODE?: string;
        NL_CLDONE?: boolean;
        NL_PLUGINS?: string[];
    }

    namespace Neutralino {
        namespace app {
            function exit(code?: number): Promise<void>;
            function killProcess(): Promise<void>;
            function restartProcess(): Promise<void>;
            function getConfig(): Promise<any>;
            function broadcast(event: string, data?: any): Promise<void>;
        }

        namespace filesystem {
            interface FileReaderOptions {
                pos?: number;
                size?: number;
            }

            interface DirectoryReaderOptions {
                recursive?: boolean;
            }

            interface Stats {
                size: number;
                isFile: boolean;
                isDirectory: boolean;
                createdAt: number;
                modifiedAt: number;
            }

            interface DirectoryEntry {
                entry: string;
                type: string;
            }

            function createDirectory(path: string): Promise<void>;
            function removeDirectory(path: string): Promise<void>;
            function writeFile(filename: string, data: string): Promise<void>;
            function appendFile(filename: string, data: string): Promise<void>;
            function writeBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
            function appendBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
            function readFile(filename: string, options?: FileReaderOptions): Promise<string>;
            function readBinaryFile(
                filename: string,
                options?: FileReaderOptions
            ): Promise<ArrayBuffer>;
            function removeFile(filename: string): Promise<void>;
            function readDirectory(
                path: string,
                options?: DirectoryReaderOptions
            ): Promise<DirectoryEntry[]>;
            function copyFile(source: string, destination: string): Promise<void>;
            function moveFile(source: string, destination: string): Promise<void>;
            function getStats(path: string): Promise<Stats>;
        }

        namespace os {
            interface SpawnedProcess {
                id: number;
                pid: number;
            }

            function execCommand(
                command: string,
                options?: { background?: boolean; cwd?: string }
            ): Promise<{ pid: number; stdOut: string; stdErr: string; exitCode: number }>;
            function spawnProcess(command: string, cwd?: string): Promise<SpawnedProcess>;
            function updateSpawnedProcess(id: number, event?: string, data?: any): Promise<void>;
            function getSpawnedProcesses(): Promise<SpawnedProcess[]>;
            function getEnv(key: string): Promise<string>;
            function getEnvs(): Promise<Record<string, string>>;
            function showOpenDialog(
                title?: string,
                options?: {
                    multiSelections?: boolean;
                    filters?: Array<{ name: string; extensions: string[] }>;
                }
            ): Promise<string[]>;
            function showFolderDialog(title?: string): Promise<string>;
            function showSaveDialog(
                title?: string,
                options?: { filters?: Array<{ name: string; extensions: string[] }> }
            ): Promise<string>;
            function showNotification(title: string, content: string, icon?: string): Promise<void>;
            function showMessageBox(
                title: string,
                content: string,
                choice?: string,
                icon?: string
            ): Promise<string>;
            function setTray(options: {
                icon: string;
                menuItems: Array<{
                    id?: string;
                    text: string;
                    isDisabled?: boolean;
                    isChecked?: boolean;
                }>;
            }): Promise<void>;
            function getPath(name: string): Promise<string>;
            function open(url: string): Promise<void>;
        }

        namespace storage {
            function setData(key: string, data: string): Promise<void>;
            function getData(key: string): Promise<string>;
            function getKeys(): Promise<string[]>;
        }

        namespace window {
            function setTitle(title: string): Promise<void>;
            function getTitle(): Promise<string>;
            function maximize(): Promise<void>;
            function unmaximize(): Promise<void>;
            function isMaximized(): Promise<boolean>;
            function minimize(): Promise<void>;
            function setFullScreen(): Promise<void>;
            function exitFullScreen(): Promise<void>;
            function isFullScreen(): Promise<boolean>;
            function show(): Promise<void>;
            function hide(): Promise<void>;
            function isVisible(): Promise<boolean>;
            function focus(): Promise<void>;
            function setIcon(icon: string): Promise<void>;
            function move(x: number, y: number): Promise<void>;
            function setDraggableRegion(domId: string): Promise<void>;
            function unsetDraggableRegion(domId: string): Promise<void>;
            function setSize(options: {
                width?: number;
                height?: number;
                minWidth?: number;
                minHeight?: number;
                maxWidth?: number;
                maxHeight?: number;
                resizable?: boolean;
            }): Promise<void>;
            function getSize(): Promise<{ width: number; height: number }>;
            function getPosition(): Promise<{ x: number; y: number }>;
        }

        namespace events {
            function on(event: string, handler: Function): Promise<void>;
            function off(event: string, handler: Function): Promise<void>;
            function dispatch(event: string, data?: any): Promise<void>;
        }

        namespace debug {
            function log(message: string, type?: string): Promise<void>;
        }

        namespace clipboard {
            function getFormat(): Promise<string>;
            function readText(): Promise<string>;
            function writeText(text: string): Promise<void>;
        }

        function init(): Promise<void>;
    }
}

export {};
