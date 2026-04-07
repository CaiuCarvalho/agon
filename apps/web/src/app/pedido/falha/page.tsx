import { redirect } from 'next/navigation';

// Redirect to confirmation page with order_id
export default async function FailurePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order_id;
  
  if (!orderId) {
    redirect('/');
  }
  
  // Redirect to confirmation page which handles all statuses
  redirect(`/pedido/confirmado?order_id=${orderId}`);
}
