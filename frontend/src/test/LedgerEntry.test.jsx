import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LedgerEntry from '../components/LedgerEntry';

const sampleTrade = {
  id: '3',
  party_a: 'GAAAA1111111111111111111111111111111111111111111111111',
  party_b: 'GBBBB2222222222222222222222222222222222222222222222222',
  offer_a: 'Logo design',
  offer_b: 'Website build',
  bond_amount: 100,
  delivered_a: false,
  delivered_b: false,
  accepted_b: true,
  status: 'Open',
  deadline: Math.floor(Date.now() / 1000) + 100000,
};

describe('LedgerEntry', () => {
  it('shows an empty state when no trade is loaded', () => {
    render(<LedgerEntry trade={null} currentAddress={null} onAction={vi.fn()} actionLoading={false} />);
    expect(screen.getByText(/no trade loaded/i)).toBeInTheDocument();
  });

  it('renders both sides of the barter', () => {
    render(<LedgerEntry trade={sampleTrade} currentAddress={null} onAction={vi.fn()} actionLoading={false} />);
    expect(screen.getByText('Logo design')).toBeInTheDocument();
    expect(screen.getByText('Website build')).toBeInTheDocument();
  });

  it('lets the connected party mark their side delivered', async () => {
    const onAction = vi.fn();
    render(
      <LedgerEntry trade={sampleTrade} currentAddress={sampleTrade.party_a} onAction={onAction} actionLoading={false} />
    );
    const user = userEvent.setup();
    await user.click(screen.getByText('Mark my side delivered'));
    expect(onAction).toHaveBeenCalledWith('markDelivered');
  });
});
