import { listen } from '@tauri-apps/api/event';
import { test, expect, describe, vi } from 'vitest';
import { disableMenu, setupListeners } from './utils';

describe('disableMenu function', () => {
  test('should prevent default context menu on "tauri.localhost"', () => {
    delete (window as Partial<Window>).location;
    window.location = { hostname: 'tauri.localhost' } as Location;

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    disableMenu();

    const prevented = !document.dispatchEvent(contextMenuEvent);
    expect(prevented).toBe(true);
  });

  test('should not disable context menu on other hostnames', () => {
    window.location.hostname = 'example.com';

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    disableMenu();

    const prevented = !document.dispatchEvent(contextMenuEvent);
    expect(prevented).toBe(false);
  });
});

test('setupListeners function', async () => {
  const mockRoot = {
    ref: [],
    deleteRef: vi.fn(),
    addRef: vi.fn(),
    mutateName: vi.fn(),
    mutateNote: vi.fn(),
    mutateTag: vi.fn(),
  };

  listen.mockImplementation((eventName, callback) => {
    return vi.fn(); // Mocked unlisten function
  });

  vi.mock('./listenFunction', () => ({
    listen: mockListen,
  }));

  await setupListeners(mockRoot);

  expect(mockListen).toHaveBeenCalledWith('deleteRef', expect.any(Function));
  expect(mockListen).toHaveBeenCalledWith('ref_added', expect.any(Function));
  expect(mockListen).toHaveBeenCalledWith(
    'ref_name_changed',
    expect.any(Function),
  );
  expect(mockListen).toHaveBeenCalledWith('note_changed', expect.any(Function));
  expect(mockListen).toHaveBeenCalledWith('tag_added', expect.any(Function));
  expect(mockListen).toHaveBeenCalledWith('tag_removed', expect.any(Function));

  await setupListeners(mockRoot as any);
});
