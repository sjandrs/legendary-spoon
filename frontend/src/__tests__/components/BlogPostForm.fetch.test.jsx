
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor, screen } from '@testing-library/react';
import * as api from '../../api';
import { Route, Routes } from 'react-router-dom';
import BlogPostForm from '../../components/BlogPostForm';

jest.mock('../../api');

/**
 * Fetch invocation tests for BlogPostForm (Batch 2)
 */

describe('BlogPostForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('does not fetch in create mode', async () => {
    api.get.mockResolvedValue({ data: {} });

    renderWithProviders(
      <Routes>
        <Route path="/blog/new" element={<BlogPostForm />} />
      </Routes>,
      { initialEntries: ['/blog/new'] }
    );

    expect(screen.getByText(/new blog post/i)).toBeInTheDocument();
    await waitFor(() => {});
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/posts\/.+\//));
  });

  it('fetches blog post once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/posts/42/') return Promise.resolve({ data: { id: 42, title: 'Hello' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/blog/:id/edit" element={<BlogPostForm />} />
      </Routes>,
      { initialEntries: ['/blog/42/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/posts/42/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/posts/42/')).toHaveLength(1);
  });
});
