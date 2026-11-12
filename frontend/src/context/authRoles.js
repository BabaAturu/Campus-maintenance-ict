export function roleHomePath(role) {
  switch (role) {
    case 'STAFF':
      return '/dashboard/staff'
    case 'ICT_ADMIN':
      return '/dashboard/ict-admin'
    case 'ICT_TECHNICIAN_TEAM_LEAD':
      return '/dashboard/team-lead'
    case 'ICT_TECHNICIAN':
      return '/dashboard/technician'
    default:
      return '/'
  }
}
