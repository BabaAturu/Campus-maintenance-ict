const requiredFields = {
  title: 'Request title',
  category: 'ICT category',
  description: 'Description',
  building: 'Campus building / location',
  room: 'Room number',
  priority: 'Priority',
}

const categories = [
  'Computer Hardware',
  'Software & Operating System',
  'Network & Internet',
  'Printer & Scanner',
  'Server & Storage',
  'ICT Classroom & Laboratory Equipment',
  'ICT Security & Other Technical Issues',
]
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function validateRequestFields(values) {
  const errors = {}

  Object.entries(requiredFields).forEach(([name, label]) => {
    if (!String(values[name] ?? '').trim()) errors[name] = `${label} is required.`
  })

  if (values.category && !categories.includes(values.category)) {
    errors.category = 'Choose a valid ICT request category.'
  }
  if (values.priority && !priorities.includes(values.priority)) {
    errors.priority = 'Choose a valid priority.'
  }

  const attachment = values.attachment
  if (attachment && attachment.size > 0 && !attachment.type?.startsWith('image/')) {
    errors.attachment = 'Choose an image file for the attachment.'
  }

  return errors
}