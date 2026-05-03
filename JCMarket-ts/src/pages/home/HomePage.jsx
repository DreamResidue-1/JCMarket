import api from '../../lib/api';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { useLanguage } from '../../i18n/LanguageContext';
import { ProductsGrid } from './ProductsGrid';
import './HomePage.css';

export function HomePage({ cart, loadCart }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
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
        setProducts(response.data);
        setError('');
      } catch (loadError) {
        setProducts([]);
        setError(loadError instanceof Error ? loadError.message : t('failedToLoadProducts'));
      }
    };

    void getHomeData();
  }, [search, t]);

  return (
    <>
      <title>JCMarket</title>

      <Header cart={cart} />

      <div className="home-page">
        <ProductsGrid products={products} loadCart={loadCart} search={search} error={error} />
      </div>
    </>
  );
}
