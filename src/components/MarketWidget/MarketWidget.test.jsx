import { render, screen, waitFor } from '@testing-library/react';
import * as api from '../../api';
import MarketWidget from './MarketWidget';

const mockData = [
  { id: 'sensex', name: 'SENSEX', value: 75000, change: 200, changePercent: 0.27, trend: 'up' },
  { id: 'nifty',  name: 'NIFTY 50', value: 22800, change: -50, changePercent: -0.22, trend: 'down' },
];

afterEach(() => vi.restoreAllMocks());

test('renders market items after fetch', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue(mockData);
  render(<MarketWidget />);
  await waitFor(() => expect(screen.getByText('SENSEX')).toBeInTheDocument());
  expect(screen.getByText('NIFTY 50')).toBeInTheDocument();
});

test('shows up arrow for positive trend', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue(mockData);
  render(<MarketWidget />);
  await waitFor(() => expect(screen.getByText(/▲/)).toBeInTheDocument());
});

test('shows down arrow for negative trend', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue(mockData);
  render(<MarketWidget />);
  await waitFor(() => expect(screen.getByText(/▼/)).toBeInTheDocument());
});

test('renders nothing when fetch fails', async () => {
  vi.spyOn(api, 'fetchMarketData').mockRejectedValue(new Error('fail'));
  const { container } = render(<MarketWidget />);
  await waitFor(() => expect(container.firstChild).toBeNull());
});

test('renders Market Watch title', async () => {
  vi.spyOn(api, 'fetchMarketData').mockResolvedValue(mockData);
  render(<MarketWidget />);
  await waitFor(() => expect(screen.getByText(/Market Watch/)).toBeInTheDocument());
});
