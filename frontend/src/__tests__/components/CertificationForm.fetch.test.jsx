
import { Routes, Route } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import CertificationForm from '../../components/CertificationForm';

jest.mock('../../api');

describe('CertificationForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches certification once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/certifications/12/') return Promise.resolve({ data: { id:12, name:'Cert' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/certifications/:id/edit" element={<CertificationForm />} />
      </Routes>,
      { initialEntries: ['/certifications/12/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/certifications/12/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/certifications/12/')).toHaveLength(1);
  });
});
