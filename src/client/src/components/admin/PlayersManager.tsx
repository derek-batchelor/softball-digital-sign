import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { playersApi } from '../../services/api';
import { Player, CreatePlayerDto, UpdatePlayerDto } from '@shared/types';
import { config } from '../../config';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from '../shared/Modal';

export const PlayersManager = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSmartFillOpen, setIsSmartFillOpen] = useState(false);
  const [smartFillText, setSmartFillText] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState('');

  // Calculate last weekend (Saturday and Sunday)
  const getLastWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const lastSaturday = new Date(today);
    lastSaturday.setDate(today.getDate() - dayOfWeek - 1);
    const lastSunday = new Date(lastSaturday);
    lastSunday.setDate(lastSaturday.getDate() + 1);
    return {
      start: lastSaturday.toISOString().split('T')[0],
      end: lastSunday.toISOString().split('T')[0],
    };
  };

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await playersApi.getAll();
      return response.data as Player[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePlayerDto) => playersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsFormOpen(false);
      setUploadedPhotoPath('');
      toast.success('Player created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create player');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlayerDto }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setEditingPlayer(null);
      setIsFormOpen(false);
      setUploadedPhotoPath('');
      toast.success('Player updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update player');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => playersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete player');
    },
  });

  const setWeekendWarriorMutation = useMutation({
    mutationFn: (id: number) => playersApi.setWeekendWarrior(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Weekend Warrior set successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to set Weekend Warrior');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const playerData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      teamName: formData.get('teamName') as string,
      jerseyNumber: formData.get('jerseyNumber') as string,
      photoPath: formData.get('photoPath') as string,
      graduationYear: formData.get('graduationYear')
        ? Number.parseInt(formData.get('graduationYear') as string)
        : undefined,
      isActive: formData.get('isActive') === 'on',
      isWeekendWarrior: formData.get('isWeekendWarrior') === 'on',
      statsStartDate: formData.get('statsStartDate')
        ? new Date(formData.get('statsStartDate') as string)
        : undefined,
      statsEndDate: formData.get('statsEndDate')
        ? new Date(formData.get('statsEndDate') as string)
        : undefined,
      gamesPlayed: Number.parseInt(formData.get('gamesPlayed') as string) || 0,
      plateAppearances: Number.parseInt(formData.get('plateAppearances') as string) || 0,
      atBats: Number.parseInt(formData.get('atBats') as string) || 0,
      hits: Number.parseInt(formData.get('hits') as string) || 0,
      doubles: Number.parseInt(formData.get('doubles') as string) || 0,
      triples: Number.parseInt(formData.get('triples') as string) || 0,
      homeRuns: Number.parseInt(formData.get('homeRuns') as string) || 0,
      rbis: Number.parseInt(formData.get('rbis') as string) || 0,
      runs: Number.parseInt(formData.get('runs') as string) || 0,
      walks: Number.parseInt(formData.get('walks') as string) || 0,
      strikeouts: Number.parseInt(formData.get('strikeouts') as string) || 0,
      strikeoutsLooking: Number.parseInt(formData.get('strikeoutsLooking') as string) || 0,
      hitByPitch: Number.parseInt(formData.get('hitByPitch') as string) || 0,
      sacrificeHits: Number.parseInt(formData.get('sacrificeHits') as string) || 0,
      sacrificeFlies: Number.parseInt(formData.get('sacrificeFlies') as string) || 0,
      reachedOnError: Number.parseInt(formData.get('reachedOnError') as string) || 0,
      fieldersChoice: Number.parseInt(formData.get('fieldersChoice') as string) || 0,
      stolenBases: Number.parseInt(formData.get('stolenBases') as string) || 0,
      caughtStealing: Number.parseInt(formData.get('caughtStealing') as string) || 0,
    };

    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: playerData });
    } else {
      createMutation.mutate(playerData as CreatePlayerDto);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setUploadedPhotoPath('');
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this player?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetWeekendWarrior = (id: number) => {
    if (
      confirm('Set this player as Weekend Warrior? This will clear any existing Weekend Warrior.')
    ) {
      setWeekendWarriorMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingPlayer(null);
    setUploadedPhotoPath('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await playersApi.upload(file);
      setUploadedPhotoPath(response.data.filePath);
      // Update the photoPath input value
      const photoPathInput = document.querySelector<HTMLInputElement>('input[name="photoPath"]');
      if (photoPathInput) {
        photoPathInput.value = response.data.filePath;
      }
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const parseSmartFillText = (
    text: string,
  ): {
    stats: Record<string, number>;
    name?: { firstName: string; lastName: string };
    startDate?: string;
    endDate?: string;
  } => {
    const stats: Record<string, number> = {};
    const lines = text.split('\n');
    let name: { firstName: string; lastName: string } | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

    const fieldMap: Record<string, string> = {
      GP: 'gamesPlayed',
      PA: 'plateAppearances',
      AB: 'atBats',
      H: 'hits',
      '2B': 'doubles',
      '3B': 'triples',
      HR: 'homeRuns',
      RBI: 'rbis',
      R: 'runs',
      BB: 'walks',
      SO: 'strikeouts',
      'K-L': 'strikeoutsLooking',
      HBP: 'hitByPitch',
      SAC: 'sacrificeHits',
      SF: 'sacrificeFlies',
      ROE: 'reachedOnError',
      FC: 'fieldersChoice',
      SB: 'stolenBases',
      CS: 'caughtStealing',
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check first line for name and date pattern
      if (i === 0 && !line.includes('\t')) {
        // Try date range pattern first (e.g., "12/13-14/25")
        const dateRangePattern = /(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{2,4})/;
        const rangeMatch = dateRangePattern.exec(line);

        if (rangeMatch) {
          const month = rangeMatch[1];
          const startDay = rangeMatch[2];
          const endDay = rangeMatch[3];
          const year = rangeMatch[4];
          const fullYear = year.length === 2 ? `20${year}` : year;
          startDate = `${fullYear}-${month.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
          endDate = `${fullYear}-${month.padStart(2, '0')}-${endDay.padStart(2, '0')}`;

          // Extract name (everything before the date)
          const nameText = line.substring(0, rangeMatch.index).trim();
          const nameParts = nameText.split(/\s+/);
          if (nameParts.length >= 2) {
            name = {
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' '),
            };
          }
          continue;
        }

        // Try single date pattern (e.g., "12/20/25")
        const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
        const dateMatch = datePattern.exec(line);

        if (dateMatch) {
          const month = dateMatch[1];
          const day = dateMatch[2];
          const year = dateMatch[3];
          const fullYear = year.length === 2 ? `20${year}` : year;
          const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          startDate = formattedDate;
          endDate = formattedDate;

          // Extract name (everything before the date)
          const nameText = line.substring(0, dateMatch.index).trim();
          const nameParts = nameText.split(/\s+/);
          if (nameParts.length >= 2) {
            name = {
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' '),
            };
          }
          continue;
        }
      }

      // Parse stats
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = Number.parseFloat(parts[1]);

        if (fieldMap[key] && !Number.isNaN(value)) {
          stats[fieldMap[key]] = Math.floor(value);
        }
      }
    }

    return { stats, name, startDate, endDate };
  };

  const handleSmartFill = () => {
    const { stats, name, startDate, endDate } = parseSmartFillText(smartFillText);

    // Update name fields if parsed
    if (name) {
      const firstNameInput = document.querySelector<HTMLInputElement>('input[name="firstName"]');
      const lastNameInput = document.querySelector<HTMLInputElement>('input[name="lastName"]');
      if (firstNameInput) firstNameInput.value = name.firstName;
      if (lastNameInput) lastNameInput.value = name.lastName;
    }

    // Update date fields if parsed
    if (startDate) {
      const startDateInput = document.querySelector<HTMLInputElement>(
        'input[name="statsStartDate"]',
      );
      if (startDateInput) startDateInput.value = startDate;
    }
    if (endDate) {
      const endDateInput = document.querySelector<HTMLInputElement>('input[name="statsEndDate"]');
      if (endDateInput) endDateInput.value = endDate;
    }

    // Update stat fields
    Object.entries(stats).forEach(([fieldName, value]) => {
      const input = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);
      if (input) {
        input.value = value.toString();
      }
    });

    setIsSmartFillOpen(false);
    setSmartFillText('');
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Player>[]>(
    () => [
      {
        accessorFn: (row) => `${row.lastName} ${row.firstName}`,
        id: 'name',
        header: 'Name',
        cell: (info) => {
          const player = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900">
                {player.firstName} {player.lastName}
              </div>
              {player.isWeekendWarrior && (
                <span
                  className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                  title="Weekend Warrior"
                >
                  ⚔️ WW
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'teamName',
        header: 'Team',
        cell: (info) => (
          <span className="text-sm text-gray-500">{(info.getValue() as string) || '-'}</span>
        ),
      },
      {
        accessorKey: 'graduationYear',
        header: 'Grad Year',
        cell: (info) => (
          <span className="text-sm text-gray-500">{(info.getValue() as number) || '-'}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Active',
        cell: (info) =>
          info.getValue() ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              Inactive
            </span>
          ),
      },
      {
        accessorKey: 'battingAverage',
        header: 'AVG',
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900">
            {(info.getValue() as number)?.toFixed(3) || '.000'}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: (info) => {
          const date = new Date(info.getValue() as string);
          return (
            <span className="text-sm text-gray-500">
              {date.toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const player = info.row.original;
          return (
            <div className="text-right text-sm font-medium space-x-2">
              {!player.isWeekendWarrior && (
                <button
                  onClick={() => handleSetWeekendWarrior(player.id)}
                  className="text-purple-600 hover:text-purple-900 p-1"
                  title="Set as Weekend Warrior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => handleEdit(player)}
                className="text-blue-600 hover:text-blue-900 p-1"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(player.id)}
                className="text-red-600 hover:text-red-900 p-1"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  // Sort players with weekend warrior at the top
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      // Weekend warrior always comes first
      if (a.isWeekendWarrior && !b.isWeekendWarrior) return -1;
      if (!a.isWeekendWarrior && b.isWeekendWarrior) return 1;
      return 0;
    });
  }, [players]);

  const table = useReactTable({
    data: sortedPlayers,
    columns,
    state: {
      sorting,
      globalFilter: filterText,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilterText,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Players</h1>
              <p className="text-gray-600 mt-2">Manage player roster and statistics</p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Filter by name or team..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 max-w-md"
            />
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Add Player
            </button>
          </div>
        </div>

        {/* Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={handleCancel}
          title={editingPlayer ? 'Edit Player' : 'Create New Player'}
          maxWidth="4xl"
          actions={
            <button
              type="button"
              onClick={() => setIsSmartFillOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              Smart Fill
            </button>
          }
          footer={
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="player-form"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending || isUploading) && (
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
                {isUploading
                  ? 'Uploading...'
                  : createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : `${editingPlayer ? 'Update' : 'Create'} Player`}
              </button>
            </div>
          }
        >
          <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  defaultValue={editingPlayer?.firstName}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  defaultValue={editingPlayer?.lastName}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  name="teamName"
                  defaultValue={editingPlayer?.teamName}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jersey Number
                </label>
                <input
                  type="text"
                  name="jerseyNumber"
                  defaultValue={editingPlayer?.jerseyNumber}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  name="graduationYear"
                  defaultValue={editingPlayer?.graduationYear}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  defaultChecked={editingPlayer?.isActive ?? true}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  name="isWeekendWarrior"
                  id="isWeekendWarrior"
                  defaultChecked={editingPlayer?.isWeekendWarrior ?? false}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isWeekendWarrior"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Weekend Warrior ⚔️
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Photo</label>
                <div className="space-y-2">
                  {(uploadedPhotoPath || editingPlayer?.photoPath) && (
                    <div className="mb-2">
                      <img
                        src={`${config.apiUrl}${uploadedPhotoPath || editingPlayer?.photoPath}?t=${Date.now()}`}
                        alt="Player"
                        className="h-64 w-64 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="hidden"
                    name="photoPath"
                    value={uploadedPhotoPath || editingPlayer?.photoPath || ''}
                  />
                  <p className="text-sm text-gray-500">
                    {isUploading ? (
                      <span className="text-blue-600">Uploading...</span>
                    ) : (
                      'Upload a player photo'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Statistics</h3>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="statsStartDate"
                      defaultValue={getLastWeekend().start}
                      className="px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      name="statsEndDate"
                      defaultValue={getLastWeekend().end}
                      className="px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Games Played"
                  >
                    GP
                  </label>
                  <input
                    type="number"
                    name="gamesPlayed"
                    defaultValue={editingPlayer?.gamesPlayed || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Plate Appearances"
                  >
                    PA
                  </label>
                  <input
                    type="number"
                    name="plateAppearances"
                    defaultValue={editingPlayer?.plateAppearances || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" title="At Bats">
                    AB
                  </label>
                  <input
                    type="number"
                    name="atBats"
                    defaultValue={editingPlayer?.atBats || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" title="Hits">
                    H
                  </label>
                  <input
                    type="number"
                    name="hits"
                    defaultValue={editingPlayer?.hits || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" title="Doubles">
                    2B
                  </label>
                  <input
                    type="number"
                    name="doubles"
                    defaultValue={editingPlayer?.doubles || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" title="Triples">
                    3B
                  </label>
                  <input
                    type="number"
                    name="triples"
                    defaultValue={editingPlayer?.triples || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" title="Home Runs">
                    HR
                  </label>
                  <input
                    type="number"
                    name="homeRuns"
                    defaultValue={editingPlayer?.homeRuns || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Runs Batted In"
                  >
                    RBI
                  </label>
                  <input
                    type="number"
                    name="rbis"
                    defaultValue={editingPlayer?.rbis || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Runs Scored"
                  >
                    R
                  </label>
                  <input
                    type="number"
                    name="runs"
                    defaultValue={editingPlayer?.runs || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Walks (Base on Balls)"
                  >
                    BB
                  </label>
                  <input
                    type="number"
                    name="walks"
                    defaultValue={editingPlayer?.walks || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Strikeouts"
                  >
                    SO
                  </label>
                  <input
                    type="number"
                    name="strikeouts"
                    defaultValue={editingPlayer?.strikeouts || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Strikeouts Looking"
                  >
                    K-L
                  </label>
                  <input
                    type="number"
                    name="strikeoutsLooking"
                    defaultValue={editingPlayer?.strikeoutsLooking || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Hit By Pitch"
                  >
                    HBP
                  </label>
                  <input
                    type="number"
                    name="hitByPitch"
                    defaultValue={editingPlayer?.hitByPitch || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Sacrifice Hits (Bunts)"
                  >
                    SAC
                  </label>
                  <input
                    type="number"
                    name="sacrificeHits"
                    defaultValue={editingPlayer?.sacrificeHits || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Sacrifice Flies"
                  >
                    SF
                  </label>
                  <input
                    type="number"
                    name="sacrificeFlies"
                    defaultValue={editingPlayer?.sacrificeFlies || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Reached On Error"
                  >
                    ROE
                  </label>
                  <input
                    type="number"
                    name="reachedOnError"
                    defaultValue={editingPlayer?.reachedOnError || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Fielder's Choice"
                  >
                    FC
                  </label>
                  <input
                    type="number"
                    name="fieldersChoice"
                    defaultValue={editingPlayer?.fieldersChoice || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Stolen Bases"
                  >
                    SB
                  </label>
                  <input
                    type="number"
                    name="stolenBases"
                    defaultValue={editingPlayer?.stolenBases || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    title="Caught Stealing"
                  >
                    CS
                  </label>
                  <input
                    type="number"
                    name="caughtStealing"
                    defaultValue={editingPlayer?.caughtStealing || 0}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isSmartFillOpen}
          onClose={() => {
            setIsSmartFillOpen(false);
            setSmartFillText('');
          }}
          title="Smart Fill - Paste Stats"
          footer={
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsSmartFillOpen(false);
                  setSmartFillText('');
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSmartFill}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Fill Form
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600 mb-4">
            Paste your stats in the format: STAT_NAME [tab/space] VALUE (one per line)
          </p>
          <textarea
            value={smartFillText}
            onChange={(e) => setSmartFillText(e.target.value)}
            placeholder="GP\t4\nPA\t10\nAB\t10\nH\t6\n2B\t2\n3B\t0\nHR\t1\nRBI\t5\nR\t6\nBB\t0\nSO\t1\nK-L\t1\nHBP\t0\nSAC\t0\nSF\t0\nROE\t0\nFC\t1\nSB\t2\nCS\t1"
            className="w-full h-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
        </Modal>

        {/* Players Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() && (
                            <span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {table.getRowModel().rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {filterText
                ? 'No players match your filter.'
                : 'No players yet. Click "Add Player" to create your first player.'}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                {' · '}
                {table.getFilteredRowModel().rows.length} total players
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »»
              </button>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="px-3 py-1 border rounded bg-white"
              >
                {[10, 15, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
