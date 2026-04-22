# DEMO SCRIPT - Platform + Maker + Checker

1. Switch to **Alpha Maker** persona and click "Create Demo Listing".
2. Execute action `submit_for_review`; verify listing becomes `PendingReview`.
3. Switch to **Alpha Checker** persona; execute `approve` then `final_confirm`.
4. Verify listing status transitions to `Listed`.
5. Switch to **Platform Super Admin** persona and open platform tab.
6. Verify platform penetration view displays tenant listing status as read-only.
7. Open another browser tab and repeat one action to verify sync updates.
8. Simulate stale write (old version) and confirm conflict warning appears.
