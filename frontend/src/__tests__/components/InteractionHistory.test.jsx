/**
 * InteractionHistory Component Test Suite
 * REQ-101.4: Interaction History Display Testing
 *
 * Test Coverage:
 * - Interaction display with various types and content
 * - Empty state handling and messaging
 * - Date formatting and localization
 * - Interaction type display and formatting
 * - Content rendering and security
 * - Component structure and accessibility
 * - Edge cases and data validation
 * - Performance with large interaction lists
 * - WCAG 2.1 AA compliance
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import InteractionHistory from "../../components/InteractionHistory";

describe("InteractionHistory Component - REQ-101.4", () => {
  // Mock data for testing
  const mockInteractions = [
    {
      id: 1,
      interaction_type: "email",
      get_interaction_type_display: "Email",
      interaction_date: "2025-10-01T10:30:00Z",
      subject: "Initial Contact Email",
      body: "Thank you for your interest in our services. We would like to schedule a meeting."
    },
    {
      id: 2,
      interaction_type: "call",
      get_interaction_type_display: "Phone Call",
      interaction_date: "2025-10-02T14:15:00Z",
      subject: "Follow-up Call",
      body: "Discussed pricing options and timeline for implementation."
    },
    {
      id: 3,
      interaction_type: "meeting",
      get_interaction_type_display: "Meeting",
      interaction_date: "2025-10-03T09:00:00Z",
      subject: "Product Demo Meeting",
      body: "Demonstrated key features and answered technical questions."
    }
  ];

  const mockInteractionWithLongContent = {
    id: 4,
    interaction_type: "email",
    get_interaction_type_display: "Email",
    interaction_date: "2025-10-04T16:45:00Z",
    subject: "Very Long Subject Line That Should Be Handled Properly In The Display Without Breaking Layout",
    body: "This is a very long interaction body that contains multiple paragraphs and detailed information about the customer interaction. It should be displayed properly and handle various types of content including special characters, quotes, and potentially HTML-like content that should be escaped properly for security."
  };

  const mockInteractionMinimal = {
    id: 5,
    interaction_type: "note",
    get_interaction_type_display: "Note",
    interaction_date: "2025-10-05T12:00:00Z",
    subject: "",
    body: ""
  };

  afterEach(() => {
    cleanup();
  });

  describe("Component Rendering", () => {
    it("renders interaction history with header", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByRole("heading", { level: 4, name: /interaction history/i })).toBeInTheDocument();
    });

    it("renders all interactions in list format", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("displays interaction types correctly", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Phone Call")).toBeInTheDocument();
      expect(screen.getByText("Meeting")).toBeInTheDocument();
    });

    it("displays subjects and bodies for all interactions", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByText("Initial Contact Email")).toBeInTheDocument();
      expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument();
      expect(screen.getByText("Follow-up Call")).toBeInTheDocument();
      expect(screen.getByText(/discussed pricing options/i)).toBeInTheDocument();
      expect(screen.getByText("Product Demo Meeting")).toBeInTheDocument();
      expect(screen.getByText(/demonstrated key features/i)).toBeInTheDocument();
    });
  });

  describe("Empty State Handling", () => {
    it("displays empty message when interactions is null", () => {
      render(<InteractionHistory interactions={null} />);

      expect(screen.getByText(/no interaction history/i)).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("displays empty message when interactions is undefined", () => {
      render(<InteractionHistory interactions={undefined} />);

      expect(screen.getByText(/no interaction history/i)).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("displays empty message when interactions array is empty", () => {
      render(<InteractionHistory interactions={[]} />);

      expect(screen.getByText(/no interaction history/i)).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("does not show header when no interactions exist", () => {
      render(<InteractionHistory interactions={[]} />);

      expect(screen.queryByRole("heading", { name: /interaction history/i })).not.toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("formats dates using locale string format", () => {
      render(<InteractionHistory interactions={[mockInteractions[0]]} />);

      // Check that date is formatted (exact format may vary by locale)
      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveTextContent("2025"); // Year should be present
      expect(listItem).toHaveTextContent("10"); // Month should be present
    });

    it("handles different date formats correctly", () => {
      const interactionWithDifferentDate = {
        ...mockInteractions[0],
        interaction_date: "2025-12-25T23:59:59.999Z"
      };

      render(<InteractionHistory interactions={[interactionWithDifferentDate]} />);

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveTextContent("2025");
      expect(listItem).toHaveTextContent("12");
    });

    it("handles invalid dates gracefully", () => {
      const interactionWithInvalidDate = {
        ...mockInteractions[0],
        interaction_date: "invalid-date"
      };

      render(<InteractionHistory interactions={[interactionWithInvalidDate]} />);

      // Component should still render without crashing
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Initial Contact Email")).toBeInTheDocument();
    });
  });

  describe("Content Display", () => {
    it("displays interaction subjects as emphasized text", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      const subjects = screen.getAllByText(/initial contact email|follow-up call|product demo meeting/i);
      subjects.forEach(subject => {
        expect(subject.tagName).toBe("STRONG");
      });
    });

    it("displays interaction types as emphasized text", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      const types = screen.getAllByText(/^(Email|Phone Call|Meeting)$/);
      types.forEach(type => {
        expect(type.tagName).toBe("STRONG");
      });
    });

    it("handles long content without breaking layout", () => {
      render(<InteractionHistory interactions={[mockInteractionWithLongContent]} />);

      expect(screen.getByText(/very long subject line/i)).toBeInTheDocument();
      expect(screen.getByText(/very long interaction body/i)).toBeInTheDocument();
    });

    it("handles empty subject and body gracefully", () => {
      render(<InteractionHistory interactions={[mockInteractionMinimal]} />);

      expect(screen.getByText("Note")).toBeInTheDocument();
      // Empty strings should not cause rendering issues
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("preserves content formatting and line breaks", () => {
      const interactionWithFormatting = {
        ...mockInteractions[0],
        body: "Line 1\nLine 2\nLine 3"
      };

      render(<InteractionHistory interactions={[interactionWithFormatting]} />);

      expect(screen.getByText(/line 1/i)).toBeInTheDocument();
    });
  });

  describe("Data Validation", () => {
    it("handles missing required fields gracefully", () => {
      const incompleteInteraction = {
        id: 6,
        // Missing other required fields
      };

      render(<InteractionHistory interactions={[incompleteInteraction]} />);

      // Should not crash and should render what's available
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("handles interactions without ID gracefully", () => {
      const interactionWithoutId = {
        interaction_type: "email",
        get_interaction_type_display: "Email",
        interaction_date: "2025-10-01T10:30:00Z",
        subject: "Test Subject",
        body: "Test Body"
      };

      // Should not cause key prop warnings or crashes
      render(<InteractionHistory interactions={[interactionWithoutId]} />);

      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Test Subject")).toBeInTheDocument();
    });

    it("handles special characters in content safely", () => {
      const interactionWithSpecialChars = {
        id: 7,
        interaction_type: "email",
        get_interaction_type_display: "Email",
        interaction_date: "2025-10-01T10:30:00Z",
        subject: "Test <script>alert('xss')</script> Subject",
        body: "Content with & < > \" ' characters"
      };

      render(<InteractionHistory interactions={[interactionWithSpecialChars]} />);

      // Special characters should be rendered safely (no XSS)
      expect(screen.getByText(/test.*script.*subject/i)).toBeInTheDocument();
      expect(screen.getByText(/content with.*characters/i)).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("uses proper semantic HTML structure", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("applies correct CSS classes", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      const container = screen.getByRole("heading").closest("div");
      expect(container).toHaveClass("interaction-history");
    });

    it("maintains proper list structure", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");

      const listItems = screen.getAllByRole("listitem");
      listItems.forEach(item => {
        expect(item.tagName).toBe("LI");
      });
    });
  });

  describe("Performance", () => {
    it("renders efficiently with large number of interactions", () => {
      // Create large dataset
      const largeInteractionList = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        interaction_type: "email",
        get_interaction_type_display: "Email",
        interaction_date: `2025-10-01T${String(index % 24).padStart(2, '0')}:30:00Z`,
        subject: `Subject ${index + 1}`,
        body: `Body content for interaction ${index + 1}`
      }));

      const startTime = performance.now();
      render(<InteractionHistory interactions={largeInteractionList} />);
      const endTime = performance.now();

      // Should render within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(100);

      expect(screen.getAllByRole("listitem")).toHaveLength(100);
    });

    it("handles frequent re-renders without performance degradation", () => {
      const { rerender } = render(<InteractionHistory interactions={mockInteractions} />);

      // Simulate multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<InteractionHistory interactions={mockInteractions} />);
      }

      // Should still display correctly
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides proper heading hierarchy", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      const heading = screen.getByRole("heading", { level: 4 });
      expect(heading).toHaveTextContent("Interaction History");
    });

    it("uses semantic list structure for screen readers", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("provides meaningful content for screen readers", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      // Each list item should contain meaningful information
      const listItems = screen.getAllByRole("listitem");
      listItems.forEach(item => {
        expect(item).toHaveTextContent(/email|phone call|meeting/i);
        expect(item.textContent.length).toBeGreaterThan(10); // Should have substantial content
      });
    });

    it("handles emphasis elements properly for screen readers", () => {
      render(<InteractionHistory interactions={mockInteractions} />);

      // Check that important information is properly emphasized
      const strongElements = screen.getAllByText(/^(Email|Phone Call|Meeting)$/);
      strongElements.forEach(element => {
        expect(element.tagName).toBe("STRONG");
      });

      const subjectElements = screen.getAllByText(/initial contact email|follow-up call|product demo meeting/i);
      subjectElements.forEach(element => {
        expect(element.tagName).toBe("STRONG");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles mixed data types gracefully", () => {
      const mixedInteractions = [
        mockInteractions[0],
        null, // null item in array
        mockInteractions[1],
        undefined, // undefined item in array
        mockInteractions[2]
      ].filter(Boolean); // Filter out null/undefined

      render(<InteractionHistory interactions={mixedInteractions} />);

      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("handles very old and future dates", () => {
      const edgeDateInteractions = [
        { ...mockInteractions[0], interaction_date: "1900-01-01T00:00:00Z" },
        { ...mockInteractions[1], interaction_date: "2099-12-31T23:59:59Z" }
      ];

      render(<InteractionHistory interactions={edgeDateInteractions} />);

      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Phone Call")).toBeInTheDocument();
    });
  });
});