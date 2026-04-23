# Security Specification: KurdBid Marketplace

## 1. Data Invariants
- **Items**: Must have a sellerId matching the authenticated user. Status can only be changed by the owner or an admin.
- **Conversations**: Must have exactly two participants. One of them must be the current user for them to see it.
- **Messages**: Must belong to a conversation. The sender must be one of the participants.
- **Notifications**: Must be owned by the target userId.
- **Users**: Admin status can only be set by the master admin or the system.

## 2. The "Dirty Dozen" Payloads (Targeting Rejection)
1. **Access Bypass**: User A tries to read Conversation B (which they aren't part of).
2. **Identity Spoofing**: User A tries to create an Item as User B.
3. **Privilege Escalation**: User A updates their own profile with `isAdmin: true`.
4. **Relationship Violation**: User A tries to create a message in a conversation they aren't part of.
5. **PII Leak**: Guest tries to list all user phone numbers.
6. **State Shortcut**: User A marks an Item as 'active' when it was 'sold' by someone else.
7. **Resource Poisoning**: User A sends a 1MB string as a category.
8. **Shadow Keys**: User A adds `secretField: 'hacked'` to an Item update.
9. **Notification Hijack**: User A tries to read User B's notifications.
10. **Admin lockout**: Non-admin tries to delete another user's item.
11. **ID Injection**: User A uses a malicious string as a document ID.
12. **Status Spoofing**: User A creates an item with `status: 'sold'`.

## 3. Implementation Plan
- Define strict validation helpers for each entity.
- Implement participant checks for conversations and messages.
- Protect sensitive user fields.
- Hardcode the master admin email.
