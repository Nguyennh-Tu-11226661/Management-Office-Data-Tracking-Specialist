"use client";
import { useEffect, useState } from "react";
import { Form, Input, Select, InputNumber } from "antd";
export default function AssignmentFields({
  form,
  showWorkDays = false,
}: {
  form: any;
  showWorkDays?: boolean;
}) {
  const [orders, setOrders] = useState<any[]>([]),
    [recruiters, setRecruiters] = useState<any[]>([]),
    [teams, setTeams] = useState<any[]>([]),
    [statuses, setStatuses] = useState<any[]>([]);
  const orderId = Form.useWatch("orderId", form),
    result = Form.useWatch("interviewResult", form);
  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/catalogs?kind=RECRUITER").then((r) => r.json()),
      fetch("/api/catalogs?kind=TEAM").then((r) => r.json()),
      fetch("/api/catalogs?kind=STATUS").then((r) => r.json()),
    ])
      .then(([o, r, t, s]) => {
        setOrders(o.data || []);
        setRecruiters(r.data || []);
        setTeams(t.data || []);
        setStatuses(s.data || []);
      })
      .catch(() => {});
  }, []);
  const order = orders.find((o) => o.id === orderId);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Form.Item name="orderId" label="Đơn hàng">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={orders
            .filter((o) => o.isActive)
            .map((o) => ({
              value: o.id,
              label: `${o.factory} · ${o.code} · ${o.name}`,
            }))}
          onChange={(id) => {
            const o = orders.find((o) => o.id === id);
            form.setFieldsValue({
              batchId: undefined,
              ...(o ? { interviewFactory: o.factory } : {}),
            });
          }}
        />
      </Form.Item>
      <Form.Item name="batchId" label="Đợt tuyển">
        <Select
          allowClear
          disabled={!orderId}
          options={(order?.batches || []).map((b: any) => ({
            value: b.id,
            label: `${b.code} · ${b.name} (${b.startDate} → ${b.endDate})`,
          }))}
        />
      </Form.Item>
      <Form.Item name="employeeCode" label="Mã nhân viên tại công ty">
        <Input />
      </Form.Item>
      <Form.Item name="recruiterId" label="Chuyên viên tuyển dụng">
        <Select
          allowClear
          options={recruiters
            .filter((r) => r.isActive)
            .map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))}
          onChange={(id) => {
            const r = recruiters.find((r) => r.id === id);
            if (r)
              form.setFieldsValue({
                teamId: r.teamId,
                recruiter: r.name,
                team: r.team?.name || "",
              });
          }}
        />
      </Form.Item>
      <Form.Item name="teamId" label="Team phụ trách">
        <Select
          allowClear
          options={teams
            .filter((t) => t.isActive)
            .map((t) => ({ value: t.id, label: t.name }))}
        />
      </Form.Item>
      <Form.Item name="interviewResult" label="Kết quả phỏng vấn">
        <Select
          allowClear
          options={[
            { value: "UNKNOWN", label: "Chưa xác nhận" },
            { value: "PENDING", label: "Chờ kết quả" },
            { value: "PASS", label: "Đỗ" },
            { value: "FAIL", label: "Trượt" },
            { value: "ABANDONED", label: "Bỏ phỏng vấn" },
          ]}
        />
      </Form.Item>
      <Form.Item
        name="passedDate"
        label="Ngày phỏng vấn đỗ"
        rules={result === "PASS" ? [{ required: true }] : []}
      >
        <Input type="date" />
      </Form.Item>
      <Form.Item name="startDate" label="Ngày bắt đầu làm (sau ngày đỗ)">
        <Input type="date" />
      </Form.Item>
      {showWorkDays && (
        <>
          <Form.Item
            name="confirmedWorkDays"
            label="Số công thực tế đã xác nhận"
          >
            <InputNumber min={0} max={10000} step={0.5} className="w-full" />
          </Form.Item>
          <Form.Item name="workDaysAsOf" label="Ngày chốt số công">
            <Input type="date" />
          </Form.Item>
        </>
      )}
    </div>
  );
}
