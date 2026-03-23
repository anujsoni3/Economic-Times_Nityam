import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchArticles } from '../../api';
import ArticleCard from '../../components/ArticleCard/ArticleCard';
import './Category.css';

export default function Category() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchArticles(slug)
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="category-page">
      <div className="container">
        <div className="category-header">
          <h1>{categoryName}</h1>
          <p>Latest {categoryName.toLowerCase()} news and analysis from The Economic Times</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</p>
        ) : articles.length > 0 ? (
          <div className="category-grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--sp-16)' }}>
            No articles found in {categoryName}.
          </p>
        )}
      </div>
    </div>
  );
}
