import { render, screen } from '@testing-library/react';
import FeatureSlot from './FeatureSlot';

test('renders title and description', () => {
  render(<FeatureSlot title="AI Briefing" icon="🤖" description="Smart summaries" featureId="briefing" />);
  expect(screen.getByText('AI Briefing')).toBeInTheDocument();
  expect(screen.getByText('Smart summaries')).toBeInTheDocument();
});

test('renders icon', () => {
  render(<FeatureSlot title="Test" icon="🧩" description="Desc" featureId="test" />);
  expect(screen.getByText('🧩')).toBeInTheDocument();
});

test('sets correct id on container', () => {
  const { container } = render(<FeatureSlot title="T" icon="x" description="D" featureId="my-feature" />);
  expect(container.querySelector('#feature-slot-my-feature')).toBeInTheDocument();
});

test('renders integration slot tag', () => {
  render(<FeatureSlot title="T" icon="x" description="D" featureId="x" />);
  expect(screen.getByText('🧩 Integration Slot')).toBeInTheDocument();
});
