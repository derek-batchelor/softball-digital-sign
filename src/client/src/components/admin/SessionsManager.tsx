import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, playersApi } from '../../services/api';
import { Session, Player, CreateSessionDto, UpdateSessionDto } from '@shared/types';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from '../shared/Modal';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SessionsManager = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionType, setSessionType] = useState<'recurring' | 'one-time'>('recurring');
  const [sortField, setSortField] = useState<'type' | 'time' | 'player'>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [debouncedPlayerSearch, setDebouncedPlayerSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await sessionsApi.getAll();
      return response.data as Session[];
    },
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await playersApi.getAll();
      return response.data as Player[];
    },
  });

  // Debounce player search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlayerSearch(playerSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [playerSearchQuery]);

  // Filter players based on debounced search query
  const filteredPlayers = useMemo(() => {
    if (!players) return [];

    if (!debouncedPlayerSearch.trim()) {
      return players.filter((p) => p.isActive);
    }

    const searchLower = debouncedPlayerSearch.toLowerCase();
    return players.filter((player) => {
      if (!player.isActive) return false;
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [players, debouncedPlayerSearch]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSessionDto) => sessionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsFormOpen(false);
      toast.success('Session created successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to create session');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSessionDto }) =>
      sessionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setEditingSession(null);
      setIsFormOpen(false);
      toast.success('Session updated successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to update session');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to delete session');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const isRecurring = formData.get('sessionType') === 'recurring';

    const sessionData: CreateSessionDto | UpdateSessionDto = {
      isRecurring,
      startDate: new Date(formData.get('startDate') as string),
      startTime: formData.get('startTime') as string,
      duration: Number.parseInt(formData.get('duration') as string),
      playerId: Number.parseInt(formData.get('playerId') as string),
      isActive: formData.get('isActive') === 'on',
    };

    if (isRecurring) {
      sessionData.dayOfWeek = Number.parseInt(formData.get('dayOfWeek') as string);
    }

    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data: sessionData });
    } else {
      createMutation.mutate(sessionData as CreateSessionDto);
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setSessionType(session.isRecurring ? 'recurring' : 'one-time');
    setSelectedPlayerId(session.playerId);
    setPlayerSearchQuery('');
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingSession(null);
    setSessionType('recurring');
    setPlayerSearchQuery('');
    setSelectedPlayerId(null);
  };

  const handleSort = (field: 'type' | 'time' | 'player') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = sessions
    ?.filter((session) => {
      const matchesFilter =
        session.player?.firstName.toLowerCase().includes(filterText.toLowerCase()) ||
        session.player?.lastName.toLowerCase().includes(filterText.toLowerCase());

      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' && session.isActive) ||
        (filterActive === 'inactive' && !session.isActive);

      const matchesType =
        filterType === 'all' ||
        (filterType === 'recurring' && session.isRecurring) ||
        (filterType === 'one-time' && !session.isRecurring);

      return matchesFilter && matchesActive && matchesType;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'player':
          compareValue = `${a.player?.lastName} ${a.player?.firstName}`.localeCompare(
            `${b.player?.lastName} ${b.player?.firstName}`,
          );
          break;
        case 'type':
          compareValue = (a.isRecurring ? 1 : 0) - (b.isRecurring ? 1 : 0);
          break;
        case 'time':
          compareValue = a.startTime.localeCompare(b.startTime);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour;
    if (hour === 0) {
      displayHour = 12;
    } else if (hour > 12) {
      displayHour = hour - 12;
    }
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isSessionActiveNow = (session: Session) => {
    if (!session.isActive) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const endTime = calculateEndTime(session.startTime, session.duration);
    const sessionDate = new Date(session.startDate);

    if (session.isRecurring) {
      return (
        session.dayOfWeek === currentDay &&
        currentTime >= session.startTime &&
        currentTime <= endTime
      );
    }

    // One-time session: check if it's the same date
    const isSameDay =
      now.getFullYear() === sessionDate.getFullYear() &&
      now.getMonth() === sessionDate.getMonth() &&
      now.getDate() === sessionDate.getDate();
    return isSameDay && currentTime >= session.startTime && currentTime <= endTime;
  };

  const getStatusBadge = (session: Session) => {
    if (isSessionActiveNow(session)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Live Now
        </span>
      );
    }
    if (session.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const getScheduleDisplay = (session: Session) => {
    if (session.isRecurring) {
      return DAYS_OF_WEEK[session.dayOfWeek ?? 0];
    }
    return formatDate(session.startDate);
  };

  if (sessionsLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading sessions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Sessions Manager
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Schedule and manage display sessions
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-center whitespace-nowrap"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Search sessions..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 text-sm sm:text-base"
              />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              >
                <option value="all">All Sessions</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'recurring' | 'one-time')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              >
                <option value="all">All Types</option>
                <option value="recurring">Recurring Only</option>
                <option value="one-time">One-Time Only</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditingSession(null);
                setSessionType('recurring');
                setPlayerSearchQuery('');
                setSelectedPlayerId(null);
                setIsFormOpen(true);
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap text-sm sm:text-base"
            >
              + New Session
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('player')}
                  >
                    <div className="flex items-center gap-1">
                      Player
                      {sortField === 'player' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === 'type' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('time')}
                  >
                    <div className="flex items-center gap-1">
                      Time
                      {sortField === 'time' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedSessions?.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                      <div className="text-sm text-gray-900">
                        {session.player
                          ? `${session.player.firstName} ${session.player.lastName}`
                          : 'N/A'}
                      </div>
                      {session.player?.teamName && (
                        <div className="text-xs text-gray-500">{session.player.teamName}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.isRecurring
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {session.isRecurring ? 'Recurring' : 'One-Time'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getScheduleDisplay(session)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(session.startTime)} -{' '}
                        {formatTime(calculateEndTime(session.startTime, session.duration))}
                      </div>
                      <div className="text-xs text-gray-500">{session.duration} min</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">{getStatusBadge(session)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="text-right space-x-2">
                        <button
                          onClick={() => handleEdit(session)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedSessions?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No sessions found. Create your first session to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={handleCancel}
          title={editingSession ? 'Edit Session' : 'Create New Session'}
          maxWidth="2xl"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="session-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {(() => {
                  if (createMutation.isPending || updateMutation.isPending) return 'Saving...';
                  if (editingSession) return 'Update Session';
                  return 'Create Session';
                })()}
              </button>
            </div>
          }
        >
          <form id="session-form" key={editingSession?.id || 'new'} onSubmit={handleSubmit}>
            {/* Session Type */}
            <div className="mb-4">
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Session Type *
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sessionType"
                      value="recurring"
                      checked={sessionType === 'recurring'}
                      onChange={(e) => setSessionType(e.target.value as 'recurring' | 'one-time')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recurring (Weekly)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sessionType"
                      value="one-time"
                      checked={sessionType === 'one-time'}
                      onChange={(e) => setSessionType(e.target.value as 'recurring' | 'one-time')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">One-Time Event</span>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* Player Selection */}
            <div className="mb-4">
              <label
                htmlFor="session-player-search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Player *
              </label>
              <input
                id="session-player-search"
                type="text"
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              />
              <input type="hidden" name="playerId" value={selectedPlayerId || ''} required />

              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                {filteredPlayers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {playerSearchQuery ? 'No players found' : 'No active players'}
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedPlayerId(player.id);
                        setPlayerSearchQuery('');
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        setSelectedPlayerId(player.id);
                        setPlayerSearchQuery('');
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 active:bg-gray-200 flex items-center justify-between ${
                        selectedPlayerId === player.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <span className="text-sm">
                        {player.firstName} {player.lastName}
                        {player.teamName && (
                          <span className="text-gray-500 ml-2">- {player.teamName}</span>
                        )}
                        {player.jerseyNumber && (
                          <span className="text-gray-500 ml-1">(#{player.jerseyNumber})</span>
                        )}
                      </span>
                      {selectedPlayerId === player.id && (
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>

              {selectedPlayerId && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {players?.find((p) => p.id === selectedPlayerId)?.firstName}{' '}
                  {players?.find((p) => p.id === selectedPlayerId)?.lastName}
                </div>
              )}
            </div>

            {/* Day of Week - Only for Recurring */}
            {sessionType === 'recurring' && (
              <div className="mb-4">
                <label
                  htmlFor="session-day"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Day of Week *
                </label>
                <select
                  id="session-day"
                  name="dayOfWeek"
                  defaultValue={editingSession?.dayOfWeek ?? ''}
                  required={sessionType === 'recurring'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a day</option>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date */}
            <div className="mb-4">
              <label
                htmlFor="session-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date *
              </label>
              <input
                id="session-date"
                type="date"
                name="startDate"
                defaultValue={
                  editingSession?.startDate
                    ? new Date(editingSession.startDate).toISOString().split('T')[0]
                    : ''
                }
                required
                style={{ touchAction: 'manipulation' }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-h-[44px]"
              />
              <p className="mt-1 text-xs text-gray-500">
                {sessionType === 'recurring'
                  ? 'First date this recurring session becomes active'
                  : 'The specific date for this one-time session'}
              </p>
            </div>

            {
              /* Start Time */
              <div className="mb-4">
                <label
                  htmlFor="session-start"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Time *
                </label>
                <input
                  id="session-start"
                  type="time"
                  name="startTime"
                  defaultValue={editingSession?.startTime || ''}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            }
            {/* Duration */}
            <div className="mb-4">
              <label
                htmlFor="session-duration"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Duration *
              </label>
              <select
                id="session-duration"
                name="duration"
                defaultValue={editingSession?.duration || 30}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingSession?.isActive ?? true}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Inactive sessions won't be displayed on the signage
              </p>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
