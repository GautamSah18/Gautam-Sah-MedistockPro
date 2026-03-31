import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const TickIcon = () => (
  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Yes</span>
);

const CrossIcon = () => (
  <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>No</span>
);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [view, setView] = useState("list"); // "list" or "detail"
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  
  // detail form states
  const [docStatus, setDocStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [regComplete, setRegComplete] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/admin/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openUserDetail = async (user) => {
    setSelectedUser(user);
    try {
      const res = await api.get(`/api/auth/admin/users/${user.id}/`);
      setUserDetail(res.data);
      setIsActive(res.data.is_active || false);
      setIsApproved(res.data.is_approved || false);
      setRegComplete(res.data.registration_complete || false);

      if (res.data.documents) {
        setDocStatus(res.data.documents.status || "pending");
        setAdminNotes(res.data.documents.admin_notes || "");
      } else {
        setDocStatus("pending");
        setAdminNotes("");
      }
      setView("detail");
    } catch (err) {
      console.error(err);
      alert("Failed to load user details");
    }
  };

  const saveDetails = async () => {
    try {
      await api.put(`/api/auth/admin/users/${selectedUser.id}/`, {
        document_status: docStatus,
        admin_notes: adminNotes,
        is_active: isActive,
        is_approved: isApproved,
        registration_complete: regComplete
      });
      alert("Changes saved successfully");
      fetchUsers();
      setView("list");
    } catch (err) {
      console.error(err);
      alert("Error saving details");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/auth/admin/users/${userId}/`);
      alert("User deleted successfully!");
      if (view === "detail") setView("list");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  // Modern light theme styles
  const styles = {
    container: {
      padding: '20px', 
      backgroundColor: '#fff', 
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginTop: '20px'
    },
    headerRow: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px'
    },
    title: {
      fontWeight: 'bold',
      fontSize: '24px',
      color: '#111827',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '4px'
    },
    tableWrapper: {
      overflowX: 'auto', 
      border: '1px solid #eee', 
      borderRadius: '8px'
    },
    table: {
      width: '100%', 
      borderCollapse: 'collapse', 
      textAlign: 'left'
    },
    th: {
      padding: '15px',
      backgroundColor: '#f9fafb', 
      color: '#6b7280', 
      fontSize: '13px', 
      textTransform: 'uppercase',
      fontWeight: '600',
      borderBottom: '1px solid #eee'
    },
    td: {
      padding: '15px', 
      borderBottom: '1px solid #eee',
      fontSize: '14px',
      color: '#374151'
    },
    emailLink: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '500',
      cursor: 'pointer'
    },
    btnPrimary: {
      backgroundColor: '#10b981',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    btnSecondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    btnDanger: {
      backgroundColor: '#ef4444',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    searchInput: {
      padding: '10px 14px', 
      border: '1px solid #d1d5db', 
      borderRadius: '8px', 
      width: '300px',
      fontSize: '14px',
      outline: 'none'
    },
    
    // Detail view styles
    formCard: {
      backgroundColor: '#fff',
      border: '1px solid #eee',
      borderRadius: '8px',
      padding: '24px',
      marginTop: '20px'
    },
    formRow: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 0',
      borderBottom: '1px solid #f3f4f6'
    },
    formLabel: {
      width: '250px',
      fontWeight: '600',
      fontSize: '14px',
      color: '#374151',
      paddingTop: '8px'
    },
    formControl: {
      flex: 1,
      fontSize: '14px',
      color: '#111827'
    },
    select: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      width: '100%',
      maxWidth: '300px',
      backgroundColor: '#fff',
      fontSize: '14px',
      color: '#374151',
      outline: 'none'
    },
    textarea: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      width: '100%',
      maxWidth: '500px',
      minHeight: '120px',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical',
      outline: 'none'
    },
    docLinkWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    docLinkBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 14px',
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #bfdbfe',
      transition: 'background-color 0.2s'
    },
    emptyDoc: {
      color: '#9ca3af',
      fontStyle: 'italic',
      padding: '8px 0'
    }
  };

  if (loading) return <div style={styles.container}>Loading Users...</div>;

  if (view === "detail" && userDetail) {
    const docs = userDetail.documents;
    
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>User Details</h2>
            <div style={styles.subtitle}>Manage pharmacy documents and approvals for {userDetail.email}</div>
          </div>
          <button style={styles.btnSecondary} onClick={() => setView("list")}>
            &larr; Back to Users
          </button>
        </div>
        
        <div style={styles.formCard}>
          <div style={styles.formRow}>
            <div style={styles.formLabel}>User Email:</div>
            <div style={styles.formControl}>
              <div style={{ padding: '8px 0', fontWeight: '500' }}>{userDetail.email}</div>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>User Role:</div>
            <div style={styles.formControl}>
              <div style={{ padding: '8px 0' }}>
                <span style={{ backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                  {userDetail.role}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>Pharmacy License:</div>
            <div style={styles.formControl}>
              {docs?.pharmacy_license ? (
                <div style={styles.docLinkWrap}>
                  <a href={docs.pharmacy_license} target="_blank" rel="noopener noreferrer" style={styles.docLinkBtn}>
                    📄 View License Document
                  </a>
                </div>
              ) : <div style={styles.emptyDoc}>No license uploaded</div>}
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>PAN Number:</div>
            <div style={styles.formControl}>
               {docs?.pan_number ? (
                <div style={styles.docLinkWrap}>
                  <a href={docs.pan_number} target="_blank" rel="noopener noreferrer" style={styles.docLinkBtn}>
                    📄 View PAN Document
                  </a>
                </div>
              ) : <div style={styles.emptyDoc}>No PAN uploaded</div>}
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>Citizenship:</div>
            <div style={styles.formControl}>
               {docs?.citizenship ? (
                <div style={styles.docLinkWrap}>
                  <a href={docs.citizenship} target="_blank" rel="noopener noreferrer" style={styles.docLinkBtn}>
                    📄 View Citizenship Document
                  </a>
                </div>
              ) : <div style={styles.emptyDoc}>No citizenship uploaded</div>}
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>User Registration:</div>
            <div style={{ ...styles.formControl, display: 'flex', gap: '20px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <input type="checkbox" checked={isApproved} onChange={(e) => setIsApproved(e.target.checked)} /> Approved
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <input type="checkbox" checked={regComplete} onChange={(e) => setRegComplete(e.target.checked)} /> Registration Complete
               </label>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>Document Status:</div>
            <div style={styles.formControl}>
               <select style={styles.select} value={docStatus} onChange={e => {
                  const val = e.target.value;
                  setDocStatus(val);
                  if (val === 'approved') {
                    setIsApproved(true);
                    setRegComplete(true);
                    setIsActive(true);
                  }
               }}>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
               </select>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>Admin Notes:</div>
            <div style={styles.formControl}>
              <textarea 
                style={styles.textarea} 
                value={adminNotes} 
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this user's application..."
              />
            </div>
          </div>

          <div style={{...styles.formRow, borderBottom: 'none'}}>
            <div style={styles.formLabel}>Timestamps:</div>
            <div style={{ ...styles.formControl, fontSize: '13px', color: '#6b7280', paddingTop: '8px' }}>
               <div style={{ marginBottom: '4px' }}><strong>Uploaded at:</strong> {docs?.uploaded_at ? new Date(docs.uploaded_at).toLocaleString() : 'N/A'}</div>
               <div><strong>Reviewed at:</strong> {docs?.reviewed_at ? new Date(docs.reviewed_at).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={styles.btnDanger} onClick={() => deleteUser(selectedUser.id)}>Delete User</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={styles.btnSecondary} onClick={() => setView("list")}>Cancel</button>
            <button style={styles.btnPrimary} onClick={saveDetails}>Save Changes</button>
          </div>
        </div>

      </div>
    )
  }

  // List view
  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>User Management</h2>
          <div style={styles.subtitle}>Select a Pharmacy User to view or update their documents.</div>
        </div>
        <input 
          type="text" 
          placeholder="Search by email..." 
          style={styles.searchInput} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email Address</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Is Approved</th>
              <th style={styles.th}>Reg. Complete</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const displayRole = user.role || 'admin';
                return (
                <tr key={user.id}>
                  <td style={{...styles.td, fontWeight: '500'}}>
                    <span onClick={() => openUserDetail(user)} style={styles.emailLink}>
                      {user.email}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      backgroundColor: displayRole === 'admin' ? '#f3e8ff' : (displayRole === 'customer' ? '#e0f2fe' : '#fef3c7'),
                      color: displayRole === 'admin' ? '#7e22ce' : (displayRole === 'customer' ? '#0369a1' : '#b45309'),
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {displayRole}
                    </span>
                  </td>
                  <td style={styles.td}>{user.is_active ? <TickIcon /> : <CrossIcon />}</td>
                  <td style={styles.td}>{user.is_approved ? <TickIcon /> : <CrossIcon />}</td>
                  <td style={styles.td}>{user.registration_complete ? <TickIcon /> : <CrossIcon />}</td>
                  <td style={styles.td}>
                    <button style={{...styles.btnDanger, padding: '4px 8px', fontSize: '12px'}} onClick={() => deleteUser(user.id)}>Delete</button>
                  </td>
                </tr>
              );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No users found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ padding: '15px 5px', fontSize: '13px', color: '#6b7280' }}>
        Showing {filteredUsers.length} Pharmacy Users
      </div>
    </div>
  );
}
