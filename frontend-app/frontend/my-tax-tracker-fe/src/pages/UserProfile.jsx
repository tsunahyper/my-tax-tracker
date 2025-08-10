import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { fetchWithAuth } from "../customprocess/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `${API_BASE_URL}/auth/me`;
    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('No user profile found');
        setLoading(false);
      });
  }, []);

  return (
    <>
    <div className="bg-gradient-to-br from-blue-400 to-blue-900 h-screen">
      <Navbar />
      <div className="p-4 sm:p-8 w-11/12 max-w-xl mx-auto bg-white rounded shadow mt-6 sm:mt-10 md:max-w-sm">
        <h1 className="lg:text-xl font-bold mb-6">USER PROFILE</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {user && (
          <div className="space-y-4">
            <div>
              <span className="font-semibold">Username:</span> {user.username}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-semibold">Phone Number:</span> {user.phone_number}
            </div>
            <div>
              <span className="font-semibold">Gender:</span> {user.gender}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default UserProfile