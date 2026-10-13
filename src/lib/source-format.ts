import {dateKey} from '@/lib/worker-validation';

export function sourceHeader(value:string){return value.replace(/\s+/g,' ').trim();}
export function sourceMonth(value:unknown,interviewDate:string){
 const s=String(value??'').trim();if(!s)return '';
 if(/^T(0[1-9]|1[0-2])\.\d{4}$/.test(s))return s;
 const match=/^Tháng\s+(0?[1-9]|1[0-2])(?:[\s/.\-]+(\d{4}))?$/i.exec(s);
 if(!match)throw new Error('Kỳ nhận việc cần dạng Tháng 05 hoặc T05.2026');
 const date=dateKey(interviewDate);const year=match[2]||date?.slice(0,4);
 if(!year)throw new Error('Tháng thiếu năm và ngày PV không có năm hợp lệ; cần xác nhận năm');
 // Year comes from the same source row; never substitute the current year.
 return `T${match[1].padStart(2,'0')}.${year}`;
}

export const sourceStatuses=['NH','Bỏ XX','GTNB','Bỏ ĐT','Trượt KSK','Đỗ - Ko tính','Ko theo dõi','Hết Phí','HHĐ','Tự ý nghỉ việc','Hết phí','LV'];
export function sourceRewardAmount(value:unknown){const s=String(value??'').trim();if(!s)return 0;if(typeof value==='number'){if(!Number.isSafeInteger(value)||value<0)throw new Error('Tiền thưởng không hợp lệ');return value;}const m=/^(\d{1,3}(?:[, .]\d{3})+|\d+)(?:\s*[-–].*|\s*(?:đ|VND))?$/i.exec(s);if(m)return Number(m[1].replace(/[, .]/g,''));if(/^(ko|không|hết|tặng)/i.test(s))return 0;throw new Error('Nội dung thưởng chưa nhận diện: '+s);}
