import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReputationCard from '../components/ReputationCard';

describe('ReputationCard', () => {
  it('does not show stats before a lookup', () => {
    render(<ReputationCard onLookup={vi.fn()} profile={null} loading={false} />);
    expect(screen.queryByText('Score')).not.toBeInTheDocument();
  });

  it('renders score, completed, and defaulted counts', () => {
    const profile = { score: 4, completed_trades: 3, defaulted_trades: 1 };
    render(<ReputationCard onLookup={vi.fn()} profile={profile} loading={false} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onLookup with the entered address', async () => {
    const onLookup = vi.fn();
    render(<ReputationCard onLookup={onLookup} profile={null} loading={false} />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('G... address'), 'GTESTADDRESS');
    await user.click(screen.getByText('Look up'));
    expect(onLookup).toHaveBeenCalledWith('GTESTADDRESS');
  });
});
