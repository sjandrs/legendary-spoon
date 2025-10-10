
import { Route, Routes } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import PageForm from '../../components/PageForm';

jest.mock('../../api');

describe('PageForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches pages list but not detail in create mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/pages/') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/pages/new" element={<PageForm />} />
      </Routes>,
      { initialEntries: ['/pages/new'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/pages/'));
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/pages\/.+\//));
  });

  it('fetches pages list then page detail exactly once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/pages/') return Promise.resolve({ data: [] });
      if (url === '/api/pages/77/') return Promise.resolve({ data: { id: 77, title: 'Test Page' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/pages/:id/edit" element={<PageForm />} />
      </Routes>,
      { initialEntries: ['/pages/77/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/pages/'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/pages/77/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/pages/77/')).toHaveLength(1);
  });
});
