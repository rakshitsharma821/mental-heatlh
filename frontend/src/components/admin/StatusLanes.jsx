import React from 'react';

/**
 * Lane strip: groups `items` by `field` and shows one lane per distinct value found in the data
 * (nothing is hard-coded — lanes appear only for statuses that exist). Each lane is a tall ruled
 * column with a count and the first few labels, like pigeon-holes on a desk.
 */
export default function StatusLanes({ items = [], field, label, max = 4, title }) {
  const lanes = new Map();
  items.forEach((it) => {
    const key = it?.[field] || 'unspecified';
    if (!lanes.has(key)) lanes.set(key, []);
    lanes.get(key).push(it);
  });
  if (lanes.size === 0) return null;
  return (
    <div className="lanes" role="list" aria-label={title || 'Grouped by status'}>
      {[...lanes.entries()].map(([key, list]) => (
        <section key={key} className="lane" role="listitem" data-s={key}>
          <header><span className="lane-k">{String(key).replace(/_/g, ' ')}</span><b className="num">{list.length}</b></header>
          <ul>
            {list.slice(0, max).map((it, i) => <li key={it.id || it.user_id || i}>{label(it)}</li>)}
            {list.length > max && <li className="more">+ {list.length - max} more</li>}
          </ul>
        </section>
      ))}
    </div>
  );
}
