import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

test('renders brand name', () => {
  renderFooter();
  expect(screen.getByText('The Economic')).toBeInTheDocument();
});

test('renders hackathon badge', () => {
  renderFooter();
  expect(screen.getByText(/ET GenAI Hackathon 2026/)).toBeInTheDocument();
});

test('renders news category links', () => {
  renderFooter();
  expect(screen.getByRole('link', { name: 'Markets' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Tech' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Politics' })).toBeInTheDocument();
});

test('renders AI features links', () => {
  renderFooter();
  expect(screen.getByRole('link', { name: /Story Arc Tracker/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /My ET/ })).toBeInTheDocument();
});

test('renders copyright text', () => {
  renderFooter();
  expect(screen.getByText(/© 2026 The Economic Times/)).toBeInTheDocument();
});
