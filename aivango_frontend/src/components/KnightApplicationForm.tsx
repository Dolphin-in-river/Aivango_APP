import { FormEvent, useEffect, useState } from 'react';
import { createKnightApplication } from '../apiKnights';
import { useAuth } from '../context/AuthContext';
import './Knights.css';
import { fetchCategories } from "../api.ts";
import { Category } from "../types.ts";

interface Props {
  tournamentId: number;
  refresh: () => void;
}

const KnightApplicationForm: React.FC<Props> = ({ tournamentId, refresh }) => {
  const { user } = useAuth();
  const token = user?.token ?? '';

  // NOTE: Этот компонент сейчас не используется в основном флоу (есть более новая форма).
  // Оставлен только чтобы проект собирался.

  const [knightName, setKnightName] = useState<string>(user?.firstName ?? '');
  const [knightSurname, setKnightSurname] = useState<string>(user?.lastName ?? '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [resume, setResume]         = useState('');
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (!token) return;

    fetchCategories(token)
        .then(setCategories)
        .catch(e =>
            setErr(
                e instanceof Error ? e.message : 'Не удалось загрузить категории',
            ),
        );
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await createKnightApplication(token, {
        tournamentId,
        knightName: knightName.trim(),
        knightSurname: knightSurname.trim(),
        motivation: resume.trim() === '' ? null : resume.trim(),
      });
      setResume('');
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = (id: number) => {
    setSelected(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  return (
      <form className="tournament-form" onSubmit={onSubmit}>
        <h3>Create application</h3>

        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <label>
            Name
            <input
              value={knightName}
              onChange={(e) => setKnightName(e.target.value)}
              className="input"
              placeholder="First name"
            />
          </label>

          <label>
            Surname
            <input
              value={knightSurname}
              onChange={(e) => setKnightSurname(e.target.value)}
              className="input"
              placeholder="Last name"
            />
          </label>
        </div>

        <h3>Select the categories to participate in (at least 1):</h3>
        <ul className="categories-list">
          {categories.map(cat => (
              <li key={cat.id}>
                <label>
                  <input
                      type="checkbox"
                      checked={selected.includes(cat.id)}
                      onChange={() => toggleLocation(cat.id)}
                  />
                  {cat.description}
                </label>
              </li>
          ))}
        </ul>

        <textarea
            rows={3}
            placeholder="Description"
            value={resume}
            onChange={e => setResume(e.target.value)}
        />

        {err && <p className="error">{err}</p>}

        <button className="app-btn primary" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit'}
        </button>
      </form>
  );
};

export default KnightApplicationForm;
