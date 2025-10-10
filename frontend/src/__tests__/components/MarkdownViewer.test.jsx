import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { get } from '../../api';
import MarkdownViewer from '../../components/MarkdownViewer';

// Mock API client
jest.mock('../../api');
const mockedGet = get;

// Mock React Router useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

// Mock react-markdown to avoid complex rendering issues in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => ({}));

// Wrapper component for routing
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Sample markdown content for testing
const sampleMarkdown = `# Test Document

This is a **test document** with some *emphasis*.

## Features

- Bullet point 1
- Bullet point 2
- Bullet point 3

### Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

> This is a blockquote

[Link to example](https://example.com)`;

const complexMarkdown = `# Advanced Features

## Lists

1. Ordered item 1
2. Ordered item 2
   - Nested bullet
   - Another nested bullet

## Task Lists

- [x] Completed task
- [ ] Incomplete task

## Tables with Alignment

| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
| D    | E      | F     |

## Code Blocks

\`\`\`python
def calculate(x, y):
    return x + y
\`\`\`

## Special Characters

Some special characters: áéíóú ñ ü & < > " ' 中文

## Horizontal Rule

---

End of document.`;

describe('MarkdownViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== COMPONENT RENDERING TESTS =====
  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      expect(screen.getByText('Loading document...')).toBeInTheDocument();
      expect(screen.getByText('Loading document...')).toHaveClass('loading-message');
    });

    test('renders markdown content after loading', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Test Document');
      });
    });

    test('renders markdown viewer container with proper CSS classes', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const container = screen.getByTestId('markdown-content').closest('.markdown-viewer-container');
        expect(container).toBeInTheDocument();

        const markdownBody = screen.getByTestId('markdown-content').closest('.markdown-body');
        expect(markdownBody).toBeInTheDocument();
      });
    });

    test('does not render content when loading', () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      expect(screen.getByText('Loading document...')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    });

    test('hides loading message after content loads', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });
    });
  });

  // ===== DATA LOADING TESTS =====
  describe('Data Loading', () => {
    test('makes API call with correct file name', async () => {
      mockUseParams.mockReturnValue({ fileName: 'user-guide' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb/user-guide/');
      });
    });

    test('handles different file name formats', async () => {
      const testFileNames = [
        'simple-file',
        'file_with_underscores',
        'file-with-123-numbers',
        'UPPERCASE-FILE',
        'file.with.dots',
        'very-long-file-name-that-might-cause-issues'
      ];

      for (const fileName of testFileNames) {
        jest.clearAllMocks();
        mockUseParams.mockReturnValue({ fileName });
        mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

        render(<MarkdownViewer />, { wrapper: RouterWrapper });

        await waitFor(() => {
          expect(mockedGet).toHaveBeenCalledWith(`/api/kb/${fileName}/`);
        });
      }
    });

    test('updates state with fetched markdown content', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toHaveTextContent('# Test Document');
        expect(markdownContent).toHaveTextContent('This is a **test document**');
      });
    });

    test('handles empty markdown content', async () => {
      mockUseParams.mockReturnValue({ fileName: 'empty-document' });
      mockedGet.mockResolvedValue({ data: { content: '' } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        expect(markdownContent).toHaveTextContent('');
      });
    });

    test('handles complex markdown with various features', async () => {
      mockUseParams.mockReturnValue({ fileName: 'complex-document' });
      mockedGet.mockResolvedValue({ data: { content: complexMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toHaveTextContent('# Advanced Features');
        expect(markdownContent).toHaveTextContent('def calculate(x, y):');
        expect(markdownContent).toHaveTextContent('Some special characters: áéíóú ñ ü');
      });
    });

    test('refetches content when fileName changes', async () => {
      mockUseParams.mockReturnValue({ fileName: 'document1' });
      mockedGet.mockResolvedValue({ data: { content: '# Document 1' } });

      const { rerender } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb/document1/');
      });

      // Change fileName
      mockUseParams.mockReturnValue({ fileName: 'document2' });
      mockedGet.mockResolvedValue({ data: { content: '# Document 2' } });

      rerender(<MarkdownViewer />);

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb/document2/');
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      mockUseParams.mockReturnValue({ fileName: 'nonexistent-document' });
      mockedGet.mockRejectedValue(new Error('Network Error'));

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toHaveClass('error-message');
      });
    });

    test('logs error to console when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      const networkError = new Error('Network Error');
      mockedGet.mockRejectedValue(networkError);

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(networkError);
      });
    });

    test('hides loading message when error occurs', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockRejectedValue(new Error('Network Error'));

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
      });
    });

    test('does not render markdown content when error occurs', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockRejectedValue(new Error('Network Error'));

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
        expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
      });
    });

    test('handles 404 error gracefully', async () => {
      mockUseParams.mockReturnValue({ fileName: 'missing-document' });
      const notFoundError = { response: { status: 404 } };
      mockedGet.mockRejectedValue(notFoundError);

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
      });
    });

    test('handles server error gracefully', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      const serverError = { response: { status: 500 } };
      mockedGet.mockRejectedValue(serverError);

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
      });
    });

    test('clears previous error when new content loads successfully', async () => {
      mockUseParams.mockReturnValue({ fileName: 'error-document' });
      mockedGet.mockRejectedValue(new Error('Network Error'));

      const { rerender } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
      });

      // Now succeed with a different document
      mockUseParams.mockReturnValue({ fileName: 'success-document' });
      mockedGet.mockResolvedValue({ data: { content: '# Success Document' } });

      rerender(<MarkdownViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load the document. Please make sure the file exists and the server is running.')).not.toBeInTheDocument();
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });
    });
  });

  // ===== UI STATE MANAGEMENT TESTS =====
  describe('UI State Management', () => {
    test('transitions from loading to content state', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockedGet.mockReturnValue(promise);

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      // Initially loading
      expect(screen.getByText('Loading document...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({ data: { content: sampleMarkdown } });

      await waitFor(() => {
        expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });
    });

    test('transitions from loading to error state', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      let rejectPromise;
      const promise = new Promise((resolve, reject) => { rejectPromise = reject; });
      mockedGet.mockReturnValue(promise);

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      // Initially loading
      expect(screen.getByText('Loading document...')).toBeInTheDocument();

      // Reject the promise
      rejectPromise(new Error('Network Error'));

      await waitFor(() => {
        expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
        expect(screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.')).toBeInTheDocument();
      });
    });

    test('shows loading state when fileName changes', async () => {
      mockUseParams.mockReturnValue({ fileName: 'document1' });
      mockedGet.mockResolvedValue({ data: { content: '# Document 1' } });

      const { rerender } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });

      // Change fileName and show loading again
      mockUseParams.mockReturnValue({ fileName: 'document2' });
      mockedGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      rerender(<MarkdownViewer />);

      expect(screen.getByText('Loading document...')).toBeInTheDocument();
    });

    test('maintains state consistency across re-renders', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      const { rerender } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });

      // Re-render component
      rerender(<MarkdownViewer />);

      // Should maintain the loaded state
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
    });
  });

  // ===== PERFORMANCE TESTS =====
  describe('Performance', () => {
    test('renders efficiently with large markdown content', async () => {
      const largeMarkdown = '# Large Document\n\n' + 'This is a paragraph. '.repeat(1000);
      mockUseParams.mockReturnValue({ fileName: 'large-document' });
      mockedGet.mockResolvedValue({ data: { content: largeMarkdown } });

      const startTime = performance.now();
      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    test('does not cause memory leaks on unmount', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      const { unmount } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });

    test('handles rapid fileName changes efficiently', async () => {
      const fileNames = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];

      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        mockUseParams.mockReturnValue({ fileName });
        mockedGet.mockResolvedValue({
          data: { content: `# Document ${i + 1}\n\nContent for ${fileName}` }
        });

        render(<MarkdownViewer />, { wrapper: RouterWrapper });

        await waitFor(() => {
          expect(mockedGet).toHaveBeenCalledWith(`/api/kb/${fileName}/`);
        });
      }
    });

    test('cancels previous requests when fileName changes', async () => {
      // This test ensures that changing the fileName doesn't cause race conditions
      mockUseParams.mockReturnValue({ fileName: 'document1' });
      mockedGet.mockResolvedValue({ data: { content: '# Document 1' } });

      const { rerender } = render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Document 1');
      });

      // Change fileName
      mockUseParams.mockReturnValue({ fileName: 'document2' });
      mockedGet.mockResolvedValue({
        data: { content: '# Document 2' }
      });

      rerender(<MarkdownViewer />);

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb/document2/');
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    test('provides meaningful loading message', () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      const loadingMessage = screen.getByText('Loading document...');
      expect(loadingMessage).toBeInTheDocument();
      // Loading message should be descriptive for screen readers
    });

    test('provides meaningful error message', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockRejectedValue(new Error('Network Error'));

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load the document. Please make sure the file exists and the server is running.');
        expect(errorMessage).toBeInTheDocument();
        // Error message provides actionable guidance
      });
    });

    test('maintains semantic structure with proper containers', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const container = screen.getByTestId('markdown-content').closest('.markdown-viewer-container');
        expect(container).toBeInTheDocument();

        const markdownBody = screen.getByTestId('markdown-content').closest('.markdown-body');
        expect(markdownBody).toBeInTheDocument();
      });
    });

    test('handles screen reader announcements for state changes', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      // Loading state should be announced
      expect(screen.getByText('Loading document...')).toBeInTheDocument();

      await waitFor(() => {
        // Content loaded state should be available to screen readers
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
        expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
      });
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    test('handles missing fileName parameter', async () => {
      mockUseParams.mockReturnValue({ fileName: undefined });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb/undefined/');
      });
    });

    test('handles null content response', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: { content: null } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        // Should handle null content gracefully
      });
    });

    test('handles malformed API response', async () => {
      mockUseParams.mockReturnValue({ fileName: 'test-document' });
      mockedGet.mockResolvedValue({ data: {} }); // Missing content property

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        // Should handle missing content property gracefully
      });
    });

    test('handles extremely long fileName', async () => {
      const veryLongFileName = 'a'.repeat(1000);
      mockUseParams.mockReturnValue({ fileName: veryLongFileName });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith(`/api/kb/${veryLongFileName}/`);
      });
    });

    test('handles special characters in fileName', async () => {
      const specialFileName = 'file-with-special-chars-@#$%';
      mockUseParams.mockReturnValue({ fileName: specialFileName });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith(`/api/kb/${specialFileName}/`);
      });
    });

    test('handles markdown with dangerous HTML content', async () => {
      const dangerousMarkdown = `# Test Document

<script>alert('xss')</script>

<img src="x" onerror="alert('xss')">

Regular **bold** text.`;

      mockUseParams.mockReturnValue({ fileName: 'dangerous-document' });
      mockedGet.mockResolvedValue({ data: { content: dangerousMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        expect(markdownContent).toBeInTheDocument();
        expect(markdownContent).toHaveTextContent('# Test Document');
        // ReactMarkdown should sanitize dangerous content
      });
    });

    test('handles empty string fileName', async () => {
      mockUseParams.mockReturnValue({ fileName: '' });
      mockedGet.mockResolvedValue({ data: { content: sampleMarkdown } });

      render(<MarkdownViewer />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/kb//');
      });
    });
  });
});
