import type { Metric } from './uk-stats';

export function matchesMetric(metric: Pick<Metric, 'title' | 'source' | 'category' | 'subcategory'>, query: string) {
  const words = query.trim().toLocaleLowerCase('en-GB').split(/\s+/).filter(Boolean);
  const text = [metric.title, metric.source, metric.category, metric.subcategory].filter(Boolean).join(' ').toLocaleLowerCase('en-GB');
  return words.every(word => text.includes(word));
}