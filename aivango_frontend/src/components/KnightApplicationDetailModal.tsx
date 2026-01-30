import { useState } from 'react';
import { KnightApplicationStatus, updateApplicationStatus } from '../apiKnights';
import { useAuth } from '../context/AuthContext';
import './Knights.css';

interface Props {
  // Компонент сейчас не используется напрямую, но оставлен для совместимости.
  // Структура application может отличаться в разных версиях API.
  application: {
    id: number;
    knightName?: string | null;
    knightSurname?: string | null;
    motivation?: string | null;
    birthDate?: string | null;
    height?: number | null;
    weight?: number | null;
  };
  onClose: () => void;
  refresh: () => void;
}

const KnightApplicationDetailModal: React.FC<Props> = ({
  application,
  onClose,
  refresh,
}) => {
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [comment, setComment]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const act = async (status: KnightApplicationStatus) => {
    setSaving(true);
    setError(null);
    try {
      await updateApplicationStatus(token, application.id, status, comment);
      refresh();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <h3>{[application.knightName, application.knightSurname].filter(Boolean).join(' ') || 'Заявка'}</h3>

        <div className="text-sm" style={{ marginTop: '0.6rem' }}>
          {application.birthDate && (
            <p><strong>Дата рождения:</strong> {application.birthDate}</p>
          )}
          {application.height != null && (
            <p><strong>Рост:</strong> {application.height} см</p>
          )}
          {application.weight != null && (
            <p><strong>Вес:</strong> {application.weight} кг</p>
          )}
          {application.motivation && (
            <p><strong>Мотивация:</strong> {application.motivation}</p>
          )}
        </div>

        <textarea
          rows={3}
          placeholder="Комментарий (обязательно при отказе/доработке)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="app-btn primary"
            onClick={() => act('APPROVED')}
            disabled={saving}
          >
            Принять
          </button>

          <button
            className="app-btn secondary"
            onClick={() => act('REJECTED')}
            disabled={saving || !comment.trim()}
          >
            Отклонить
          </button>

          <button
            className="app-btn secondary"
            onClick={() => act('EDITS')}
            disabled={saving || !comment.trim()}
          >
            На&nbsp;доработку
          </button>
        </div>

        <button
          className="app-btn secondary"
          style={{ marginTop: '0.8rem' }}
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default KnightApplicationDetailModal;
