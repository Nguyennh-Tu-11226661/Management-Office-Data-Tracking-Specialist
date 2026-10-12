import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {guard} from '@/lib/auth';
import {recruitmentReport,rewardReport} from '@/lib/reporting';
import {resultError,DomainError} from '@/lib/domain';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){const denied=await guard(r);if(denied)return denied;try{
 const p=r.nextUrl.searchParams;if(p.get('month')&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.get('month')!))throw new DomainError('Tháng PV không hợp lệ');
 const [workers,enrollments]=await Promise.all([prisma.worker.findMany({include:{assignments:{include:{order:true,batch:true}}}}),prisma.policyEnrollment.findMany({include:{assignment:{include:{worker:true,order:true,batch:true}},stages:{include:{payments:true}}}})]);
 return NextResponse.json({success:true,data:{recruitment:recruitmentReport(workers,p),rewards:rewardReport(enrollments,p)}});
 }catch(e){return resultError(e);}}
