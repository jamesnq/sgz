export const formatEmailToUsername = (email: string): string => {
  return email.split('@')[0] || ''
}
