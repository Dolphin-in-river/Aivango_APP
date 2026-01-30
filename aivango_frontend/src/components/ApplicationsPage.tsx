import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApplications } from '../api';
import {ApplicationDTO} from "../types.ts";
import './ApplicationsPage.css';
type ViewState = 'loading' | 'ready' | 'error' | 'unauth';

const ApplicationsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [applications, setApplications] = useState<ApplicationDTO[]>([]);
    const [state, setState] = useState<ViewState>('loading');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!user?.token) {
                setState('unauth');
                return;
            }

            setState('loading');
            try {
                const data = await getApplications(Number(id), user.token);
                if (!cancelled) {
                    setApplications(data);
                    setState('ready');
                }
            } catch {
                if (!cancelled) setState('error');
            }
        };

        load();
        return () => { cancelled = true; };
    }, [id, user?.token]);

    if (state === 'unauth') return <p>Пожалуйста, авторизуйтесь для просмотра заявок.</p>;
    if (state === 'loading') return <p>Загрузка...</p>;
    if (state === 'error') return <p>Ошибка при загрузке заявок.</p>;

    return (
        <div className="tournaments-wrapper">
            <h2>Заявки на турнир #{id}</h2>
            <table className="application-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя смельчака</th>
                    <th>Дата подачи заявки</th>
                </tr>
                </thead>
                <tbody>
                {applications.map(app => (
                    <tr key={app.id}>
                        <td>{app.id}</td>
                        <td>{app.fullName}</td>
                        <td>{new Date(app.createdAt).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ApplicationsPage;
