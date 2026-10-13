export type ImportIssue={row:number;message:string;kind:string};
export function splitImportReview(messages:string[]){
 const warnings:ImportIssue[]=[],duplicates:ImportIssue[]=[];
 for(const message of new Set(messages)){
  const row=Number(/^Dòng (\d+):/.exec(message)?.[1]||0);
  const duplicate=/trùng(?:\s|$)|lượt PV đã có|CCCD có đợt|chưa xác nhận hồ sơ đang hoạt động|Bản thưởng của đợt đã có|Lượt PV đã được người khác thêm/i.test(message);
  const kind=duplicate?(/STK|tài khoản/.test(message)?'BANK_ACCOUNT':/SĐT/.test(message)?'PHONE':/đang hoạt động|CCCD có đợt/.test(message)?'ACTIVE_IDENTITY':/thưởng/.test(message)?'BONUS':'EXACT_RECRUITMENT'):'DATA_WARNING';
  (duplicate?duplicates:warnings).push({row,message,kind});
 }
 const duplicateRowNumbers=new Set(duplicates.map(i=>i.row));
 return {warnings,duplicates,warningRows:new Set(warnings.filter(i=>!duplicateRowNumbers.has(i.row)).map(i=>i.row)).size,duplicateRows:duplicateRowNumbers.size,reviewRows:new Set([...warnings,...duplicates].map(i=>i.row)).size};
}
