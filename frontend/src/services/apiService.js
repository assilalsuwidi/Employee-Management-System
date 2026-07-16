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

// Payroll API
export async function generatePayroll(employeeId) {
  const { data } = await axiosClient.post("/payroll/generate", {
    employee_id: employeeId,
  });
  return data;
}

// Tasks API
export async function getTasks() {
  const { data } = await axiosClient.get("/tasks");
  return data.data;
}
