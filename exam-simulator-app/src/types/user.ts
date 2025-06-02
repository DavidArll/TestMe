// src/types/user.ts
export interface User {
  id: string;
  username: string;
  // email?: string; // Optional for now
  // password is not stored in the User object in context, only for registration/login check
}
