import {headers} from 'next/headers';
import {redirect,notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default function LoginPage(){
 if(process.env.LOCAL_DEMO_AUTO_VIEW==='1'&&['127.0.0.1:3005','localhost:3005'].includes(headers().get('host')||''))redirect('/');
 notFound();
}
