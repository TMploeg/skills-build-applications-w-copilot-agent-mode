import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  loadItems: () => Promise<T[]>;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, loadItems, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    loadItems()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadItems]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {loading
      ? <p role="status">Loading {title.toLowerCase()}...</p>
      : error
        ? <p role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>
        : items.length === 0
          ? <p>{emptyMessage}</p>
          : <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
