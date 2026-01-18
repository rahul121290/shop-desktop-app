"use client";

import { useState } from "react";


export default function LedgerPage() {
    const [customers, setCustomers] = useState([
  {
    id: 1,
    name: "Rahul Sinha",
    phone: "+91 98765 43210",
    alternate: "+91 91234 56789",
    address:
      "2nd Floor, ABC Apartment, MG Road, Bengaluru, Karnataka – 560001",
    photo: "https://via.placeholder.com/120",
  },
  {
    id: 2,
    name: "Amit Verma",
    phone: "+91 99887 66554",
    alternate: "+91 90011 22334",
    address:
      "Flat 12, Sunrise Society, Andheri East, Mumbai – 400069",
    photo: "https://via.placeholder.com/120",
  },
]);

const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
const [showAddCustomer, setShowAddCustomer] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LEFT SIDE – CUSTOMER DETAILS */}
        <div className="md:col-span-1 border rounded-lg p-4">

          {/* CUSTOMER DROPDOWN */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Select Customer
            </label>
            <select
  className="w-full border rounded-md px-3 py-2 text-sm"
  value={selectedCustomer.id}
  onChange={(e) => {
    if (e.target.value === "add_new") {
      setShowAddCustomer(true);
      return;
    }

    const customer = customers.find(
      (c) => c.id === Number(e.target.value)
    );
    if (customer) setSelectedCustomer(customer);
  }}
>
  {customers.map((customer) => (
    <option key={customer.id} value={customer.id}>
      {customer.name}
    </option>
  ))}

  <option value="add_new">➕ Add New Customer</option>
</select>

          </div>

          {/* CUSTOMER INFO */}
          <div className="flex flex-col items-center text-center">
            <img
              src={selectedCustomer.photo}
              alt="Customer"
              className="w-28 h-28 rounded-full border mb-4"
            />

            <h2 className="text-xl font-semibold">
              {selectedCustomer.name}
            </h2>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div>
              <span className="font-medium">Contact No:</span>
              <p className="text-gray-700">
                {selectedCustomer.phone}
              </p>
            </div>

            <div>
              <span className="font-medium">Alternate No:</span>
              <p className="text-gray-700">
                {selectedCustomer.alternate}
              </p>
            </div>

            <div>
              <span className="font-medium">Address:</span>
              <p className="text-gray-700">
                {selectedCustomer.address}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – TRANSACTION TABLE */}
        {/* RIGHT SIDE – TRANSACTION TABLE */}
<div className="md:col-span-2 border rounded-lg p-4 overflow-x-auto">
  
  {/* HEADER + FILTERS */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    
    <h3 className="text-lg font-semibold">
      Transaction History
    </h3>

    <div className="flex flex-wrap items-center gap-2">
      {/* FROM DATE */}
      <input
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm"
      />

      {/* TO DATE */}
      <input
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm"
      />

      {/* ADD TRANSACTION BUTTON */}
      <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700">
        Search
      </button>
      <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700">
        Add More
      </button>
    </div>
  </div>

  {/* TABLE */}
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-gray-100 text-left">
        <th className="p-2 border">Date</th>
        <th className="p-2 border">Description</th>
        <th className="p-2 border text-right">Debit (₹)</th>
        <th className="p-2 border text-right">Credit (₹)</th>
        <th className="p-2 border text-right">Balance (₹)</th>
      </tr>
    </thead>

    <tbody>
      <tr className="hover:bg-gray-50">
        <td className="p-2 border">01 Jan 2026</td>
        <td className="p-2 border">Opening Balance</td>
        <td className="p-2 border text-right">–</td>
        <td className="p-2 border text-right">–</td>
        <td className="p-2 border text-right">10,000</td>
      </tr>

      <tr className="hover:bg-gray-50">
        <td className="p-2 border">05 Jan 2026</td>
        <td className="p-2 border">Purchase</td>
        <td className="p-2 border text-right">2,500</td>
        <td className="p-2 border text-right">–</td>
        <td className="p-2 border text-right">7,500</td>
      </tr>

      <tr className="hover:bg-gray-50">
        <td className="p-2 border">10 Jan 2026</td>
        <td className="p-2 border">Payment Received</td>
        <td className="p-2 border text-right">–</td>
        <td className="p-2 border text-right">5,000</td>
        <td className="p-2 border text-right">12,500</td>
      </tr>
    </tbody>
  </table>
</div>


      </div>



      {showAddCustomer && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        Add New Customer
      </h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;

          const newCustomer = {
            id: Date.now(),
            name: (form.name as any).value,
            phone: (form.phone as any).value,
            alternate: (form.alternate as any).value,
            address: (form.address as any).value,
            photo: "https://via.placeholder.com/120",
          };

          setCustomers([...customers, newCustomer]);
          setSelectedCustomer(newCustomer);
          setShowAddCustomer(false);
          form.reset();
        }}
        className="space-y-3"
      >
        <input
          name="name"
          placeholder="Customer Name"
          required
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <input
          name="phone"
          placeholder="Contact Number"
          required
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <input
          name="alternate"
          placeholder="Alternate Number"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <textarea
          name="address"
          placeholder="Address"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={() => setShowAddCustomer(false)}
            className="px-4 py-1.5 border rounded text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
}
