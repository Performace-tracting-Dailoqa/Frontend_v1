"use client";

import React from "react";

export default function EmployeesTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-title-lg font-headline font-bold text-on-surface">Employee Directory</h3>
        <button className="bg-[#4B2EF5] text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer shadow-sm hover:bg-[#4B2EF5]/90 transition-colors">Add Employee</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant font-medium">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-surface-container-low transition-colors">
                <td className="px-4 py-3 font-medium text-on-surface">Employee {i}</td>
                <td className="px-4 py-3 text-on-surface-variant">Engineering</td>
                <td className="px-4 py-3 text-on-surface-variant">Developer</td>
                <td className="px-4 py-3">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">Active</span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-[#4B2EF5] hover:underline font-medium cursor-pointer">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
