import importlib.util
import sys
import types
import unittest
from pathlib import Path


def load_generator_module() -> types.ModuleType:
    root = Path(__file__).resolve().parents[3]  # repo root
    mod_path = root / "docs" / "automation" / "generate_issues_from_spec.py"
    spec = importlib.util.spec_from_file_location("generate_issues_from_spec", mod_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    # Ensure module is visible to dataclasses decorator during load
    sys.modules["generate_issues_from_spec"] = module
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


gen = load_generator_module()


SAMPLE = """
## Phase 1 — Foo ~10%
Focus: Do the thing

Deliverables
- First deliverable
- Second deliverable

Acceptance Criteria
- [ ] Pass tests

Dependencies
- Stuff

Risks
- Risky
""".strip()


class TestGenerator(unittest.TestCase):
    def test_parse_spec_extracts_phase_and_sections(self):
        phases = gen.parse_spec(SAMPLE)
        self.assertEqual(len(phases), 1)
        ph = phases[0]
        self.assertEqual(ph.number, 1)
        self.assertTrue(ph.title.startswith("Foo"))
        self.assertEqual(ph.percent, "10%")
        self.assertEqual(ph.focus, "Do the thing")
        self.assertEqual(ph.deliverables, ["- First deliverable", "- Second deliverable"])
        self.assertTrue(ph.acceptance and ph.acceptance[0].startswith("- [ ] Pass"))
        self.assertTrue(ph.dependencies and ph.dependencies[0].startswith("- Stuff"))
        self.assertTrue(ph.risks and ph.risks[0].startswith("- Risky"))

    def test_slugify_cases(self):
        self.assertEqual(gen.slugify("First deliverable"), "first-deliverable")
        self.assertEqual(gen.slugify("APIs & Tests (Phase 1)"), "apis-tests")
        self.assertEqual(gen.slugify("Normalize to 100%"), "normalize-to-100")

    def test_generate_issue_markdown_contains_milestone(self):
        ph = gen.Phase(number=1, title="Foo", percent="10%", focus="Focus")
        ph.deliverables = ["- A"]
        title, body = gen.generate_issue_markdown(ph)
        self.assertIn("Milestone:", body)
        self.assertTrue(title.startswith("Phase 1"))


if __name__ == "__main__":
    unittest.main()
