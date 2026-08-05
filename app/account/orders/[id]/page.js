import OrderDetailClient from '../../../../components/account/OrderDetailClient';

export default async function AccountOrderDetailPage({ params }) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
