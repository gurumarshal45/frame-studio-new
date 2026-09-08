export function validateEnquiry(input) {
  const enquiry = {
    name: String(input.name || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    phone: String(input.phone || '').trim(),
    event_date: input.event_date || null,
    event_location: String(input.event_location || '').trim(),
    message: String(input.message || '').trim(),
  };
  if (enquiry.name.length < 2 || enquiry.name.length > 100) throw Error('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email) || enquiry.email.length > 254) throw Error('Please enter a valid email address.');
  if (enquiry.phone.length > 30) throw Error('Phone number is too long.');
  if (enquiry.event_location.length > 150) throw Error('Event location is too long.');
  if (enquiry.message.length < 5 || enquiry.message.length > 2000) throw Error('Please enter a message between 5 and 2000 characters.');
  return enquiry;
}

export async function submitEnquiry(client, input) {
  const enquiry = validateEnquiry(input);
  const { error } = await client.from('contact_enquiries').insert(enquiry);
  if (error) throw Error('We could not save your enquiry. Please try again or call us.');
}
