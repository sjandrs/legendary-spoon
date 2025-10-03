import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TagManager from '../../components/TagManager';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

// Mock CSS import
jest.mock('../../components/TagManager.css', () => ({}));

const mockApi = require('../../api');

describe('TagManager Component', () => {
  // Test data
  const mockProps = {
    associatedTags: [
      { id: 1, name: 'Important' },
      { id: 2, name: 'Client' }
    ],
    onTagsUpdate: jest.fn(),
    entityId: '123',
    entityType: 'contacts'
  };

  const mockAllTags = [
    { id: 1, name: 'Important' },
    { id: 2, name: 'Client' },
    { id: 3, name: 'Prospect' },
    { id: 4, name: 'Active' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful API responses
    mockApi.get.mockResolvedValue({
      data: { results: mockAllTags }
    });
    mockApi.patch.mockResolvedValue({
      data: { tags: mockProps.associatedTags }
    });
    mockApi.post.mockResolvedValue({
      data: { id: 5, name: 'New Tag' }
    });
  });

  // Loading and initial render tests
  describe('Loading and Initial Render', () => {
    test('displays loading message initially', () => {
      render(<TagManager {...mockProps} />);
      expect(screen.getByText('Loading tags...')).toBeInTheDocument();
    });

    test('renders tags heading after loading', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
      });
    });

    test('fetches tags on component mount', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/tags/');
      });
    });

    test('renders without crashing', () => {
      const { container } = render(<TagManager {...mockProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // Associated tags display tests
  describe('Associated Tags Display', () => {
    test('displays associated tags', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Important')).toBeInTheDocument();
        expect(screen.getByText('Client')).toBeInTheDocument();
      });
    });

    test('displays remove buttons for associated tags', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        expect(removeButtons).toHaveLength(2);
      });
    });

    test('handles empty associated tags', async () => {
      const emptyProps = { ...mockProps, associatedTags: [] };
      render(<TagManager {...emptyProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
      });

      // Should not have any remove buttons
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });
  });

  // Available tags display tests
  describe('Available Tags Display', () => {
    test('displays available tags section', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /available tags/i })).toBeInTheDocument();
      });
    });

    test('displays available tags that are not associated', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Prospect')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    test('does not display already associated tags in available section', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const availableSection = screen.getByRole('heading', { name: /available tags/i }).closest('.available-tags-cloud');

        // Should not find associated tags in available section
        expect(availableSection).not.toHaveTextContent('Important');
        expect(availableSection).not.toHaveTextContent('Client');

        // Should find unassociated tags
        expect(availableSection).toHaveTextContent('Prospect');
        expect(availableSection).toHaveTextContent('Active');
      });
    });
  });

  // Tag interaction tests
  describe('Tag Interactions', () => {
    test('calls handleAddTag when available tag is clicked', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const prospectTag = screen.getByText('Prospect');
        fireEvent.click(prospectTag);
      });

      expect(mockApi.patch).toHaveBeenCalledWith('/api/contacts/123/', {
        tag_ids: [1, 2, 3]
      });
    });

    test('calls handleRemoveTag when remove button is clicked', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        fireEvent.click(removeButtons[0]);
      });

      expect(mockApi.patch).toHaveBeenCalledWith('/api/contacts/123/', {
        tag_ids: [2]
      });
    });

    test('calls onTagsUpdate after successful tag addition', async () => {
      const updatedTags = [...mockProps.associatedTags, { id: 3, name: 'Prospect' }];
      mockApi.patch.mockResolvedValue({ data: { tags: updatedTags } });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const prospectTag = screen.getByText('Prospect');
        fireEvent.click(prospectTag);
      });

      await waitFor(() => {
        expect(mockProps.onTagsUpdate).toHaveBeenCalledWith(updatedTags);
      });
    });

    test('calls onTagsUpdate after successful tag removal', async () => {
      const updatedTags = [{ id: 2, name: 'Client' }];
      mockApi.patch.mockResolvedValue({ data: { tags: updatedTags } });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        fireEvent.click(removeButtons[0]);
      });

      await waitFor(() => {
        expect(mockProps.onTagsUpdate).toHaveBeenCalledWith(updatedTags);
      });
    });
  });

  // Create new tag tests
  describe('Create New Tag', () => {
    test('renders create new tag input and button', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Create new tag')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create & add/i })).toBeInTheDocument();
      });
    });

    test('updates input value when typing', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Create new tag');
        fireEvent.change(input, { target: { value: 'New Tag' } });
        expect(input.value).toBe('New Tag');
      });
    });

    test('creates and adds new tag when button clicked', async () => {
      const newTag = { id: 5, name: 'New Tag' };
      mockApi.post.mockResolvedValue({ data: newTag });
      mockApi.patch.mockResolvedValue({ data: { tags: [...mockProps.associatedTags, newTag] } });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Create new tag');
        const button = screen.getByRole('button', { name: /create & add/i });

        fireEvent.change(input, { target: { value: 'New Tag' } });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/tags/', {
          name: 'New Tag',
          slug: 'new-tag'
        });
      });
    });

    test('does not create tag with empty name', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /create & add/i });
        fireEvent.click(button);
      });

      expect(mockApi.post).not.toHaveBeenCalled();
    });

    test('clears input after successful tag creation', async () => {
      const newTag = { id: 5, name: 'New Tag' };
      mockApi.post.mockResolvedValue({ data: newTag });
      mockApi.patch.mockResolvedValue({ data: { tags: [...mockProps.associatedTags, newTag] } });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Create new tag');
        const button = screen.getByRole('button', { name: /create & add/i });

        fireEvent.change(input, { target: { value: 'New Tag' } });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Create new tag')).toHaveValue('');
      });
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('displays error message when tag loading fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load tags.')).toBeInTheDocument();
      });
    });

    test('displays error message when tag addition fails', async () => {
      mockApi.patch.mockRejectedValue({
        response: { data: { detail: 'Permission denied' } }
      });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const prospectTag = screen.getByText('Prospect');
        fireEvent.click(prospectTag);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to add tag.*permission denied/i)).toBeInTheDocument();
      });
    });

    test('displays error message when tag removal fails', async () => {
      mockApi.patch.mockRejectedValue({
        response: { data: { detail: 'Not found' } }
      });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        fireEvent.click(removeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to remove tag.*not found/i)).toBeInTheDocument();
      });
    });

    test('displays error message when tag creation fails', async () => {
      mockApi.post.mockRejectedValue({
        response: { data: { detail: 'Tag already exists' } }
      });

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Create new tag');
        const button = screen.getByRole('button', { name: /create & add/i });

        fireEvent.change(input, { target: { value: 'Existing Tag' } });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to create and add tag/i)).toBeInTheDocument();
      });
    });
  });

  // PropTypes and integration tests
  describe('PropTypes and Integration', () => {
    test('handles different entity types', async () => {
      const accountProps = { ...mockProps, entityType: 'accounts' };
      render(<TagManager {...accountProps} />);

      await waitFor(() => {
        const prospectTag = screen.getByText('Prospect');
        fireEvent.click(prospectTag);
      });

      expect(mockApi.patch).toHaveBeenCalledWith('/api/accounts/123/', {
        tag_ids: [1, 2, 3]
      });
    });

    test('prevents adding duplicate tags', async () => {
      render(<TagManager {...mockProps} />);

      // Try to add a tag that's already associated (Important - id: 1)
      // This should not make an API call since it's already associated
      await waitFor(() => {
        // Important should not be in available tags
        expect(screen.queryByText('Important')).toBeInTheDocument(); // In associated section

        // Available section should not have Important
        const availableSection = screen.getByRole('heading', { name: /available tags/i }).closest('.available-tags-cloud');
        expect(availableSection).not.toHaveTextContent('Important');
      });
    });
  });

  // Performance and accessibility tests
  describe('Performance and Accessibility', () => {
    test('renders quickly with moderate data set', async () => {
      const startTime = performance.now();
      render(<TagManager {...mockProps} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    test('has proper semantic structure', async () => {
      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Available Tags' })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create & add/i })).toBeInTheDocument();
      });
    });

    test('has no console errors during normal operation', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TagManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
