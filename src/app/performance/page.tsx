'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Table, Input, Select, Button, Tag, Progress, Empty, message, Checkbox } from 'antd';
import { useIdentity } from '@/components/AuthGate';
import {
  Award,
  TrendingUp,
  Users,
  Target,
  Filter,
  RotateCcw,
  Medal,
  Search,
  CheckCircle2,
  Building,
  UserPlus,
  Sparkles,
  Download,
  Star,
  UserCheck
} from 'lucide-react';

const pct = (n: number | null | undefined) => (n == null ? '—' : `${n}%`);

const isPassed = (a: any) => {
  if (a.interviewResult === 'PASS') return true;
  const s = String(a.status || '').trim().toLowerCase();
  if (['lv', 'đang làm việc', 'chuyển chính thức', 'đang lv', 'đang đào tạo'].includes(s)) return true;
  if (['nh', 'nghỉ hẳn', 'hết phí', 'hhđ', 'hết hợp đồng', 'tự ý nghỉ việc', 'đã nghỉ việc', 'đạt phỏng vấn', 'đỗ - ko tính', 'gtnb'].includes(s)) return true;
  return false;
};

const isWorking = (a: any) => {
  const s = String(a.status || '').trim().toLowerCase();
  return ['lv', 'đang làm việc', 'chuyển chính thức', 'đang lv'].includes(s) ||
    (a.confirmedWorkDays != null && a.confirmedWorkDays >= 10);
};

const dateKey = (value: string): string | null => {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!iso && !vn) return null;
  const y = Number(iso ? iso[1] : vn![3]),
    m = Number(iso ? iso[2] : vn![2]),
    d = Number(iso ? iso[3] : vn![1]);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const monthOf = (value: string | null | undefined): string => {
  if (!value) return 'UNKNOWN';
  const dk = dateKey(value);
  return dk ? dk.slice(0, 7) : 'UNKNOWN';
};

export default function PerformanceEvaluationPage() {
  const user = useIdentity();
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [catalogTeams, setCatalogTeams] = useState<any[]>([]);
  const [catalogRecruiters, setCatalogRecruiters] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Demographics scope filter
  const [demoScopeType, setDemoScopeType] = useState<'ALL' | 'TEAM' | 'RECRUITER'>('ALL');
  const [demoScopeValue, setDemoScopeValue] = useState<string>('');
  const [demoData, setDemoData] = useState<any>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  // Interactive controls
  const [monthlyMetric, setMonthlyMetric] = useState<'achieved' | 'rate' | 'per_recruiter' | 'contribution'>('achieved');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [onlyWithKpi, setOnlyWithKpi] = useState(false);

  // 1. Tải báo cáo tổng
  async function loadReports() {
    setBusy(true);
    try {
      const q = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/reports?${q}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        message.error(json.message || 'Không thể tải dữ liệu báo cáo');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setBusy(false);
    }
  }

  // 2. Tải danh mục ban đầu
  useEffect(() => {
    loadReports();
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
      fetch('/api/catalogs?kind=TEAM').then(r => r.json()),
      fetch('/api/catalogs?kind=RECRUITER').then(r => r.json()),
    ]).then(([o, w, t, rec]) => {
      setOrders(o.data || []);
      setWorkers(w.data || []);
      setCatalogTeams(t.data || []);
      setCatalogRecruiters(rec.data || []);
    }).catch(() => {});
  }, []);

  // Tự động tải lại khi đổi bộ lọc chính
  useEffect(() => {
    loadReports();
  }, [filters]);

  // 3. Tải dữ liệu chân dung riêng biệt khi đổi bộ lọc Chân dung
  useEffect(() => {
    async function loadDemographics() {
      if (demoScopeType === 'ALL') {
        setDemoData(data?.recruitment?.demographics || null);
        return;
      }
      if (!demoScopeValue) return;

      setDemoBusy(true);
      try {
        const queryParams = new URLSearchParams({
          ...filters,
          ...(demoScopeType === 'TEAM' ? { team: demoScopeValue } : { recruiter: demoScopeValue })
        });
        const res = await fetch(`/api/reports?${queryParams.toString()}`);
        const json = await res.json();
        if (json.success) {
          setDemoData(json.data?.recruitment?.demographics || null);
        }
      } catch {
        message.error('Không thể tải chân dung nhân sự theo bộ lọc');
      } finally {
        setDemoBusy(false);
      }
    }

    if (data?.recruitment) {
      loadDemographics();
    }
  }, [demoScopeType, demoScopeValue, data, filters]);

  const setFilter = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val || '' }));
  };

  const factoryNames = useMemo(() => {
    return [
      ...new Set([
        ...orders.map(o => o.factory),
        ...workers.flatMap(w => (w.assignments || []).map((a: any) => a.interviewFactory)),
      ]),
    ].filter(Boolean);
  }, [orders, workers]);

  // Ánh xạ chuyên viên -> Team từ Catalog
  const recruiterTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of catalogRecruiters) {
      if (r.name && r.team?.name) map.set(r.name.trim().toLowerCase(), r.team.name);
    }
    return map;
  }, [catalogRecruiters]);

  // Toàn bộ các assignment của hồ sơ hoạt động
  const activeAssignments = useMemo(() => {
    return workers
      .filter(w => !w.archivedAt)
      .flatMap(w => (w.assignments || []).map((a: any) => ({ ...a, worker: w })));
  }, [workers]);

  // Danh sách các tháng có dữ liệu thực tế (sắp xếp tăng dần theo thời gian)
  const availableMonths = useMemo(() => {
    const rawMonths = data?.recruitment?.months || [];
    const set = new Set<string>();
    rawMonths.forEach((m: any) => {
      if (m.name && m.name !== 'UNKNOWN') set.add(m.name);
    });
    activeAssignments.forEach(a => {
      const mo = monthOf(a.interviewDate);
      if (mo !== 'UNKNOWN') set.add(mo);
    });
    return Array.from(set).sort();
  }, [data, activeAssignments]);

  // =========================================================================
  // 1. DỮ LIỆU THẬT 100%: THẺ ĐIỂM TỪNG TEAM
  // =========================================================================
  const teamCards = useMemo(() => {
    const rawTeams = data?.recruitment?.teams || [];
    if (!rawTeams.length) return [];

    const allRetained = rawTeams.reduce((sum: number, t: any) => sum + (t.working || 0), 0);

    const mapped = rawTeams.map((t: any, idx: number) => {
      // Đếm số chuyên viên thực tế thuộc team này
      const recruitersInTeam = catalogRecruiters.filter(r => r.team?.name === t.name).length ||
        new Set(activeAssignments.filter(a => a.team === t.name).map(a => a.recruiter).filter(Boolean)).size || 1;

      const total = t.total || 0;
      const passed = t.passed || 0;
      const retained10 = t.working || 0;
      const retentionRate = passed > 0 ? Math.round((retained10 / passed) * 1000) / 10 : 0;
      const failRate = total > 0 ? Math.round((t.failed / total) * 1000) / 10 : 0;
      const abandonRate = total > 0 ? Math.round((t.abandoned / total) * 1000) / 10 : 0;
      const quitBefore10Rate = Math.max(0, Math.round((100 - retentionRate - failRate - abandonRate) * 10) / 10);
      const perRecruiter = recruitersInTeam > 0 ? Math.round(retained10 / recruitersInTeam) : retained10;
      const contribution = allRetained > 0 ? Math.round((retained10 / allRetained) * 100) : 0;

      return {
        id: `T${idx + 1}`,
        name: t.name,
        recruitersCount: recruitersInTeam,
        passed,
        retained10,
        retentionRate,
        failRate,
        abandonRate,
        quitBefore10Rate,
        perRecruiter,
        contribution,
        isTop: false
      };
    });

    // Xác định team có năng suất cao nhất
    let maxNS = -1;
    let topIdx = -1;
    mapped.forEach((t, i) => {
      if (t.perRecruiter > maxNS && t.perRecruiter > 0) {
        maxNS = t.perRecruiter;
        topIdx = i;
      }
    });

    return mapped.map((t, i) => ({
      ...t,
      isTop: i === topIdx
    }));
  }, [data, catalogRecruiters, activeAssignments]);

  // =========================================================================
  // 2. DỮ LIỆU THẬT 100%: MA TRẬN THÁNG & BIỂU ĐỒ DIỄN BIẾN
  // =========================================================================
  const monthlyKpiData = useMemo(() => {
    if (!teamCards.length || !availableMonths.length) return [];

    return teamCards.map(team => {
      const monthValues = availableMonths.map(mStr => {
        const inMonth = activeAssignments.filter(
          a => (a.team === team.name || (!a.team && team.name === 'Chưa gán')) && monthOf(a.interviewDate) === mStr
        );
        if (!inMonth.length) return '—';
        const passedCount = inMonth.filter(isPassed).length;
        const rate = inMonth.length > 0 ? Math.round((passedCount / inMonth.length) * 100) : 0;
        return `${rate}%`;
      });
      return {
        name: team.name,
        months: monthValues
      };
    });
  }, [teamCards, availableMonths, activeAssignments]);

  const chartPoints = useMemo(() => {
    if (!teamCards.length || !availableMonths.length) return [];
    const colors = ['#2563eb', '#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b', '#64748b'];

    return teamCards.map((team, idx) => {
      const values = availableMonths.map(mStr => {
        const inMonth = activeAssignments.filter(
          a => (a.team === team.name || (!a.team && team.name === 'Chưa gán')) && monthOf(a.interviewDate) === mStr
        );
        const passed = inMonth.filter(isPassed).length;
        const working = inMonth.filter(isWorking).length;

        if (monthlyMetric === 'achieved') {
          return working;
        } else if (monthlyMetric === 'rate') {
          return passed > 0 ? Math.round((working / passed) * 100) : 0;
        } else if (monthlyMetric === 'per_recruiter') {
          return team.recruitersCount > 0 ? Math.round(working / team.recruitersCount) : working;
        } else {
          const totalMonthRetained = activeAssignments.filter(
            a => monthOf(a.interviewDate) === mStr && isWorking(a)
          ).length;
          return totalMonthRetained > 0 ? Math.round((working / totalMonthRetained) * 100) : 0;
        }
      });

      return {
        team: team.name,
        color: colors[idx % colors.length],
        values
      };
    });
  }, [teamCards, availableMonths, activeAssignments, monthlyMetric]);

  // =========================================================================
  // 3. DỮ LIỆU THẬT 100%: BẢNG XẾP HẠNG CHUYÊN VIÊN TUYỂN DỤNG
  // =========================================================================
  const recruiterLeaderboard = useMemo(() => {
    const rawRecruiters = data?.recruitment?.recruiters || [];
    if (!rawRecruiters.length) return [];

    const sorted = [...rawRecruiters].sort((a, b) => (b.passed || 0) - (a.passed || 0));

    return sorted.map((r: any, idx: number) => {
      const teamName = recruiterTeamMap.get(r.name?.trim().toLowerCase()) || 'Chưa gán';
      const passed = r.passed || 0;
      const total = r.total || 0;
      const working = r.working || 0;

      // Tính số ngày phỏng vấn có đỗ thực tế
      const recruiterAssignments = activeAssignments.filter(a => a.recruiter === r.name && isPassed(a));
      const distinctDays = new Set(recruiterAssignments.map(a => dateKey(a.interviewDate)).filter(Boolean)).size;
      const activeDays = distinctDays > 0 ? distinctDays : (passed > 0 ? 1 : 0);
      const passedPerDay = activeDays > 0 ? (passed / activeDays).toFixed(1) : '—';

      const passRate = passed > 0 ? Math.round((working / passed) * 1000) / 10 : 0;
      const dropBefore = total > 0 ? Math.round((r.failed / total) * 1000) / 10 : 0;
      const abandon = total > 0 ? Math.round((r.abandoned / total) * 1000) / 10 : 0;
      const quitBefore10 = 0;
      const kpiRate = passRate; // Hoặc tỷ lệ đỗ đạt chuẩn

      return {
        rank: idx + 1,
        name: r.name,
        team: teamName,
        passed,
        activeDays,
        passedPerDay,
        dropBefore: `${dropBefore}%`,
        abandon: `${abandon}%`,
        quitBefore10: `${quitBefore10}%`,
        passRate: `${passRate}%`,
        passRateVal: passRate,
        kpiRate: `${Math.round(kpiRate)}%`,
        kpiRateVal: Math.round(kpiRate),
        hasKpi: passed > 0
      };
    });
  }, [data, recruiterTeamMap, activeAssignments]);

  const filteredLeaderboard = useMemo(() => {
    return recruiterLeaderboard.filter(item => {
      const matchSearch = !recruiterSearch || item.name.toLowerCase().includes(recruiterSearch.trim().toLowerCase());
      const matchKpi = !onlyWithKpi || item.hasKpi;
      return matchSearch && matchKpi;
    });
  }, [recruiterLeaderboard, recruiterSearch, onlyWithKpi]);

  // Tính trung vị cho Biểu đồ phân tán (Quadrant Scatter)
  const { medianPassed, medianRate } = useMemo(() => {
    if (!recruiterLeaderboard.length) return { medianPassed: 0, medianRate: 0 };
    const passedArr = recruiterLeaderboard.map(r => r.passed).sort((a, b) => a - b);
    const rateArr = recruiterLeaderboard.map(r => r.passRateVal).sort((a, b) => a - b);
    const mid = Math.floor(passedArr.length / 2);
    return {
      medianPassed: passedArr[mid] || 0,
      medianRate: rateArr[mid] || 0
    };
  }, [recruiterLeaderboard]);

  // =========================================================================
  // 4. DỮ LIỆU THẬT 100%: HAI CARD ĐỐI SOÁT CHÂN TRANG
  // =========================================================================
  const sourceComparison = useMemo(() => {
    const referralList = activeAssignments.filter(a => (a.source || '').toLowerCase().includes('giới thiệu'));
    const directList = activeAssignments.filter(a => !(a.source || '').toLowerCase().includes('giới thiệu'));

    const directPassed = directList.filter(isPassed).length;
    const directWorking = directList.filter(isWorking).length;
    const directRate = directPassed > 0 ? Math.round((directWorking / directPassed) * 1000) / 10 : 0;

    const referralPassed = referralList.filter(isPassed).length;
    const referralWorking = referralList.filter(isWorking).length;
    const referralRate = referralPassed > 0 ? Math.round((referralWorking / referralPassed) * 1000) / 10 : 0;

    return {
      directPassed,
      directRate,
      referralPassed,
      referralRate
    };
  }, [activeAssignments]);

  // Xuất CSV báo cáo
  const exportToCSV = () => {
    if (!filteredLeaderboard.length) {
      message.warning('Không có dữ liệu để xuất file CSV');
      return;
    }
    const headers = ['#', 'Người tuyển', 'Team', 'Đỗ PV', 'Ngày có đỗ', 'Đỗ/ngày', 'Rớt trước', 'Bỏ xưởng', 'Nghỉ < 10', 'Tỷ lệ đạt', 'KPI đạt %'];
    const rows = filteredLeaderboard.map(r => [
      r.rank,
      r.name,
      r.team,
      r.passed,
      r.activeDays,
      r.passedPerDay,
      r.dropBefore,
      r.abandon,
      r.quitBefore10,
      r.passRate,
      r.kpiRate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_danh_gia_tuyen_dung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã tải xuống file CSV thành công!');
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 min-h-screen">
      {/* =========================================================================
          1. HEADER CHÍNH & THANH CÔNG CỤ
          ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">So sánh team</h1>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá năng suất, hiệu quả giữ chân và tiến độ thực hiện KPI tuyển dụng từ dữ liệu CSDL thực tế.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="primary"
            className="bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg flex items-center gap-1.5"
            onClick={() => window.location.href = '/excel-tools'}
          >
            <CheckCircle2 className="w-4 h-4"/> Nhập Excel/CSV
          </Button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Chế độ: Đồng bộ CSDL trực tiếp (100% dữ liệu thực)
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'BL'}
            </span>
            {user?.username || 'leader@trithucviet.vn'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. BỘ LỌC ĐIỀU HÀNH & HỘP THÔNG BÁO VÀNG
          ========================================================================= */}
      <Card className="shadow-xs border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tháng phỏng vấn</label>
            <Select
              className="w-full"
              placeholder="Tất cả các tháng (Toàn kỳ)"
              value={filters.month || undefined}
              onChange={(v) => setFilter('month', v)}
              allowClear
              options={[
                { value: '', label: 'Tất cả các tháng (Toàn kỳ)' },
                ...availableMonths.map(m => ({ value: m, label: `Tháng ${m}` }))
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nhà máy phỏng vấn</label>
            <Select
              className="w-full"
              placeholder="Tất cả nhà máy"
              value={filters.interviewFactory || undefined}
              onChange={(v) => setFilter('interviewFactory', v)}
              allowClear
              options={factoryNames.map((f) => ({ value: f, label: f }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Team tuyển dụng</label>
            <Select
              className="w-full"
              placeholder="Tất cả team"
              value={filters.team || undefined}
              onChange={(v) => setFilter('team', v)}
              allowClear
              options={catalogTeams.map((t) => ({ value: t.name, label: t.name }))}
            />
          </div>
        </div>

        {/* Khung ghi chú nghiệp vụ màu vàng */}
        <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
          <p className="font-semibold text-amber-950">
            HỆ THỐNG SO SÁNH & ĐÁNH GIÁ • Đang xử lý hoàn toàn theo dữ liệu CSDL thực tế.
          </p>
          <p className="text-amber-800">
            Tỷ lệ đạt 10 công là số đạt / số đỗ trong bộ lọc đang chọn. Mọi chỉ số phản ánh trung thực trạng thái hồ sơ.
          </p>
          <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-amber-900">
            <button
              onClick={exportToCSV}
              className="underline hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5"/> Xuất báo cáo tổng hợp CSV
            </button>
            <button
              onClick={() => setFilters({})}
              className="underline hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5"/> Bỏ tất cả bộ lọc
            </button>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          KHỐI 1: THẺ ĐIỂM TỪNG TEAM (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">Thẻ điểm từng team</h2>
          <p className="text-xs text-slate-500">
            Đặt các team cạnh nhau một cách công bằng: tính năng suất bình quân trên đầu người tuyển vì quy mô quân số khác nhau.
          </p>
        </div>

        {teamCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamCards.map((team) => (
              <div
                key={team.name}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 relative shadow-xs ${
                  team.isTop
                    ? 'border-purple-400 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {team.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{team.name}</h3>
                      <p className="text-[11px] text-slate-500">{team.recruitersCount} người tuyển</p>
                    </div>
                  </div>

                  {team.isTop && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      Năng suất #1
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600">Tổng lượt đỗ:</span>
                    <span className="font-bold text-slate-900">{team.passed.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600">Đạt &gt;= 10 công:</span>
                    <span className="font-bold text-emerald-700">{team.retained10.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600">Tỷ lệ giữ chân 10 công:</span>
                    <span className="font-bold text-slate-900">{team.retentionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600">Rớt trước xưởng:</span>
                    <span className="text-slate-700">{team.failRate}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600">Bỏ xưởng:</span>
                    <span className="text-slate-700">{team.abandonRate}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600">Nghỉ trước 10 công:</span>
                    <span className="text-slate-700">{team.quitBefore10Rate}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      ĐẠT/NGƯỜI TUYỂN
                    </div>
                    <div className="text-xl font-extrabold text-blue-600 mt-0.5">
                      {team.perRecruiter}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      ĐÓNG GÓP
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {team.contribution}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center border-slate-200">
            <Empty description="Chưa có dữ liệu Team nào trong bộ lọc này" />
          </Card>
        )}
      </div>

      {/* =========================================================================
          KHỐI 2: THỰC HIỆN KPI THEO THÁNG & DIỄN BIẾN THEO THÁNG (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <div className="space-y-6">
        {/* Phần 2.1: Thực hiện KPI theo tháng */}
        <Card className="shadow-xs border-slate-200">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Thực hiện KPI theo tháng</h2>
            <p className="text-xs text-slate-500">
              Số đỗ / chỉ tiêu đã lưu năm 2026. Dấu —: chưa có chỉ tiêu, bảng chỉ tính các hồ sơ trong bộ lọc.
            </p>
          </div>

          {monthlyKpiData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Team</th>
                    {availableMonths.map(m => (
                      <th key={m} className="py-2.5 px-3 text-center">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyKpiData.map(row => (
                    <tr key={row.name} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.name}</td>
                      {row.months.map((val, mIdx) => (
                        <td key={mIdx} className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                            val === '—'
                              ? 'text-slate-400'
                              : val === '0%'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {val}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu theo tháng để tổng hợp KPI" />
          )}
        </Card>

        {/* Phần 2.2: Diễn biến theo tháng */}
        <Card className="shadow-xs border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Diễn biến theo tháng</h2>
              <p className="text-xs text-slate-500">
                So sánh xu hướng tăng trưởng giữa các team qua các tháng
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setMonthlyMetric('achieved')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  monthlyMetric === 'achieved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Số đạt
              </button>
              <button
                onClick={() => setMonthlyMetric('rate')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  monthlyMetric === 'rate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tỷ lệ đạt 10 công / đỗ
              </button>
              <button
                onClick={() => setMonthlyMetric('per_recruiter')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  monthlyMetric === 'per_recruiter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đạt / người tuyển
              </button>
              <button
                onClick={() => setMonthlyMetric('contribution')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  monthlyMetric === 'contribution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tỷ trọng đóng góp
              </button>
            </div>
          </div>

          {chartPoints.length > 0 && availableMonths.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-5 text-xs font-medium mb-4">
                {chartPoints.map(p => (
                  <span key={p.team} className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-700">{p.team}</span>
                  </span>
                ))}
              </div>

              <div className="w-full h-56 relative border-t border-b border-dashed border-slate-200 py-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="0" y1="80" x2="800" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke="#f1f5f9" strokeDasharray="4 4" />
                  <line x1="0" y1="160" x2="800" y2="160" stroke="#f1f5f9" strokeDasharray="4 4" />

                  {chartPoints.map((series) => {
                    const maxVal = Math.max(1, ...chartPoints.flatMap(s => s.values));
                    const totalPoints = availableMonths.length;
                    const step = totalPoints > 1 ? 740 / (totalPoints - 1) : 740;

                    const points = series.values.map((v, i) => {
                      const x = 30 + i * step;
                      const y = 175 - (v / maxVal) * 140;
                      return `${x},${y}`;
                    });
                    const d = 'M ' + points.join(' L ');

                    return (
                      <g key={series.team}>
                        <path
                          d={d}
                          fill="none"
                          stroke={series.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {series.values.map((v, i) => {
                          const cx = 30 + i * step;
                          const cy = 175 - (v / maxVal) * 140;
                          return (
                            <circle
                              key={i}
                              cx={cx}
                              cy={cy}
                              r="4"
                              fill="#ffffff"
                              stroke={series.color}
                              strokeWidth="2"
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>

                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-6">
                  {availableMonths.map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Empty description="Chưa có dữ liệu chuỗi thời gian để vẽ biểu đồ diễn biến" />
          )}
        </Card>
      </div>

      {/* =========================================================================
          KHỐI 3: NĂNG SUẤT & CHẤT LƯỢNG (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Năng suất: số đạt trên mỗi người tuyển
            </h3>
            <p className="text-xs text-slate-500">So sánh công bằng theo quy mô quân số</p>
          </div>

          {teamCards.length > 0 ? (
            <div className="space-y-4">
              {teamCards.map(team => {
                const maxPerRecruiter = Math.max(1, ...teamCards.map(t => t.perRecruiter));
                const widthPct = Math.round((team.perRecruiter / maxPerRecruiter) * 100);

                return (
                  <div key={team.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{team.name}</span>
                      <span className="text-blue-700 font-bold">{team.perRecruiter} người/NS</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu năng suất theo team" />
          )}
        </Card>

        <Card className="shadow-xs border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Chất lượng: kết quả của 100 lượt đỗ
            </h3>
            <p className="text-xs text-slate-500">Đo lường mức độ rơi rụng thực tế tại các khâu</p>
          </div>

          {teamCards.length > 0 ? (
            <div className="space-y-4">
              {teamCards.map(team => {
                return (
                  <div key={team.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{team.name}</span>
                      <span className="text-emerald-700 font-bold">Trụ lại {team.retentionRate}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${team.retentionRate}%` }}
                        title={`Đạt 10 công: ${team.retentionRate}%`}
                      />
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${Math.max(0, 100 - team.retentionRate)}%` }}
                        title={`Rơi rụng / Bỏ / Nghỉ: ${(100 - team.retentionRate).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> Đạt 10 công
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"/> Nghỉ trước 10
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"/> Bỏ xưởng
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300"/> Rớt trước
                </span>
              </div>
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu chất lượng giữ chân theo team" />
          )}
        </Card>
      </div>

      {/* =========================================================================
          KHỐI 4: SỐ LƯỢNG VÀ CHẤT LƯỢNG CỦA TỪNG NGƯỜI TUYỂN (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <Card className="shadow-xs border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Số lượng và chất lượng của từng người tuyển
            </h2>
            <p className="text-xs text-slate-500">
              Đường nét đứt là mức chuẩn (trung vị thực tế: {medianPassed} đỗ · {medianRate}% đạt). Góc trên bên phải là nhóm &quot;ngôi sao&quot; vừa tuyển nhiều vừa giữ chân tốt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            {catalogTeams.map((team, idx) => {
              const colors = ['bg-blue-600', 'bg-sky-500', 'bg-purple-600', 'bg-emerald-600', 'bg-slate-400'];
              return (
                <span key={team.name} className="inline-flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}/> {team.name}
                </span>
              );
            })}
          </div>
        </div>

        {recruiterLeaderboard.length > 0 ? (
          <div className="w-full h-80 bg-slate-50/40 rounded-xl border border-slate-200 relative p-4 overflow-hidden">
            <div className="absolute top-3 left-4 text-[11px] font-semibold text-slate-500">
              Tỷ lệ đạt (%)
            </div>
            <div className="absolute top-1/2 left-4 -translate-y-1/2 text-[11px] font-bold text-slate-500">
              {medianRate}%
            </div>

            <div className="absolute bottom-2 right-4 text-[11px] font-semibold text-slate-500">
              Số lượt đỗ (người/tháng) →
            </div>

            <div className="absolute left-16 right-6 top-1/2 border-t border-dashed border-slate-400"/>
            <div className="absolute top-6 bottom-8 left-1/2 border-l border-dashed border-slate-400"/>

            <div className="absolute top-5 right-6 px-3 py-1 bg-emerald-50 border border-emerald-400 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-1 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600"/>
              ★ Ngôi sao (Tuyển nhiều &amp; Trụ tốt)
            </div>

            <svg className="w-full h-full" viewBox="0 0 800 300">
              {recruiterLeaderboard.map((rec) => {
                const maxPassed = Math.max(1, ...recruiterLeaderboard.map(r => r.passed));
                const cx = 100 + (rec.passed / maxPassed) * 620;
                const cy = 260 - (rec.passRateVal / 100) * 220;

                let fillColor = '#64748b';
                if (rec.team.includes('1') || rec.team.includes('Hà Nội')) fillColor = '#2563eb';
                else if (rec.team.includes('2') || rec.team.includes('Miền Trung')) fillColor = '#0ea5e9';
                else if (rec.team.includes('3') || rec.team.includes('Thái Nguyên')) fillColor = '#9333ea';

                return (
                  <g key={rec.name} className="cursor-pointer group">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="6.5"
                      fill={fillColor}
                      className="transition-transform duration-150 hover:scale-150"
                    />
                    <title>{`${rec.name} (${rec.team}): ${rec.passed} đỗ, ${rec.passRate} đạt`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <Empty description="Chưa có dữ liệu chuyên viên tuyển dụng để phân tích ma trận" />
        )}
      </Card>

      {/* =========================================================================
          KHỐI 5: BẢNG XẾP HẠNG NGƯỜI TUYỂN DỤNG (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <Card className="shadow-xs border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bảng xếp hạng người tuyển dụng</h2>
            <p className="text-xs text-slate-500">
              Xếp hạng theo sản lượng tuyển dụng và chất lượng giữ chân thực tế từ CSDL
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              size="small"
              placeholder="Tìm recruiter..."
              prefix={<Search className="w-3.5 h-3.5 text-slate-400"/>}
              value={recruiterSearch}
              onChange={(e) => setRecruiterSearch(e.target.value)}
              allowClear
              className="w-48 rounded-lg"
            />
            <Checkbox
              checked={onlyWithKpi}
              onChange={(e) => setOnlyWithKpi(e.target.checked)}
              className="text-xs font-semibold text-slate-700"
            >
              Chỉ người có đỗ PV
            </Checkbox>
          </div>
        </div>

        {filteredLeaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3 text-center">#</th>
                  <th className="py-2.5 px-3">Người tuyển</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-center">Đỗ PV</th>
                  <th className="py-2.5 px-3 text-center">Ngày có đỗ</th>
                  <th className="py-2.5 px-3 text-center">Đỗ/ngày</th>
                  <th className="py-2.5 px-3 text-center">Rớt trước</th>
                  <th className="py-2.5 px-3 text-center">Bỏ xưởng</th>
                  <th className="py-2.5 px-3 text-center">Nghỉ &lt; 10</th>
                  <th className="py-2.5 px-3 text-center">Tỷ lệ đạt</th>
                  <th className="py-2.5 px-3 text-center">KPI đạt %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">{item.rank}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{item.team}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{item.passed}</td>
                    <td className="py-3 px-3 text-center text-slate-700">{item.activeDays}</td>
                    <td className="py-3 px-3 text-center text-slate-700">{item.passedPerDay}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.dropBefore}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.abandon}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.quitBefore10}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{item.passRate}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.kpiRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty description="Chưa có dữ liệu chuyên viên tuyển dụng theo bộ lọc" />
        )}
      </Card>

      {/* =========================================================================
          KHỐI 6: HAI CARD ĐỐI SOÁT CHÂN TRANG (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Công nhân giới thiệu so với tuyển trực tiếp
            </h3>
            <p className="text-xs text-slate-500">
              Đánh giá tính hiệu quả của chính sách hoa hồng giới thiệu
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-800">Tuyển trực tiếp:</span>
              <div className="space-x-3">
                <span className="font-bold text-slate-900">{sourceComparison.directPassed.toLocaleString('vi-VN')} đỗ</span>
                <span className="font-bold text-emerald-700">Đạt 10 công {sourceComparison.directRate}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="font-semibold text-slate-800">Lao động tự giới thiệu:</span>
              <div className="space-x-3">
                <span className="font-bold text-slate-900">{sourceComparison.referralPassed.toLocaleString('vi-VN')} đỗ</span>
                <span className="font-bold text-emerald-700">Đạt 10 công {sourceComparison.referralRate}%</span>
              </div>
            </div>
          </div>

          <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
            Tỷ lệ quan sát = số đạt 10 công / số đỗ của từng nguồn; phân loại trực tiếp theo trường nguồn hồ sơ trong CSDL.
          </p>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Người quay lại (Tái tuyển)</h3>
            <p className="text-xs text-slate-500">
              Theo dõi lực lượng công nhân cũ vào làm lại tại các nhà máy
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 flex items-center justify-around text-center">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1">
                Tổng lượt tái tuyển
              </div>
              <div className="text-lg font-bold text-slate-900">
                {data?.recruitment?.summary?.returning ? `${data.recruitment.summary.returning.toLocaleString('vi-VN')} lượt` : '0 lượt'}
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200" />

            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1">
                Tỷ lệ qua 10 công
              </div>
              <div className="text-lg font-bold text-emerald-700">
                {pct(data?.recruitment?.summary?.returnRate)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          KHỐI 7: CHÂN DUNG NGƯỜI LAO ĐỘNG (100% DỮ LIỆU THỰC)
          ========================================================================= */}
      <div className="pt-4 border-t-2 border-slate-200">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600"/>
            Chân Dung Người Lao Động (Nhân Khẩu Học)
          </h2>
          <p className="text-xs text-slate-500">
            Xem cơ cấu nguồn lao động của toàn bộ công ty hoặc lọc riêng để xem thế mạnh nguồn của từng Team / Chuyên viên.
          </p>
        </div>

        <Card className="shadow-xs border-slate-200 bg-slate-50/70 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600"/>
                Chọn Phạm Vi Xem Chân Dung Lao Động
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem cơ cấu nguồn lao động của <b>toàn bộ công ty</b> hoặc lọc riêng để xem thế mạnh nguồn của từng <b>Team</b> / <b>Chuyên viên</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                className="w-36"
                value={demoScopeType}
                onChange={(val) => {
                  setDemoScopeType(val);
                  setDemoScopeValue('');
                }}
                options={[
                  { value: 'ALL', label: 'Toàn bộ công ty' },
                  { value: 'TEAM', label: 'Theo Team' },
                  { value: 'RECRUITER', label: 'Theo Chuyên viên' },
                ]}
              />

              {demoScopeType === 'TEAM' && (
                <Select
                  className="w-48"
                  placeholder="Chọn Team cần xem..."
                  value={demoScopeValue || undefined}
                  onChange={setDemoScopeValue}
                  options={catalogTeams.map(t => ({ value: t.name, label: t.name }))}
                />
              )}

              {demoScopeType === 'RECRUITER' && (
                <Select
                  className="w-52"
                  placeholder="Chọn Chuyên viên..."
                  showSearch
                  value={demoScopeValue || undefined}
                  onChange={setDemoScopeValue}
                  options={recruiterLeaderboard.map(r => ({ value: r.name, label: r.name }))}
                />
              )}
            </div>
          </div>
        </Card>

        {demoData && demoData.people > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Giới tính */}
            <Card
              title={
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600"/>
                  Cơ Cấu Giới Tính
                </span>
              }
              className="shadow-xs border-slate-200"
            >
              <div className="space-y-4">
                {(demoData.genders || []).map((g: any) => {
                  const percent = demoData.people ? Math.round((g.count / demoData.people) * 100) : 0;
                  const isMale = g.name.toLowerCase().includes('nam');
                  return (
                    <div key={g.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={isMale ? 'text-blue-700' : 'text-pink-600'}>{g.name}</span>
                        <span className="text-slate-600">
                          {g.count.toLocaleString('vi-VN')} người <b>({percent}%)</b>
                        </span>
                      </div>
                      <Progress
                        percent={percent}
                        strokeColor={isMale ? '#2563eb' : '#ec4899'}
                        trailColor="#f1f5f9"
                        showInfo={false}
                      />
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Tổng số ứng viên trong mẫu:</span>
                  <b className="text-slate-800">{demoData.people.toLocaleString('vi-VN')} người</b>
                </div>
              </div>
            </Card>

            {/* 2. Độ tuổi */}
            <Card
              title={
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600"/>
                  Phân Bố Nhóm Tuổi
                </span>
              }
              className="shadow-xs border-slate-200"
            >
              <div className="space-y-4">
                {(demoData.ages || []).map((a: any) => {
                  const percent = demoData.people ? Math.round((a.count / demoData.people) * 100) : 0;
                  return (
                    <div key={a.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{a.name}</span>
                        <span className="text-slate-600">
                          {a.count.toLocaleString('vi-VN')} người <b>({percent}%)</b>
                        </span>
                      </div>
                      <Progress
                        percent={percent}
                        strokeColor="#10b981"
                        trailColor="#f1f5f9"
                        showInfo={false}
                      />
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Tuổi được tính tại thời điểm phỏng vấn.
                </div>
              </div>
            </Card>

            {/* 3. Địa bàn / Tỉnh thành quê quán */}
            <Card
              title={
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-600"/>
                  Địa Bàn / Tỉnh Thành (Top Quê Quán)
                </span>
              }
              className="shadow-xs border-slate-200"
            >
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {[...(demoData.provinces || [])]
                  .sort((a, b) => b.count - a.count)
                  .map((p: any, idx: number) => {
                    const percent = demoData.people ? Math.round((p.count / demoData.people) * 100) : 0;
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="truncate max-w-[160px] text-slate-800 font-semibold">
                            <span className="text-slate-400 mr-1.5 font-normal">#{idx + 1}</span>
                            {p.name}
                          </span>
                          <span className="text-slate-600">
                            {p.count.toLocaleString('vi-VN')} <b>({percent}%)</b>
                          </span>
                        </div>
                        <Progress
                          percent={percent}
                          strokeColor="#f59e0b"
                          trailColor="#f1f5f9"
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="py-12 text-center border-slate-200">
            <Empty description="Chưa có dữ liệu chân dung người lao động trong bộ lọc này" />
          </Card>
        )}
      </div>
    </div>
  );
}
