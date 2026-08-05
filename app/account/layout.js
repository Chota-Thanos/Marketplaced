import AccountShell from '../../components/account/AccountShell';

export const metadata = {
  title: 'My Account | BazaarX',
};

export default function AccountLayout({ children }) {
  return <AccountShell>{children}</AccountShell>;
}
