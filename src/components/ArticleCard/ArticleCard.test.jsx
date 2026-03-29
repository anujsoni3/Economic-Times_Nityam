import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArticleCard from './ArticleCard';

const article = {
  id: 1,
  title: 'Test Article Title',
  summary: 'Test summary text',
  category: 'Markets',
  imageUrl: 'https://example.com/img.jpg',
  author: 'ET Bureau',
  publishedAt: new Date().toISOString(),
  readTime: 3,
};

const renderCard = (props = {}) =>
  render(<MemoryRouter><ArticleCard article={article} {...props} /></MemoryRouter>);

test('renders title and summary', () => {
  renderCard();
  expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  expect(screen.getByText('Test summary text')).toBeInTheDocument();
});

test('renders category badge', () => {
  renderCard();
  expect(screen.getByText('Markets')).toBeInTheDocument();
});

test('renders author and read time', () => {
  renderCard();
  expect(screen.getByText('ET Bureau')).toBeInTheDocument();
  expect(screen.getByText(/3 min/)).toBeInTheDocument();
});

test('links to correct article page', () => {
  renderCard();
  expect(screen.getByRole('link')).toHaveAttribute('href', '/article/1');
});

test('renders action buttons', () => {
  renderCard();
  expect(screen.getByText('📊 Track Story')).toBeInTheDocument();
  expect(screen.getByText('🧠 AI Briefing')).toBeInTheDocument();
});

test('applies horizontal class when prop is true', () => {
  renderCard({ horizontal: true });
  expect(screen.getByRole('link')).toHaveClass('horizontal');
});
