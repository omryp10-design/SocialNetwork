import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export default function BarChart({ data, title }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = d3.select(ref.current);
    root.selectAll('*').remove();
    if (!data || !data.length) return;

    const width = 480, height = 280, margin = { top: 20, right: 20, bottom: 70, left: 45 };
    const svg = root.append('svg').attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3.scaleBand().domain(data.map((d) => d.label)).range([margin.left, width - margin.right]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) || 1]).nice().range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text').attr('transform', 'rotate(-35)').style('text-anchor', 'end');

    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

    svg.selectAll('rect').data(data).join('rect')
      .attr('x', (d) => x(d.label))
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d.value))
      .attr('rx', 4)
      .attr('fill', 'var(--accent)');
  }, [data]);

  return (
    <section className="chart-card">
      <h3>{title}</h3>
      {data && data.length ? <div ref={ref} /> : <p className="muted">No data yet.</p>}
    </section>
  );
}
