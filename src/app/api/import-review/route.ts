import {NextRequest,NextResponse} from 'next/server';
import {guard} from '@/lib/auth';
import {readImportSources} from '@/lib/import-source-store';
import {splitImportReview} from '@/lib/import-review';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const denied=await guard(request);if(denied)return denied;
 try{const sources=await readImportSources();const warnings:any[]=[],duplicates:any[]=[];
 for(const source of sources)for(const row of source.rows){const review=splitImportReview([...(row.warnings||[]),...(row.duplicates||[])]);const common={id:`${source.id}-${row.row}`,file:source.file,sheet:source.sheet,importType:source.type,row:row.row,values:row.values};if(review.duplicates.length)duplicates.push({...common,issues:[...review.duplicates,...review.warnings]});else if(review.warnings.length)warnings.push({...common,issues:review.warnings});}
 return NextResponse.json({success:true,data:{warnings,duplicates}});
 }catch{return NextResponse.json({success:false,message:'Không tải được danh sách phân luồng import'},{status:500});}
}
