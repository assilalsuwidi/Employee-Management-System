import axiosClient from "./axiosClient";

// Employees API
export async function getEmployees() {
  const { data } = await axiosClient.get("/employees");
  return data.data;
}

export async function getEmployee(id) {
  const { data } = await axiosClient.get(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(formData) {
  const { data } = await axiosClient.post("/employees", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function updateEmployee(id, formData) {
  const { data } = await axiosClient.put(`/employees/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function deleteEmployee(id) {
  const { data } = await axiosClient.delete(`/employees/${id}`);
  return data;
}

// Departments API
export async function getDepartments() {
  const { data } = await axiosClient.get("/departments");
  return data.data;
}

export async function createDepartment(name) {
  const { data } = await axiosClient.post("/departments", { name });
  return data;
}

export async function updateDepartment(id, name) {
  const { data } = await axiosClient.put(`/departments/${id}`, { name });
  return data;
}

export async function deleteDepartment(id) {
  const { data } = await axiosClient.delete(`/departments/${id}`);
  return data;
}

// Groups API
export async function getGroups() {
  const { data } = await axiosClient.get("/groups");
  return data.data;
}

export async function createGroup(groupName, description, employeeIds) {
  const { data } = await axiosClient.post("/groups", {
    group_name: groupName,
    description,
    employee_ids: employeeIds,
  });
  return data;
}

export async function updateGroup(id, groupName, description, employeeIds) {
  const { data } = await axiosClient.put(`/groups/${id}`, {
    group_name: groupName,
    description,
    employee_ids: employeeIds,
  });
  return data;
}

export async function deleteGroup(id) {
  const { data } = await axiosClient.delete(`/groups/${id}`);
  return data;
}

// Audit Logs API
export async function getAuditLogs() {
  const { data } = await axiosClient.get("/audit");
  return data.data;
}

// Attendance API
export async function checkInAttendance(employeeId) {
  const { data } = await axiosClient.post("/attendance", {
    employee_id: employeeId,
  });
  return data;
}

export async function getAttendanceReports() {
  const { data } = await axiosClient.get("/attendance/reports");
  return data.data;
}

// Payroll API
export async function generatePayroll(employeeId, month, year, bonus = 0, overtimeHours = 0, deduction = 0, isPreview = false) {
  const { data } = await axiosClient.post("/payroll/generate", {
    employee_id: employeeId,
    month,
    year,
    bonus,
    overtime_hours: overtimeHours,
    deduction,
    preview: isPreview
  });
  return data;
}

export async function getPayrollHistory(employeeId) {
  const { data } = await axiosClient.get(`/payroll/history/${employeeId}`);
  return data.data;
}

// Tasks API
export async function getTasks() {
  const { data } = await axiosClient.get("/tasks");
  return data.data;
}

export async function createTask(groupId, title, note, deadline) {
  const { data } = await axiosClient.post("/tasks", {
    group_id: groupId,
    title,
    note,
    deadline
  });
  return data;
}

export async function assignTask(taskId, employeeId) {
  const { data } = await axiosClient.post(`/tasks/${taskId}/assign`, {
    employee_id: employeeId
  });
  return data;
}

export async function updateTaskProgress(taskId, employeeId, progress, note) {
  const { data } = await axiosClient.post(`/tasks/${taskId}/progress`, {
    employee_id: employeeId,
    progress,
    note
  });
  return data;
}

export async function getEmployeeSalary(id) {
  const { data } = await axiosClient.get(`/employees/${id}/salary`);
  return data.data;
}

export async function updateEmployeeSalary(id, salaryData) {
  const { data } = await axiosClient.put(`/employees/${id}/salary`, salaryData);
  return data;
}

export async function getEmployeeRules(id) {
  const { data } = await axiosClient.get(`/employees/${id}/rules`);
  return data.data;
}

export async function updateEmployeeRules(id, rulesData) {
  const { data } = await axiosClient.put(`/employees/${id}/rules`, rulesData);
  return data;
}

// Leaves API
export async function getLeaves() {
  const { data } = await axiosClient.get("/leaves");
  return data.data;
}

export async function requestLeave(leaveData) {
  const { data } = await axiosClient.post("/leaves", leaveData);
  return data;
}

export async function updateLeaveStatus(id, status) {
  const { data } = await axiosClient.put(`/leaves/${id}/status`, { status });
  return data;
}
