import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from './HeroSection';

const makeArticle = (id) => ({
  id,
  title: `Hero Title ${id}`,
  summary: `Summary ${id}`,
  category: 'Markets',
  imageUrl: '',
  author: 'ET Bureau',
  publishedAt: new Date().toISOString(),
  readTime: 3,
});

test('renders nothing when no articles', () => {
  const { container } = render(<MemoryRouter><HeroSection articles={[]} /></MemoryRouter>);
  expect(container.firstChild).toBeNull();
});

test('renders main article title', () => {
  render(<MemoryRouter><HeroSection articles={[makeArticle(1)]} /></MemoryRouter>);
  expect(screen.getByText('Hero Title 1')).toBeInTheDocument();
});

test('renders up to 4 side articles', () => {
  const arts = [1, 2, 3, 4, 5].map(makeArticle);
  render(<MemoryRouter><HeroSection articles={arts} /></MemoryRouter>);
  // main + 4 side = 5 links
  expect(screen.getAllByRole('link').length).toBe(5);
});

test('main article links to correct page', () => {
  render(<MemoryRouter><HeroSection articles={[makeArticle(7)]} /></MemoryRouter>);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/article/7');
});

test('shows BREAKING badge', () => {
  render(<MemoryRouter><HeroSection articles={[makeArticle(1)]} /></MemoryRouter>);
  expect(screen.getByText('BREAKING')).toBeInTheDocument();
});
