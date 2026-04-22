# UAT CHECKLIST - RBAC & Maker-Checker

- [ ] Maker can create a tenant listing draft.
- [ ] Maker can submit listing from Draft/ChangesRequested into PendingReview.
- [ ] Checker can approve listing from PendingReview into ApprovedInternal.
- [ ] Checker can reject listing from PendingReview into ChangesRequested with reason.
- [ ] Checker can final confirm listing into Listed.
- [ ] Platform Super Admin can view all tenant listings in read-only mode.
- [ ] Cross-tab synchronization updates listing status via sync bus.
- [ ] Version conflict rejects stale update and shows an error.
