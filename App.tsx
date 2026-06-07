import { FormEvent, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  fetchTickets,
  createTicket as apiCreateTicket,
  deleteTicket as apiDeleteTicket,
} from './api';
import { Ticket } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { NotFound } from './NotFound';
import './App.css';

function AppContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Closed'>(
    'Open'
  );

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ================= Load Tickets ================= */
  const loadTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const page = Number(search);
      const data = await fetchTickets(Number.isNaN(page) ? 0 : page);

      // backend now returns { success, tickets }
      setTickets(data.tickets);
    } catch (err) {
      setError((err as Error).message || 'Unable to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* ================= Create Ticket ================= */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required.');
      return;
    }

    setSaving(true);

    try {
      await apiCreateTicket({ subject, description, priority, status });

      setSubject('');
      setDescription('');
      setPriority('Low');
      setStatus('Open');

      setSuccess('Ticket created successfully.');
      await loadTickets();
    } catch (err) {
      setError((err as Error).message || 'Could not create ticket');
    } finally {
      setSaving(false);
    }
  };

  /* ================= Delete Ticket ================= */
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this ticket?')) return;

    setError(null);

    try {
      await apiDeleteTicket(id);
      setSuccess('Ticket deleted successfully.');
      loadTickets();
    } catch (err) {
      setError((err as Error).message || 'Could not delete ticket');
    }
  };

  /* ================= Recently Added Items ================= */
  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Mini Help Desk</h1>
        <p>Manage support tickets easily without pagination.</p>
      </header>

      <main>
        {/* ================= Create Ticket ================= */}
        <section className="grid-two">
          <Card title="Create Ticket">
            <form onSubmit={handleSubmit} className="ticket-form">
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <label className="input-group">
                <span>Description</span>
                <textarea
                  className="input-field textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </label>

              <label className="input-group">
                <span>Priority</span>
                <select
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="input-group">
                <span>Status</span>
                <select
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </label>

              <Button
                label={saving ? 'Saving...' : 'Create Ticket'}
                type="submit"
                disabled={saving}
              />
            </form>
          </Card>

          {/* ================= Recently Added Items ================= */}
          <Card title="Recently Added Tickets">
            {loading ? (
              <p>Loading...</p>
            ) : recentTickets.length === 0 ? (
              <p>No recent tickets</p>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket._id} className="ticket-item">
                  <strong>{ticket.subject}</strong>
                  <p>{ticket.status}</p>
                  <small>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </Card>
        </section>

        {/* ================= Alerts ================= */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ================= Ticket List ================= */}
        <section>
          <Card title="All Tickets">
            <div className="input-group">
              <label>Search</label>
              <div className="search-row">
                <input
                  className="input-field"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets..."
                />
                <Button label="Search" onClick={loadTickets} />
              </div>
            </div>

            {loading ? (
              <p>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p>No tickets found</p>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="ticket-item">
                    <h3>{ticket.subject}</h3>
                    <p>{ticket.description}</p>

                    <div className="ticket-meta">
                      <span>{ticket.priority}</span>
                      <span>{ticket.status}</span>
                      <span>
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <Button
                      label="Delete"
                      variant="danger"
                      onClick={() => handleDelete(ticket._id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

/* ================= Router ================= */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}