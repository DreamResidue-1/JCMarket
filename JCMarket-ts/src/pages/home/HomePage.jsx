import api from '../../lib/api';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { useLanguage } from '../../i18n/LanguageContext';
import { ProductsGrid } from './ProductsGrid';
import './HomePage.css';
import sampleProducts from '../../sample-products.json';

export function HomePage({ cart, loadCart }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState(sampleProducts);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    const getHomeData = async () => {
      const params = new URLSearchParams();

      if (search) {
        params.set('search', search);
      }

      const urlPath = params.toString() ? `/api/products?${params.toString()}` : '/api/products';
      try {
        const response = await api.get(urlPath);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setProducts(response.data);
        }
        setError('');
      } catch (loadError) {
        // fallback to sample data so the storefront works offline/demo
        setProducts(sampleProducts);
        setError(loadError instanceof Error ? loadError.message : t('failedToLoadProducts'));
        // keep running silently in console for developers
        // eslint-disable-next-line no-console
        console.warn('Failed to load /api/products — using local sample data:', loadError);
      }
    };

    void getHomeData();
  }, [search, t]);

  return (
    <>
      <title>JCMarket</title>

      <Header cart={cart} />

      <div className="home-page">
        <div className="container">
          <ProductsGrid products={products} loadCart={loadCart} search={search} error={error} />
        </div>
      </div>
    </>
  );
}
