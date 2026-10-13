import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {guard} from '@/lib/auth';
import {recruitmentReport,rewardReport,matchesAssignment} from '@/lib/reporting';
import {resultError,DomainError} from '@/lib/domain';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){const denied=await guard(r);if(denied)return denied;try{
 const p=r.nextUrl.searchParams;if(p.get('month')&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.get('month')!))throw new DomainError('Tháng PV không hợp lệ');
 const [workers,enrollments,imported]=await Promise.all([prisma.worker.findMany({include:{assignments:{include:{order:true,batch:true}}}}),prisma.policyEnrollment.findMany({include:{assignment:{include:{worker:true,order:true,batch:true}},stages:{include:{payments:true}}}}),prisma.bonusRecord.findMany({where:{note:{contains:'SOURCE_EXCEL_ACTUAL_PAID'}},include:{assignment:{include:{worker:true}},worker:true}})]);
 const sourcePaid=imported.filter(b=>b.assignment&&!b.worker.archivedAt&&matchesAssignment(b.assignment,p)).map(b=>({id:b.id,name:b.worker.fullName,company:b.company,month:b.month,interviewDate:b.interviewDate,paid:b.totalBonus||0,sourceRewards:JSON.parse(b.note!).rewards.join(' · ')}));
 return NextResponse.json({success:true,data:{sourcePaid:{total:sourcePaid.reduce((n,r)=>n+r.paid,0),rows:sourcePaid},recruitment:recruitmentReport(workers,p),rewards:rewardReport(enrollments,p)}});
 }catch(e){return resultError(e);}}
