// Next.js App Router
import dynamic from 'next/dynamic';

const CommunityFeed = dynamic(()=> import('../../components/CommunityFeed'), { ssr:false });

export const metadata = {
  title: 'Courant+ Community'
};

export default function Page() {
  return <CommunityFeed />;
}



