import React, { useEffect, useState } from 'react';
import type { Project } from '../types';

interface NotificationManagerProps {
    projects: Project[];
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ projects }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(setPermission);
        } else {
            setPermission('granted');
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (permission === 'granted') {
                const now = new Date();
                projects.forEach((project) => {
                    project.tasks.forEach((task) => {
                        if (task.reminder) {
                            const reminderTime = new Date(task.reminder);
                            if (
                                reminderTime.getFullYear() === now.getFullYear() &&
                                reminderTime.getMonth() === now.getMonth() &&
                                reminderTime.getDate() === now.getDate() &&
                                reminderTime.getHours() === now.getHours() &&
                                reminderTime.getMinutes() === now.getMinutes() &&
                                reminderTime.getSeconds() === now.getSeconds()
                            ) {
                                new Notification('Reminder', {
                                    body: `Task: ${task.title}`
                                });
                            }
                        }
                    });
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [permission, projects]);

    return null; // This component does not render anything
};

export default NotificationManager;
