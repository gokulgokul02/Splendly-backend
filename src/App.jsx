import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Home,
  CreditCard,
  Bell,
  RefreshCw,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // FCM Form State
  const [fcmTargetType, setFcmTargetType] = useState('broadcast');
  const [fcmTargetId, setFcmTargetId] = useState('');
  const [fcmTitle, setFcmTitle] = useState('Kudumbam-Pay Alert: ₹500 Spent 💸');
  const [fcmBody, setFcmBody] = useState('Gokul spent ₹500 for Groceries');
  const [fcmVoiceText, setFcmVoiceText] = useState('Gokul spent 500 rupees for Groceries');
  const [fcmAmount, setFcmAmount] = useState('500');
  const [fcmTxType, setFcmTxType] = useState('DEBIT');
  const [fcmUserName, setFcmUserName] = useState('Gokul');
  const [fcmSending, setFcmSending] = useState(false);
  const [fcmResponse, setFcmResponse] = useState(null);

  // Quick Reminder Form State
  const [reminderUserId, setReminderUserId] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResponse, setReminderResponse] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes, usersRes, famRes, remRes] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()).catch(() => ({ stats: null })),
        fetch('/api/transactions').then((r) => r.json()).catch(() => ({ transactions: [] })),
        fetch('/api/users').then((r) => r.json()).catch(() => ({ users: [] })),
        fetch('/api/families').then((r) => r.json()).catch(() => ({ families: [] })),
        fetch('/api/reminders').then((r) => r.json()).catch(() => ({ reminders: [] })),
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (usersRes.users) setUsers(usersRes.users);
      if (famRes.families) setFamilies(famRes.families);
      if (remRes.reminders) setReminders(remRes.reminders);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleSendFCM = async (e) => {
    e.preventDefault();
    setFcmSending(true);
    setFcmResponse(null);

    try {
      const res = await fetch('/api/send-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: fcmTargetType,
          targetId: fcmTargetId,
          title: fcmTitle,
          body: fcmBody,
          voiceText: fcmVoiceText,
          amount: fcmAmount,
          txType: fcmTxType,
          userName: fcmUserName,
        }),
      });
      const data = await res.json();
      setFcmResponse(data);
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      setFcmResponse({ success: false, error: err.message });
    } finally {
      setFcmSending(false);
    }
  };

  const handleSendReminder = async (e) => {
    e.preventDefault();
    if (!reminderUserId || !reminderMessage) return;

    setReminderSending(true);
    setReminderResponse(null);

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: reminderUserId,
          fromName: 'Family Head (Admin)',
          message: reminderMessage,
        }),
      });
      const data = await res.json();
      setReminderResponse(data);
      if (data.success) {
        setReminderMessage('');
        fetchData();
      }
    } catch (err) {
      setReminderResponse({ success: false, error: err.message });
    } finally {
      setReminderSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 32px' }}>
      {/* HEADER BAR */}
      <header
        className="glass-card"
        style={{
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            <CreditCard size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              KUDUMBAM-PAY <span style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '600' }}>CLOUD</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Firebase Realtime Admin & Voice Push Notifications Backend (React + Vite + Vercel)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="badge badge-success">
            <ShieldCheck size={14} />
            <span>Firebase Admin (kudumbam-pay)</span>
          </div>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Sync ({lastUpdated})</span>
          </button>
        </div>
      </header>

      {/* STATS OVERVIEW CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Family Members
            </span>
            <Users size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats?.totalUsers ?? users.length}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Synced with Cloud Firestore</span>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Families Groups
            </span>
            <Home size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats?.totalFamilies ?? families.length}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Connected family units</span>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Spent (Expenses)
            </span>
            <ArrowDownLeft size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f87171' }}>
            ₹{stats?.totalExpense?.toLocaleString('en-IN') ?? '0'}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Family debits recorded</span>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Income (Deposits)
            </span>
            <ArrowUpRight size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399' }}>
            ₹{stats?.totalIncome?.toLocaleString('en-IN') ?? '0'}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Family credits received</span>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Reminders Dispatched
            </span>
            <Bell size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats?.totalReminders ?? reminders.length}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>FCM push notifications</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        {[
          { id: 'transactions', label: 'Live Transactions Feed', icon: Activity },
          { id: 'fcm', label: 'FCM Voice & Push Sender', icon: Bell },
          { id: 'families', label: 'Families & Users Directory', icon: Users },
          { id: 'reminders', label: 'Reminders Console', icon: MessageSquare },
          { id: 'deploy', label: 'Vercel Deployment Guide', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: isActive ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRANSACTIONS FEED */}
      {activeTab === 'transactions' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Real-time Family Transactions (Cloud Firestore)</h2>
            <div className="badge badge-primary">{transactions.length} Transactions</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Note / Category</th>
                  <th>Family ID</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No transactions recorded yet in Firestore.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = (tx.type || '').toUpperCase() === 'CREDIT';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isCredit ? '#34d399' : '#f87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '13px',
                              }}
                            >
                              {(tx.userName || 'M')[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600' }}>{tx.userName || 'Member'}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '800', fontSize: '15px', color: isCredit ? '#34d399' : '#f87171' }}>
                          {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`}>
                            {isCredit ? 'CREDIT (INCOME)' : 'DEBIT (EXPENSE)'}
                          </span>
                        </td>
                        <td>
                          <div>{tx.note || 'No note'}</div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{tx.category || 'General'}</span>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#94a3b8' }}>
                          {tx.familyId || 'N/A'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Just now'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FCM PUSH NOTIFICATIONS & VOICE ANNOUNCER */}
      {activeTab === 'fcm' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Service Account FCM Push Dispatcher (HTTP v1)
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              Dispatches high-priority push notifications with coin sound and voice announcements to Android/Web devices.
            </p>

            <form onSubmit={handleSendFCM} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Target Audience
                  </label>
                  <select
                    className="input-control"
                    value={fcmTargetType}
                    onChange={(e) => setFcmTargetType(e.target.value)}
                  >
                    <option value="broadcast">Broadcast to All Devices</option>
                    <option value="family">Specific Family Group</option>
                    <option value="user">Specific User UID</option>
                    <option value="token">Direct Device FCM Token</option>
                  </select>
                </div>

                {fcmTargetType !== 'broadcast' && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                      Target ID / Token
                    </label>
                    <input
                      className="input-control"
                      placeholder="e.g. FAM_XYZ or User UID"
                      value={fcmTargetId}
                      onChange={(e) => setFcmTargetId(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Member Name (Announced)
                  </label>
                  <input
                    className="input-control"
                    value={fcmUserName}
                    onChange={(e) => {
                      setFcmUserName(e.target.value);
                      setFcmVoiceText(`${e.target.value} spent ${fcmAmount} rupees`);
                      setFcmBody(`${e.target.value} spent ₹${fcmAmount}`);
                    }}
                    placeholder="e.g. Gokul"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Amount (₹)
                  </label>
                  <input
                    className="input-control"
                    type="number"
                    value={fcmAmount}
                    onChange={(e) => {
                      setFcmAmount(e.target.value);
                      setFcmVoiceText(`${fcmUserName} spent ${e.target.value} rupees`);
                      setFcmBody(`${fcmUserName} spent ₹${e.target.value}`);
                    }}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Notification Title
                </label>
                <input
                  className="input-control"
                  value={fcmTitle}
                  onChange={(e) => setFcmTitle(e.target.value)}
                  placeholder="Notification Title"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Notification Message Body
                </label>
                <input
                  className="input-control"
                  value={fcmBody}
                  onChange={(e) => setFcmBody(e.target.value)}
                  placeholder="Message Body"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Voice Announcement Speech (TTS text)
                </label>
                <input
                  className="input-control"
                  value={fcmVoiceText}
                  onChange={(e) => setFcmVoiceText(e.target.value)}
                  placeholder="e.g. Gokul spent 500 rupees"
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={fcmSending} style={{ padding: '14px' }}>
                <Send size={16} />
                <span>{fcmSending ? 'Dispatching via Firebase Admin...' : 'Send Push Notification Now'}</span>
              </button>
            </form>

            {fcmResponse && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: fcmResponse.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${fcmResponse.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {fcmResponse.success ? <CheckCircle size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                  <span style={{ fontWeight: '700', color: fcmResponse.success ? '#34d399' : '#f87171' }}>
                    {fcmResponse.message || (fcmResponse.success ? 'Notification Dispatched!' : 'Dispatch Error')}
                  </span>
                </div>
                {fcmResponse.error && <p style={{ fontSize: '12px', color: '#f87171' }}>{fcmResponse.error}</p>}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>Voice Soundbox Preview</h2>
            <div
              style={{
                padding: '20px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '8px' }}>
                <Smartphone size={18} />
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Device Audio Channel: splendly_alerts_v2</span>
              </div>
              <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                📢 <strong>Voice Readout:</strong> "{fcmVoiceText}"
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                🔔 <strong>Sound File:</strong> <code>assets/sounds/coinsound.wav</code> (Android: coinsound)
              </p>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>
              Active FCM Tokens ({users.filter((u) => u.fcmToken).length} Registered)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {users.map((u) => (
                <div
                  key={u.uid}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                  </div>
                  <span className={`badge ${u.fcmToken ? 'badge-success' : 'badge-warning'}`}>
                    {u.fcmToken ? 'FCM READY' : 'NO TOKEN'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAMILIES & USERS */}
      {activeTab === 'families' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Families Directory ({families.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {families.length === 0 ? (
                <p style={{ color: '#64748b' }}>No family units registered yet.</p>
              ) : (
                families.map((f) => (
                  <div
                    key={f.familyId}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>{f.name || 'My Kudumbam'}</span>
                      <span className="badge badge-primary">{f.familyId}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Admin UID: <code>{f.createdBy}</code>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Members: {(f.members || []).length} registered member(s)
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Registered Users ({users.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map((u) => (
                <div
                  key={u.uid}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</div>
                    {u.upiId && <div style={{ fontSize: '11px', color: '#60a5fa' }}>UPI: {u.upiId}</div>}
                  </div>
                  <span className="badge badge-primary">{u.familyId || 'No Family'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REMINDERS CONSOLE */}
      {activeTab === 'reminders' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Family Reminders History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reminders.length === 0 ? (
                <p style={{ color: '#64748b', padding: '24px', textAlign: 'center' }}>No reminders sent yet.</p>
              ) : (
                reminders.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>From: {r.fromName}</span>
                        <span className="badge badge-warning">Target: {r.toUserId}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>"{r.message}"</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {r.timestamp ? new Date(r.timestamp).toLocaleString() : 'Recent'}
                      </div>
                    </div>
                    <span className={`badge ${r.isRead ? 'badge-success' : 'badge-danger'}`}>
                      {r.isRead ? 'READ' : 'UNREAD'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Send Family Reminder</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              Triggers real-time Firestore notification & FCM push on recipient phone.
            </p>

            <form onSubmit={handleSendReminder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Select Recipient Member
                </label>
                <select
                  className="input-control"
                  value={reminderUserId}
                  onChange={(e) => setReminderUserId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Reminder Message
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="e.g. Please pay the electricity bill today"
                  required
                />
              </div>

              <button className="btn btn-success" type="submit" disabled={reminderSending} style={{ padding: '12px' }}>
                <Send size={15} />
                <span>{reminderSending ? 'Sending Reminder...' : 'Dispatch Reminder Alert'}</span>
              </button>
            </form>

            {reminderResponse && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: reminderResponse.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${reminderResponse.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  fontSize: '13px',
                }}
              >
                {reminderResponse.success ? '✅ Reminder sent with instant push notification!' : reminderResponse.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: VERCEL DEPLOYMENT GUIDE */}
      {activeTab === 'deploy' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
            Deploying this React + Vite Backend to Vercel
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '24px' }}>
            This project is structured so that Vercel builds the React + Vite frontend and exposes the serverless API routes under <code>/api/*</code> with full Firebase Admin SDK support.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#60a5fa', marginBottom: '10px' }}>
                Method 1: Vercel CLI (1-Click)
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
                Open terminal in <code>backend-react</code> directory and run:
              </p>
              <pre
                style={{
                  background: '#020617',
                  padding: '12px',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px',
                  color: '#38bdf8',
                  overflowX: 'auto',
                }}
              >
{`cd backend-react
npm install
npx vercel --prod`}
              </pre>
            </div>

            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#34d399', marginBottom: '10px' }}>
                Method 2: GitHub Repository Connection
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
                In your Vercel Dashboard project settings:
              </p>
              <ul style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Set Root Directory to <code>backend-react</code></li>
                <li>Framework Preset: <code>Vite</code></li>
                <li>Add Environment Variable <code>FIREBASE_SERVICE_ACCOUNT</code> with content of <code>service-account.json</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
