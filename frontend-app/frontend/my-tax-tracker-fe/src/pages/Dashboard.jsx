import React, { useState, useEffect } from 'react';
import Card from '../components/Cards';
import SubCards from '../components/SubCards';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { fetchWithAuth } from '../customprocess/auth';

const years = [2025, 2024]; // Add more years as needed
const latestYear = years[0];

const Dashboard = () => {
  const [receiptCount, setReceiptCount] = useState(0);
  const [totalClaim, setTotalClaim] = useState(0);
  const [selectedYear, setSelectedYear] = useState(latestYear.toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch Receipt View API, render to receipt dashboard component
  useEffect(() => {
    const url = `${API_BASE_URL}/receipts/view`;
    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setReceiptCount(Array.isArray(data) ? data.length : 0);
        setLoading(false);
      })
      .catch((err) => {
        setError('No receipts found');
        setLoading(false);
      });
  }, [API_BASE_URL]);

  // Fetch Total claims based on the year filtered
  useEffect(() => {
    const url = `${API_BASE_URL}/receipts/total-claims?year=${selectedYear}`;
    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setTotalClaim(data.total_claims || 0);
      })
      .catch((err) => {
        setTotalClaim(0);
        console.error('No total claims found:', err);
      });
  }, [selectedYear, API_BASE_URL]);

  return (
    <>
      <Navbar />
      <div className='bg-gradient-to-br from-blue-400 to-blue-900 dashboard-app p-6 bg-slate-300 h-screen'>
        <div className='flex items-center justify-center gap-4 mb-6'>
          <p className="text-gray-800 font-medium">Select Year:</p>
          <select
            name="receipt-year"
            id="year"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="ml-4 flex-1 min-w-[250px] max-w-md px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className='flex flex-col md:flex-row items-center gap-6 w-full'>
          <Card
            title="Total Claims This Year"
            value={`~RM ${totalClaim.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`As of ${selectedYear}`}
          />
          <Card
            title="No. of Receipts"
            value={loading ? "Loading..." : error ? error : receiptCount}
            subtitle="Receipt Submitted"
          />
        </div>

        <div className='p-10 flex flex-col md:flex-row justify-center gap-6 w-full'>
          <SubCards
            to="/receipt"
            title="Upload New Receipt"
            icon={ArrowUpTrayIcon}
            width="w-1/3"
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;