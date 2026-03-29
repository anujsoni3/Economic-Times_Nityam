import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../api';
import Navbar from './Navbar';

afterEach(() => vi.restoreAllMocks());

const renderNavbar = (path = '/') =>
  render(<MemoryRouter initialEntries={[path]}><Navbar /></MemoryRouter>);

test('renders logo text', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue([]);
  renderNavbar();
  expect(screen.getByText('The Economic')).toBeInTheDocument();
});

test('renders all nav links', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue([]);
  renderNavbar();
  expect(screen.getByText('Markets')).toBeInTheDocument();
  expect(screen.getByText('Tech')).toBeInTheDocument();
  expect(screen.getByText('My ET')).toBeInTheDocument();
});

test('search input updates on change', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue([]);
  renderNavbar();
  const input = screen.getByPlaceholderText('Search news...');
  fireEvent.change(input, { target: { value: 'RBI' } });
  expect(input.value).toBe('RBI');
});

test('renders market ticker when data loads', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue([
    { id: 'sensex', name: 'SENSEX', value: 75000, change: 100, changePercent: 0.13, trend: 'up' },
  ]);
  renderNavbar();
  await waitFor(() => expect(screen.getByText('LIVE')).toBeInTheDocument());
});

test('no ticker when market data is empty', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue([]);
  renderNavbar();
  await waitFor(() => expect(screen.queryByText('LIVE')).not.toBeInTheDocument());
});
