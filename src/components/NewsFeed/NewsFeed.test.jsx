import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewsFeed from './NewsFeed';

const makeArticle = (id, category) => ({
  id,
  title: `Article ${id}`,
  summary: 'Summary',
  category,
  imageUrl: '',
  author: 'Author',
  publishedAt: new Date().toISOString(),
  readTime: 2,
});

const articles = [
  makeArticle(1, 'Markets'),
  makeArticle(2, 'Tech'),
  makeArticle(3, 'Markets'),
];

const renderFeed = (arts = articles) =>
  render(<MemoryRouter><NewsFeed articles={arts} /></MemoryRouter>);

test('renders all articles on All tab', () => {
  renderFeed();
  expect(screen.getAllByRole('link').length).toBe(3);
});

test('filters by category tab', () => {
  renderFeed();
  fireEvent.click(screen.getByRole('button', { name: 'Markets' }));
  expect(screen.getAllByRole('link').length).toBe(2);
});

test('shows empty message when no articles in category', () => {
  renderFeed();
  fireEvent.click(screen.getByRole('button', { name: 'Wealth' }));
  expect(screen.getByText(/No articles in this category yet/)).toBeInTheDocument();
});

test('active tab changes on click', () => {
  renderFeed();
  const techTab = screen.getByRole('button', { name: 'Tech' });
  fireEvent.click(techTab);
  expect(techTab).toHaveClass('active');
});

test('renders Latest News heading', () => {
  renderFeed();
  expect(screen.getByText('Latest News')).toBeInTheDocument();
});
