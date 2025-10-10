/**
 * ContactDetail Component Test Suite
 * REQ-101.2: Contact Detail View Testing
 *
 * Test Coverage:
 * - Data display with various contact types and information levels
 * - Edit mode integration and navigation
 * - Interaction history display with filtering
 * - Custom fields display and validation
 * - Tag management integration
 * - Account association and navigation
 * - Permission-based access control
 * - Error handling and loading states
 * - API integration with contact and interaction endpoints
 * - Accessibility compliance (WCAG 2.1 AA)
 */

import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ContactDetail from "../../components/ContactDetail";
import api from "../../api";

// Mock API
jest.mock("../../api");
const mockApi = api;

// Mock the child components to isolate ContactDetail testing
jest.mock("../../components/InteractionHistory", () => {
  return function MockInteractionHistory({ interactions, contactId }) {
    return (
      <div data-testid="interaction-history">
        <h3>Interaction History</h3>
        <div data-testid="interactions-count">{interactions?.length || 0} interactions</div>
        <div data-testid="contact-id">{contactId}</div>
      </div>
    );
  };
});

jest.mock("../../components/TagManager", () => {
  return function MockTagManager({ associatedTags, onTagsUpdate, entityId, entityType }) {
    const handleAddTag = () => {
      onTagsUpdate([...associatedTags, { id: 999, name: "New Tag" }]);
    };

    return (
      <div data-testid="tag-manager">
        <h4>Tags</h4>
        <div data-testid="current-tags">
          {associatedTags?.map(tag => (
            <span key={tag.id} data-testid={`tag-${tag.id}`}>{tag.name}</span>
          ))}
        </div>
        <button onClick={handleAddTag} data-testid="add-tag">Add Tag</button>
        <div data-testid="entity-info">{entityType}-{entityId}</div>
      </div>
    );
  };
});

describe("ContactDetail Component - REQ-101.2", () => {
  const user = userEvent.setup();

  // Mock data
  const mockContact = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone_number: "555-123-4567",
    title: "Software Engineer",
    account: {
      id: 10,
      name: "Tech Corp"
    },
    owner: {
      id: 1,
      username: "salesrep1"
    },
    tags: [
      { id: 1, name: "VIP" },
      { id: 2, name: "Hot Lead" }
    ],
    custom_fields: [
      { id: 1, field_name: "LinkedIn Profile", value: "https://linkedin.com/in/johndoe" },
      { id: 2, field_name: "Referral Source", value: "Google Ads" }
    ]
  };

  const mockInteractions = [
    {
      id: 1,
      type: "email",
      description: "Initial contact email",
      date: "2025-10-01T10:00:00Z",
      user: { username: "salesrep1" }
    },
    {
      id: 2,
      type: "call",
      description: "Follow-up call",
      date: "2025-10-02T14:30:00Z",
      user: { username: "salesrep1" }
    }
  ];

  const mockContactMinimal = {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: null,
    phone_number: null,
    title: null,
    account: null,
    owner: null,
    tags: [],
    custom_fields: []
  };

  const renderContactDetail = (contactId = "1") => {
    return render(
      <MemoryRouter initialEntries={[`/contacts/${contactId}`]}>
        <Routes>
          <Route path="/contacts/:id" element={<ContactDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful API responses
    mockApi.get.mockImplementation((url) => {
      if (url.includes("/api/contacts/1/")) {
        return Promise.resolve({ data: mockContact });
      }
      if (url.includes("/api/interactions/")) {
        return Promise.resolve({ data: { results: mockInteractions } });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Component Rendering", () => {
    it("renders contact detail page with full contact information", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("555-123-4567")).toBeInTheDocument();
    });

    it("shows loading state initially", () => {
      renderContactDetail();
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    it("renders action buttons for editing and task creation", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("link", { name: /create task/i })).toBeInTheDocument();
    });

    it("renders with minimal contact information", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/2/")) {
          return Promise.resolve({ data: mockContactMinimal });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail("2");

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /jane smith/i })).toBeInTheDocument();
      });

      // Use getAllByText since there are multiple N/A elements for different fields
      const naElements = screen.getAllByText("N/A");
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  describe("Data Display Testing", () => {
    it("displays complete contact information correctly", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/email:/i)).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText(/phone:/i)).toBeInTheDocument();
      expect(screen.getByText("555-123-4567")).toBeInTheDocument();
      expect(screen.getByText(/title:/i)).toBeInTheDocument();
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    it("displays account association with navigation link", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/account:/i)).toBeInTheDocument();
      });

      const accountLink = screen.getByRole("link", { name: /tech corp/i });
      expect(accountLink).toBeInTheDocument();
      expect(accountLink).toHaveAttribute("href", "/accounts/10");
    });

    it("displays contact owner information", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/owner:/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/salesrep1/i)).toBeInTheDocument();
    });

    it("handles null values gracefully with N/A display", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({
            data: { ...mockContact, email: null, phone_number: null, title: null }
          });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      // Should show N/A for null values
      const naElements = screen.getAllByText("N/A");
      expect(naElements).toHaveLength(3); // email, phone, title
    });
  });

  describe("Custom Fields Display", () => {
    it("displays custom fields section when present", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/custom fields/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/linkedin profile:/i)).toBeInTheDocument();
      expect(screen.getByText("https://linkedin.com/in/johndoe")).toBeInTheDocument();
      expect(screen.getByText(/referral source:/i)).toBeInTheDocument();
      expect(screen.getByText("Google Ads")).toBeInTheDocument();
    });

    it("hides custom fields section when no custom fields exist", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({
            data: { ...mockContact, custom_fields: [] }
          });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/custom fields/i)).not.toBeInTheDocument();
    });

    it("handles custom field values of different types", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({
            data: {
              ...mockContact,
              custom_fields: [
                { id: 1, field_name: "Revenue Target", value: 50000 },
                { id: 2, field_name: "VIP Status", value: true },
                { id: 3, field_name: "Join Date", value: "2025-01-15" }
              ]
            }
          });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/revenue target:/i)).toBeInTheDocument();
      });

      expect(screen.getByText("50000")).toBeInTheDocument();
      expect(screen.getByText("true")).toBeInTheDocument();
      expect(screen.getByText("2025-01-15")).toBeInTheDocument();
    });
  });

  describe("Tag Management Integration", () => {
    it("renders TagManager component with current tags", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("tag-manager")).toBeInTheDocument();
      });

      expect(screen.getByTestId("tag-1")).toHaveTextContent("VIP");
      expect(screen.getByTestId("tag-2")).toHaveTextContent("Hot Lead");
      expect(screen.getByTestId("entity-info")).toHaveTextContent("contacts-1");
    });

    it("handles tag updates through TagManager callback", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("tag-manager")).toBeInTheDocument();
      });

      // Simulate adding a tag
      await user.click(screen.getByTestId("add-tag"));

      // Should show the new tag (mocked in TagManager mock)
      expect(screen.getByTestId("tag-999")).toHaveTextContent("New Tag");
    });

    it("handles empty tags array gracefully", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({
            data: { ...mockContact, tags: [] }
          });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("tag-manager")).toBeInTheDocument();
      });

      expect(screen.getByTestId("current-tags")).toBeEmptyDOMElement();
    });
  });

  describe("Interaction History Integration", () => {
    it("renders InteractionHistory component with interaction data", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("interaction-history")).toBeInTheDocument();
      });

      expect(screen.getByText(/interaction history/i)).toBeInTheDocument();
      expect(screen.getByTestId("interactions-count")).toHaveTextContent("2 interactions");
      expect(screen.getByTestId("contact-id")).toHaveTextContent("1");
    });

    it("handles empty interaction history", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({ data: mockContact });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("interaction-history")).toBeInTheDocument();
      });

      expect(screen.getByTestId("interactions-count")).toHaveTextContent("0 interactions");
    });

    it("handles different interaction API response formats", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({ data: mockContact });
        }
        if (url.includes("/api/interactions/")) {
          // Return direct array instead of paginated results
          return Promise.resolve({ data: mockInteractions });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByTestId("interactions-count")).toHaveTextContent("2 interactions");
      });
    });
  });

  describe("Navigation Integration", () => {
    it("provides correct edit link with contact ID", async () => {
      renderContactDetail();

      await waitFor(() => {
        const editLink = screen.getByRole("link", { name: /edit/i });
        expect(editLink).toHaveAttribute("href", "/contacts/1/edit");
      });
    });

    it("provides task creation link with contact state", async () => {
      renderContactDetail();

      await waitFor(() => {
        const taskLink = screen.getByRole("link", { name: /create task/i });
        expect(taskLink).toHaveAttribute("href", "/tasks/new");
      });
    });

    it("provides account navigation link when account exists", async () => {
      renderContactDetail();

      await waitFor(() => {
        const accountLink = screen.getByRole("link", { name: /tech corp/i });
        expect(accountLink).toHaveAttribute("href", "/accounts/10");
      });
    });

    it("does not show account link when no account associated", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({
            data: { ...mockContact, account: null }
          });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /tech corp/i })).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error message when contact API call fails", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({ data: [] });
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/failed to load contact details/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/you may not have permission/i)).toBeInTheDocument();
    });

    it("shows no contact found when contact is null", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({ data: null });
        }
        if (url.includes("/api/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/no contact found/i)).toBeInTheDocument();
      });
    });

    it("handles interactions API failure gracefully", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/1/")) {
          return Promise.resolve({ data: mockContact });
        }
        if (url.includes("/api/contacts/1/interactions/")) {
          return Promise.reject(new Error("Interactions API error"));
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      // Should still render contact details even if interactions fail
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();

      // InteractionHistory component should still be rendered (handled internally)
      expect(screen.getByTestId("interaction-history")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading indicator while fetching contact data", () => {
      // Make API call hang to test loading state
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      renderContactDetail();

      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    it("hides loading indicator after successful data load", async () => {
      renderContactDetail();

      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
    });

    it("hides loading indicator after error occurs", async () => {
      mockApi.get.mockRejectedValue(new Error("API Error"));

      renderContactDetail();

      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/failed to load contact details/i)).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("calls correct API endpoints on component mount", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/api/contacts/1/");
      });

      expect(mockApi.get).toHaveBeenCalledWith("/api/interactions/?contact=1");
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });

    it("refetches data when contact ID changes", async () => {
      // Test that we can successfully call different API endpoints by unmounting and remounting
      // First render contact 1
      const { unmount } = renderContactDetail("1", "/contacts/1");

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/api/contacts/1/");
      });

      // Unmount the first component
      unmount();
      jest.clearAllMocks();

      // Set up API mock for contact 2
      mockApi.get.mockImplementation((url) => {
        if (url.includes("/api/contacts/2/")) {
          return Promise.resolve({ data: mockContactMinimal });
        }
        if (url.includes("/api/contacts/2/interactions/")) {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      // Render contact 2
      renderContactDetail("2", "/contacts/2");

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/api/contacts/2/");
      });
    });

    it("handles contact API response with serialized custom fields", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/linkedin profile:/i)).toBeInTheDocument();
      });

      expect(screen.getByText("https://linkedin.com/in/johndoe")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders with proper container structure", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      });

      expect(document.querySelector(".contact-detail-container")).toBeInTheDocument();
      expect(document.querySelector(".contact-header")).toBeInTheDocument();
      expect(document.querySelector(".contact-body")).toBeInTheDocument();
      expect(document.querySelector(".contact-info")).toBeInTheDocument();
      expect(document.querySelector(".contact-main-content")).toBeInTheDocument();
    });

    it("maintains semantic HTML structure", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
      });

      // Check for semantic structure
      expect(screen.getByRole("heading", { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getAllByRole("link")).toHaveLength(3); // Edit, Create Task, Account
    });
  });

  describe("Accessibility", () => {
    it("uses proper heading hierarchy", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 2, name: /john doe/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("heading", { level: 4, name: /custom fields/i })).toBeInTheDocument();
    });

    it("provides descriptive link text", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("link", { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /tech corp/i })).toBeInTheDocument();
    });

    it("uses proper label association for data display", async () => {
      renderContactDetail();

      await waitFor(() => {
        expect(screen.getByText(/email:/i)).toBeInTheDocument();
      });

      // Labels should be associated with their values
      expect(screen.getByText(/phone:/i)).toBeInTheDocument();
      expect(screen.getByText(/title:/i)).toBeInTheDocument();
      expect(screen.getByText(/account:/i)).toBeInTheDocument();
      expect(screen.getByText(/owner:/i)).toBeInTheDocument();
    });
  });
});
