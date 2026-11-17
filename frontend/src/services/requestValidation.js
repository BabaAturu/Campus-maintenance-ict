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
const attachmentTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.pdf', 'application/pdf'],
])
const maxAttachmentSize = 5 * 1024 * 1024

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
  if (attachment && attachment.size > 0) {
    const extension = attachment.name?.slice(attachment.name.lastIndexOf('.')).toLowerCase()
    const expectedType = attachmentTypes.get(extension)
    if (!expectedType || (attachment.type && attachment.type !== expectedType)) {
      errors.attachment = 'Choose a JPG, PNG, GIF, WEBP, or PDF file.'
    } else if (attachment.size > maxAttachmentSize) {
      errors.attachment = 'The attachment must be 5 MB or smaller.'
    }
  }

  return errors
}