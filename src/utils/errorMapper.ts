/**
 * Maps database and API errors to user-friendly messages.
 * This prevents exposing sensitive implementation details to end users.
 */
export function mapDatabaseError(error: unknown): string {
  const errorObj = error as { message?: string; code?: string };
  const message = errorObj?.message?.toLowerCase() || '';
  const code = errorObj?.code?.toLowerCase() || '';

  // Duplicate/Already exists errors
  if (message.includes('duplicate') || message.includes('already exists') || message.includes('already registered')) {
    if (message.includes('email')) {
      return 'This email is already registered.';
    }
    return 'This record already exists. Please check your input.';
  }

  // Foreign key violations
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Invalid data relationship. Please verify your selections.';
  }

  // Permission/RLS errors
  if (message.includes('permission denied') || message.includes('rls') || message.includes('policy') || code === '42501') {
    return 'You do not have permission to perform this action.';
  }

  // Unique constraint violations
  if (message.includes('unique constraint')) {
    return 'A record with this information already exists.';
  }

  // Not found errors
  if (message.includes('not found') || code === 'pgrst116') {
    return 'The requested resource was not found.';
  }

  // Auth-related errors
  if (message.includes('invalid login') || message.includes('invalid password')) {
    return 'Invalid email or password.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before logging in.';
  }

  // Generic fallback - log original error in dev only
  if (import.meta.env.DEV) {
    console.error('Database error:', error);
  }

  return 'An error occurred. Please try again or contact support.';
}
