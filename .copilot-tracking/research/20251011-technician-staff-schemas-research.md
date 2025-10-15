<!-- markdownlint-disable-file -->
# Task Research Notes: Technician & Staff (EnhancedUser) Schemas

## Research Executed

### File Analysis
- main/models.py → Technician, EnhancedUser confirmed.
- main/serializers.py → TechnicianSerializer, EnhancedUserSerializer confirmed fields.

### Project Conventions
- Standards referenced: draft-07 closed schemas; readOnly on server-managed timestamps; alignment with serializers.

## Key Discoveries
Technician has nested relations (certifications, availability, coverage areas) which remain separate in API. EnhancedUser includes hierarchy fields and technician link.

## Recommended Approach
Use created draft-07 closed schemas + variants; add nested entity schemas separately if needed (Certification, CoverageArea, Availability).

## Implementation Guidance
- Objectives: Stable contracts for technician and staff; prepare for nested schemas later.
- Key Tasks: Ensure examples are realistic; variants added.
- Success Criteria: Schemas reflect API I/O; validation works for primary draft-07.
