export async function listLeads(client, requireAdmin) {
  await requireAdmin();
  const { data, error } = await client.from('contact_enquiries').select('*')
    .order('created_at', { ascending: false }).order('id', { ascending: false });
  if (error) throw Error('Leads could not be loaded. Confirm that contact-enquiries.sql was run in Supabase.');
  return data || [];
}
