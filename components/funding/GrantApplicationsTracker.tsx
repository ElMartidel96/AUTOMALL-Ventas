'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  GrantApplication,
  GrantApplicationInsert,
  GrantApplicationUpdate,
  GrantApplicationStatus,
  GrantPriority,
  GrantApplicationNotes,
  GRANT_STATUS_CONFIG,
  GRANT_PRIORITY_CONFIG,
  GRANT_TRACKER_AUTHORIZED_WALLETS
} from '@/lib/supabase/types';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  FileText,
  Tag,
  User,
  Mail,
  MessageSquare,
  History,
  Eye,
  EyeOff
} from 'lucide-react';

interface GrantApplicationsTrackerProps {
  className?: string;
}

export function GrantApplicationsTracker({ className = '' }: GrantApplicationsTrackerProps) {
  const { address, isConnected } = useAccount();
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<GrantApplicationStatus | 'all'>('all');
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    totalRequested: number;
    totalApproved: number;
  } | null>(null);

  // Check if current wallet is authorized
  const isAuthorized = address && GRANT_TRACKER_AUTHORIZED_WALLETS.includes(address.toLowerCase());

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!isAuthorized || !address) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ wallet: address });
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const res = await fetch(`/api/grants?${params}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.data || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || 'Failed to fetch applications');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, isAuthorized, filterStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Create application
  const createApplication = async (data: GrantApplicationInsert) => {
    if (!address) return;

    try {
      const res = await fetch('/api/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, wallet: address })
      });

      const result = await res.json();
      if (result.success) {
        setShowForm(false);
        fetchApplications();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create application');
      console.error('Create error:', err);
    }
  };

  // Update application
  const updateApplication = async (id: string, data: GrantApplicationUpdate) => {
    if (!address) return;

    try {
      const res = await fetch('/api/grants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data, wallet: address })
      });

      const result = await res.json();
      if (result.success) {
        setEditingId(null);
        fetchApplications();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update application');
      console.error('Update error:', err);
    }
  };

  // Delete application
  const deleteApplication = async (id: string) => {
    if (!address || !confirm('Are you sure you want to delete this application?')) return;

    try {
      const res = await fetch(`/api/grants?wallet=${address}&id=${id}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      if (result.success) {
        fetchApplications();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete application');
      console.error('Delete error:', err);
    }
  };

  // Toggle expanded
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className={`glass-card p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Connect Wallet Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please connect your wallet to access the grant applications tracker.
        </p>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className={`glass-card p-8 text-center ${className}`}>
        <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Access Restricted
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          This tracker is only available to authorized team members.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 font-mono">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Grant Applications Tracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage all funding applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchApplications}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={<FileText className="w-5 h-5" />} />
          <StatCard
            label="Submitted"
            value={stats.byStatus?.submitted || 0}
            icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          />
          <StatCard
            label="Approved"
            value={stats.byStatus?.approved || 0}
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          />
          <StatCard
            label="Requested"
            value={`$${stats.totalRequested.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-yellow-500" />}
          />
          <StatCard
            label="Approved"
            value={`$${stats.totalApproved.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-green-500" />}
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 py-2">Filter:</span>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filterStatus === 'all'
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {Object.entries(GRANT_STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as GrantApplicationStatus)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterStatus === status
                ? `${config.bgColor} ${config.color}`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <ApplicationForm
          onSubmit={createApplication}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No applications found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add your first application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              isExpanded={expandedIds.has(app.id)}
              isEditing={editingId === app.id}
              onToggleExpand={() => toggleExpanded(app.id)}
              onEdit={() => setEditingId(app.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(data) => updateApplication(app.id, data)}
              onDelete={() => deleteApplication(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Stat Card
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}

// Application Card
interface ApplicationCardProps {
  application: GrantApplication;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: GrantApplicationUpdate) => void;
  onDelete: () => void;
}

function ApplicationCard({
  application,
  isExpanded,
  isEditing,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete
}: ApplicationCardProps) {
  const statusConfig = GRANT_STATUS_CONFIG[application.status];
  const priorityConfig = GRANT_PRIORITY_CONFIG[application.priority];

  if (isEditing) {
    return (
      <ApplicationForm
        initial={application}
        onSubmit={(data) => onUpdate(data as GrantApplicationUpdate)}
        onCancel={onCancelEdit}
        isEdit
      />
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        {/* Status Icon */}
        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
          <span className="text-xl">{statusConfig.icon}</span>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              {application.platform_name}
            </h3>
            {application.program_name && (
              <span className="text-gray-500 dark:text-gray-400">
                / {application.program_name}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            {application.requested_amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {application.requested_amount.toLocaleString()} {application.requested_currency}
              </span>
            )}
            {application.submitted_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Submitted: {new Date(application.submitted_at).toLocaleDateString()}
              </span>
            )}
            {application.deadline_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Deadline: {new Date(application.deadline_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Tags */}
          {application.tags && application.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {application.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <a
            href={application.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            title="Open URL"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-green-500 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
          {/* Description */}
          {application.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{application.description}</p>
            </div>
          )}

          {/* Notes */}
          {application.notes && Object.keys(application.notes).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </h4>

              {application.notes.summary && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {application.notes.summary}
                </p>
              )}

              {application.notes.actions_taken && application.notes.actions_taken.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Actions Taken</h5>
                  <ul className="space-y-1">
                    {application.notes.actions_taken.map((action, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {application.notes.next_steps && application.notes.next_steps.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Next Steps</h5>
                  <ul className="space-y-1">
                    {application.notes.next_steps.map((step, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(application.contact_person || application.contact_email) && (
            <div className="flex items-center gap-4 text-sm">
              {application.contact_person && (
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  {application.contact_person}
                </span>
              )}
              {application.contact_email && (
                <a
                  href={`mailto:${application.contact_email}`}
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                >
                  <Mail className="w-4 h-4" />
                  {application.contact_email}
                </a>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 flex items-center gap-4">
            <span>Created: {new Date(application.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(application.updated_at).toLocaleString()}</span>
            <span className="font-mono">ID: {application.id.slice(0, 8)}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Application Form
interface ApplicationFormProps {
  initial?: Partial<GrantApplication>;
  onSubmit: (data: GrantApplicationInsert) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function ApplicationForm({ initial, onSubmit, onCancel, isEdit = false }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    platform_name: initial?.platform_name || '',
    program_name: initial?.program_name || '',
    application_url: initial?.application_url || '',
    project_url: initial?.project_url || '',
    status: initial?.status || 'draft' as GrantApplicationStatus,
    priority: initial?.priority || 'medium' as GrantPriority,
    submitted_at: initial?.submitted_at?.slice(0, 10) || '',
    deadline_at: initial?.deadline_at?.slice(0, 10) || '',
    requested_amount: initial?.requested_amount?.toString() || '',
    requested_currency: initial?.requested_currency || 'USD',
    description: initial?.description || '',
    contact_person: initial?.contact_person || '',
    contact_email: initial?.contact_email || '',
    tags: initial?.tags?.join(', ') || '',
    notes_summary: initial?.notes?.summary || '',
    notes_actions: initial?.notes?.actions_taken?.join('\n') || '',
    notes_next_steps: initial?.notes?.next_steps?.join('\n') || '',
    internal_notes: initial?.internal_notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const notes: GrantApplicationNotes = {
      summary: formData.notes_summary || undefined,
      actions_taken: formData.notes_actions ? formData.notes_actions.split('\n').filter(s => s.trim()) : undefined,
      next_steps: formData.notes_next_steps ? formData.notes_next_steps.split('\n').filter(s => s.trim()) : undefined
    };

    const baseData = {
      platform_name: formData.platform_name,
      program_name: formData.program_name || null,
      application_url: formData.application_url,
      project_url: formData.project_url || null,
      status: formData.status,
      priority: formData.priority,
      submitted_at: formData.submitted_at ? new Date(formData.submitted_at).toISOString() : null,
      deadline_at: formData.deadline_at ? new Date(formData.deadline_at).toISOString() : null,
      requested_amount: formData.requested_amount ? parseFloat(formData.requested_amount) : null,
      requested_currency: formData.requested_currency,
      description: formData.description || null,
      contact_person: formData.contact_person || null,
      contact_email: formData.contact_email || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      notes,
      internal_notes: formData.internal_notes || null
    };

    // Always create a GrantApplicationInsert - the API handles the difference
    const submitData: GrantApplicationInsert = {
      ...baseData,
      created_by: '' // Will be set by API
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {isEdit ? 'Edit Application' : 'New Grant Application'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Platform Name *
          </label>
          <input
            type="text"
            value={formData.platform_name}
            onChange={e => setFormData(p => ({ ...p, platform_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
            placeholder="e.g., Giveth, Base Builder Grants"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Program Name
          </label>
          <input
            type="text"
            value={formData.program_name}
            onChange={e => setFormData(p => ({ ...p, program_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            placeholder="Specific program or round"
          />
        </div>
      </div>

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Application URL *
          </label>
          <input
            type="url"
            value={formData.application_url}
            onChange={e => setFormData(p => ({ ...p, application_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project URL
          </label>
          <input
            type="url"
            value={formData.project_url}
            onChange={e => setFormData(p => ({ ...p, project_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            placeholder="Our project page on the platform"
          />
        </div>
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={e => setFormData(p => ({ ...p, status: e.target.value as GrantApplicationStatus }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            {Object.entries(GRANT_STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={e => setFormData(p => ({ ...p, priority: e.target.value as GrantPriority }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            {Object.entries(GRANT_PRIORITY_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Submitted Date
          </label>
          <input
            type="date"
            value={formData.submitted_at}
            onChange={e => setFormData(p => ({ ...p, submitted_at: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={formData.deadline_at}
            onChange={e => setFormData(p => ({ ...p, deadline_at: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Requested Amount
          </label>
          <input
            type="number"
            value={formData.requested_amount}
            onChange={e => setFormData(p => ({ ...p, requested_amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={formData.requested_currency}
            onChange={e => setFormData(p => ({ ...p, requested_currency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            <option value="USD">USD</option>
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
            <option value="OP">OP</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          rows={3}
          placeholder="Brief description of the application..."
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          placeholder="web3, dao, base, funding"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            placeholder="Name of contact"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            placeholder="email@example.com"
          />
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Notes</h4>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Summary
          </label>
          <textarea
            value={formData.notes_summary}
            onChange={e => setFormData(p => ({ ...p, notes_summary: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            rows={2}
            placeholder="Brief summary of the application status..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Actions Taken (one per line)
          </label>
          <textarea
            value={formData.notes_actions}
            onChange={e => setFormData(p => ({ ...p, notes_actions: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            rows={3}
            placeholder="Created profile&#10;Submitted application&#10;Contacted reviewer..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Next Steps (one per line)
          </label>
          <textarea
            value={formData.notes_next_steps}
            onChange={e => setFormData(p => ({ ...p, notes_next_steps: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            rows={3}
            placeholder="Follow up in 1 week&#10;Prepare demo&#10;Share on social..."
          />
        </div>
      </div>

      {/* Internal Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Internal Notes (private)
        </label>
        <textarea
          value={formData.internal_notes}
          onChange={e => setFormData(p => ({ ...p, internal_notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          rows={2}
          placeholder="Private notes not shown elsewhere..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4" />
          {isEdit ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
