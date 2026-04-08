import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import SharePage from './SharePage';

// Stub QRCodeSVG — jsdom has no SVG rendering and we don't need to test QR output
vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string)         => store[key] ?? null,
    setItem:    (key: string, v: string) => { store[key] = v; },
    removeItem: (key: string)         => { delete store[key]; },
    clear:      ()                    => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: clipboardWriteMock },
  configurable: true,
});

window.print = vi.fn();

beforeEach(() => {
  localStorageMock.clear();
  usePatientStore.getState().clearAll();
  clipboardWriteMock.mockClear();
  vi.mocked(window.print).mockClear();
});

// ---------------------------------------------------------------------------
// Page renders
// ---------------------------------------------------------------------------

describe('SharePage — renders', () => {
  it('renders without crashing and shows all three section headings', () => {
    render(<SharePage />);
    expect(screen.getByText('Check-in QR code')).toBeInTheDocument();
    expect(screen.getByText('Other ways to share')).toBeInTheDocument();
    expect(screen.getByText('Access log')).toBeInTheDocument();
  });

  it('renders the QR code placeholder', () => {
    render(<SharePage />);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('renders the expiry line', () => {
    render(<SharePage />);
    expect(screen.getByText('Expires in 24 hours')).toBeInTheDocument();
  });

  it('renders the three sharing method rows', () => {
    render(<SharePage />);
    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
    expect(screen.getByText('Print summary')).toBeInTheDocument();
    expect(screen.getByText('Send secure link')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Token creation on mount
// ---------------------------------------------------------------------------

describe('SharePage — token creation on mount', () => {
  it('creates exactly one share token on mount', () => {
    render(<SharePage />);
    const tokens = Object.values(usePatientStore.getState().record.shareTokens);
    expect(tokens).toHaveLength(1);
  });

  it('the token is labelled Check-in QR and starts active', () => {
    render(<SharePage />);
    const tokens = Object.values(usePatientStore.getState().record.shareTokens);
    expect(tokens[0].label).toBe('Check-in QR');
    expect(tokens[0].active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Refresh code
// ---------------------------------------------------------------------------

describe('SharePage — Refresh code', () => {
  it('creates a new token on refresh', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh code' }));
    const tokens = Object.values(usePatientStore.getState().record.shareTokens);
    expect(tokens).toHaveLength(2);
  });

  it('revokes the old token when refreshed', () => {
    render(<SharePage />);
    const before = Object.values(usePatientStore.getState().record.shareTokens);
    const oldTokenId = before[0].token;

    fireEvent.click(screen.getByRole('button', { name: 'Refresh code' }));

    const after = Object.values(usePatientStore.getState().record.shareTokens);
    const oldToken = after.find((t) => t.token === oldTokenId);
    expect(oldToken?.active).toBe(false);
  });

  it('the new token after refresh is active', () => {
    render(<SharePage />);
    const before = Object.values(usePatientStore.getState().record.shareTokens);
    const oldTokenId = before[0].token;

    fireEvent.click(screen.getByRole('button', { name: 'Refresh code' }));

    const after = Object.values(usePatientStore.getState().record.shareTokens);
    const newToken = after.find((t) => t.token !== oldTokenId);
    expect(newToken?.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Copy link
// ---------------------------------------------------------------------------

describe('SharePage — Copy link', () => {
  it('calls navigator.clipboard.writeText', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(clipboardWriteMock).toHaveBeenCalledTimes(1);
  });

  it('appends a clipboard log entry labelled Copy link', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    const log = usePatientStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log[0].method).toBe('clipboard');
    expect(log[0].label).toBe('Copy link');
  });

  it('the log entry carries the current token', () => {
    render(<SharePage />);
    const tokenId = Object.keys(usePatientStore.getState().record.shareTokens)[0];
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(usePatientStore.getState().log[0].token).toBe(tokenId);
  });
});

// ---------------------------------------------------------------------------
// Copy to clipboard (sharing method row)
// ---------------------------------------------------------------------------

describe('SharePage — Copy to clipboard', () => {
  it('calls navigator.clipboard.writeText', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Copy to clipboard'));
    expect(clipboardWriteMock).toHaveBeenCalledTimes(1);
  });

  it('appends a clipboard log entry', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Copy to clipboard'));
    const log = usePatientStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log[0].method).toBe('clipboard');
  });
});

// ---------------------------------------------------------------------------
// Send secure link
// ---------------------------------------------------------------------------

describe('SharePage — Send secure link', () => {
  it('calls navigator.clipboard.writeText', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Send secure link'));
    expect(clipboardWriteMock).toHaveBeenCalledTimes(1);
  });

  it('appends a link log entry', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Send secure link'));
    const log = usePatientStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log[0].method).toBe('link');
  });
});

// ---------------------------------------------------------------------------
// Print summary
// ---------------------------------------------------------------------------

describe('SharePage — Print summary', () => {
  it('calls window.print()', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Print summary'));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('appends a print log entry', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Print summary'));
    const log = usePatientStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log[0].method).toBe('print');
    expect(log[0].label).toBe('Print summary');
  });
});

// ---------------------------------------------------------------------------
// Access log — empty state
// ---------------------------------------------------------------------------

describe('SharePage — access log empty state', () => {
  it('shows the empty state message when the log is empty', () => {
    render(<SharePage />);
    expect(screen.getByText('No sharing activity yet.')).toBeInTheDocument();
  });

  it('shows 0 events in the badge when the log is empty', () => {
    render(<SharePage />);
    expect(screen.getByText('0 events')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Section picker
// ---------------------------------------------------------------------------

describe('SharePage — section picker', () => {
  it('all 8 sections are selected by default', () => {
    render(<SharePage />);
    expect(screen.getByText('Sharing 8 of 8 sections')).toBeInTheDocument();
  });

  it('deselecting a section decrements the sharing count', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByLabelText('Allergies'));
    expect(screen.getByText('Sharing 7 of 8 sections')).toBeInTheDocument();
  });

  it('reselecting a section restores the count', () => {
    render(<SharePage />);
    const checkbox = screen.getByLabelText('Allergies');
    fireEvent.click(checkbox); // deselect
    fireEvent.click(checkbox); // reselect
    expect(screen.getByText('Sharing 8 of 8 sections')).toBeInTheDocument();
  });

  it('deselecting a section revokes the old token and creates a new one', () => {
    render(<SharePage />);
    const oldTokenId = Object.keys(usePatientStore.getState().record.shareTokens)[0];
    fireEvent.click(screen.getByLabelText('Allergies'));
    const tokens = Object.values(usePatientStore.getState().record.shareTokens);
    expect(tokens).toHaveLength(2);
    const old = tokens.find((t) => t.token === oldTokenId);
    expect(old?.active).toBe(false);
  });

  it('the new token after a section change contains the updated sections', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByLabelText('Allergies'));
    const tokens = Object.values(usePatientStore.getState().record.shareTokens);
    const activeToken = tokens.find((t) => t.active);
    expect(activeToken?.sections).not.toContain('allergies');
    expect(activeToken?.sections).toHaveLength(7);
  });

  it('all 8 section checkboxes are rendered', () => {
    render(<SharePage />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });

  it('all 8 section checkboxes are checked by default', () => {
    render(<SharePage />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });
});

// ---------------------------------------------------------------------------
// Clear log
// ---------------------------------------------------------------------------

describe('SharePage — clear log', () => {
  it('Clear log button is not shown when the log is empty', () => {
    render(<SharePage />);
    expect(screen.queryByRole('button', { name: 'Clear log' })).not.toBeInTheDocument();
  });

  it('Clear log button appears after an event is logged', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(screen.getByRole('button', { name: 'Clear log' })).toBeInTheDocument();
  });

  it('clicking Clear log empties the store log', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    expect(usePatientStore.getState().log).toHaveLength(0);
  });

  it('clicking Clear log restores the empty state message', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    expect(screen.getByText('No sharing activity yet.')).toBeInTheDocument();
  });

  it('clicking Clear log does not collapse the log section', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    // empty state is visible — log is still open
    expect(screen.getByText('No sharing activity yet.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Access log — collapse / expand
// ---------------------------------------------------------------------------

describe('SharePage — access log collapse/expand', () => {
  it('log is open by default', () => {
    render(<SharePage />);
    expect(screen.getByText('No sharing activity yet.')).toBeInTheDocument();
  });

  it('clicking the Access log heading collapses the log', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('heading', { name: 'Access log' }));
    expect(screen.queryByText('No sharing activity yet.')).not.toBeInTheDocument();
  });

  it('clicking the heading again re-expands the log', () => {
    render(<SharePage />);
    const heading = screen.getByRole('heading', { name: 'Access log' });
    fireEvent.click(heading); // collapse
    fireEvent.click(heading); // expand
    expect(screen.getByText('No sharing activity yet.')).toBeInTheDocument();
  });

  it('log entries are hidden when collapsed', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    // "Clipboard" is the method badge text — only appears inside log entries
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'Access log' }));
    expect(screen.queryByText('Clipboard')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Access log — entries and revoke
// ---------------------------------------------------------------------------

describe('SharePage — access log entries', () => {
  it('hides the empty state message after Copy link is clicked', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(screen.queryByText('No sharing activity yet.')).not.toBeInTheDocument();
  });

  it('shows the event count badge after a log entry is added', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(screen.getByText('1 events')).toBeInTheDocument();
  });

  it('Revoke button is shown for active log entries with a token', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Send secure link'));
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
  });

  it('Revoke button revokes the correct token in the store', () => {
    render(<SharePage />);
    const tokenId = Object.keys(usePatientStore.getState().record.shareTokens)[0];
    fireEvent.click(screen.getByText('Send secure link'));
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    const token = usePatientStore.getState().record.shareTokens[tokenId];
    expect(token.active).toBe(false);
  });

  it('entry shows Revoked label and hides the button after revocation', () => {
    render(<SharePage />);
    fireEvent.click(screen.getByText('Send secure link'));
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    expect(screen.queryByRole('button', { name: 'Revoke' })).not.toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });
});
