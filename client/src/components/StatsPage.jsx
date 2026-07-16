import { useEffect, useState } from 'react';
import { api } from '../api/api';
import BarChart from './BarChart';

export default function StatsPage() {
  const [stats, setStats] = useState({ months: [], groups: [], cities: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [months, groups, cities] = await Promise.all([
          api.stats('posts-per-month'),
          api.stats('members-per-group'),
          api.stats('users-per-city')
        ]);
        setStats({ months, groups, cities });
      } catch (err) { setError(err.message); }
    })();
  }, []);

  return (
    <section>
      <h2>Live statistics</h2>
      {error && <p className="error">{error}</p>}
      <div className="columns">
        <BarChart data={stats.months} title="Posts per month" />
        <BarChart data={stats.groups} title="Members per group" />
        <BarChart data={stats.cities} title="Users per city" />
      </div>
    </section>
  );
}
