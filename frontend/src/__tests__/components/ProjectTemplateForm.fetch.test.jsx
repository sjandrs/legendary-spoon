
import { Routes, Route } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import ProjectTemplateForm from '../../components/ProjectTemplateForm';

jest.mock('../../api');

describe('ProjectTemplateForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches template once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/project-templates/55/') return Promise.resolve({ data: { id:55, name:'T', description:'', estimated_hours:'' , tasks:[] } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/project-templates/:id/edit" element={<ProjectTemplateForm />} />
      </Routes>,
      { initialEntries: ['/project-templates/55/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/project-templates/55/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/project-templates/55/')).toHaveLength(1);
  });
});
