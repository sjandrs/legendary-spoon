---
name: API Parity Checklist
about: Validate endpoint parity vs canonical (routes, pagination, errors, RBAC)
title: "[API Parity] <resource>"
labels: [api, parity]
assignees: []
---

## Endpoint(s)

- `/api/<resource>/`

## Checks

- [ ] Pagination shape is `{count,next,previous,results}`
- [ ] Error shape standardized (detail/errors list)
- [ ] RBAC matrix: 401 unauth, 403 unauthorized, 200/201 authorized
- [ ] Filtering/search params documented and tested
- [ ] Ordering fields documented and tested

## References

- Tests: link to APITestCase assertions
- Docs: docs/API.md anchors
